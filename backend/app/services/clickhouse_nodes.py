# -*- coding: utf-8 -*-
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.db.clickhouse import ping, query_rows

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

def calcular_ica_pm25(pm25: float | None) -> dict:
    if pm25 is None or pm25 < 0:
        return {"ica": 0, "level": "buena"}
    
    breakpoints = [
        (0.0, 12.0, 0, 50, "buena"),
        (12.1, 35.4, 51, 100, "moderada"),
        (35.5, 55.4, 101, 150, "dañina-grupos-sensibles"),
        (55.5, 150.4, 151, 200, "dañina"),
        (150.5, 250.4, 201, 300, "muy-dañina"),
        (250.5, 500.4, 301, 500, "peligrosa")
    ]
    
    for c_low, c_high, i_low, i_high, level in breakpoints:
        if pm25 <= c_high:
            ica = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
            return {"ica": int(round(ica)), "level": level}
            
    return {"ica": 500, "level": "peligrosa"}

def get_nodos_clickhouse() -> List[Dict[str, Any]]:
    """Consulta la última lectura de cada sensor desde la tabla real en ClickHouse."""
    query = """
        SELECT
            name AS sensor_id,
            argMax(geo, time)  AS geohash,
            argMax(tmp, time)  AS temperatura,
            argMax(hum, time)  AS humedad,
            argMax(pm25, time) AS pm25,
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
        except Exception:
            lat, lng = 3.4372, -76.5222  # Cali centro de fallback
            
        # Formatear la hora
        if isinstance(ultima_utc, datetime):
            # Restar 5 horas para hora local de Cali (UTC-5)
            ultima_cali = (ultima_utc - timedelta(hours=5)).isoformat()
        else:
            ultima_cali = str(ultima_utc)
            
        nodos.append({
            "id": sensor_id,
            "name": f"Nodo {sensor_id[:6]}",
            "geohash": geohash,
            "coordinates": {"lat": lat, "lng": lng},
            "comuna": "Cali",
            "barrio": "Cali",
            "status": "activo",
            "lastUpdate": ultima_cali,
            "measurements": {
                "temperature": tmp_clean if tmp_clean is not None else 25.0,
                "humidity": hum_clean if hum_clean is not None else 65.0,
                "pm25": pm25_clean if pm25_clean is not None else 15.0,
                "co2": co2_clean if co2_clean is not None else 400.0,
                "ica": ica_info["ica"],
                "level": ica_info["level"]
            }
        })
    return nodos
