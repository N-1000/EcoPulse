# -*- coding: utf-8 -*-
# ===================================================
# /health/ready ya distinguia "MuadDib deshabilitado" de "Nivel 1 degradado"
# (canonical_data is None), pero no decia nada sobre si Nivel 2 (el LLM)
# puede funcionar -- sin ANTHROPIC_API_KEY, el chat completo "funciona"
# (200, ready=True) pero el 100% de las escaladas van a caer en
# fallback_seguro, y nada en este endpoint lo avisa. Hallazgo 2 del
# reporte de corpus (docs/reporte-corpus-chat.md).
# ===================================================
import json
from types import SimpleNamespace

from app.main import readiness


def test_readiness_reporta_nivel2_configurado_true_cuando_hay_api_key():
    motor = SimpleNamespace(api_key="sk-ant-fake", canonical_data=object())
    request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(muaddib_router=motor)))

    response = readiness(request)
    body = json.loads(response.body)

    assert response.status_code == 200
    assert body["ready"] is True
    assert body["nivel2_configurado"] is True


def test_readiness_reporta_nivel2_configurado_false_cuando_no_hay_api_key():
    motor = SimpleNamespace(api_key=None, canonical_data=object())
    request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(muaddib_router=motor)))

    response = readiness(request)
    body = json.loads(response.body)

    assert response.status_code == 200
    assert body["ready"] is True
    assert body["nivel2_configurado"] is False


def test_readiness_nivel2_configurado_false_cuando_muaddib_deshabilitado():
    request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(muaddib_router=None)))

    response = readiness(request)
    body = json.loads(response.body)

    assert response.status_code == 503
    assert body["nivel2_configurado"] is False


def test_readiness_endpoint_real_sin_api_key(client):
    """Integracion real contra el TestClient de conftest.py (corre sin ANTHROPIC_API_KEY) --
    confirma que el endpoint real, no solo la funcion aislada, expone el campo."""
    response = client.get("/health/ready")
    body = response.json()

    assert response.status_code == 200
    assert body["ready"] is True
    assert body["nivel2_configurado"] is False
