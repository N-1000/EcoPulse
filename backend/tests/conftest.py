# -*- coding: utf-8 -*-
# ===================================================
# conftest.py -- fixtures compartidas de backend/tests/
#
# Objetivo: probar POST /api/chat/ de punta a punta via HTTP (FastAPI
# TestClient, que corre el lifespan real de main.py) SIN depender de:
#   - una instancia real de ClickHouse (se fuerza el camino de fallback
#     a datos mock, parcheando `ping` en los dos módulos de servicio que
#     lo importan -- clickhouse_nodes.py y clickhouse_analytics.py)
#   - la red real de noticias (news_service.py hace peticiones HTTP a
#     RSS feeds reales; se reemplaza por una lista fija)
#   - una ANTHROPIC_API_KEY real (se borra del entorno si existe, para
#     que Nivel 2 siempre caiga en fallback_seguro de forma determinista)
#
# El modelo de embeddings (sentence-transformers) SÍ se carga real -- ya
# está cacheado localmente (~/.cache/huggingface), así que no pega a la
# red, pero mide el comportamiento real de Nivel 1, no un mock.
# ===================================================
import os
from unittest.mock import patch

import pytest

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.pop("ANTHROPIC_API_KEY", None)

_NOTICIAS_FIJAS = [
    {
        "title": "CVC reporta mejora en calidad del aire tras lluvias",
        "source": "CVC Ambiental",
        "url": "https://example.org/noticia-1",
        "published": "2026-10-01",
    },
    {
        "title": "Alcaldía de Cali amplía la red de monitoreo Tángara",
        "source": "Alcaldía de Cali / DAGMA",
        "url": "https://example.org/noticia-2",
        "published": "2026-09-28",
    },
]


@pytest.fixture(scope="session")
def client():
    """TestClient de sesión: corre el lifespan real (carga MuadDib + modelo de
    embeddings una sola vez), con ClickHouse y noticias forzados a su camino
    de fallback/mock, y sin API key de Anthropic."""
    with patch("app.services.clickhouse_nodes.ping", lambda: False), \
         patch("app.services.clickhouse_analytics.ping", lambda: False), \
         patch("app.muaddib_client.tools.fetch_live_cali_news", lambda: _NOTICIAS_FIJAS):
        from fastapi.testclient import TestClient
        from app.core.limiter import limiter
        from app.main import app

        # El corpus manda ~40 mensajes por el mismo TestClient (misma IP) en
        # segundos -- @limiter.limit("20/minute") de chat.py se dispara a mitad
        # de corrida si no se desactiva. Esto NO es un parche a produccion: el
        # rate limit real sigue intacto en app/routers/chat.py, solo se apaga el
        # enforcement para esta sesion de tests (no estamos midiendo rate
        # limiting, estamos midiendo resolucion de intenciones).
        limiter.enabled = False
        with TestClient(app) as test_client:
            yield test_client
        limiter.enabled = True


# ===================================================
# Reporte automático al final de la sesión: tabla mensaje/nivel/intención/
# respuesta real + % correcto / % fallback / % incorrecto_con_confianza.
#
# v2 -- corrige el criterio de "coincide" de la v1 (que solo comparaba un
# booleano "resolvió sin LLM sí/no" y por eso contaba como "acierto" una
# respuesta que resolvió localmente pero ESTABA MAL: ignoró una zona/
# sensor mencionado sin avisar, o usó el periodo por default en vez del
# que el mensaje pedía). Ahora se clasifica cada caso en 4 baldes:
#   - "correcto": resolvió localmente Y, si el mensaje nombraba una zona/
#     sensor que no se puede desagregar, la respuesta lo aclaró; y si
#     aplicaba un periodo esperado, usó ese periodo.
#   - "fallback": alguna cláusula escaló a Nivel 2 (con o sin LLM real) --
#     el sistema admite que no sabe, no inventa nada.
#   - "incorrecto_con_confianza": resolvió localmente SIN escalar, pero
#     viola alguna de las garantías de arriba -- esto es más grave que un
#     fallback, el sistema contesta seguro algo que no corresponde.
#   - "rechazo_longitud": nunca tocó el router (MAX_LARGO_MENSAJE).
#
# Las frases de aclaración y las plantillas de periodo de abajo están
# copiadas literal de respuestas.yaml / tools.py (no adivinadas) -- si
# ese texto cambia, este chequeo se rompe a propósito (se nota en el
# reporte, no se queda silenciosamente desactualizado).
# ===================================================
_NO_CAPACIDAD_INTENTS = frozenset(
    {
        "consultar_pronostico",
        "solicitar_reporte",
        "comparar_calidad_aire",
        "activar_alerta",
        "cancelar_alerta",
        "configurar_alerta",
        "agregar_sensor",
    }
)

# Substrings exactos (en minúsculas) de los únicos textos de producción que
# hoy aclaran una limitación de desagregación/alcance. Fuente: respuestas.yaml
# (no_capacidad.*, planes.pance.aclaracion) y tools.py::ubicar_sensor().
_FRASES_ACLARACION = (
    "todavía no tengo el aire desagregado",  # pance + comparar_calidad_aire + no_desagregado.region
    "no hay forma de ubicar",  # locate_sensor
    "no puedo buscar un sensor puntual por nombre",  # no_desagregado.sensor
    "no tengo sistema de alertas",  # activar_alerta / configurar_alerta
    "no hay alertas que cancelar",  # cancelar_alerta
    "no tengo favoritos ni watchlist",  # agregar_sensor
    "no tengo un modelo de pronóstico",  # consultar_pronostico
    "no genero reportes",  # solicitar_reporte
)

# Substrings exactos de las plantillas de tendencia_calidad_aire() (tools.py).
_MARCA_PERIODO = {
    "24h": "últimas 24 horas",
    "mensual": "mensual",
}


def _contiene_aclaracion(reply: str) -> bool:
    reply_low = reply.lower()
    return any(frase in reply_low for frase in _FRASES_ACLARACION)


def _periodo_coincide(periodo_esperado: str, reply: str) -> bool:
    marca = _MARCA_PERIODO.get(periodo_esperado)
    return marca is not None and marca in reply.lower()


def _truncar(texto: str, tope: int = 160) -> str:
    texto = texto.replace("\n", " ").replace("|", "\\|")
    return texto if len(texto) <= tope else texto[:tope] + "…"


def _nivel_real_str(niveles: list) -> str:
    if not niveles:
        return "sin_evento"
    if len(niveles) == 1:
        return str(niveles[0])
    return "mixto" + str(tuple(niveles))


def _clasificar_real(caso, resultado: dict) -> str:
    """Clasifica el resultado real en 4 baldes -- ver el comentario de arriba."""
    niveles = resultado["niveles"]

    if not niveles:
        return "rechazo_longitud" if caso.nivel_esperado == "rechazo_longitud" else "fallback"

    if any(n == 2 for n in niveles):
        return "fallback"

    # Ninguna cláusula escaló: resolvió "seguro". Ahora hay que verificar
    # que ese "seguro" no esté escondiendo algo mal.
    if caso.intencion_esperada is None:
        # Se predijo que NINGÚN intent local encaja -- si de todos modos
        # resolvió sin escalar, es una respuesta confiada sobre algo que no
        # debería tener match (ej. el atractor de consultar_plan_pance).
        return "incorrecto_con_confianza"

    if caso.debe_aclarar_limitacion and not _contiene_aclaracion(resultado["reply"]):
        return "incorrecto_con_confianza"

    if caso.periodo_esperado is not None and not _periodo_coincide(caso.periodo_esperado, resultado["reply"]):
        return "incorrecto_con_confianza"

    return "correcto"


def pytest_sessionfinish(session, exitstatus):
    from tests._resultados import RESULTADOS

    if not RESULTADOS:
        return

    from tests.corpus_chat import CORPUS

    por_id = {r["caso"].id: r for r in RESULTADOS}
    filas = []
    conteo = {"correcto": 0, "fallback": 0, "incorrecto_con_confianza": 0, "rechazo_longitud": 0}
    n_coincide = 0

    for caso in CORPUS:
        r = por_id.get(caso.id)
        if r is None:
            continue

        clasificacion_real = _clasificar_real(caso, r)
        conteo[clasificacion_real] += 1
        coincide = clasificacion_real == caso.clasificacion_esperada
        n_coincide += int(coincide)

        intenciones = [i for i in r["intenciones"] if i is not None]
        intencion_str = ", ".join(intenciones) if intenciones else "—"
        herramientas = [h for tup in r["herramientas_llamadas"] for h in tup]
        if herramientas:
            intencion_str += f" (herramientas: {', '.join(herramientas)})"
        if any(i in _NO_CAPACIDAD_INTENTS for i in intenciones):
            intencion_str += " [sin_capacidad]"

        filas.append(
            "| {id} | {cat} | {msg} | {clas_esp} | {clas_real} | {intencion} | {reply} | {coincide} |".format(
                id=caso.id,
                cat=caso.categoria,
                msg=_truncar(caso.mensaje, 60) or "(vacío)",
                clas_esp=caso.clasificacion_esperada,
                clas_real=clasificacion_real,
                intencion=_truncar(intencion_str, 55),
                reply=_truncar(r["reply"], 120),
                coincide="sí" if coincide else "NO",
            )
        )

    total = len(RESULTADOS)
    n_correcto = conteo["correcto"]
    n_fallback = conteo["fallback"]
    n_incorrecto = conteo["incorrecto_con_confianza"]
    n_rechazo = conteo["rechazo_longitud"]
    pct = lambda n: round(100 * n / total, 1) if total else 0.0
    pct_coincide = round(100 * n_coincide / total, 1) if total else 0.0

    docs_dir = __import__("pathlib").Path(__file__).resolve().parent.parent.parent / "docs"
    docs_dir.mkdir(exist_ok=True)
    # Archivo SEPARADO del análisis manual (docs/reporte-corpus-chat.md) a
    # propósito: este hook sobreescribe el archivo completo en cada corrida,
    # y pisó el análisis a mano la primera vez que se reescribió este
    # conftest.py. Los datos crudos van siempre acá; el análisis humano vive
    # en el otro archivo y solo lo edita una persona, nunca este hook.
    out_path = docs_dir / "reporte-corpus-chat-datos.md"

    lines = [
        "# Datos crudos: corpus de ~40 mensajes contra POST /api/chat/ (sin LLM, ClickHouse mockeado)",
        "",
        "Generado automáticamente por `backend/tests/conftest.py::pytest_sessionfinish` -- este archivo "
        "se SOBREESCRIBE completo en cada corrida de `pytest tests/`. El análisis (revisión manual de "
        "fallbacks, hallazgos, diagnóstico) vive en [reporte-corpus-chat.md](reporte-corpus-chat.md), "
        "que nunca se edita desde este hook.",
        "",
        "Fuente: `backend/tests/corpus_chat.py` (predicciones escritas antes de correr, incluye "
        "entidades esperadas, si debe aclarar una limitación y el periodo esperado) + "
        "`backend/tests/test_chat_corpus.py` (resultados reales vía HTTP + log estructurado de "
        "`intent_router.metrics`). Clasificación de 3 vías + rechazo: 'correcto' exige además que, "
        "cuando corresponde, la respuesta aclare la limitación o use el periodo correcto -- no alcanza "
        "con resolver sin escalar.",
        "",
        f"- Total de casos: **{total}**",
        f"- Correctos (resuelve Y, si aplica, aclara/usa el periodo bien): **{n_correcto}** ({pct(n_correcto)}%)",
        f"- Fallback (alguna cláusula escaló, el sistema admite que no sabe): **{n_fallback}** ({pct(n_fallback)}%)",
        f"- **Incorrecto con confianza** (resolvió sin escalar pero está mal): **{n_incorrecto}** ({pct(n_incorrecto)}%)",
        f"- Rechazados por longitud antes de tocar el router: **{n_rechazo}** ({pct(n_rechazo)}%)",
        f"- Predicción vs realidad (clasificación de 4 vías): coincide en **{n_coincide}/{total}** ({pct_coincide}%)",
        "",
        "| id | categoría | mensaje | clasificación esperada | clasificación real | intención real | respuesta real | ¿coincide? |",
        "|---|---|---|---|---|---|---|---|",
        *filas,
        "",
    ]
    out_path.write_text("\n".join(lines), encoding="utf-8")
