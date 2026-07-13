from pydantic import BaseModel
from typing import List, Dict, Optional

class RouteRequest(BaseModel):
    start: List[float]  # [lat, lng]
    end: List[float]    # [lat, lng]
    transport_mode: str  # 'walk', 'bike', etc.

class RoutePoint(BaseModel):
    lat: float
    lng: float
    name: str = "Área Verde"
    isGreen: bool = True
    bounds: Optional[List[List[float]]] = None

class RouteResult(BaseModel):
    path: List[List[float]]  # list of [lat, lng]
    distance: float
    durations: Dict[str, int]
    co2Saved: int
    greenCoverage: int
    averageICA: int
    healthScore: str
    destinationName: str
    # Tráfico
    trafficRisk: str = "low"       # low | medium | high
    trafficLabel: str = "Tráfico fluido"
    rushHour: bool = False
