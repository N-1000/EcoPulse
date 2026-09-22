# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - loadtest/run_mocked_app.py
#
# Punto de entrada para la prueba de carga: aplica los 5 mocks de
# servicios externos y RECIÉN DESPUÉS importa app.main. El orden
# importa -- importar app.main primero y mockear después no alcanza a
# interceptar las llamadas que hacen los routers durante el arranque.
#
# Uso (desde backend/, con el venv activo):
#   uvicorn loadtest.run_mocked_app:app --host 127.0.0.1 --port 8001
#
# Puerto 8001 a propósito -- nunca el mismo que el backend real (8000),
# para no confundir tráfico de prueba con tráfico real por accidente.
# ===================================================
from loadtest.mocks import patch_all_external_services

patch_all_external_services()

from app.main import app  # noqa: E402 -- el import tardío es intencional, ver arriba

__all__ = ["app"]
