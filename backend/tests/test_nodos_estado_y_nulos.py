"""Estado por antigüedad y 'sin dato' (None) en get_nodos_clickhouse, sin tocar ClickHouse."""
from datetime import datetime
from unittest.mock import patch

from app.services import clickhouse_nodes


def _fila(**kw):
    base = {
        "sensor_id": "D29ESP32TEST", "geohash": "d29e1ze",
        "temperatura": 24.0, "humedad": 70.0,
        "pm25_prom_1h": 10.0, "pm25_ultimo": 12.0, "co2": 0.0,
        "ultima_lectura_utc": datetime(2026, 11, 8, 12, 0, 0),
        "segundos_sin_datos": 30,
    }
    base.update(kw)
    return base


def _nodo(**kw):
    with patch.object(clickhouse_nodes, "query_rows", return_value=[_fila(**kw)]):
        return clickhouse_nodes.get_nodos_clickhouse()[0]


def test_nodo_con_lectura_reciente_esta_activo():
    assert _nodo()["status"] == "activo"


def test_nodo_con_lectura_vieja_esta_inactivo():
    assert _nodo(segundos_sin_datos=24 * 3600)["status"] == "inactivo"


def test_umbral_de_inactividad_es_configurable_y_exacto():
    limite = clickhouse_nodes.get_settings().node_stale_minutes * 60
    assert _nodo(segundos_sin_datos=limite)["status"] == "activo"
    assert _nodo(segundos_sin_datos=limite + 1)["status"] == "inactivo"


def test_sin_promedio_1h_usa_ultima_lectura_no_cero():
    for sin_promedio in (None, float("nan")):
        n = _nodo(pm25_prom_1h=sin_promedio, pm25_ultimo=7.0)
        assert n["measurements"]["pm25"] == 7.0


def test_valores_ausentes_o_invalidos_salen_como_null_no_cero():
    m = _nodo(temperatura=None, humedad=250.0, pm25_prom_1h=None, pm25_ultimo=None, co2=None)["measurements"]
    assert m["temperature"] is None
    assert m["humidity"] is None   # fuera de rango físico
    assert m["pm25"] is None
    assert m["co2"] is None
