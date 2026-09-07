# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - Router de Noticias Ambientales Reales
# ===================================================
from fastapi import APIRouter
from typing import List, Dict, Any

from app.services.news_service import fetch_live_cali_news

router = APIRouter(prefix="/api/v1/news", tags=["noticias"])


@router.get("")
def get_live_news() -> List[Dict[str, Any]]:
    """Devuelve las noticias ambientales reales y en vivo para Santiago de Cali."""
    return fetch_live_cali_news()
