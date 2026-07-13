"""
traffic.py — Estimación de tráfico para rutas saludables en Cali.

Estrategia sin API de pago:
  1. Clasificación de vías por Overpass OSM → riesgo base por tipo de calle
  2. Factor hora del día (horas pico Cali) → multiplicador de congestión
  3. Resultado: trafficRisk (low/medium/high) + factor CO₂ ajustado

Cuando ClickHouse tenga datos de conteo vehicular, se reemplaza
estimate_traffic_level() por una consulta real.
"""

import math
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple

# Zona horaria de Cali (UTC-5)
CALI_TZ = timezone(timedelta(hours=-5))

# Horas pico en Cali (hora local)
RUSH_HOURS = {
    "morning": (6, 9),    # 6 a.m.–9 a.m.
    "midday":  (11, 14),  # 11 a.m.–2 p.m.
    "evening": (17, 20),  # 5 p.m.–8 p.m.
}

# Tipos de vía OSM → índice de riesgo base (0-1)
ROAD_RISK: Dict[str, float] = {
    "motorway":       1.0,
    "trunk":          0.9,
    "primary":        0.8,
    "secondary":      0.6,
    "tertiary":       0.4,
    "residential":    0.2,
    "living_street":  0.1,
    "cycleway":       0.0,
    "footway":        0.0,
    "path":           0.0,
    "unclassified":   0.3,
}


def _cali_hour() -> int:
    """Hora actual en Cali."""
    return datetime.now(CALI_TZ).hour


def _time_multiplier(hour: int) -> float:
    """Multiplica el riesgo base según hora del día en Cali."""
    for name, (start, end) in RUSH_HOURS.items():
        if start <= hour < end:
            return 1.5   # hora pico
    if 22 <= hour or hour < 5:
        return 0.3       # noche
    return 1.0           # hora valle


async def _fetch_road_types_overpass(
    lat_min: float, lng_min: float, lat_max: float, lng_max: float
) -> List[str]:
    """
    Consulta Overpass para obtener tipos de vías en la bbox de la ruta.
    Timeout corto — si falla, se usa estimación por defecto.
    """
    query = f"""
    [out:json][timeout:5];
    way["highway"]({lat_min},{lng_min},{lat_max},{lng_max});
    out tags;
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query}
            )
            if resp.status_code == 200:
                elements = resp.json().get("elements", [])
                return [e.get("tags", {}).get("highway", "unclassified") for e in elements]
    except Exception:
        pass
    return []  # fallback vacío → usa solo hora del día


def _risk_from_road_types(road_types: List[str]) -> float:
    """
    Promedio ponderado de los riesgos de vía.
    Usa mediana simple para no sobreponderar vías peligrosas lejanas a la ruta.
    Retorna None si la lista está vacía (sin datos Overpass).
    """
    if not road_types:
        return None  # sin datos: usar solo hora del día

    risks = [ROAD_RISK.get(rt, 0.3) for rt in road_types]
    # Mediana — más representativa que percentil 75 para una bbox urbana
    sorted_risks = sorted(risks)
    mid = len(sorted_risks) // 2
    if len(sorted_risks) % 2 == 0:
        return (sorted_risks[mid - 1] + sorted_risks[mid]) / 2
    return sorted_risks[mid]


def _classify(score: float) -> str:
    if score < 0.40:
        return "low"
    if score < 0.70:
        return "medium"
    return "high"


TRAFFIC_LABELS = {
    "low":    "Tráfico fluido",
    "medium": "Tráfico moderado",
    "high":   "Tráfico pesado",
}

# Factor de CO₂ adicional por congestión (autos frenando/acelerando)
CO2_TRAFFIC_FACTOR = {
    "low":    1.0,   # sin ajuste
    "medium": 1.25,  # +25 %
    "high":   1.55,  # +55 %
}

# Penalización al healthScore por tráfico
HEALTH_PENALTY = {
    "low":    0,
    "medium": 1,  # baja 1 nivel
    "high":   2,  # baja 2 niveles
}

HEALTH_LEVELS = ["A+", "A", "B", "C"]


# Score de riesgo base puro por hora (sin datos de vía)
_HOUR_BASE_RISK = {
    "rush":   0.65,   # hora pico → high si se confirma con vías
    "valley": 0.25,   # hora valle → low
    "night":  0.10,   # noche → low
}


async def get_traffic_data(path: List[List[float]]) -> Dict[str, Any]:
    """
    Retorna tráfico estimado para la ruta dada.
    path: lista de [lat, lng]

    Si Overpass responde: combina tipo de vía + hora del día.
    Si Overpass falla:    usa solo hora del día (sin fallback falso).
    """
    lats = [p[0] for p in path]
    lngs = [p[1] for p in path]
    bbox = (min(lats), min(lngs), max(lats), max(lngs))

    hour = _cali_hour()
    time_mult = _time_multiplier(hour)
    is_rush = time_mult > 1.0
    is_night = time_mult < 1.0

    road_types = await _fetch_road_types_overpass(*bbox)
    road_risk = _risk_from_road_types(road_types)  # None si Overpass falló

    if road_risk is not None:
        # Datos reales: combinar vía + hora
        raw_score = min(1.0, road_risk * time_mult)
    else:
        # Solo hora del día — sin inventar datos de vía
        if is_rush:
            raw_score = _HOUR_BASE_RISK["rush"]
        elif is_night:
            raw_score = _HOUR_BASE_RISK["night"]
        else:
            raw_score = _HOUR_BASE_RISK["valley"]

    risk = _classify(raw_score)

    return {
        "trafficRisk":   risk,
        "trafficLabel":  TRAFFIC_LABELS[risk],
        "trafficScore":  round(raw_score, 2),
        "co2Factor":     CO2_TRAFFIC_FACTOR[risk],
        "healthPenalty": HEALTH_PENALTY[risk],
        "rushHour":      is_rush,
        "localHour":     hour,
        "overpassOk":    road_risk is not None,
    }


def apply_traffic_to_health(base_score: str, penalty: int) -> str:
    """Baja el healthScore según la penalización de tráfico."""
    idx = HEALTH_LEVELS.index(base_score) if base_score in HEALTH_LEVELS else 2
    new_idx = min(len(HEALTH_LEVELS) - 1, idx + penalty)
    return HEALTH_LEVELS[new_idx]
