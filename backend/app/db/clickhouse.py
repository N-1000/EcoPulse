# ===================================================
# TANGARA 2026 - Cliente ClickHouse
# Fuente de datos principal (capa Silver: tangara_plata).
# Solo lectura. Nunca ejecutar DDL/DML contra la infra de Tangara.
# ===================================================
from __future__ import annotations

from typing import Any

import clickhouse_connect
from clickhouse_connect.driver.client import Client

from app.core.config import get_settings

_client: Client | None = None


def get_client() -> Client:
    """Devuelve un cliente ClickHouse reutilizable (singleton perezoso).

    clickhouse-connect usa HTTP(S) y mantiene un pool de conexiones interno,
    por lo que es seguro compartir una sola instancia en toda la app.
    """
    global _client
    if _client is None:
        settings = get_settings()
        _client = clickhouse_connect.get_client(
            host=settings.clickhouse_host,
            port=settings.clickhouse_port,
            username=settings.clickhouse_user,
            password=settings.clickhouse_password,
            database=settings.clickhouse_database,
            secure=settings.clickhouse_secure,
            # Read-only a nivel de sesión: bloquea cualquier escritura accidental.
            settings={"readonly": 1},
        )
    return _client


def query_rows(sql: str, parameters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Ejecuta una consulta y devuelve las filas como lista de diccionarios.

    Usa siempre `parameters` (consultas parametrizadas de ClickHouse) para
    interpolar valores del usuario y evitar inyección SQL.
    """
    client = get_client()
    result = client.query(sql, parameters=parameters or {})
    columns = result.column_names
    return [dict(zip(columns, row)) for row in result.result_rows]


def ping() -> bool:
    """Comprueba la conectividad con ClickHouse."""
    try:
        return get_client().query("SELECT 1").result_rows[0][0] == 1
    except Exception:
        return False
