# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - muaddib_client/loader.py
#
# Carga config + modelo + embeddings canonicos de MuadDib UNA sola vez,
# al arranque de FastAPI (ver lifespan en app/main.py). No se vuelve a
# llamar por request.
# ===================================================
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional

from intent_router.config_loader import cargar_config
from intent_router.embeddings import CanonicalEmbeddings, MODEL_DEFAULT, load_model, precompute_canonical
from intent_router.tools import Herramienta

from app.core.config import get_settings
from app.muaddib_client.tools import HERRAMIENTAS

logger = logging.getLogger(__name__)

CLIENT_DIR = Path(__file__).resolve().parent
CONFIG_PATH = CLIENT_DIR / "config.yaml"
RULES_PATH = CLIENT_DIR / "rules_nivel0.yaml"
ENTITIES_PATH = CLIENT_DIR / "entities.yaml"
CANONICAL_PATH = CLIENT_DIR / "canonical.yaml"


@dataclass
class MuadDibRouter:
    config: dict[str, Any]
    canonical_data: Optional[CanonicalEmbeddings]
    herramientas: tuple[Herramienta, ...]
    api_key: Optional[str]


def iniciar_router() -> MuadDibRouter:
    """Carga config, modelo, embeddings canonicos y valida el registro de herramientas al arranque.

    Deja propagar cualquier excepcion a proposito -- el CALLER (lifespan en
    app/main.py) es quien decide que hacer con eso: deshabilitar solo el
    chat, no tumbar el proceso entero (mapa/tendencias/noticias no
    dependen de MuadDib), y /health/ready responde 503 "deshabilitado".

    - ConfigError: cargar_config() valida al cargar el esquema cerrado de
      los cuatro YAML, `efecto` y `sensitive` obligatorios y cruzados, y el
      registro de herramientas (schemas, acciones registradas, coherencia
      efecto/efecto_real); antes eran tres compuertas que se llamaban a mano.
      Tambien estampa la huella del registro que resolver_escaladas exige.
    - RuntimeError: el modelo de embeddings es obligatorio desde el
      hallazgo 29 de MuadDib. Antes, sin modelo, el chat arrancaba
      degradado a Nivel 0 sin que nada lo hiciera visible (MD-015).
    """
    logger.info("MuadDib: cargando config del cliente (owned en EcoPulse, backend/app/muaddib_client/)")
    config = cargar_config(CONFIG_PATH, RULES_PATH, ENTITIES_PATH, CANONICAL_PATH, HERRAMIENTAS)

    logger.info("MuadDib: %d herramientas registradas y validadas (Nivel 1 + Nivel 2)", len(HERRAMIENTAS))

    api_key = get_settings().anthropic_api_key
    if not api_key:
        logger.warning("MuadDib: ANTHROPIC_API_KEY no configurada -- Nivel 2 responderá con fallback_seguro")

    modelo = load_model(MODEL_DEFAULT)
    if modelo is None:
        raise RuntimeError(f"El modelo de embeddings '{MODEL_DEFAULT}' no cargo: el servicio no debe arrancar sin Nivel 1.")
    canonical_data = precompute_canonical(config, modelo)
    logger.info("MuadDib: modelo y embeddings canonicos cargados -- Nivel 0 y Nivel 1 activos")
    return MuadDibRouter(config=config, canonical_data=canonical_data, herramientas=HERRAMIENTAS, api_key=api_key)
