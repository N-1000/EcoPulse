# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - loadtest/mocks.py
#
# Reemplaza los 5 servicios externos reales (ClickHouse, OSRM, Overpass,
# RSS, Claude) por dobles con latencia realista, ANTES de importar
# app.main. Nunca se llama a un servicio real desde acá -- ver
# run_mocked_app.py, que aplica esto primero y recién después importa
# la app.
#
# Filosofía: mockear en el borde de red más bajo posible (el cliente
# HTTP/DB), no reescribir la lógica de negocio -- así los fallbacks
# reales y ya probados de cada servicio (_fallback_monthly_historical,
# _fallback_24h_trends, etc.) son los que se ejercitan, en vez de
# inventar datos de mentira nuevos acá.
# ===================================================
import asyncio
import random
import time
from types import SimpleNamespace
from typing import Any


# ──────────────────────────────────────────────────────────────
# 1. ClickHouse -- ~300ms, ver criterio aprobado.
# Se mockea get_client(): tanto ping() como query_rows() pasan por ahí.
# Siempre "sin filas" -> cada función real cae en su propio fallback
# realista ya escrito (esto SOLO prueba concurrencia/latencia, no
# corrección de datos).
# ──────────────────────────────────────────────────────────────
class _FakeClickHouseClient:
    def query(self, sql: str, parameters: dict | None = None):
        time.sleep(random.uniform(0.25, 0.35))
        if "SELECT 1" in sql:
            return SimpleNamespace(result_rows=[[1]], column_names=["1"])
        return SimpleNamespace(result_rows=[], column_names=[])


def patch_clickhouse() -> None:
    from app.db import clickhouse

    _fake = _FakeClickHouseClient()
    clickhouse.get_client = lambda: _fake


# ──────────────────────────────────────────────────────────────
# 2. OSRM -- httpx.AsyncClient en app/services/osrm.py. ~250ms.
# ──────────────────────────────────────────────────────────────
class _FakeHttpxResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._payload = payload

    def json(self) -> dict:
        return self._payload


class _FakeAsyncClient:
    """Reemplaza httpx.AsyncClient como context manager async."""

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url: str, params: dict | None = None):
        await asyncio.sleep(random.uniform(0.20, 0.30))
        # Ruta de mentira pero con forma real (2 puntos, geometry GeoJSON) --
        # alcanza para ejercitar el path completo de calculate_healthy_route().
        return _FakeHttpxResponse(200, {
            "routes": [{
                "distance": 1200.0,
                "geometry": {"coordinates": [[-76.53, 3.45], [-76.54, 3.44]]},
            }]
        })

    async def post(self, url: str, data: dict | None = None):
        # Overpass (traffic.py) -- lista vacía de elementos = "sin datos de
        # vía", cae en la heurística por hora que ya existe en traffic.py.
        await asyncio.sleep(random.uniform(0.15, 0.30))
        return _FakeHttpxResponse(200, {"elements": []})


def patch_osrm_and_overpass() -> None:
    from app.services import osrm, traffic

    osrm.httpx.AsyncClient = _FakeAsyncClient
    traffic.httpx.AsyncClient = _FakeAsyncClient


# ──────────────────────────────────────────────────────────────
# 3. RSS de noticias -- urllib en app/services/news_service.py. ~200ms.
# ──────────────────────────────────────────────────────────────
_FAKE_RSS_XML = b"""<?xml version="1.0"?>
<rss><channel>
<item>
  <title>Calidad del aire mejora en Cali tras lluvias recientes - El Pais Cali</title>
  <link>https://example.test/noticia-1</link>
  <pubDate>Mon, 22 Sep 2026 10:00:00 GMT</pubDate>
  <description>Nota de prueba generada por el harness de carga, no es una noticia real.</description>
</item>
</channel></rss>
"""


class _FakeUrlopenResponse:
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self) -> bytes:
        time.sleep(random.uniform(0.15, 0.25))
        return _FAKE_RSS_XML


def patch_news() -> None:
    from app.services import news_service

    news_service.urllib.request.urlopen = lambda *a, **kw: _FakeUrlopenResponse()


# ──────────────────────────────────────────────────────────────
# 4. Claude (Nivel 2) -- 0.8-1.5s, ver criterio aprobado. Simula un
# tool-use real de 2 vueltas (llama show_air_quality, después responde en
# texto) para ejercitar el loop completo de escalar(), no solo el mock.
# ──────────────────────────────────────────────────────────────
def _texto(t: str):
    return SimpleNamespace(type="text", text=t)


def _tool_use(id_: str, name: str, input_: dict):
    return SimpleNamespace(type="tool_use", id=id_, name=name, input=input_)


def _respuesta(bloques: list, tokens_in: int, tokens_out: int):
    return SimpleNamespace(content=bloques, usage=SimpleNamespace(input_tokens=tokens_in, output_tokens=tokens_out))


class _FakeMessages:
    def __init__(self):
        self._turno = 0

    async def create(self, **kwargs):
        await asyncio.sleep(random.uniform(0.8, 1.5))
        self._turno += 1
        if self._turno == 1:
            return _respuesta([_tool_use("call_1", "show_air_quality", {})], 120, 25)
        return _respuesta([_texto("El ICA promedio de Cali ahora mismo está en un nivel Buena, según la red Tángara.")], 140, 30)


class _FakeAsyncAnthropic:
    def __init__(self, *args, **kwargs):
        self.messages = _FakeMessages()


def patch_claude() -> None:
    from intent_router import llm_engine

    llm_engine.anthropic.AsyncAnthropic = _FakeAsyncAnthropic


def patch_all_external_services() -> None:
    """Aplica los 5 mocks. Llamar ANTES de importar app.main."""
    patch_clickhouse()
    patch_osrm_and_overpass()
    patch_news()
    patch_claude()
