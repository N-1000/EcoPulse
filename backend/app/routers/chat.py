# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - routers/chat.py
#
# Traduce la Decision de MuadDib (intencion + nivel + accion) a un
# ChatResponse. El mapeo accion -> funcion del backend es un diccionario
# de despacho (ACTION_DISPATCH), no lógica adentro del endpoint. El texto
# de respuesta para intenciones "reconocidas-sin-capacidad" (action: [])
# vive acá -- el router de MuadDib solo declara la intención, EcoPulse
# escribe qué decirle al usuario.
# ===================================================
import logging
import random
import time
from typing import Any, Callable

from fastapi import APIRouter, Request

from app.models.chat import ChatRequest, ChatResponse, UIAction
from app.services.clickhouse_nodes import obtener_nodos_actuales
from app.services.clickhouse_analytics import get_24h_trends_clickhouse, get_monthly_historical_clickhouse, get_serie_por_sensor
from app.services.news_service import fetch_live_cali_news
from app.services.routing import CALI_PARKS
from app.utils.node_metrics import ica_promedio_ciudad, nodo_mejor_ica, nodo_peor_ica

from intent_router.metrics import EventoDecision, log_decision
from intent_router.router import Decision, resolve

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


GENERIC_ESCALATION_REPLY = (
    "No estoy seguro de haber entendido bien. ¿Podés reformular la pregunta "
    "sobre la calidad del aire en Cali?"
)

_ICA_LEVEL_LABELS = (
    (50, "Buena"),
    (100, "Moderada"),
    (150, "Dañina para grupos sensibles"),
    (200, "Dañina"),
    (300, "Muy Dañina"),
    (500, "Peligrosa"),
)


def _nivel_label(ica: int) -> str:
    for limite, etiqueta in _ICA_LEVEL_LABELS:
        if ica <= limite:
            return etiqueta
    return "Peligrosa"


# ──────────────────────────────────────────────────────────────
# Reconocida-sin-capacidad: canonical.yaml declara action: [] para estas
# intenciones a propósito (no hay auth/sesión, no hay endpoint, o el dato
# está bloqueado). El router solo reconoce la intención; el texto vive acá.
# ──────────────────────────────────────────────────────────────
NO_CAPACIDAD: dict[str, str] = {
    "consultar_pronostico": (
        "Todavía no tengo un modelo de pronóstico del aire -- eso no existe en el "
        "backend de EcoPulse. Te puedo mostrar la tendencia real de las últimas horas."
    ),
    "solicitar_reporte": (
        "Todavía no genero reportes ni PDFs descargables. Puedo mostrarte el histórico "
        "mensual o la tendencia de las últimas 24 horas si te sirve."
    ),
    "comparar_calidad_aire": (
        "Todavía no tengo el aire desagregado por comuna o barrio -- eso no está "
        "disponible en los datos de EcoPulse hoy. Te puedo mostrar el estado general de la ciudad."
    ),
    "activar_alerta": "Todavía no tengo sistema de alertas -- EcoPulse no maneja cuentas de usuario.",
    "cancelar_alerta": "No hay alertas que cancelar -- ese sistema todavía no existe en EcoPulse.",
    "configurar_alerta": "Todavía no puedo configurar alertas -- EcoPulse no maneja cuentas de usuario.",
    "agregar_sensor": "Todavía no tengo favoritos ni watchlist -- EcoPulse no maneja cuentas de usuario.",
}


# ──────────────────────────────────────────────────────────────
# Contenido real, recuperado del agent_core.py original (borrado, ver
# git show 9e2b481eabf7c8b2ecf01a7c2256ae7123a48cc0~1) -- no inventado acá.
# ──────────────────────────────────────────────────────────────
_GREETING_TEXTS = [
    "¡Hola, ciudadano! Revisa el mapa EcoPulse para ver la calidad del aire en tiempo real en tu zona.",
    "¡Claro que sí, parcero! Consulta el semáforo ICA en el mapa para planear tu actividad de forma segura.",
    "¡Mirá ve! La red EcoPulse tiene datos en tiempo real del aire de Cali. ¿En qué te puedo ayudar?",
    "¡Qué nota, ciudadano! EcoPulse AI está aquí para ayudarte a explorar Cali de forma inteligente y ecológica.",
]
_PANCE_TEXTS = [
    "¡Uff, Pance es una verraquera, ciudadano! Consulta el sensor más cercano en el mapa para ver el ICA en tiempo real antes de salir. El río está bueno pa' refrescarse, eso sí.",
    "¡Mirá ve, qué plan tan chuzón! Revisa el semáforo del nodo Pance en el mapa. Si está verde, ¡vamos! Y no olvides cuidar el río.",
]
_CAMINATA_TEXTS = [
    "¡Qué calidoso ese plan! Antes de salir, revisa el ICA de tu zona en el mapa EcoPulse. La madrugada o el tardecito (después de las 4pm) suelen ser los mejores horarios. ¡Lleva agua, parcero!",
    "¡Sí señor, a caminar se dijo! Usa la Ruta Saludable del mapa para evitar zonas de alto tráfico. Los cerros tutelares tienen el aire más fresco de la ciudad.",
]
_BICI_TEXTS = [
    "¡Ay, parcero, en bici por Cali es una chimba! Activa la modalidad 'Bicicleta' en la Ruta Saludable del mapa para encontrar el camino con mejor calidad del aire. ¡Y casco, que eso es ley!",
    "¡Ruta en bici, qué bello plan, causita! Consulta el mapa para ver qué nodos están en verde hoy. Sal tempranito antes de las 7am.",
]
_BORONDO_TEXTS = [
    "¡Eso es lo que necesitaba escuchar, el borondo! Revisa el semáforo del mapa para los barrios del plan: San Antonio, La Loma de la Cruz, Granada. Si están en verde, ¡vamos que Cali es verraca!",
    "¡Viva Cali! Antes del borondo, chequea el ICA en el mapa. Empieza en el Museo La Tertulia, sube a Cristo Rey y termina donde el cuerpo aguante.",
]


# ──────────────────────────────────────────────────────────────
# Handlers de acción real -- cada uno devuelve (texto, [UIAction]).
# ──────────────────────────────────────────────────────────────

def _handle_show_air_quality(decision: Decision) -> tuple[str, list[UIAction]]:
    nodos = obtener_nodos_actuales()
    ica = ica_promedio_ciudad(nodos)
    reply = f"El ICA promedio de Cali ahora mismo es {ica} ({_nivel_label(ica)})."
    return reply, [UIAction(type="navigate", payload={"page": "calidad-aire"})]


def _handle_show_quality_air_region(decision: Decision) -> tuple[str, list[UIAction]]:
    # Legacy: agent_core.py resolvía esto con NodeDataService.get_node_by_region(),
    # un catálogo de 5 nodos inventados con ICA hardcodeado. No se reutiliza esa
    # data falsa acá. entities.yaml declara el tipo "region" pero clickhouse_nodes.py
    # no desagrega comuna/barrio (hardcodeado a "Cali") -- mismo hueco que
    # comparar_calidad_aire, documentado en canonical.yaml. Por ende: texto real de
    # producto (recuperado del agent_core.py borrado) + ICA real de ciudad, sin
    # fingir que es un dato puntual de la región.
    nodos = obtener_nodos_actuales()
    ica = ica_promedio_ciudad(nodos)
    base = random.choice(_PANCE_TEXTS)
    reply = (
        f"{base} Ojo: todavía no tengo el aire desagregado por zona, así que no puedo "
        f"darte el ICA puntual de Pance -- el promedio de la ciudad ahora mismo es {ica} ({_nivel_label(ica)})."
    )
    return reply, [UIAction(type="navigate", payload={"page": "mapa"})]


def _handle_locate_sensor(decision: Decision) -> tuple[str, list[UIAction]]:
    nodos = obtener_nodos_actuales()
    activos = sum(1 for n in nodos if n.get("status") == "activo")
    reply = (
        f"Tengo {activos} sensores activos en la red Tángara -- todavía no puedo ubicar uno puntual "
        "por nombre de barrio, así que te muestro todos en el mapa."
    )
    return reply, [UIAction(type="navigate", payload={"page": "mapa"})]


def _handle_sensor_health(decision: Decision) -> tuple[str, list[UIAction]]:
    nodos = obtener_nodos_actuales()
    total = len(nodos)
    activos = sum(1 for n in nodos if n.get("status") == "activo")
    inactivos = total - activos
    if inactivos == 0:
        reply = f"Los {total} sensores de la red están activos ahora mismo."
    else:
        reply = (
            f"{activos} de {total} sensores están activos; {inactivos} inactivo(s). "
            "Todavía no puedo identificar cuál puntual por nombre."
        )
    return reply, [UIAction(type="navigate", payload={"page": "mapa"})]


def _handle_health_advice(decision: Decision) -> tuple[str, list[UIAction]]:
    nodos = obtener_nodos_actuales()
    ica = ica_promedio_ciudad(nodos)
    if ica <= 50:
        reply = f"Sí, buen momento -- el ICA está en {ica} ({_nivel_label(ica)}). Condiciones ideales para salir."
    elif ica <= 100:
        reply = f"Se puede, con moderación -- el ICA está en {ica} ({_nivel_label(ica)}). Si sos sensible, reducí el esfuerzo."
    else:
        reply = f"Mejor esperá un poco -- el ICA está en {ica} ({_nivel_label(ica)}), por encima de lo recomendable para actividad intensa."
    return reply, []


def _handle_show_help(decision: Decision) -> tuple[str, list[UIAction]]:
    reply = (
        "El ICA (Índice de Calidad del Aire) resume la concentración de PM2.5 medida por la "
        "red Tángara: sensores IoT distribuidos por Cali. Se calcula con la fórmula EPA / "
        "Resolución 2254 del MinAmbiente, y los datos se guardan en tiempo real."
    )
    return reply, []


def _handle_show_news(decision: Decision) -> tuple[str, list[UIAction]]:
    noticias = fetch_live_cali_news()
    if not noticias:
        reply = "No encontré noticias ambientales recientes de Cali en este momento."
    else:
        primero = noticias[0]
        reply = f"Encontré {len(noticias)} noticias ambientales recientes. La más reciente: \"{primero['title']}\" ({primero['source']})."
    return reply, [UIAction(type="navigate", payload={"page": "noticias"})]


def _handle_green_zones(decision: Decision) -> tuple[str, list[UIAction]]:
    nombres = [p["name"] for p in CALI_PARKS[:5]]
    reply = f"Tengo {len(CALI_PARKS)} parques y zonas verdes curadas en Cali, por ejemplo: {', '.join(nombres)}."
    return reply, [UIAction(type="navigate", payload={"page": "mapa"})]


def _handle_show_trend(decision: Decision) -> tuple[str, list[UIAction]]:
    periodo_vals = decision.entidades.get("periodo", ["24h"])
    periodo = periodo_vals[0] if periodo_vals else "24h"

    if periodo == "mensual":
        datos = get_monthly_historical_clickhouse()
        medidos = [d for d in datos if d.get("ica") is not None]
        if medidos:
            prom = round(sum(d["ica"] for d in medidos) / len(medidos))
            reply = f"El promedio mensual de ICA este año es {prom}, con {len(medidos)} meses medidos."
        else:
            reply = "Todavía no hay datos mensuales medidos para este año."
    else:
        datos = get_24h_trends_clickhouse("24h")
        valores = datos.get("green", [])
        if valores:
            actual = valores[-1]
            reply = f"El ICA de las últimas 24 horas fue de {min(valores)} a {max(valores)}; ahora mismo está en {actual}."
        else:
            reply = "Todavía no hay datos suficientes de las últimas 24 horas."

    return reply, [UIAction(type="navigate", payload={"page": "tendencias"})]


def _handle_sensor_series(decision: Decision) -> tuple[str, list[UIAction]]:
    datos = get_serie_por_sensor()
    sensores = datos.get("sensors", [])
    if not sensores:
        reply = "Todavía no hay suficientes lecturas por sensor en las últimas 24 horas."
    else:
        reply = f"Tengo la serie de PM2.5 de las últimas 24 horas para {len(sensores)} sensores individuales."
    return reply, [UIAction(type="navigate", payload={"page": "tendencias"})]


def _handle_node_ranking(decision: Decision) -> tuple[str, list[UIAction]]:
    nodos = obtener_nodos_actuales()
    peor = nodo_peor_ica(nodos)
    mejor = nodo_mejor_ica(nodos)
    if not peor:
        reply = "Ningún sensor está midiendo un ICA válido ahora mismo."
    else:
        reply = f"El nodo con peor aire ahora mismo es {peor['id']}, con un ICA de {peor['measurements']['ica']}."
        if mejor and mejor["id"] != peor["id"]:
            reply += f" El de mejor aire es {mejor['id']}, con un ICA de {mejor['measurements']['ica']}."
    return reply, [UIAction(type="navigate", payload={"page": "mapa"})]


def _handle_greeting(decision: Decision) -> tuple[str, list[UIAction]]:
    return random.choice(_GREETING_TEXTS), []


def _texto_nodo_mas_contaminado() -> str:
    nodos = obtener_nodos_actuales()
    peor = nodo_peor_ica(nodos)
    if not peor:
        return "Ningún sensor está midiendo un ICA válido ahora mismo."
    return f"El nodo con mayor contaminación ahora mismo es {peor['id']}, con un ICA de {peor['measurements']['ica']} ({_nivel_label(peor['measurements']['ica'])}). Te llevo al mapa."


# Nivel 0 (rules_nivel0.yaml): intención -> (página destino, texto o generador).
# Texto real recuperado de agent_core.py o generado con datos reales; None cuando
# el texto ya lo dio otro fragmento (caso consultar_pronostico, ver NO_CAPACIDAD).
_NIVEL0_NAVIGATE: dict[str, tuple[str, Any]] = {
    "navegar_mapa": ("mapa", "¡De una! Te dirijo al mapa interactivo de monitoreo ambiental."),
    "navegar_inicio": ("inicio", "Volviendo a la pantalla principal de EcoPulse."),
    "consultar_nodo_mas_contaminado": ("mapa", _texto_nodo_mas_contaminado),
    "consultar_ruta_saludable": ("mapa", "¡La Ruta Saludable es mi especialidad! Abrí el mapa para trazar el camino con menor ICA desde tu ubicación."),
    "consultar_plan_caminata": ("mapa", lambda: random.choice(_CAMINATA_TEXTS)),
    "consultar_plan_bici": ("mapa", lambda: random.choice(_BICI_TEXTS)),
    "consultar_plan_borondo": ("mapa", lambda: random.choice(_BORONDO_TEXTS)),
    # PARCHE TEMPORAL anotado (no diseño): rules_nivel0.yaml todavía declara
    # action: ["navigate"] para consultar_pronostico, mientras canonical.yaml
    # (la fuente de verdad para esta intención) dice action: []. El choque real
    # se reportó a MuadDib para arreglarse en el origen (corregir
    # rules_nivel0.yaml + validación cruzada en config_loader.py). Mientras
    # tanto, si Nivel 0 dispara esta rama, el texto honesto ya lo dio
    # NO_CAPACIDAD -- acá solo se aprovecha el navigate real como bonus.
    "consultar_pronostico": ("tendencias", None),
}


def _handle_navigate(decision: Decision) -> tuple[str, list[UIAction]]:
    entrada = _NIVEL0_NAVIGATE.get(decision.intencion)
    if entrada is None:
        return "", []
    pagina, texto = entrada
    if texto is None:
        reply = ""
    elif callable(texto):
        reply = texto()
    else:
        reply = texto
    return reply, [UIAction(type="navigate", payload={"page": pagina})]


# ──────────────────────────────────────────────────────────────
# Diccionario de despacho accion -> handler. focus_node y enable_tool
# quedan deliberadamente sin handler: sin soporte real en frontend ni
# backend, cablearlos sería teatro (UIAction que no hace nada).
# ──────────────────────────────────────────────────────────────
ACTION_DISPATCH: dict[str, Callable[[Decision], tuple[str, list[UIAction]]]] = {
    "show_air_quality": _handle_show_air_quality,
    "show_quality_air": _handle_show_quality_air_region,
    "locate_sensor": _handle_locate_sensor,
    "get_sensor_health": _handle_sensor_health,
    "get_health_activity_advice": _handle_health_advice,
    "show_help": _handle_show_help,
    "show_news": _handle_show_news,
    "show_green_zones": _handle_green_zones,
    "show_trend": _handle_show_trend,
    "show_sensor_series": _handle_sensor_series,
    "show_node_ranking": _handle_node_ranking,
    "navigate": _handle_navigate,
    "reply_greeting": _handle_greeting,
}


def _procesar_decision(decision: Decision) -> tuple[str, list[UIAction]]:
    if decision.intencion in NO_CAPACIDAD:
        fragmentos = [NO_CAPACIDAD[decision.intencion]]
        acciones: list[UIAction] = []
        # Bonus: si además trae una acción real (el navigate stale de Nivel 0
        # para consultar_pronostico), se despacha igual -- ver parche anotado
        # en _NIVEL0_NAVIGATE.
        for token in decision.accion:
            handler = ACTION_DISPATCH.get(token)
            if handler is None:
                continue
            _, ui = handler(decision)
            acciones.extend(ui)
        return " ".join(fragmentos), acciones

    if decision.nivel == 2 or decision.intencion is None:
        return GENERIC_ESCALATION_REPLY, []

    if not decision.accion:
        logger.warning(
            "chat: intención '%s' resuelta sin acción y sin texto de no-capacidad declarado",
            decision.intencion,
        )
        return GENERIC_ESCALATION_REPLY, []

    fragmentos = []
    acciones = []
    for token in decision.accion:
        handler = ACTION_DISPATCH.get(token)
        if handler is None:
            continue  # focus_node, enable_tool: sin handler a propósito
        texto, ui = handler(decision)
        if texto:
            fragmentos.append(texto)
        acciones.extend(ui)

    reply = " ".join(fragmentos) if fragmentos else GENERIC_ESCALATION_REPLY
    return reply, acciones


@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest, http_request: Request) -> ChatResponse:
    motor = getattr(http_request.app.state, "muaddib_router", None)
    if motor is None:
        logger.error("chat: MuadDib no se inicializó -- revisar el arranque del servicio")
        return ChatResponse(reply=GENERIC_ESCALATION_REPLY, ai_actions=[])

    inicio = time.perf_counter()
    try:
        resultado = resolve(request.message, motor.config, motor.canonical_data)
    except Exception as exc:
        logger.error("chat: resolve() tiró una excepción inesperada: %s", exc)
        return ChatResponse(reply=GENERIC_ESCALATION_REPLY, ai_actions=[])
    latencia_ms = (time.perf_counter() - inicio) * 1000

    fragmentos: list[str] = []
    acciones: list[UIAction] = []
    for decision in resultado.decisiones:
        log_decision(EventoDecision(decision=decision, latencia_ms=latencia_ms))
        texto, ui = _procesar_decision(decision)
        if texto:
            fragmentos.append(texto)
        acciones.extend(ui)

    reply = " ".join(fragmentos) if fragmentos else GENERIC_ESCALATION_REPLY
    return ChatResponse(reply=reply, ai_actions=acciones)
