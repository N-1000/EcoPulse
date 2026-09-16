# ===================================================
# ECOPULSE 2026 - Cliente ClickHouse
# Fuente de datos principal (capa Silver: tangara_plata).
# Solo lectura. Nunca ejecutar DDL/DML contra la infra física.
# ===================================================
from __future__ import annotations

import threading
from typing import Any

import logging
import clickhouse_connect
from clickhouse_connect.driver.client import Client

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# clickhouse-connect NO soporta queries concurrentes sobre la misma instancia
# de Client: cada instancia mantiene un session_id propio en el servidor, y
# dos queries simultáneas sobre el mismo Client chocan con "Attempt to
# execute concurrent queries within the same session".
#
# Los endpoints síncronos de FastAPI (routers declarados con `def`, no
# `async def`) corren en el threadpool de Starlette, así que bajo carga
# real (el HomePage dispara varios fetches en paralelo) sí hay dos hilos
# distintos llamando a query_rows() al mismo tiempo. Un singleton global
# rompe ahí.
#
# La solución es un cliente por hilo (`threading.local`), no un pool manual:
# el threadpool de Starlette reutiliza un número acotado de hilos worker
# entre requests, así que cada hilo crea su Client una sola vez y lo
# reutiliza en las siguientes requests que le toquen — sin la sobrecarga de
# abrir conexión en cada query, y sin el riesgo de compartir sesión entre
# hilos concurrentes.
_thread_local = threading.local()


def _build_client() -> Client:
    settings = get_settings()
    return clickhouse_connect.get_client(
        host=settings.clickhouse_host,
        port=settings.clickhouse_port,
        username=settings.clickhouse_user,
        password=settings.clickhouse_password,
        database=settings.clickhouse_database,
        secure=settings.clickhouse_secure,
        # Read-only a nivel de sesión: bloquea cualquier escritura accidental.
        settings={"readonly": 1},
    )


def get_client() -> Client:
    """Devuelve el cliente ClickHouse del hilo actual (uno por hilo, perezoso)."""
    client = getattr(_thread_local, "client", None)
    if client is None:
        client = _build_client()
        _thread_local.client = client
    return client


def query_rows(sql: str, parameters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Ejecuta una consulta y devuelve las filas como lista de diccionarios.

    Usa siempre `parameters` (consultas parametrizadas de ClickHouse) para
    interpolar valores del usuario y evitar inyección SQL.
    """
    try:
        client = get_client()
        result = client.query(sql, parameters=parameters or {})
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]
    except Exception as exc:
        logger.error("Error consultando ClickHouse: %s", exc)
        return []


def ping() -> bool:
    """Comprueba la conectividad con ClickHouse."""
    try:
        return get_client().query("SELECT 1").result_rows[0][0] == 1
    except Exception as exc:
        logger.warning("Fallo en ping a ClickHouse: %s", exc)
        return False
