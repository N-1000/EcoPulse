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


# --- ica/level en None (no 0) para nodo inactivo o sin PM2.5 (EP-011) ---

def test_nodo_activo_con_pm25_tiene_ica_numerico():
    m = _nodo()["measurements"]
    assert isinstance(m["ica"], int) and m["ica"] > 0
    assert m["level"] == "buena"


def test_nodo_inactivo_por_antiguedad_tiene_ica_y_level_null_no_cero():
    n = _nodo(segundos_sin_datos=24 * 3600)
    assert n["status"] == "inactivo"
    assert n["measurements"]["ica"] is None
    assert n["measurements"]["level"] is None
    assert n["measurements"]["pm25"] == 10.0  # la última lectura real se conserva; el ICA actual no


def test_nodo_sin_ninguna_lectura_valida_tiene_ica_null():
    m = _nodo(temperatura=None, humedad=None, pm25_prom_1h=None, pm25_ultimo=None, co2=None)["measurements"]
    assert m["ica"] is None and m["level"] is None


def test_sensor_co2_activo_no_reporta_ica_cero():
    # Un TTGO no mide PM2.5; si la columna llega en 0, eso no es "aire perfecto".
    n = _nodo(sensor_id="TTGOT1TEST", pm25_prom_1h=0.0, pm25_ultimo=0.0, co2=600.0)
    assert n["status"] == "activo" and n["sensorType"] == "co2"
    assert n["measurements"]["ica"] is None and n["measurements"]["level"] is None


def test_metricas_ignoran_ica_null_sin_romperse():
    from app.utils.node_metrics import ica_promedio_ciudad, nodo_peor_ica
    nodos = [_nodo(), _nodo(segundos_sin_datos=24 * 3600)]
    assert nodo_peor_ica(nodos)["status"] == "activo"
    assert ica_promedio_ciudad(nodos) == nodos[0]["measurements"]["ica"]
