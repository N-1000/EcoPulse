# -*- coding: utf-8 -*-
# ===================================================
# ECOPULSE 2026 - utils/node_metrics.py
# Funciones puras sobre la lista de nodos que devuelve
# get_nodos_clickhouse() (o su fallback mock). Sin ClickHouse,
# sin I/O — se testean con listas de nodos armadas a mano.
# ===================================================
import math
from typing import Any, Dict, List, Optional


def _nodos_activos_con_ica(nodos: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Nodos activos con una lectura de ICA válida (> 0).

    Mismo filtro que `calculateNodeMetrics()` en src/utils/nodeMetrics.ts:
    un nodo inactivo o con ica=0 no está "midiendo", así que no cuenta ni
    para el promedio ni para el peor/mejor nodo.
    """
    return [
        n for n in nodos
        if (not n.get("status") or n.get("status") == "activo")
        and n.get("measurements", {}).get("ica", 0) > 0
    ]


def nodo_peor_ica(nodos: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Nodo activo con el ICA más alto (peor calidad de aire). None si no hay ninguno midiendo."""
    candidatos = _nodos_activos_con_ica(nodos)
    return max(candidatos, key=lambda n: n["measurements"]["ica"]) if candidatos else None


def nodo_mejor_ica(nodos: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Nodo activo con el ICA más bajo (mejor calidad de aire). None si no hay ninguno midiendo."""
    candidatos = _nodos_activos_con_ica(nodos)
    return min(candidatos, key=lambda n: n["measurements"]["ica"]) if candidatos else None


def nodo_por_id(nodos: List[Dict[str, Any]], node_id: str) -> Optional[Dict[str, Any]]:
    """Busca un nodo por su id exacto. None si no existe en la lista."""
    return next((n for n in nodos if n.get("id") == node_id), None)


def ica_promedio_ciudad(nodos: List[Dict[str, Any]]) -> int:
    """ICA promedio de la ciudad, sobre nodos activos con ica > 0.

    Replica exactamente el criterio de `calculateNodeMetrics()` en
    src/utils/nodeMetrics.ts (avgICA): mismo filtro de nodos activos con
    ica > 0, mismo promedio simple, mismo redondeo. Se usa `math.floor(x + 0.5)`
    en vez de `round()` de Python porque `round()` redondea al par más
    cercano en los .5 exactos (round(42.5) == 42), mientras que
    `Math.round()` de JS siempre redondea .5 hacia arriba (43). Sin este
    ajuste, backend y frontend divergirían justo en los promedios que caen
    en .5 — el caso exacto que se quiere evitar.
    """
    candidatos = _nodos_activos_con_ica(nodos)
    if not candidatos:
        return 0
    promedio = sum(n["measurements"]["ica"] for n in candidatos) / len(candidatos)
    return int(math.floor(promedio + 0.5))
