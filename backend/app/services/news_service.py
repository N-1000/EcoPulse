# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - services/news_service.py
# Servicio de Noticias Ambientales Reales en Vivo para Cali y Valle del Cauca.
# Extrae y normaliza noticias de fuentes oficiales (CVC, DAGMA, Alcaldía, El País, etc.)
# FILTRO ESTRICTO: Máximo 14 días de antigüedad para garantizar cero desinformación.
# ===================================================
import time
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Caché en memoria
_CACHE_TIMESTAMP: float = 0.0
_CACHE_DURATION_SECONDS: float = 600.0  # 10 minutos
_CACHED_NEWS: List[Dict[str, Any]] = []

MAX_AGE_DAYS: float = 14.0  # NINGUNA noticia mayor a 14 días ingresará al feed

SOURCE_MAPPINGS = [
    ("elpais.com.co", "El País Cali"),
    ("cvc.gov.co", "CVC Ambiental"),
    ("cali.gov.co", "Alcaldía de Cali / DAGMA"),
    ("occidente.co", "Diario Occidente"),
    ("bluradio.com", "Blu Radio"),
    ("elespectador.com", "El Espectador"),
    ("eltiempo.com", "El Tiempo"),
    ("valoraanalitik.com", "Valora Analitik"),
    ("90minutos.co", "Noticiero 90 Minutos"),
    ("tubarco.news", "TuBarco Cali"),
    ("diarioadn.co", "Diario ADN"),
    ("las2orillas.co", "Las2orillas"),
]

MESES_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def _clean_html(raw_html: str) -> str:
    """Elimina etiquetas HTML y entidades codificadas."""
    clean = re.sub(r"<[^>]+>", "", raw_html)
    clean = clean.replace("&nbsp;", " ").replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
    return clean.strip()


def _categorize(title: str, summary: str) -> str:
    """Asigna categoría según palabras clave en el texto."""
    text = f"{title} {summary}".lower()
    if any(w in text for w in ["alerta", "humo", "olor", "contamin", "incendio", "riesgo", "emergencia", "escombros"]):
        return "ALERTA"
    if any(w in text for w in ["árbol", "arbol", "siembra", "bosque", "comuna", "parque", "comunidad", "fauna", "cristo rey", "residuos"]):
        return "COMUNIDAD"
    if any(w in text for w in ["estudio", "oms", "investig", "cient", "sensor", "datos", "smart city", "biointeligente", "expo"]):
        return "CIENCIA"
    if any(w in text for w in ["clima", "lluvia", "temperatura", "sol", "tormenta", "el niño", "río"]):
        return "CLIMA"
    return "PROGRESO"


def _format_time_ago(dt: datetime, now: datetime) -> tuple[str, str]:
    """
    Devuelve la tupla (timeAgo, formattedDate).
    e.g. ('Hace 8h', '4 sep') o ('Ayer', '3 sep') o ('Hace 4 días', '31 ago')
    """
    diff_sec = (now - dt).total_seconds()
    day = dt.day
    month_name = MESES_ES[dt.month - 1]
    formatted_date = f"{day} {month_name}"

    if diff_sec < 0:
        return ("Hoy", formatted_date)
    if diff_sec < 3600:
        mins = max(1, int(diff_sec / 60))
        return (f"Hace {mins} min", formatted_date)
    if diff_sec < 86400:
        hours = int(diff_sec / 3600)
        return (f"Hace {hours}h", formatted_date)
    if diff_sec < 172800:
        return ("Ayer", formatted_date)
    
    days = int(diff_sec / 86400)
    return (f"Hace {days} días", formatted_date)


def fetch_live_cali_news() -> List[Dict[str, Any]]:
    """Consulta y devuelve las noticias más frescas y recientes de Cali (< 14 días), ordenadas por fecha."""
    global _CACHE_TIMESTAMP, _CACHED_NEWS

    now = time.time()
    if _CACHED_NEWS and (now - _CACHE_TIMESTAMP < _CACHE_DURATION_SECONDS):
        return _CACHED_NEWS

    now_dt = datetime.now(timezone.utc)

    # Búsqueda amplia de fuentes ambientales y cívicas de Cali
    rss_query = "Cali ambiental OR DAGMA Cali OR CVC Cali OR aire Cali"
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(rss_query)}&hl=es-419&gl=CO&ceid=CO:es-419"

    raw_items = []

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EcoPulse/2026"})
        with urllib.request.urlopen(req, timeout=6) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = root.findall(".//item")

            for idx, it in enumerate(items):
                title_elem = it.find("title")
                link_elem = it.find("link")
                pub_date_elem = it.find("pubDate")
                desc_elem = it.find("description")
                source_elem = it.find("source")

                raw_title = title_elem.text if title_elem is not None and title_elem.text else ""
                raw_link = link_elem.text if link_elem is not None and link_elem.text else "#"
                raw_desc = desc_elem.text if desc_elem is not None and desc_elem.text else ""
                raw_source = source_elem.text if source_elem is not None and source_elem.text else ""

                # Parse obligatorio de fecha pubDate (usando is None)
                if pub_date_elem is None or not pub_date_elem.text:
                    continue

                try:
                    dt = parsedate_to_datetime(pub_date_elem.text)
                except Exception:
                    continue

                # FILTRO ESTRICTO DE FECHA: Descartar noticias de más de 14 días
                age_days = (now_dt - dt).total_seconds() / 86400.0
                if age_days > MAX_AGE_DAYS:
                    continue

                title = raw_title
                source_name = raw_source
                if " - " in raw_title:
                    parts = raw_title.rsplit(" - ", 1)
                    title = parts[0].strip()
                    if not source_name:
                        source_name = parts[1].strip()

                if not source_name:
                    for domain, label in SOURCE_MAPPINGS:
                        if domain in raw_link.lower():
                            source_name = label
                            break
                    if not source_name:
                        source_name = "Prensa Cali"

                summary = _clean_html(raw_desc)
                if not summary or len(summary) < 20:
                    summary = f"Actualidad sobre la gestión ambiental, biodiversidad y calidad del aire en Santiago de Cali reportada por {source_name}."

                # Descartar deportes u otros temas no ambientales que se cuelen
                lower_title = title.lower()
                if any(x in lower_title for x in ["fútbol", "futbol", "dimayor", "golazo", "partido", "alineación", "campeonato"]):
                    continue

                category = _categorize(title, summary)
                time_ago, date_formatted = _format_time_ago(dt, now_dt)

                raw_items.append({
                    "id": f"live-news-{idx + 1}",
                    "title": title,
                    "summary": summary,
                    "category": category,
                    "source": source_name,
                    "url": raw_link,
                    "publishedAt": dt.isoformat(),
                    "timeAgo": time_ago,
                    "dateFormatted": date_formatted,
                    "_dt": dt,
                })

    except Exception as e:
        print(f"[EcoPulse NewsService] Advertencia al obtener RSS en vivo: {e}.")

    # ORDENAR ESTRICTAMENTE DE MÁS RECIENTE A MÁS ANTIGUA
    raw_items.sort(key=lambda x: x["_dt"], reverse=True)

    clean_result = []
    for it in raw_items[:18]:
        it_copy = dict(it)
        it_copy.pop("_dt", None)
        clean_result.append(it_copy)

    _CACHED_NEWS = clean_result
    _CACHE_TIMESTAMP = now
    return _CACHED_NEWS
