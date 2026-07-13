from fastapi import APIRouter
from typing import List, Dict, Any
from app.db.clickhouse import ping, query_rows
from app.services.mock_data import TANGARA_NODES

router = APIRouter(prefix="/api/nodes", tags=["nodos"])

@router.get("")
async def get_nodes() -> List[Dict[str, Any]]:
    """
    Retorna la lista de todos los nodos de la red Tangara y sus últimas mediciones.
    Si la conexión a ClickHouse está degradada, se sirve el fallback con datos mock.
    """
    if ping():
        try:
            # Aquí iría la consulta real a ClickHouse
            # Para fines de este MVP, si hay ClickHouse usamos los datos estructurados.
            # En producción: query_rows("SELECT id, name, geohash, status, ... FROM tangara_plata.nodos")
            rows = query_rows("SELECT * FROM tangara_plata.nodos")
            if rows:
                return rows
        except Exception as e:
            print(f"Error consultando ClickHouse: {e}")
            
    # Fallback transparente con datos mock
    return TANGARA_NODES
