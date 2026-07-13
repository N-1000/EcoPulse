# -*- coding: utf-8 -*-
import math
from typing import List, Dict, Any, Optional
from app.services.geo import get_distance
from app.services.osrm import fetch_osrm_route
from app.services.mock_data import TANGARA_NODES
from app.services.traffic import get_traffic_data, apply_traffic_to_health

# Parques curados de Cali con Bounding Boxes precisos (minLat, minLng), (maxLat, maxLng)
def _gen_bounds(lat, lng, r_lat=0.0015, r_lng=0.0015):
    return [[lat - r_lat, lng - r_lng], [lat + r_lat, lng + r_lng]]

CALI_PARKS = [
    {"lat": 3.4568, "lng": -76.5260, "name": "Boulevard del Río", "isGreen": True, "bounds": [[3.4520, -76.5280], [3.4590, -76.5240]]},
    {"lat": 3.3830, "lng": -76.5290, "name": "Parque del Ingenio", "isGreen": True, "bounds": [[3.3780, -76.5320], [3.3850, -76.5260]]},
    {"lat": 3.3350, "lng": -76.5400, "name": "Ecoparque Pance", "isGreen": True, "bounds": [[3.3250, -76.5500], [3.3450, -76.5300]]},
    {"lat": 3.4612, "lng": -76.5370, "name": "Parque Versalles", "isGreen": True, "bounds": _gen_bounds(3.4612, -76.5370)},
    {"lat": 3.4470, "lng": -76.5430, "name": "Parque del Perro", "isGreen": True, "bounds": _gen_bounds(3.4470, -76.5430, 0.0008, 0.0008)},
    {"lat": 3.4542, "lng": -76.5420, "name": "Parque de San Antonio", "isGreen": True, "bounds": _gen_bounds(3.4542, -76.5420, 0.0012, 0.0012)},
    {"lat": 3.4810, "lng": -76.5120, "name": "Parque de La Flora", "isGreen": True, "bounds": [[3.4770, -76.5150], [3.4840, -76.5080]]},
    {"lat": 3.4380, "lng": -76.5230, "name": "Parque Las Banderas", "isGreen": True, "bounds": _gen_bounds(3.4380, -76.5230)},
    {"lat": 3.4190, "lng": -76.5445, "name": "Ecoparque Las Tres Cruces", "isGreen": True, "bounds": [[3.4150, -76.5500], [3.4250, -76.5380]]},
    {"lat": 3.4500, "lng": -76.5610, "name": "Parque Ecológico Bataclán", "isGreen": True, "bounds": [[3.4450, -76.5650], [3.4550, -76.5550]]},
    {"lat": 3.4370, "lng": -76.5390, "name": "Parque Obrero", "isGreen": True, "bounds": _gen_bounds(3.4370, -76.5390, 0.001, 0.001)},
    {"lat": 3.4640, "lng": -76.5290, "name": "Parque Cabal", "isGreen": True, "bounds": _gen_bounds(3.4640, -76.5290)},
    {"lat": 3.4520, "lng": -76.4900, "name": "Parque Olímpico Pasoancho", "isGreen": True, "bounds": _gen_bounds(3.4520, -76.4900)},
    {"lat": 3.4090, "lng": -76.5400, "name": "Parque Pisamos", "isGreen": True, "bounds": _gen_bounds(3.4090, -76.5400)},
    {"lat": 3.4730, "lng": -76.5350, "name": "Parque Julio Rincón", "isGreen": True, "bounds": _gen_bounds(3.4730, -76.5350)},
]

def select_best_destination(origin: List[float], nodes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Selecciona el mejor parque de destino para un nodo dado en Cali.
    """
    MIN_DIST = 0.3
    MAX_DIST = 3.5
    
    candidates = []
    for p in CALI_PARKS:
        d = get_distance(origin[0], origin[1], p["lat"], p["lng"])
        if MIN_DIST <= d <= MAX_DIST:
            candidates.append((p, d))
            
    if not candidates:
        # Fallback al más cercano que cumpla MIN_DIST
        fallbacks = []
        for p in CALI_PARKS:
            d = get_distance(origin[0], origin[1], p["lat"], p["lng"])
            if d >= MIN_DIST:
                fallbacks.append((p, d))
        if fallbacks:
            fallbacks.sort(key=lambda x: x[1])
            return fallbacks[0][0]
        return CALI_PARKS[0]

    scored = []
    for park, dist in candidates:
        # ICA del sensor más cercano al parque
        park_ica = 40
        min_d = float('inf')
        for node in nodes:
            coords = node.get("coordinates")
            if coords:
                d = get_distance(park["lat"], park["lng"], coords["lat"], coords["lng"])
                if d < min_d:
                    min_d = d
                    park_ica = node["measurements"]["ica"]
                    
        # Penalizaciones
        ica_penalty = 3.0 if park_ica > 100 else (1.5 if park_ica > 75 else 0.0)
        dist_score = dist if dist < 1.0 else ((dist - 2.0) * 2.0 if dist > 2.0 else 0.0)
        name_bonus = -0.5 if (park.get("name") and park["name"] != "Área Verde") else 0.0
        
        score = dist_score + ica_penalty + name_bonus
        scored.append((park, score))
        
    scored.sort(key=lambda x: x[1])
    return scored[0][0]

async def calculate_healthy_route(
    start: List[float],
    end: List[float],
    nodes: List[Dict[str, Any]],
    destination_name: str = "Área Verde",
    transport_mode: str = "walk"
) -> Dict[str, Any]:
    """
    Calcula la ruta saludable completa OSRM y métricas ambientales en Python.
    """
    osrm_res = await fetch_osrm_route(start, end, transport_mode)
    if osrm_res:
        path = osrm_res["path"]
        distance = osrm_res["distance"]
    else:
        path = [start, end]
        distance = round(get_distance(start[0], start[1], end[0], end[1]), 2)
        
    co2_saved = int(round(distance * 120))
    
    durations = {
        "walk": int(round(distance * 12)),
        "bike": int(round(distance * 4)),
        "skates": int(round(distance * 5)),
        "skateboard": int(round(distance * 6)),
        "escooter": int(round(distance * 3)),
    }
    
    # Métricas ambientales a lo largo de la ruta
    green_points = 0
    total_ica = 0
    
    sample_step = max(1, len(path) // 30)
    sampled_path = [path[i] for i in range(0, len(path), sample_step)]
    
    for pt in sampled_path:
        # Verifica intersección con rectángulos de parques usando márgenes de 30m (~0.0003) para mayor precisión.
        def _in_bounds(lat, lng, bounds):
            return (bounds[0][0] - 0.0003) <= lat <= (bounds[1][0] + 0.0003) and \
                   (bounds[0][1] - 0.0003) <= lng <= (bounds[1][1] + 0.0003)
                   
        near_park = any(p.get("bounds") and _in_bounds(pt[0], pt[1], p["bounds"]) for p in CALI_PARKS)
        
        if near_park:
            green_points += 1
            
        # ICA sensor más cercano
        closest_ica = nodes[0]["measurements"]["ica"] if nodes else 50
        min_d = float('inf')
        for node in nodes:
            coords = node.get("coordinates")
            if coords:
                d = get_distance(pt[0], pt[1], coords["lat"], coords["lng"])
                if d < min_d:
                    min_d = d
                    closest_ica = node["measurements"]["ica"]
        total_ica += closest_ica
        
    avg_ica = int(round(total_ica / len(sampled_path))) if sampled_path else 50
    green_cov = int(round((green_points / len(sampled_path)) * 100)) if sampled_path else 0
    
    # Score base de salud (antes de penalizar por tráfico)
    health_score = "B"
    if avg_ica <= 50 and green_cov >= 40:
        health_score = "A+"
    elif avg_ica <= 75 and green_cov >= 25:
        health_score = "A"
    elif avg_ica > 100:
        health_score = "C"

    # ── Tráfico ──────────────────────────────────────────────────────────────
    traffic = await get_traffic_data(path)
    # CO₂ real = CO₂ auto × factor de congestión (autos en tráfico consumen más)
    co2_saved = int(round(distance * 120 * traffic["co2Factor"]))
    # El tráfico pesado degrada el puntaje de salud de la ruta
    health_score = apply_traffic_to_health(health_score, traffic["healthPenalty"])
    # ─────────────────────────────────────────────────────────────────────────

    return {
        "path": path,
        "distance": distance,
        "durations": durations,
        "co2Saved": co2_saved,
        "greenCoverage": green_cov,
        "averageICA": avg_ica,
        "healthScore": health_score,
        "destinationName": destination_name,
        "trafficRisk":  traffic["trafficRisk"],
        "trafficLabel": traffic["trafficLabel"],
        "rushHour":     traffic["rushHour"],
    }
