# pyrefly: ignore [missing-import]
import math
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Dict, Optional

# Cobertura real de la red Tángara + parques curados (services/mock_data.py +
# services/routing.py::CALI_PARKS), medida 2026-10-03 sobre 27 puntos reales:
# lat 3.3350-3.5191, lng -76.5610 a -76.4312. Con margen de ~0.05° porque el
# usuario puede pedir una ruta desde/hacia un punto de Cali real que no
# coincide con un nodo o parque exacto.
#
# NO es un polígono municipal oficial -- no hay shapefile/GeoJSON de Cali en
# el repo (investigado durante el saneamiento, sin resolver: requiere bajar
# el archivo real de datos.gov.co o del geoportal de la Alcaldía). Esto es
# una caja rectangular derivada de coordenadas reales, documentada como tal,
# no una geocerca de precisión -- rechaza lo que está lejos de cualquier
# cobertura real (otro país, el mar, Bogotá), no reemplaza el shapefile
# pendiente para casos finos (un barrio específico dentro vs. fuera de Cali).
CALI_LAT_RANGE = (3.28, 3.57)
CALI_LNG_RANGE = (-76.61, -76.38)


class CoordenadaInvalida(ValueError):
    pass


def validar_coordenada(valor: List[float], campo: str) -> List[float]:
    """Valida [lat, lng]: 2 elementos, finitos, rango global, cobertura real de Cali.

    Rechaza en vez de clampear -- una coordenada fuera de cobertura es un
    error del cliente, no "la más cercana válida". Clampear al borde
    devolvería una ruta real hacia un lugar que el usuario no pidió.
    """
    if len(valor) != 2:
        raise CoordenadaInvalida(f"{campo} debe tener exactamente 2 elementos [lat, lng], recibió {len(valor)}")

    lat, lng = valor
    for nombre, v in (("latitud", lat), ("longitud", lng)):
        if not math.isfinite(v):
            raise CoordenadaInvalida(f"{campo}: {nombre} no puede ser NaN ni infinito (recibió {v!r})")

    if not (-90.0 <= lat <= 90.0):
        raise CoordenadaInvalida(f"{campo}: latitud fuera de rango global [-90, 90]: {lat}")
    if not (-180.0 <= lng <= 180.0):
        raise CoordenadaInvalida(f"{campo}: longitud fuera de rango global [-180, 180]: {lng}")

    if not (CALI_LAT_RANGE[0] <= lat <= CALI_LAT_RANGE[1] and CALI_LNG_RANGE[0] <= lng <= CALI_LNG_RANGE[1]):
        raise CoordenadaInvalida(
            f"{campo}: fuera de la cobertura real de Cali/Tángara "
            f"(lat {CALI_LAT_RANGE}, lng {CALI_LNG_RANGE}), recibió [{lat}, {lng}]"
        )
    return valor


class RouteRequest(BaseModel):
    # strict=True en el Field (no en model_config global, para no afectar
    # transport_mode): rechaza "3.45" (string numérico) y True/False
    # (bool -- subclase de int en Python, Pydantic en modo laxo lo
    # coerciona a float sin avisar) en vez de colarlos como coordenada válida.
    start: List[float] = Field(strict=True)  # [lat, lng]
    end: List[float] = Field(strict=True)    # [lat, lng]
    transport_mode: str  # 'walk', 'bike', etc.

    @field_validator("start", "end")
    @classmethod
    def _validar_lista_coordenada(cls, v: List[float], info) -> List[float]:
        return validar_coordenada(v, info.field_name)

    @model_validator(mode="after")
    def _origen_distinto_de_destino(self) -> "RouteRequest":
        # Decisión: rechazar, no calcular una ruta de distancia cero. Un
        # origen == destino casi siempre es un bug del cliente, no un
        # pedido real de "ruta saludable" a ningún lado.
        if self.start == self.end:
            raise ValueError("origen y destino no pueden ser el mismo punto")
        return self

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
