# Tangara 2026 — Backend (FastAPI + ClickHouse)

Backend de **Inteligencia Ambiental Urbana** para la hackathon Tangara 2026.
Consume la capa Silver (`tangara_plata`) de ClickHouse mediante consultas
agregadas y eficientes. **No descarga los datos masivamente ni modifica la
infraestructura de Tangara** — solo lee.

## Requisitos
- Python 3.11+ (probado con 3.13)
- Credenciales de ClickHouse entregadas por los organizadores

## Puesta en marcha

Desde la carpeta `backend/`:

```bash
# 1. Crear entorno virtual
python -m venv .venv

# 2. Activarlo
#   Windows (PowerShell):
.venv\Scripts\Activate.ps1
#   Linux / macOS:
source .venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar credenciales
#   Copia .env.example a .env y rellena los valores de ClickHouse
copy .env.example .env      # Windows
# cp .env.example .env       # Linux / macOS

# 5. Levantar el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

## Verificación
- Salud del servicio + conexión a ClickHouse: http://localhost:8000/health
- Documentación interactiva (Swagger): http://localhost:8000/docs

## Introspección del esquema (capa Silver)
Una vez configurado el `.env`, estos endpoints revelan la estructura real:
- `GET /api/meta/tables` — tablas disponibles en `tangara_plata`
- `GET /api/meta/columns?table=<nombre>` — columnas y tipos de una tabla
- `GET /api/meta/sample?table=<nombre>&limit=5` — filas de muestra

## Estructura
```
backend/
├── app/
│   ├── core/config.py       # Configuración tipada (variables de entorno)
│   ├── db/clickhouse.py     # Cliente ClickHouse (solo lectura)
│   ├── routers/
│   │   └── meta.py          # Introspección del esquema
│   └── main.py              # App FastAPI + CORS + /health
├── .env.example             # Plantilla de variables de entorno
└── requirements.txt
```

## Seguridad
- Las credenciales viven en `.env` (ignorado por git). Nunca se comitean.
- El cliente ClickHouse abre la sesión con `readonly=1`.
- Las consultas usan parámetros de ClickHouse (`{param:Tipo}`) para evitar inyección.
