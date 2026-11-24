"""EP-011: sin datos reales de ClickHouse ningún camino devuelve nodos fabricados como activos.

Antes, en los tres casos (ping falla, excepción en la consulta, cero filas)
/api/nodes servía TANGARA_NODES: 12 nodos "activo" con lastUpdate inventado,
y el chat y el ruteo afirmaban un ICA sobre esos datos.
"""
import asyncio
import re
from unittest.mock import patch

import pytest

from app.core.config import get_settings
from app.muaddib_client import tools
from app.services import clickhouse_nodes, routing
from app.utils.node_metrics import TEXTO_SIN_DATOS_EN_VIVO, sin_datos_en_vivo_para_banner


@pytest.fixture(autouse=True)
def _cache_vacia():
    """Cada test arranca y termina con la caché de nodos vacía, para no contaminar a los demás."""
    clickhouse_nodes._CACHE_NODOS = None
    yield
    clickhouse_nodes._CACHE_NODOS = None


def _assert_todos_inactivos_sin_dato(nodos):
    assert nodos, "debe devolver los nodos conocidos, no una lista vacía"
    for n in nodos:
        assert n["status"] == "inactivo", n["id"]
        assert n["lastUpdate"] is None, n["id"]
        m = n["measurements"]
        assert (m["temperature"], m["humidity"], m["pm25"], m["co2"]) == (None, None, None, None), n["id"]
        assert m["ica"] is None, n["id"]  # 0 es un ICA válido: sin dato es None
        assert m["level"] is None, n["id"]
    assert sin_datos_en_vivo_para_banner(nodos) is True


# --- (a) ClickHouse caído ---

def test_clickhouse_caido_api_nodes_todos_inactivos_sin_lastupdate(client):
    with patch.object(clickhouse_nodes, "ping", lambda: False):
        response = client.get("/api/nodes")
    assert response.status_code == 200
    _assert_todos_inactivos_sin_dato(response.json())


def test_excepcion_en_la_consulta_todos_inactivos(client):
    def _falla():
        raise RuntimeError("timeout de ClickHouse")

    with patch.object(clickhouse_nodes, "ping", lambda: True), \
         patch.object(clickhouse_nodes, "get_nodos_clickhouse", _falla):
        response = client.get("/api/nodes")
    assert response.status_code == 200
    _assert_todos_inactivos_sin_dato(response.json())


# --- (b) cero filas (corte de más de node_lookback_days) ---

def test_cero_filas_api_nodes_todos_inactivos_sin_lastupdate(client):
    with patch.object(clickhouse_nodes, "ping", lambda: True), \
         patch.object(clickhouse_nodes, "query_rows", return_value=[]):
        response = client.get("/api/nodes")
    assert response.status_code == 200
    _assert_todos_inactivos_sin_dato(response.json())


# --- lastUpdate real conservado, nunca fabricado ---

def test_con_cache_previa_conserva_el_ultimo_timestamp_real_y_no_sus_mediciones():
    real = {
        "id": "D29ESP32REAL", "name": "Nodo real", "geohash": "d29e1ze",
        "coordinates": {"lat": 3.4, "lng": -76.5}, "comuna": "Cali", "barrio": "X",
        "status": "activo", "lastUpdate": "2026-11-20T08:15:00", "sensorType": "pm25",
        "measurements": {"temperature": 25.0, "humidity": 60.0, "pm25": 30.0, "co2": None, "ica": 88, "level": "moderada"},
    }
    clickhouse_nodes._CACHE_NODOS = (0.0, [real])
    with patch.object(clickhouse_nodes, "ping", lambda: False):
        (nodo,) = clickhouse_nodes._obtener_nodos_sin_cache()
    assert nodo["id"] == "D29ESP32REAL"
    assert nodo["status"] == "inactivo"
    assert nodo["lastUpdate"] == "2026-11-20T08:15:00"
    assert nodo["measurements"]["pm25"] is None
    assert nodo["measurements"]["ica"] is None and nodo["measurements"]["level"] is None


def test_ningun_lastupdate_es_fabricado_aunque_el_catalogo_lo_tenga():
    # El catálogo de mock_data.py trae lastUpdate de _get_recent_time(): no debe filtrarse.
    with patch.object(clickhouse_nodes, "ping", lambda: False):
        nodos = clickhouse_nodes._obtener_nodos_sin_cache()
    assert all(n["lastUpdate"] is None for n in nodos)


# --- modo demo explícito ---

def test_mock_solo_con_ecopulse_demo_data_activo(monkeypatch):
    monkeypatch.setenv("ECOPULSE_DEMO_DATA", "1")
    get_settings.cache_clear()
    try:
        with patch.object(clickhouse_nodes, "ping", lambda: False):
            nodos = clickhouse_nodes._obtener_nodos_sin_cache()
        assert nodos is clickhouse_nodes.TANGARA_NODES
    finally:
        monkeypatch.delenv("ECOPULSE_DEMO_DATA")
        get_settings.cache_clear()


def test_demo_apagado_por_defecto():
    assert get_settings().ecopulse_demo_data is False


# --- (c) el chat sin datos en vivo no afirma un ICA ---

_UN_ICA = re.compile(r"\bICA (de |promedio |actual )?.{0,25}\d", re.IGNORECASE)


def test_chat_nodo_mas_contaminado_sin_datos_en_vivo_no_afirma_ica(client):
    with patch.object(clickhouse_nodes, "ping", lambda: False):
        response = client.post("/api/chat/", json={"message": "nodo con mayor contaminacion"})
    assert response.status_code == 200
    reply = response.json()["reply"]
    assert TEXTO_SIN_DATOS_EN_VIVO in reply
    assert not _UN_ICA.search(reply), reply


@pytest.mark.parametrize("herramienta", [tools.mostrar_calidad_aire, tools.consejo_actividad_salud, tools.ranking_nodos])
def test_herramientas_del_asistente_sin_datos_en_vivo_no_afirman_ica(herramienta):
    with patch.object(clickhouse_nodes, "ping", lambda: False):
        texto = herramienta()
    assert TEXTO_SIN_DATOS_EN_VIVO in texto
    assert not _UN_ICA.search(texto), texto
    assert "ideales" not in texto  # el consejo de salud no recomienda salir sin datos


def test_ruta_sin_nodos_en_vivo_no_inventa_ica():
    trafico = {"co2Factor": 1.0, "healthPenalty": 0, "trafficRisk": "low", "trafficLabel": "-", "rushHour": False}

    async def _sin_osrm(*_a, **_k):
        return None

    async def _trafico(*_a, **_k):
        return trafico

    with patch.object(clickhouse_nodes, "ping", lambda: False):
        nodos = clickhouse_nodes.obtener_nodos_actuales()
    with patch.object(routing, "fetch_osrm_route", _sin_osrm), patch.object(routing, "get_traffic_data", _trafico):
        r = asyncio.run(routing.calculate_healthy_route([3.45, -76.53], [3.38, -76.53], nodos, "Parque"))
    assert r["averageICA"] is None
    assert r["healthScore"] not in ("A+", "A")
