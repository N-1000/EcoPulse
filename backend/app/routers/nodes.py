import logging
from fastapi import APIRouter
from typing import List, Dict, Any
from app.db.clickhouse import ping
from app.services.mock_data import TANGARA_NODES
from app.services.clickhouse_nodes import get_nodos_clickhouse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/nodes", tags=["nodos"])

@router.get("")
async def get_nodes() -> List[Dict[str, Any]]:
    """
    Retorna la lista de todos los nodos de la red Tangara y sus últimas mediciones.
    Si la conexión a ClickHouse está degradada, se sirve el fallback con datos mock.
    """
    if ping():
        try:
            rows = get_nodos_clickhouse()
            if rows:
                return rows
        except Exception as exc:
            logger.error("Error consultando ClickHouse en /api/nodes: %s", exc)
            
    # Fallback transparente con datos mock
    return TANGARA_NODES
