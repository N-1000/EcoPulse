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

import yaml
from intent_router.config_loader import cargar_config
from intent_router.embeddings import CanonicalEmbeddings, MODEL_DEFAULT, load_model, precompute_canonical
from intent_router.tools import (
    Herramienta,
    validar_acciones_registradas,
    validar_coherencia_sensitive_efecto,
    validar_esquemas_herramientas,
)

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

    Deja propagar cualquier excepcion (ConfigError de cargar_config() o de
    las tres compuertas de tools.py) a proposito -- el CALLER (lifespan en
    app/main.py) es quien decide que hacer con eso: deshabilitar solo el
    chat, no tumbar el proceso entero (mapa/tendencias/noticias no
    dependen de MuadDib). load_model() nunca tira (ya degrada
    internamente): si el modelo no carga, canonical_data queda en None y
    resolve() resuelve solo por Nivel 0, escalando todo lo demas a Nivel 2.
    """
    logger.info("MuadDib: cargando config del cliente (owned en EcoPulse, backend/app/muaddib_client/)")
    config = cargar_config(CONFIG_PATH, RULES_PATH, ENTITIES_PATH, CANONICAL_PATH)

    validar_esquemas_herramientas(HERRAMIENTAS)
    validar_acciones_registradas(config, HERRAMIENTAS)
    validar_coherencia_sensitive_efecto(config, HERRAMIENTAS)
    logger.info("MuadDib: %d herramientas registradas y validadas (Nivel 1 + Nivel 2)", len(HERRAMIENTAS))

    api_key = get_settings().anthropic_api_key
    if not api_key:
        logger.warning("MuadDib: ANTHROPIC_API_KEY no configurada -- Nivel 2 responderá con fallback_seguro")

    modelo = load_model(MODEL_DEFAULT)
    if modelo is None:
        logger.warning(
            "MuadDib: load_model('%s') devolvio None -- el servicio arranca degradado, "
            "solo Nivel 0 resuelve, todo lo demas escala a Nivel 2",
            MODEL_DEFAULT,
        )
        return MuadDibRouter(config=config, canonical_data=None, herramientas=HERRAMIENTAS, api_key=api_key)

    canonical_data = _cargar_canonical(modelo)
    logger.info("MuadDib: modelo y embeddings canonicos cargados -- Nivel 0 y Nivel 1 activos")
    return MuadDibRouter(config=config, canonical_data=canonical_data, herramientas=HERRAMIENTAS, api_key=api_key)


def _cargar_canonical(modelo: Any) -> CanonicalEmbeddings:
    with CANONICAL_PATH.open("r", encoding="utf-8") as f:
        canonical_yaml = yaml.safe_load(f)
    return precompute_canonical({"intents": canonical_yaml.get("intents", [])}, modelo)
