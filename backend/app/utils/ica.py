# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - utils/ica.py
# Módulo compartido de cálculo de ICA estándar EPA / MinAmbiente.
# Única fuente de verdad para la fórmula de interpolación lineal.
# ===================================================
from typing import Tuple

# Breakpoints estándar EPA / Resolución 2254 MinAmbiente Colombia
# (C_low, C_high, I_low, I_high, level_label)
PM25_BREAKPOINTS: Tuple[Tuple[float, float, int, int, str], ...] = (
    (0.0, 12.0, 0, 50, "buena"),
    (12.1, 35.4, 51, 100, "moderada"),
    (35.5, 55.4, 101, 150, "dañina-grupos-sensibles"),
    (55.5, 150.4, 151, 200, "dañina"),
    (150.5, 250.4, 201, 300, "muy-dañina"),
    (250.5, 500.4, 301, 500, "peligrosa"),
)


def calcular_ica_pm25(pm25: float | None) -> dict:
    """Calcula el ICA y el nivel usando interpolación lineal estándar EPA.

    Returns:
        dict con claves 'ica' (int) y 'level' (str).
    """
    if pm25 is None or pm25 < 0:
        return {"ica": 0, "level": "buena"}

    for c_low, c_high, i_low, i_high, level in PM25_BREAKPOINTS:
        if pm25 <= c_high:
            ica = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
            return {"ica": int(round(ica)), "level": level}

    return {"ica": 500, "level": "peligrosa"}


def calcular_ica_valor(pm25: float | None) -> int:
    """Versión que devuelve solo el valor entero del ICA."""
    return calcular_ica_pm25(pm25)["ica"]
