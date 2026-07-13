"""
osrm.py — Cliente HTTP para OSRM con soporte de múltiples perfiles de transporte.

Servidores usados (gratuitos, sin API key):
  - Peatón/patines/skateboard : routing.openstreetmap.de/routed-foot
  - Bicicleta/patineta eléctrica : routing.openstreetmap.de/routed-bike
  - Auto (fallback)           : router.project-osrm.org/driving

Si el servidor del perfil específico falla, intenta con driving como fallback.
"""

import httpx
from typing import List, Dict, Any, Optional

# Servidores OSRM por perfil de transporte
OSRM_SERVERS = {
    "foot":    "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
    "bike":    "https://routing.openstreetmap.de/routed-bike/route/v1/bike",
    "driving": "https://router.project-osrm.org/route/v1/driving",
}

# Modos del frontend → perfil OSRM
MODE_TO_PROFILE = {
    "walk":       "foot",
    "skates":     "foot",
    "skateboard": "foot",
    "bike":       "bike",
    "escooter":   "bike",
}


async def _call_osrm(server: str, start: List[float], end: List[float]) -> Optional[Dict[str, Any]]:
    """Llama a un servidor OSRM y retorna {path, distance} o None si falla."""
    url = f"{server}/{start[1]},{start[0]};{end[1]},{end[0]}"
    params = {"overview": "full", "geometries": "geojson", "steps": "false"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, params=params)
            if res.status_code != 200:
                return None
            data = res.json()
            if data and data.get("routes"):
                route = data["routes"][0]
                coordinates = [[pt[1], pt[0]] for pt in route["geometry"]["coordinates"]]
                distance_km = round(route["distance"] / 1000.0, 2)
                return {"path": coordinates, "distance": distance_km}
    except Exception as e:
        print(f"[OSRM] Error con {server}: {e}")
    return None


async def fetch_osrm_route(
    start: List[float],
    end: List[float],
    transport_mode: str = "walk"
) -> Optional[Dict[str, Any]]:
    """
    Obtiene la ruta callejera real para el modo de transporte dado.
    Intenta con el perfil específico, luego con driving como fallback.
    """
    profile = MODE_TO_PROFILE.get(transport_mode, "foot")
    primary_server = OSRM_SERVERS[profile]

    # Intento principal con perfil correcto
    result = await _call_osrm(primary_server, start, end)
    if result:
        return result

    # Fallback a driving si el perfil específico falla
    if profile != "driving":
        print(f"[OSRM] Perfil '{profile}' falló, usando 'driving' como fallback")
        result = await _call_osrm(OSRM_SERVERS["driving"], start, end)
        if result:
            return result

    return None
