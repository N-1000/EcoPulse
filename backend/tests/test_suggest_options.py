# -*- coding: utf-8 -*-
# ===================================================
# suggest_options: cuando el chat cae en el fallback genérico, el backend
# agrega un UIAction con 3-4 capacidades reales para que el frontend las
# muestre como botones (ver propuesta en el reporte interno del corpus de chat, no publicado).
#
# El riesgo real de esta feature: sugerir una opción que a su vez cae en
# fallback sería peor que no sugerir nada. Por eso el test central de este
# archivo no es "¿se ve bien el botón?" -- es "¿CADA query declarada en
# opciones_sugeridas resuelve de verdad, en Nivel 0 o 1, con la intención
# que dice que resuelve?". Si canonical.yaml cambia de frases, o se tocan
# umbrales/márgenes más adelante (calibración pendiente), este test avisa
# si alguna sugerencia dejó de servir.
# ===================================================
import logging

import pytest

from app.routers.chat import GENERIC_ESCALATION_REPLY, OPCIONES_SUGERIDAS

_LOGGER_DECISIONES = "intent_router.metrics"


@pytest.mark.parametrize("opcion", OPCIONES_SUGERIDAS, ids=[o["query"] for o in OPCIONES_SUGERIDAS])
def test_opcion_sugerida_resuelve_en_nivel_0_o_1_con_la_intencion_esperada(client, caplog, opcion):
    caplog.set_level(logging.INFO, logger=_LOGGER_DECISIONES)
    caplog.clear()

    response = client.post("/api/chat/", json={"message": opcion["query"]})
    assert response.status_code == 200

    eventos = [
        r for r in caplog.records
        if r.name == _LOGGER_DECISIONES and r.getMessage() == "decision_router"
    ]
    assert len(eventos) == 1, f"{opcion['query']!r}: se esperaba una sola cláusula, hubo {len(eventos)}"
    evento = eventos[0]
    assert evento.nivel in (0, 1), (
        f"{opcion['query']!r}: escaló a Nivel 2 (motivos={evento.motivos_escalada}) -- "
        f"una opción sugerida no puede caer en fallback"
    )
    assert evento.intencion == opcion["intencion_esperada"], (
        f"{opcion['query']!r}: resolvió a '{evento.intencion}', se esperaba '{opcion['intencion_esperada']}'"
    )


def test_fallback_generico_incluye_suggest_options(client):
    """Mensaje sin ningún match local -> el reply es el fallback genérico Y trae
    un UIAction suggest_options con las opciones reales."""
    response = client.post("/api/chat/", json={"message": "¿cuál es la mejor receta de sancocho valluno?"})
    data = response.json()

    assert data["reply"] == GENERIC_ESCALATION_REPLY

    sugeridas = [a for a in data["ai_actions"] if a["type"] == "suggest_options"]
    assert len(sugeridas) == 1
    opciones = sugeridas[0]["payload"]["options"]
    assert len(opciones) == len(OPCIONES_SUGERIDAS)
    for opcion in opciones:
        assert "label" in opcion and "query" in opcion


def test_respuesta_con_contenido_real_no_incluye_suggest_options(client):
    """No sobre-aplicar: si YA hay una respuesta real, no hace falta sugerir nada."""
    response = client.post("/api/chat/", json={"message": "como esta el aire hoy"})
    data = response.json()
    assert all(a["type"] != "suggest_options" for a in data["ai_actions"])
