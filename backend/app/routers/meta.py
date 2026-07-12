# ===================================================
# TANGARA 2026 - Router de metadatos / introspección
# Descubre el esquema real de la capa Silver (tangara_plata)
# sin necesidad de conocerlo de antemano.
# ===================================================
from fastapi import APIRouter, Query

from app.core.config import get_settings
from app.db.clickhouse import query_rows

router = APIRouter(prefix="/api/meta", tags=["metadatos"])


@router.get("/tables")
def list_tables() -> list[dict[str, object]]:
    """Lista las tablas de la base de datos configurada con su nº de filas y tamaño."""
    settings = get_settings()
    sql = """
        SELECT
            name AS tabla,
            total_rows AS filas,
            formatReadableSize(total_bytes) AS tamano
        FROM system.tables
        WHERE database = {db:String}
        ORDER BY total_rows DESC
    """
    return query_rows(sql, {"db": settings.clickhouse_database})


@router.get("/columns")
def describe_table(table: str = Query(..., description="Nombre de la tabla a describir")) -> list[dict[str, object]]:
    """Devuelve las columnas (nombre y tipo) de una tabla de la capa Silver."""
    settings = get_settings()
    sql = """
        SELECT
            name AS columna,
            type AS tipo
        FROM system.columns
        WHERE database = {db:String} AND table = {table:String}
        ORDER BY position
    """
    return query_rows(sql, {"db": settings.clickhouse_database, "table": table})


@router.get("/sample")
def sample_table(
    table: str = Query(..., description="Nombre de la tabla"),
    limit: int = Query(5, ge=1, le=50, description="Nº de filas de muestra (máx. 50)"),
) -> list[dict[str, object]]:
    """Devuelve unas pocas filas de muestra para entender la forma de los datos.

    El nombre de tabla se valida contra el catálogo real antes de interpolarlo,
    ya que los identificadores no pueden parametrizarse en ClickHouse.
    """
    settings = get_settings()
    valid = query_rows(
        "SELECT name FROM system.tables WHERE database = {db:String}",
        {"db": settings.clickhouse_database},
    )
    valid_names = {row["name"] for row in valid}
    if table not in valid_names:
        return [{"error": f"Tabla '{table}' no encontrada en {settings.clickhouse_database}"}]

    # `table` ya está validado contra el catálogo -> seguro para interpolar.
    return query_rows(f"SELECT * FROM {table} LIMIT {int(limit)}")
