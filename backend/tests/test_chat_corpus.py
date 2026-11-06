# -*- coding: utf-8 -*-
# ===================================================
# Primeros tests de backend/ -- POST /api/chat/ de punta a punta via HTTP
# (FastAPI TestClient con lifespan real), sin LLM (sin ANTHROPIC_API_KEY,
# ver conftest.py) y con ClickHouse/noticias mockeados.
#
# Cada caso de tests/corpus_chat.py se manda por HTTP de verdad contra el
# endpoint real. Para poder reportar nivel/intención real (que el
# contrato HTTP de ChatResponse no expone -- solo da reply/ai_actions) se
# usa `caplog` para leer el log estructurado que YA emite
# intent_router.metrics.log_decision() en producción (decision_router,
# con nivel/intencion/herramientas_llamadas como campos `extra`) -- no se
# tocó ningún código de producción para esto, es logging que ya existía.
# ===================================================
import importlib.util
import logging

import pytest

from tests._resultados import RESULTADOS

if importlib.util.find_spec("tests.corpus_chat") is None:
    pytest.skip(
        "corpus_chat.py no esta en este arbol: es un corpus privado, ignorado por git. "
        "Copialo a backend/tests/corpus_chat.py para correr estos tests.",
        allow_module_level=True,
    )

from tests.corpus_chat import CORPUS  # noqa: E402

_LOGGER_DECISIONES = "intent_router.metrics"


@pytest.mark.parametrize("caso", CORPUS, ids=[c.id for c in CORPUS])
def test_corpus_chat(client, caplog, caso):
    caplog.set_level(logging.INFO, logger=_LOGGER_DECISIONES)
    caplog.clear()

    response = client.post("/api/chat/", json={"message": caso.mensaje, "current_page": "inicio"})

    # Invariantes duras: tienen que cumplirse SIEMPRE, sin importar si el
    # router resolvió, escaló o rechazó -- esto es lo que de verdad protege
    # contra una regresión real (un 500, un esquema roto, un reply vacío).
    assert response.status_code == 200, f"{caso.id}: status {response.status_code} para {caso.mensaje!r}"
    data = response.json()
    assert isinstance(data.get("reply"), str) and data["reply"] != "", (
        f"{caso.id}: reply vacío o ausente para {caso.mensaje!r}"
    )
    assert isinstance(data.get("ai_actions"), list), f"{caso.id}: ai_actions no es una lista"

    eventos = [
        r for r in caplog.records
        if r.name == _LOGGER_DECISIONES and r.getMessage() == "decision_router"
    ]

    if caso.nivel_esperado == "rechazo_longitud":
        # Caso único (largo_01): esto SÍ es una garantía dura del código --
        # chat.py valida el largo antes de tocar el router.
        assert len(eventos) == 0, f"{caso.id}: se esperaba rechazo por longitud, pero el router se ejecutó"
        assert "demasiado largo" in data["reply"].lower()

    RESULTADOS.append(
        {
            "caso": caso,
            "reply": data["reply"],
            "ai_actions": data["ai_actions"],
            "niveles": [getattr(r, "nivel", None) for r in eventos],
            "intenciones": [getattr(r, "intencion", None) for r in eventos],
            "herramientas_llamadas": [tuple(getattr(r, "herramientas_llamadas", ()) or ()) for r in eventos],
            "n_eventos": len(eventos),
        }
    )
