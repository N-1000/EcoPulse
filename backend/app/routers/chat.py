# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - routers/chat.py
#
# Único archivo de EcoPulse que conoce tipos de intent_router (Decision,
# RoutingResult, resolve_async, resolver_escaladas). Traduce cada Decision a un
# ChatResponse:
#   - Nivel 0/1 resuelto: cada token de `accion` se traduce a una llamada
#     a la Herramienta registrada en muaddib_client/tools.py (parámetros
#     simples derivados de `entidades`, nunca la Decision completa -- esa
#     es la única función Decision-aware de esta traducción).
#   - Reconocida-sin-capacidad (action: []): texto de respuestas.yaml.
#   - Nivel 2 (escalada a Claude vía resolver_escaladas): usa
#     `respuesta_texto`, o el texto genérico si vino `fallback_seguro`.
# ===================================================
import logging
import random
import time
from pathlib import Path
from typing import Any

import yaml
from fastapi import APIRouter, Request

from app.models.chat import ChatRequest, ChatResponse, UIAction
from app.muaddib_client.tools import Herramienta
from app.services.clickhouse_nodes import obtener_nodos_actuales
from app.utils.ica import nivel_label_desde_ica
from app.utils.node_metrics import nodo_peor_ica

from intent_router.llm_engine import resolver_escaladas
from intent_router.metrics import EventoDecision, hit_rate, log_decision
from intent_router.router import Decision, resolve_async

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


# Texto de respuesta conversacional: vive en respuestas.yaml, no acá (ver
# el header de ese archivo). Se carga una sola vez al importar este módulo.
_RESPUESTAS_PATH = Path(__file__).resolve().parent.parent / "muaddib_client" / "respuestas.yaml"
with _RESPUESTAS_PATH.open("r", encoding="utf-8") as _f:
    _RESPUESTAS: dict[str, Any] = yaml.safe_load(_f)

GENERIC_ESCALATION_REPLY: str = _RESPUESTAS["escalada"]["generica"]
NO_CAPACIDAD: dict[str, str] = _RESPUESTAS["no_capacidad"]
_GREETING_TEXTS: list[str] = _RESPUESTAS["saludos"]
_PANCE = _RESPUESTAS["planes"]["pance"]
_CAMINATA_TEXTS: list[str] = _RESPUESTAS["planes"]["caminata"]
_BICI_TEXTS: list[str] = _RESPUESTAS["planes"]["bici"]
_BORONDO_TEXTS: list[str] = _RESPUESTAS["planes"]["borondo"]

# ──────────────────────────────────────────────────────────────
# navigate/reply_greeting/show_quality_air: presentación, no datos.
# Nivel 0/1 usa el texto rico de respuestas.yaml acá mismo (igual que
# antes); tools.py registra versiones planas y factuales de estas mismas
# 3 acciones para que Nivel 2 tenga algo que llamar si hace falta -- las
# dos rutas son honestas, solo cambia el tono.
# ──────────────────────────────────────────────────────────────

def _texto_nodo_mas_contaminado() -> str:
    peor = nodo_peor_ica(obtener_nodos_actuales())
    if not peor:
        return "Ningún sensor está midiendo un ICA válido ahora mismo."
    return f"El nodo con mayor contaminación ahora mismo es {peor['id']}, con un ICA de {peor['measurements']['ica']} ({nivel_label_desde_ica(peor['measurements']['ica'])}). Te llevo al mapa."


_PAGINA_POR_INTENCION: dict[str, str] = {
    "navegar_mapa": "mapa",
    "navegar_inicio": "inicio",
    "consultar_nodo_mas_contaminado": "mapa",
    "consultar_ruta_saludable": "mapa",
    "consultar_plan_caminata": "mapa",
    "consultar_plan_bici": "mapa",
    "consultar_plan_borondo": "mapa",
}

_TEXTO_NAVEGACION: dict[str, Any] = {
    "navegar_mapa": "¡De una! Te dirijo al mapa interactivo de monitoreo ambiental.",
    "navegar_inicio": "Volviendo a la pantalla principal de EcoPulse.",
    "consultar_nodo_mas_contaminado": _texto_nodo_mas_contaminado,
    "consultar_ruta_saludable": "¡La Ruta Saludable es mi especialidad! Abrí el mapa para trazar el camino con menor ICA desde tu ubicación.",
    "consultar_plan_caminata": lambda: random.choice(_CAMINATA_TEXTS),
    "consultar_plan_bici": lambda: random.choice(_BICI_TEXTS),
    "consultar_plan_borondo": lambda: random.choice(_BORONDO_TEXTS),
}

# Acción -> página de UIAction, para las herramientas de datos reales
# (tools.py). None = sin UIAction (igual que antes del refactor de Nivel 2).
_PAGINA_POR_ACCION: dict[str, str | None] = {
    "show_air_quality": "calidad-aire",
    "locate_sensor": "mapa",
    "get_sensor_health": "mapa",
    "get_health_activity_advice": None,
    "show_help": None,
    "show_news": "noticias",
    "show_green_zones": "mapa",
    "show_trend": "tendencias",
    "show_sensor_series": "tendencias",
    "show_node_ranking": "mapa",
}


def _kwargs_para_herramienta(nombre: str, decision: Decision) -> dict[str, Any]:
    """Deriva los parámetros simples que necesita cada Herramienta a partir de entidades -- nunca la Decision completa."""
    if nombre == "show_trend":
        valores = decision.entidades.get("periodo") or ["24h"]
        return {"periodo": valores[0]}
    return {}


def _texto_y_ui_para_accion(
    nombre: str, decision: Decision, herramientas: dict[str, Herramienta]
) -> tuple[str, list[UIAction]]:
    """Traduce UN token de accion a (texto, UIActions) -- la única función que mezcla Decision con las Herramientas."""
    if nombre == "reply_greeting":
        return random.choice(_GREETING_TEXTS), []

    if nombre == "show_quality_air":
        reply = f"{random.choice(_PANCE['frases'])} {_PANCE['aclaracion']}"
        return reply, [UIAction(type="navigate", payload={"page": "mapa"})]

    if nombre == "navigate":
        pagina = _PAGINA_POR_INTENCION.get(decision.intencion, "mapa")
        texto = _TEXTO_NAVEGACION.get(decision.intencion)
        reply = texto() if callable(texto) else (texto or "")
        return reply, [UIAction(type="navigate", payload={"page": pagina})]

    herramienta = herramientas.get(nombre)
    if herramienta is None:
        logger.warning("chat: accion '%s' sin Herramienta registrada", nombre)
        return "", []

    reply = herramienta.funcion(**_kwargs_para_herramienta(nombre, decision))
    pagina = _PAGINA_POR_ACCION.get(nombre)
    ui = [UIAction(type="navigate", payload={"page": pagina})] if pagina else []
    return reply, ui


def _procesar_decision_nivel2(decision: Decision) -> tuple[str, list[UIAction]]:
    """Nivel 2 no produce UIAction (resolver_escaladas no las genera, es solo lectura vía texto)."""
    if decision.herramienta_pendiente is not None:
        # No debería pasar nunca: las 13 herramientas registradas son todas
        # efecto_real=False. Si pasa, es una herramienta nueva mal declarada.
        logger.error(
            "chat: Nivel 2 pidió confirmación para una herramienta con efecto_real -- no hay ninguna registrada así: %s",
            decision.herramienta_pendiente,
        )
        return GENERIC_ESCALATION_REPLY, []

    if decision.accion == ("fallback_seguro",):
        logger.warning("chat: Nivel 2 fallback_seguro -- motivos=%s", decision.motivos_escalada)
        return GENERIC_ESCALATION_REPLY, []

    if decision.respuesta_texto:
        return decision.respuesta_texto, []

    return GENERIC_ESCALATION_REPLY, []


def _procesar_decision(decision: Decision, herramientas: dict[str, Herramienta]) -> tuple[str, list[UIAction]]:
    if decision.nivel == 2:
        return _procesar_decision_nivel2(decision)

    if decision.intencion in NO_CAPACIDAD:
        return NO_CAPACIDAD[decision.intencion], []

    if decision.intencion is None:
        return GENERIC_ESCALATION_REPLY, []

    if not decision.accion:
        logger.warning(
            "chat: intención '%s' resuelta sin acción y sin texto de no-capacidad declarado",
            decision.intencion,
        )
        return GENERIC_ESCALATION_REPLY, []

    fragmentos: list[str] = []
    acciones: list[UIAction] = []
    for token in decision.accion:
        texto, ui = _texto_y_ui_para_accion(token, decision, herramientas)
        if texto:
            fragmentos.append(texto)
        acciones.extend(ui)

    reply = " ".join(fragmentos) if fragmentos else GENERIC_ESCALATION_REPLY
    return reply, acciones


# ──────────────────────────────────────────────────────────────
# Visibilidad sobre cómo está resolviendo MuadDib en este proceso.
#
# Deliberadamente NO se mantiene acá una segunda cuenta por nivel/intención:
# eso ya lo tiene `_eventos` adentro de intent_router.metrics, y llevar la
# misma cuenta por duplicado en el cliente es exactamente el patrón que ya
# se había consolidado en embeddings.py para que dos mediciones de lo mismo
# no puedan divergir. MuadDib ya expone desglose_por_nivel()/
# desglose_por_intencion() sobre su propio acumulador -- pendiente de
# sumar acá si hace falta, no recalculado en este archivo.
#
# `total` sí se cuenta acá: es un entero simple incrementado en el mismo
# call site que log_decision(), no una métrica derivada que pueda leerse
# distinto -- sirve como denominador para interpretar hit_rate().
#
# hit_rate() mide tasa de RESOLUCIÓN LOCAL (no escaló a Nivel 2), no tasa de
# ACIERTO -- una decisión resuelta mal en Nivel 0/1 cuenta igual que una
# resuelta bien.
#
# No se guarda el texto de los mensajes escalados ni de las respuestas de
# Nivel 2, ni tokens/api_key: es un endpoint sin auth, y el texto libre
# del usuario puede incluir su barrio u otro dato identificable. Solo
# conteos -- eso mismo es lo que ya loguea log_decision() del lado del
# servidor (nunca la api_key, nunca vive en la Decision).
# ──────────────────────────────────────────────────────────────
_total_decisiones = 0


@router.get("/metrics")
async def chat_metrics() -> dict[str, Any]:
    """hit_rate real de MuadDib desde que arrancó este proceso, más el total como denominador."""
    return {
        "hit_rate": round(hit_rate(), 3),
        "total_decisiones": _total_decisiones,
    }


@router.post("/", response_model=ChatResponse)
async def process_chat(request: ChatRequest, http_request: Request) -> ChatResponse:
    motor = getattr(http_request.app.state, "muaddib_router", None)
    if motor is None:
        logger.error("chat: MuadDib no se inicializó -- revisar el arranque del servicio")
        return ChatResponse(reply=GENERIC_ESCALATION_REPLY, ai_actions=[])

    inicio = time.perf_counter()
    try:
        # resolve_async(), no resolve(): el encode de Nivel 1 corre en el
        # executor dedicado de MuadDib (torch_threads pineado), no bloquea
        # el event loop de este proceso -- mismo criterio que resolver_escaladas().
        resultado = await resolve_async(request.message, motor.config, motor.canonical_data)
        resultado = await resolver_escaladas(resultado, motor.herramientas, motor.config, motor.api_key)
    except Exception as exc:
        logger.error("chat: resolve_async()/resolver_escaladas() tiró una excepción inesperada: %s", exc)
        return ChatResponse(reply=GENERIC_ESCALATION_REPLY, ai_actions=[])
    latencia_ms = (time.perf_counter() - inicio) * 1000

    herramientas_por_nombre = {h.name: h for h in motor.herramientas}

    fragmentos: list[str] = []
    acciones: list[UIAction] = []
    global _total_decisiones
    for decision in resultado.decisiones:
        log_decision(EventoDecision(decision=decision, latencia_ms=latencia_ms))
        _total_decisiones += 1
        texto, ui = _procesar_decision(decision, herramientas_por_nombre)
        if texto:
            fragmentos.append(texto)
        acciones.extend(ui)

    reply = " ".join(fragmentos) if fragmentos else GENERIC_ESCALATION_REPLY
    return ChatResponse(reply=reply, ai_actions=acciones)
