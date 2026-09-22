import asyncio
from fastapi import APIRouter
from typing import Dict, Any
from app.models.route import RouteRequest, RouteResult
from app.services.routing import select_best_destination, calculate_healthy_route, CALI_PARKS
from app.services.clickhouse_nodes import obtener_nodos_actuales

router = APIRouter(prefix="/api/routing", tags=["ruteo"])

@router.get("/green-zones")
async def get_green_zones():
    """Lista de parques y áreas verdes curadas de Cali."""
    return CALI_PARKS

@router.get("/best-destination")
def get_best_destination(lat: float, lng: float):
    """Dado un origen, retorna el mejor parque de destino.

    `def` a propósito -- ver la nota de nodes.py:get_nodes sobre por qué
    obtener_nodos_actuales() no puede vivir en un `async def`.
    """
    nodes = obtener_nodos_actuales()
    dest = select_best_destination([lat, lng], nodes)
    return dest

@router.post("/healthy-route", response_model=RouteResult)
async def post_healthy_route(req: RouteRequest) -> Dict[str, Any]:
    """
    Calcula una ruta saludable completa.
    Recibe origen y destino, devuelve trayecto, tiempos por modo,
    CO₂ evitado, ICA promedio, score de salud y nombre del destino.

    Sigue siendo `async def` porque tiene un await real (calculate_healthy_route,
    que llama OSRM/Overpass con httpx.AsyncClient) -- pero obtener_nodos_actuales()
    es bloqueante (ClickHouse síncrono), así que va a un hilo aparte con
    asyncio.to_thread() en vez de ejecutarse inline en el event loop.
    """
    nodes = await asyncio.to_thread(obtener_nodos_actuales)

    # Si no hay destino explícito, seleccionar el mejor parque
    end = req.end
    dest_park = next((p for p in CALI_PARKS if p["lat"] == end[0] and p["lng"] == end[1]), None)
    dest_name = dest_park["name"] if dest_park else "Destino"

    result = await calculate_healthy_route(req.start, end, nodes, dest_name, req.transport_mode)
    return result
