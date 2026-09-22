from fastapi import APIRouter
from typing import List, Dict, Any
from app.services.clickhouse_nodes import obtener_nodos_actuales

router = APIRouter(prefix="/api/nodes", tags=["nodos"])

@router.get("")
def get_nodes() -> List[Dict[str, Any]]:
    """
    Retorna la lista de todos los nodos de la red Tangara y sus últimas mediciones.
    Si la conexión a ClickHouse está degradada, se sirve el fallback con datos mock.

    `def` a propósito, no `async def`: obtener_nodos_actuales() es una llamada
    bloqueante (cliente síncrono de ClickHouse). FastAPI corre los endpoints
    `def` en un threadpool aparte; en `async def` bloqueaba el event loop
    entero -- verificado corriendo con asyncio en modo debug: dos requests
    concurrentes se servían en serie, no en paralelo (ver auditoría 2026-09-21).
    """
    return obtener_nodos_actuales()
