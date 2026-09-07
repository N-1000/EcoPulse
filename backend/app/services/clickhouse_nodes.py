import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.db.clickhouse import ping, query_rows
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
    query = """
        SELECT
            name AS sensor_id,
            argMax(geo, time)  AS geohash,
            argMax(tmp, time)  AS temperatura,
            argMax(hum, time)  AS humedad,
            if(isNaN(avgIf(pm25, time >= now() - INTERVAL 1 HOUR AND pm25 >= 0 AND pm25 <= 500)) OR avgIf(pm25, time >= now() - INTERVAL 1 HOUR AND pm25 >= 0 AND pm25 <= 500) = 0, argMax(pm25, time), avgIf(pm25, time >= now() - INTERVAL 1 HOUR AND pm25 >= 0 AND pm25 <= 500)) AS pm25,
            argMax(co2, time)  AS co2,
            max(time)          AS ultima_lectura_utc
        FROM tangara_plata.plata_tangara_sensores
        WHERE time >= now() - INTERVAL 48 HOUR
        GROUP BY name
    """
    resultado = query_rows(query)
    nodos = []
    for row in resultado:
        sensor_id = row.get("sensor_id")
        geohash = row.get("geohash")
        tmp = row.get("temperatura")
        hum = row.get("humedad")
        pm25 = row.get("pm25")
        co2 = row.get("co2")
        ultima_utc = row.get("ultima_lectura_utc")
        
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
            
        # Determinar estado: un nodo está activo si mide PM2.5, CO2 o Temperatura
        tiene_lectura_valida = (
            (pm25_clean is not None and pm25_clean > 0) or
            (co2_clean is not None and co2_clean > 0) or
            (tmp_clean is not None and tmp_clean > 0)
        )
        status = "activo" if tiene_lectura_valida else "inactivo"

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
                "temperature": tmp_clean if tmp_clean is not None else 0.0,
                "humidity": hum_clean if hum_clean is not None else 0.0,
                "pm25": pm25_clean if pm25_clean is not None else 0.0,
                "co2": co2_clean if co2_clean is not None else 0.0,
                "ica": ica_info["ica"] if tiene_lectura_valida else 0,
                "level": ica_info["level"] if tiene_lectura_valida else "buena"
            }
        })
    return nodos
