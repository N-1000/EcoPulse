# ===================================================
# ECOPULSE 2026 - Punto de entrada FastAPI
# Inteligencia Ambiental Urbana · Cali - Valle del Cauca
# ===================================================
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.clickhouse import ping
from app.muaddib_client.loader import iniciar_router
from app.routers import meta, nodes, routing, air_quality, chat, news

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Config y modelo de MuadDib se cargan una sola vez acá, no por request.
    # Si CUALQUIER cosa de MuadDib falla al cargar (config rota, esquema de
    # herramienta inválido, acción declarada sin herramienta registrada,
    # etc.), se deshabilita SOLO el chat -- el resto del servicio (mapa,
    # tendencias, noticias) no depende de MuadDib y tiene que levantar
    # igual. chat.py ya maneja app.state.muaddib_router is None con una
    # respuesta degradada, no revienta.
    try:
        app.state.muaddib_router = iniciar_router()
    except Exception:
        logger.exception("MuadDib no pudo inicializar -- el chat queda deshabilitado, el resto del servicio sigue")
        app.state.muaddib_router = None
    yield


app = FastAPI(
    title="EcoPulse API",
    description="Backend de Inteligencia Ambiental Urbana. Consume la capa Silver "
    "(tangara_plata) para sensores en vivo y la capa Oro (tangara_oro) para analíticas.",
    version="0.1.0",
    lifespan=lifespan,
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


@app.get("/health/ready", tags=["salud"])
def readiness(request: Request) -> JSONResponse:
    """
    Readiness de MuadDib (el chat), no solo si el proceso levantó.

    Uvicorn no acepta conexiones hasta que el lifespan termina, así que
    esto no cubre una carrera contra requests durante esos ~9s de arranque
    en este proceso único -- pero sí le da al harness de carga (o a un
    orquestador con múltiples workers) una señal confiable para esperar
    antes de mandar tráfico real, y sirve para ver en cualquier momento
    si el chat quedó degradado o deshabilitado, no solo al arrancar.

    503 si el modelo de embeddings no cargó (Nivel 1 inactivo) o si
    MuadDib no inicializó -- 200 solo cuando está completamente listo.
    """
    motor = getattr(request.app.state, "muaddib_router", None)
    if motor is None:
        return JSONResponse(status_code=503, content={"ready": False, "muaddib": "deshabilitado"})
    if motor.canonical_data is None:
        return JSONResponse(status_code=503, content={"ready": False, "muaddib": "degradado (solo Nivel 0)"})
    return JSONResponse(status_code=200, content={"ready": True, "muaddib": "listo"})
