from fastapi import APIRouter
from typing import Dict, Any, List
from app.models.route import RouteRequest, RouteResult
from app.services.routing import select_best_destination, calculate_healthy_route, CALI_PARKS
from app.services.mock_data import TANGARA_NODES
from app.db.clickhouse import ping

router = APIRouter(prefix="/api/routing", tags=["ruteo"])

def _get_nodes() -> List[Dict[str, Any]]:
    """Intenta obtener nodos de ClickHouse, usa mock como fallback."""
    if ping():
        try:
            from app.services.clickhouse_nodes import get_nodos_clickhouse
            rows = get_nodos_clickhouse()
            if rows:
                return rows
        except Exception:
            pass
    return TANGARA_NODES

@router.get("/green-zones")
async def get_green_zones():
    """Lista de parques y áreas verdes curadas de Cali."""
    return CALI_PARKS

@router.get("/best-destination")
async def get_best_destination(lat: float, lng: float):
    """Dado un origen, retorna el mejor parque de destino."""
    nodes = _get_nodes()
    dest = select_best_destination([lat, lng], nodes)
    return dest

@router.post("/healthy-route", response_model=RouteResult)
async def post_healthy_route(req: RouteRequest) -> Dict[str, Any]:
    """
    Calcula una ruta saludable completa.
    Recibe origen y destino, devuelve trayecto, tiempos por modo,
    CO₂ evitado, ICA promedio, score de salud y nombre del destino.
    """
    nodes = _get_nodes()
    
    # Si no hay destino explícito, seleccionar el mejor parque
    end = req.end
    dest_park = next((p for p in CALI_PARKS if p["lat"] == end[0] and p["lng"] == end[1]), None)
    dest_name = dest_park["name"] if dest_park else "Destino"
    
    result = await calculate_healthy_route(req.start, end, nodes, dest_name, req.transport_mode)
    return result
