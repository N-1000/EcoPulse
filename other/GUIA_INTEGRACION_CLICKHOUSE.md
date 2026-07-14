# Guía de Integración — ClickHouse Tángara (Capa Plata)

> Hackathon Ciudadana Tángara 2026 · Estado: esquema real confirmado, listo para conectar el backend.

## 1. Resumen ejecutivo

El backend ya tiene el fallback a `mock_data.py` implementado (Fase 2). Este documento
recoge todo lo necesario para reemplazar el mock por datos reales de la red de sensores
Tángara, sin más suposiciones sobre nombres de columna, tipos o estructura de datos —
todo lo de abajo fue confirmado contra la base real.

**Bloqueante resuelto:** credenciales de ClickHouse obtenidas del equipo Tángara.
**Esquema:** confirmado con `DESCRIBE TABLE` + perfilado de datos reales.
**Pendiente:** integrar la query final en `nodes.py` y definir la función ICA/EPA.

---

## 2. Configuración (`backend/.env`)

```ini
CLICKHOUSE_HOST=<host real del equipo Tángara>
CLICKHOUSE_PORT=8443
CLICKHOUSE_USER=<usuario real>
CLICKHOUSE_PASSWORD=<password real>
CLICKHOUSE_DATABASE=tangara_plata
CLICKHOUSE_SECURE=True
```

⚠️ Cloudflare protege el acceso a Silver/Gold, no a Bronze — como analista solo
necesitas y solo debes tener credenciales para `tangara_plata` (y `tangara_oro`
si ya está poblada, ver sección 7).

### Validar conectividad antes de tocar el backend

```bash
cp example.env .env   # completar con credenciales reales
python validar_clickhouse_http.py
python validar_clickhouse_client.py
```

El segundo script introspecciona `system.tables`, detecta motores
`ReplacingMergeTree` y compara `count()` vs `count() FINAL` para advertir
sobre filas duplicadas pendientes de merge.

---

## 3. Esquema real — `tangara_plata.plata_tangara_sensores`

Motor: `ReplacingMergeTree` · ~63.7M filas · datos en vivo (última lectura a minutos de ahora).

| Columna | Tipo | Descripción |
|---|---|---|
| `time` | `DateTime64(3, 'UTC')` | Timestamp de la lectura, **en UTC** — restar 5h para hora de Cali |
| `name` | `String` | ID del sensor (hardware ESP32/TTGO), ej. `D29ESP32DED2FF6` |
| `geo` | `String` | Geohash de 7 caracteres, ej. `d29ed5r` |
| `tmp` | `Float32` | Temperatura °C |
| `hum` | `Float32` | Humedad relativa % |
| `pm25` | `Float32` | PM2.5 µg/m³ |
| `co2` | `Float32` | CO₂ ppm (bonus, no estaba en el alcance original) |
| `_ingested_at` | `DateTime64` | Metadato interno de ingesta |

### Hallazgos del perfilado (datos reales, no estimados)

- **87 sensores únicos, 82 geohashes únicos.**
- **Rango temporal:** 2021-09-16 → hoy (datos vivos, ~5 años de histórico).
- **Co-ubicación real y significativa** — bancos de calibración con múltiples
  sensores en el mismo punto:
  - `d29e6de` → 44 sensores
  - `d29ed5r` → 23 sensores
  - `d29dbmw` → 19 sensores

  → El clustering en el mapa (ya implementado en Fase 3) **es obligatorio**,
    no cosmético: sin él, `d29e6de` se ve como un solo punto ilegible con 44
    sensores encima.

- **⚠️ Outliers físicamente imposibles presentes en Silver** (no filtrados
  automáticamente por la MV Bronze→Plata):

  | Variable | Rango observado | Rango físicamente válido |
  |---|---|---|
  | `tmp` | -147°C a 1228°C | -10°C a 50°C (Cali) |
  | `hum` | 0% a 3288% | 0% a 100% |
  | `pm25` | 0 a 49.920 µg/m³ | 0 a ~1000 µg/m³ (generoso) |
  | `co2` | 0 a 40.000 ppm | 0 a ~10.000 ppm (generoso) |

  Los promedios sí son sensatos (temp ~28°C, humedad ~60%, PM2.5 ~19.8) — es
  ruido puntual de sensor, no un problema sistemático. **Filtrar en el
  backend (Python), no en SQL**, para poder ajustar rangos rápido sin tocar
  la query durante la demo.

---

## 4. Query final — última lectura por sensor

```sql
SELECT
    name AS sensor_id,
    argMax(geo, time)  AS geohash,
    argMax(tmp, time)  AS temperatura,
    argMax(hum, time)  AS humedad,
    argMax(pm25, time) AS pm25,
    argMax(co2, time)  AS co2,
    max(time)          AS ultima_lectura_utc
FROM tangara_plata.plata_tangara_sensores
WHERE time >= now() - INTERVAL 2 HOUR
GROUP BY name
```

**Por qué `argMax` y no `ORDER BY ... LIMIT 1 BY`:** es la forma idiomática y
más barata en ClickHouse para "última lectura por grupo" sin ordenar
particiones completas. El filtro `WHERE time >= now() - INTERVAL 2 HOUR` es
lo que evita escanear las 63.7M filas completas en cada request — sin él, un
`GROUP BY name` sobre toda la tabla es un full scan innecesario.

**Sobre `ReplacingMergeTree` y duplicados:** no hace falta `FINAL` aquí. Si
existen dos filas idénticas con el mismo `time` pendientes de merge, `argMax`
devuelve el mismo valor de cualquiera de las dos — el resultado no cambia.
`FINAL` solo importaría para un `COUNT()` exacto en un reporte, no para esta
query de "última lectura".

---

## 5. Implementación — `backend/db/queries/nodes.py`

```python
from datetime import timedelta
from app.db.clickhouse import get_client

RANGOS_VALIDOS = {
    "temperatura": (-10, 50),      # °C razonable para Cali
    "humedad": (0, 100),           # % relativo, límite físico real
    "pm25": (0, 1000),             # µg/m³, generoso por encima de "peligroso" EPA
    "co2": (0, 10000),             # ppm, generoso por encima de espacios mal ventilados
}

def _clamp_o_null(valor, campo):
    if valor is None:
        return None
    lo, hi = RANGOS_VALIDOS[campo]
    return valor if lo <= valor <= hi else None

def get_nodos_actuales():
    client = get_client()
    query = """
        SELECT
            name AS sensor_id,
            argMax(geo, time)  AS geohash,
            argMax(tmp, time)  AS temperatura,
            argMax(hum, time)  AS humedad,
            argMax(pm25, time) AS pm25,
            argMax(co2, time)  AS co2,
            max(time)          AS ultima_lectura_utc
        FROM tangara_plata.plata_tangara_sensores
        WHERE time >= now() - INTERVAL 2 HOUR
        GROUP BY name
    """
    resultado = client.query(query)
    nodos = []
    for sensor_id, geo, tmp, hum, pm25, co2, ultima_utc in resultado.result_rows:
        nodos.append({
            "sensor_id": sensor_id,
            "geohash": geo,  # el frontend decodifica esto (Fase 3), no duplicar lógica aquí
            "temperatura": _clamp_o_null(tmp, "temperatura"),
            "humedad": _clamp_o_null(hum, "humedad"),
            "pm25": _clamp_o_null(pm25, "pm25"),
            "co2": _clamp_o_null(co2, "co2"),
            "ica": categorizar_ica(_clamp_o_null(pm25, "pm25")),
            "ultima_lectura_cali": (ultima_utc - timedelta(hours=5)).isoformat(),
        })
    return nodos
```

```python
# backend/routers/nodes.py
from fastapi import APIRouter
from db.queries.nodes import get_nodos_actuales
from mock_data import get_mock_nodes
from db.clickhouse import clickhouse_disponible

router = APIRouter()

@router.get("/api/nodes")
def listar_nodos():
    if clickhouse_disponible():
        try:
            return {"fuente": "clickhouse", "nodos": get_nodos_actuales()}
        except Exception as e:
            # No tumbar el endpoint si ClickHouse falla a mitad de demo
            return {"fuente": "mock_fallback", "error": str(e), "nodos": get_mock_nodes()}
    return {"fuente": "mock", "nodos": get_mock_nodes()}
```

### Decisiones de diseño (para que el equipo no las reabra sin razón)

1. **`geo` se manda crudo al frontend, sin convertir a lat/lon en el backend.**
   El frontend ya decodifica geohashes en TypeScript (Fase 3) — mantener una
   sola fuente de verdad para esa lógica evita bugs de decodificación
   duplicada en dos lenguajes.
2. **Clampeo a `None`, no descarte del sensor completo.** Un sensor con
   `pm25` bueno pero `tmp` corrupta sigue siendo útil para el mapa — se
   pierde solo el campo malo, no el nodo entero.
3. **El filtrado de outliers vive en Python, no en SQL**, para poder
   ajustar rangos en caliente durante la demo sin tocar la query.

---

## 6. Categorización ICA/EPA — `categorizar_ica()`

Umbrales tomados directamente del panel Grafana oficial de Tángara (coinciden
con los breakpoints EPA estándar de PM2.5 24h):

```python
UMBRALES_ICA = [
    (13,  "verde",   "Bueno"),
    (35,  "amarillo","Moderado"),
    (55,  "naranja", "Dañino para grupos sensibles"),
    (150, "rojo",    "Dañino"),
    (250, "morado",  "Muy dañino"),
    (float("inf"), "marron", "Peligroso"),
]

def categorizar_ica(pm25):
    if pm25 is None:
        return {"color": "gris", "etiqueta": "Sin dato"}
    for limite, color, etiqueta in UMBRALES_ICA:
        if pm25 < limite:
            return {"color": color, "etiqueta": etiqueta}
    return {"color": "marron", "etiqueta": "Peligroso"}
```

Este es el mismo mapeo que ya viste en el mapa de Grafana (imágenes 3-4 del
equipo) — así el semáforo de tu app coincide visualmente con el dashboard
oficial que el jurado ya conoce.

---

## 7. Pendientes abiertos (no asumir, confirmar con el equipo)

- [ ] **¿`tangara_oro` existe y está poblada?** Necesario para las páginas de
      Estadísticas/Tendencias sin agregar en vivo sobre 63.7M filas. Si no,
      hay un plan B con `AggregatingMergeTree` propio (ver conversación de
      diseño de rollups).
- [ ] **Confirmar si el ClickHouse compartido soporta la carga de todos los
      equipos del hackathon simultáneamente** el día de la demo — si hay
      riesgo de saturación, considerar el Ubuntu Server como caché local
      (Redis + Postgres con refresh periódico) descrito en la sesión de
      arquitectura.
- [ ] **CO₂ no estaba en el alcance original** — decidir si entra en el MVP
      o se deja para "Educación Ambiental"/"Estadísticas" como dato bonus.

---

## 8. Checklist rápido para el dev que conecte esto

- [ ] `.env` completado con credenciales reales, `CLICKHOUSE_DATABASE=tangara_plata`
- [ ] `validar_clickhouse_http.py` y `validar_clickhouse_client.py` corridos sin errores
- [ ] Query de la sección 4 probada directamente en la consola de ClickHouse
- [ ] `nodes.py` actualizado con `get_nodos_actuales()` + `categorizar_ica()`
- [ ] Fallback a `mock_data.py` sigue funcionando si se apaga `.env` (probar quitando credenciales)
- [ ] Frontend recibe `geohash` crudo y sigue decodificando igual que con el mock
- [ ] Verificado visualmente: colores del semáforo coinciden con el Grafana oficial de Tángara
