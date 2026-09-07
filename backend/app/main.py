# ===================================================
# ECOPULSE 2026 - Punto de entrada FastAPI
# Inteligencia Ambiental Urbana · Cali - Valle del Cauca
# ===================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.clickhouse import ping
from app.routers import meta, nodes, routing, air_quality, chat, news


app = FastAPI(
    title="EcoPulse API",
    description="Backend de Inteligencia Ambiental Urbana. Consume la capa Silver "
    "(tangara_plata) para sensores en vivo y la capa Oro (tangara_oro) para analíticas.",
    version="0.1.0",
)

app.include_router(chat.router)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meta.router)
app.include_router(nodes.router)
app.include_router(routing.router)
app.include_router(air_quality.router)
app.include_router(news.router)


@app.get("/health", tags=["salud"])
def health() -> dict[str, object]:
    """Estado del backend y de la conexión a ClickHouse."""
    db_ok = ping()
    return {
        "status": "ok" if db_ok else "degraded",
        "clickhouse": "conectado" if db_ok else "sin conexión",
        "database": settings.clickhouse_database,
    }
