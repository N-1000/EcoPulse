# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - Router de Calidad del Aire y Analítica (Capa Oro)
# ===================================================
from fastapi import APIRouter, Query
from typing import List, Dict, Any

from app.services.clickhouse_analytics import (
    get_monthly_historical_clickhouse,
    get_24h_trends_clickhouse,
    get_serie_por_sensor,
    get_hourly_pattern_clickhouse,
)


router = APIRouter(prefix="/api/v1/air-quality", tags=["calidad-aire"])


@router.get("/monthly-historical")
def get_monthly_historical(
    year: str = Query("2026", description="Año a consultar (e.g. 2026, 2025)")
) -> List[Dict[str, Any]]:
    """Devuelve las métricas mensuales agregadas de la Capa Oro (`tangara_oro`)."""
    return get_monthly_historical_clickhouse(year)


@router.get("/trends-24h")
def get_24h_trends(
    metric: str = Query("24h", description="Métrica a consultar: 24h, pm25, co2")
) -> Dict[str, Any]:
    """Devuelve la tendencia horaria cronológica de las últimas 24h desde ClickHouse."""
    return get_24h_trends_clickhouse(metric)


@router.get("/serie-por-sensor")
def get_serie_sensores() -> Dict[str, Any]:
    """
    Devuelve las series temporales de PM2.5 de los top 12 sensores más activos
    en intervalos de 30 minutos durante las últimas 24h (hora Cali).
    Usado para el spaghetti chart multi-sensor de TendenciaSemana.
    """
    return get_serie_por_sensor()


@router.get("/hourly-pattern")
def get_hourly_pattern() -> List[Dict[str, Any]]:
    """
    Promedio real de PM2.5/ICA por hora del día (0-23h), agregado sobre
    todo el histórico de la red Tángara. Usado por HeatmapHoras para
    mostrar cómo varía el aire durante el día con datos reales, no un
    patrón hardcodeado.
    """
    return get_hourly_pattern_clickhouse()


