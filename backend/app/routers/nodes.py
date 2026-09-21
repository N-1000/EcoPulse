from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.clickhouse_nodes import obtener_nodos_actuales

router = APIRouter(prefix="/api/nodes", tags=["nodos"])

@router.get("")
async def get_nodes() -> List[Dict[str, Any]]:
    """
    Retorna la lista de todos los nodos de la red Tangara y sus últimas mediciones.
    Si la conexión a ClickHouse está degradada, se sirve el fallback con datos mock.
    """
    return obtener_nodos_actuales()
