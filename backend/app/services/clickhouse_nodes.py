import logging
import math
import threading
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.core.config import get_settings
from app.db.clickhouse import ping, query_rows
from app.services.mock_data import TANGARA_NODES
from app.utils.ica import calcular_ica_pm25

logger = logging.getLogger(__name__)

RANGOS_VALIDOS = {
    "temperatura": (-10, 50),      # °C razonable para Cali
    "humedad": (0, 100),           # % relativo, límite físico real
    "pm25": (0, 1000),             # µg/m³, generoso por encima de "peligroso" EPA
    "co2": (0, 10000),             # ppm, generoso
}

def _clamp_o_null(valor, campo):
    if valor is None:
        return None
    lo, hi = RANGOS_VALIDOS[campo]
    return valor if lo <= valor <= hi else None

def _elegir_pm25(promedio_1h: Any, ultimo: Any) -> Optional[float]:
    """Promedio de la última hora si existe y es > 0; si no, la última lectura.

    Con el nodo sin lecturas en la última hora, ClickHouse devuelve NULL (o NaN)
    para el promedio: antes eso se propagaba hasta el API como 0.0 en vez de
    caer a la última lectura conocida.
    """
    if promedio_1h is not None and not math.isnan(promedio_1h) and promedio_1h != 0:
        return promedio_1h
    return ultimo


def decode_geohash(geohash: str) -> tuple[float, float]:
    """Decodes a geohash string to (latitude, longitude) coordinates."""
    base32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    dec32 = {char: i for i, char in enumerate(base32)}
    
    lat_interval = (-90.0, 90.0)
    lon_interval = (-180.0, 180.0)
    
    is_even = True
    for char in geohash:
        if char not in dec32:
            continue
        val = dec32[char]
        for mask in [16, 8, 4, 2, 1]:
            if is_even:
                mid = (lon_interval[0] + lon_interval[1]) / 2
                if val & mask:
                    lon_interval = (mid, lon_interval[1])
                else:
                    lon_interval = (lon_interval[0], mid)
            else:
                mid = (lat_interval[0] + lat_interval[1]) / 2
                if val & mask:
                    lat_interval = (mid, lat_interval[1])
                else:
                    lat_interval = (lat_interval[0], mid)
            is_even = not is_even
            
    lat = (lat_interval[0] + lat_interval[1]) / 2
    lon = (lon_interval[0] + lon_interval[1]) / 2
    return lat, lon

def get_nodos_clickhouse() -> List[Dict[str, Any]]:
    """Consulta la última lectura de cada sensor desde la tabla real en ClickHouse."""
    dias_ventana = int(get_settings().node_lookback_days)
    query = f"""
        SELECT
            name AS sensor_id,
            argMax(geo, time)  AS geohash,
            argMax(tmp, time)  AS temperatura,
            argMax(hum, time)  AS humedad,
            avgIf(pm25, time >= now() - INTERVAL 1 HOUR AND pm25 >= 0 AND pm25 <= 500) AS pm25_prom_1h,
            argMax(pm25, time) AS pm25_ultimo,
            argMax(co2, time)  AS co2,
            max(time)          AS ultima_lectura_utc,
            dateDiff('second', max(time), now()) AS segundos_sin_datos
        FROM tangara_plata.plata_tangara_sensores
        WHERE time >= now() - INTERVAL {dias_ventana} DAY
        GROUP BY name
    """
    resultado = query_rows(query)
    umbral_inactividad_s = get_settings().node_stale_minutes * 60
    nodos = []
    for row in resultado:
        sensor_id = row.get("sensor_id")
        geohash = row.get("geohash")
        tmp = row.get("temperatura")
        hum = row.get("humedad")
        pm25 = _elegir_pm25(row.get("pm25_prom_1h"), row.get("pm25_ultimo"))
        co2 = row.get("co2")
        ultima_utc = row.get("ultima_lectura_utc")
        segundos_sin_datos = row.get("segundos_sin_datos")
        
        # Validar y limpiar valores
        tmp_clean = _clamp_o_null(tmp, "temperatura")
        hum_clean = _clamp_o_null(hum, "humedad")
        pm25_clean = _clamp_o_null(pm25, "pm25")
        co2_clean = _clamp_o_null(co2, "co2")
        
        # Calcular ICA
        ica_info = calcular_ica_pm25(pm25_clean)
        
        # Decodificar geohash
        try:
            lat, lng = decode_geohash(geohash)
        except Exception as exc:
            logger.warning("Fallo al decodificar geohash '%s' para el sensor '%s': %s", geohash, sensor_id, exc)
            lat, lng = 3.4372, -76.5222  # Cali centro de fallback
            
        # Formatear la hora
        if isinstance(ultima_utc, datetime):
            # Restar 5 horas para hora local de Cali (UTC-5)
            ultima_cali = (ultima_utc - timedelta(hours=5)).isoformat()
        else:
            ultima_cali = str(ultima_utc)
            
        # Determinar estado: activo si mide PM2.5, CO2 o Temperatura Y su última
        # lectura es reciente. Antes solo se miraba lo primero, así que un nodo
        # mudo desde hacía horas seguía figurando como "activo".
        tiene_lectura_valida = (
            (pm25_clean is not None and pm25_clean > 0) or
            (co2_clean is not None and co2_clean > 0) or
            (tmp_clean is not None and tmp_clean > 0)
        )
        lectura_reciente = (
            segundos_sin_datos is not None
            and segundos_sin_datos <= umbral_inactividad_s
        )
        status = "activo" if (tiene_lectura_valida and lectura_reciente) else "inactivo"

        # Detectar tipo de sensor por ID: TTGO miden CO2, ESP32 miden PM2.5
        sensor_type = "co2" if "TTGOT" in sensor_id else "pm25"

        nodos.append({
            "id": sensor_id,
            "name": f"Nodo {sensor_id[:6]}",
            "geohash": geohash,
            "coordinates": {"lat": lat, "lng": lng},
            "comuna": "Cali",
            "barrio": "Cali",
            "status": status,
            "lastUpdate": ultima_cali,
            "sensorType": sensor_type,
            "measurements": {
                "temperature": tmp_clean,
                "humidity": hum_clean,
                "pm25": pm25_clean,
                "co2": co2_clean,
                "ica": ica_info["ica"] if tiene_lectura_valida else 0,
                "level": ica_info["level"] if tiene_lectura_valida else "buena"
            }
        })
    return nodos


# Caché en memoria: /api/nodes se pollea cada 60s desde cada pestaña abierta
# (useNodes.ts) y el dato real cambia por minuto, no por request -- sin
# caché, N usuarios concurrentes son N queries a ClickHouse por minuto.
# TTL configurable por CACHE_TTL_SECONDS (Settings.cache_ttl_seconds,
# existía declarado pero sin ningún consumidor); default 45s, a mitad del
# rango pedido (30-60s).
#
# Estampida encontrada en la prueba de carga 2026-09-22 (p95 llegaba a
# 4000ms a 50 usuarios concurrentes, saturando el threadpool de FastAPI):
# muchos requests veían la caché vencida a la vez y todos refrescaban en
# paralelo. Fix: stale-while-revalidate. Con caché tibia pero vencida, se
# sigue sirviendo el dato viejo mientras UN SOLO hilo de fondo refresca
# -- para un dato que cambia por minuto, servir uno de hace TTL segundos
# es honesto, no hace falta que nadie espere. Con caché vacía (arranque en
# frío) sí hay que esperar: ahí el lock evita que todos golpeen a la vez,
# porque no hay ningún dato viejo que servir.
_cache_lock = threading.Lock()
_refresh_en_curso = False
_CACHE_NODOS: Optional[tuple[float, List[Dict[str, Any]]]] = None


def obtener_nodos_actuales() -> List[Dict[str, Any]]:
    """Nodos reales de ClickHouse con fallback a datos mock, cacheados en memoria (stale-while-revalidate)."""
    global _CACHE_NODOS, _refresh_en_curso
    now_ts = time.time()
    ttl = get_settings().cache_ttl_seconds

    with _cache_lock:
        if _CACHE_NODOS is None:
            # Arranque en frío: nadie tiene nada que servir. Refrescar
            # sosteniendo el lock a propósito -- los demás hilos que
            # lleguen mientras tanto quedan esperando acá, no golpeando
            # todos a la vez a ClickHouse.
            resultado = _obtener_nodos_sin_cache()
            _CACHE_NODOS = (now_ts, resultado)
            return resultado

        cached_time, cached_data = _CACHE_NODOS
        if now_ts - cached_time < ttl:
            return cached_data

        # Caché vencida pero con dato: servirlo igual, y disparar UN solo
        # refresh en background (no bloquea, no compite por el threadpool
        # de requests -- es un hilo propio).
        if not _refresh_en_curso:
            _refresh_en_curso = True
            threading.Thread(target=_refrescar_cache_en_background, daemon=True).start()
        return cached_data


def _refrescar_cache_en_background() -> None:
    global _CACHE_NODOS, _refresh_en_curso
    try:
        resultado = _obtener_nodos_sin_cache()
        with _cache_lock:
            _CACHE_NODOS = (time.time(), resultado)
    except Exception:
        logger.exception("obtener_nodos_actuales: falló el refresh en background -- se sigue sirviendo el dato viejo")
    finally:
        with _cache_lock:
            _refresh_en_curso = False


_CAMPOS_DE_IDENTIDAD = ("id", "name", "geohash", "coordinates", "comuna", "barrio", "sensorType")


def _nodos_sin_datos_en_vivo() -> List[Dict[str, Any]]:
    """Nodos conocidos, todos "inactivo" y sin mediciones: lo que se sirve cuando no hay datos reales.

    La lista sale de la última respuesta real cacheada (si la hay) o del
    catálogo de nodos de mock_data.py, pero de cada nodo se conserva solo su
    identidad y ubicación. lastUpdate es el último timestamp REAL que se vio
    de ese nodo, o None si nunca se vio uno; jamás uno fabricado. Las
    mediciones van en None (con ica 0, la convención de "inactivo" de
    get_nodos_clickhouse), para que ni la UI ni el chat puedan presentar
    un valor como actual.
    """
    cache = _CACHE_NODOS[1] if _CACHE_NODOS is not None else None
    base = cache if cache else TANGARA_NODES
    ultima_real = {n.get("id"): n.get("lastUpdate") for n in (cache or [])}
    nodos = []
    for n in base:
        nodo = {k: n[k] for k in _CAMPOS_DE_IDENTIDAD if k in n}
        nodo["status"] = "inactivo"
        nodo["lastUpdate"] = ultima_real.get(n.get("id"))
        nodo["measurements"] = {
            "temperature": None, "humidity": None, "pm25": None, "co2": None,
            "ica": 0, "level": "buena",
        }
        nodos.append(nodo)
    return nodos


def _sin_datos_reales(motivo: str) -> List[Dict[str, Any]]:
    """Respuesta de los tres casos sin datos reales: nodos inactivos, o el mock solo si ECOPULSE_DEMO_DATA está activo."""
    if get_settings().ecopulse_demo_data:
        logger.warning("obtener_nodos_actuales: %s -- sirviendo datos de DEMO (ECOPULSE_DEMO_DATA activo)", motivo)
        return TANGARA_NODES
    logger.warning("obtener_nodos_actuales: %s -- todos los nodos como inactivos, sin mediciones", motivo)
    return _nodos_sin_datos_en_vivo()


def _obtener_nodos_sin_cache() -> List[Dict[str, Any]]:
    """Nodos reales de ClickHouse; sin datos reales, nodos inactivos (nunca mock salvo modo demo).

    Antes duplicado en routers/nodes.py y routers/routing.py; un tercer
    call site (el dispatch de chat) hizo que valiera la pena extraerlo
    a una sola función en vez de copiar el bloque una vez más.

    Antes, en los tres casos de abajo se devolvía TANGARA_NODES: 12 nodos
    "activo" con lastUpdate de hace 2-13 minutos inventado y PM2.5 fijo. La
    UI y el chat los presentaban como mediciones en vivo (EP-011).
    """
    if not ping():
        return _sin_datos_reales("ping a ClickHouse falló")
    try:
        rows = get_nodos_clickhouse()
    except Exception as exc:
        logger.error("obtener_nodos_actuales: excepción consultando ClickHouse: %s", exc)
        return _sin_datos_reales("excepción consultando ClickHouse")
    if not rows:
        return _sin_datos_reales(
            f"ClickHouse respondió sin filas (ninguna lectura en {get_settings().node_lookback_days} días)"
        )
    return rows
