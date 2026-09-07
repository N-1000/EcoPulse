# EcoPulse | Red Ambiental de Cali

Plataforma de **Inteligencia Ambiental Urbana (IAU)** diseñada para la ciudad de Santiago de Cali. Combina monitoreo en tiempo real de la calidad del aire, cálculo de rutas saludables, analítica de datos ambientales y un asistente inteligente de ciudad.

---

## 🎨 Tech Stack

### Frontend
- **Framework**: React 18
- **Lenguaje**: TypeScript (Estricto, sin `any`)
- **Bundler**: Vite
- **Estilos**: Tailwind CSS (Sistema visual orgánico, cálido y data-journalism editorial)
- **Mapas**: Leaflet / React-Leaflet (Con OSRM para ruteo en vivo)
- **Iconografía**: Lucide React
- **Fuentes**: Inter + Playfair Display

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Base de Datos**: ClickHouse (`tangara_plata.plata_tangara_sensores` para lecturas en vivo e históricas; `tangara_oro` para agregaciones/vistas consolidadas, con zona horaria `America/Bogota` UTC-5)
- **Motor de Ruteo**: OSRM (Open Source Routing Machine) API
- **Modelos Externos**: Open-Meteo API (Pronóstico meteorológico en vivo) & RSS Google News Cali Ambiental (con filtro estricto de 14 días y orden cronológico)
- **Agente IA**: Engine híbrido/determinista (`app/services/agent_core.py`) con Tool Calling para orquestar la UI mediante `UIAction`.

---

## 🌿 Sistema de Diseño

- **Blanco Hueso / Fondo**: `#FAFAF7`
- **Verde Bosque Oscuro**: `#0F1F17` (Fondo del Sidebar y Banner principal)
- **Verde Menta / Texto en oscuro**: `#A8C5B0`
- **Verde Bosque Acento**: `#2D6A4F` (Líneas de gráficos y botones principales)
- **Terracota Acento**: `#D05A3F` (Botones de acción primaria / destaque)

---

## 🏗️ Arquitectura del Proyecto

```text
EcoPulse-IAU-2026/
├── src/                          # FRONTEND (React 18 + TS)
│   ├── components/
│   │   ├── chat/                 # EcopulseChat.tsx, FloatingChatButton.tsx
│   │   ├── common/               # BrandLogo.tsx, EarthAvatar.tsx, ScrollReveal.tsx
│   │   ├── dashboard/            # HeroBanner, ContaminantesGrid, PronosticoCard, PulsoNarrativo, HeatmapHoras, SaludPerfiles, TendenciaSemana, HistoricoMensual, NoticiasSection
│   │   ├── layout/               # Layout.tsx, TopBar.tsx, Sidebar.tsx, FooterBar.tsx
│   │   └── map/                  # NodeDetailPanel.tsx, HealthyRoutePanel.tsx, MapLegend.tsx
│   ├── constants/                # ica.ts (Rangos y niveles ICA canónicos)
│   ├── hooks/                    # useAirQuality.ts, useNodes.ts, useMapData.ts
│   ├── pages/                    # 12 Vistas (HomePage, MapPage, AirQualityPage, PredictionsPage, etc.)
│   ├── services/                 # api.ts (Cliente HTTP único hacia FastAPI y fallback de noticias)
│   ├── types/                    # index.ts (Interfaces globales)
│   └── utils/                    # nodeMetrics.ts, airQuality.ts, geo.ts
│
├── backend/                      # BACKEND (FastAPI + Python)
│   └── app/
│       ├── core/                 # config.py (Variables de entorno con ClickHouse Silver & Gold)
│       ├── db/                   # clickhouse.py (Conexión segura de solo lectura a ClickHouse)
│       ├── models/               # chat.py, route.py (Modelos Pydantic)
│       ├── routers/              # chat.py, nodes.py, routing.py, air_quality.py, news.py, meta.py
│       └── services/             # agent_core.py, clickhouse_nodes.py, clickhouse_analytics.py, news_service.py, routing.py, traffic.py, osrm.py
```

---

## 🚀 Estado de Funcionalidades y Mejoras

1. **Noticias Ambientales**:
   - Filtrado estricto de antigüedad máxima (14 días) y orden cronológico descendente.
   - Enlace directo a la fuente periodística externa sin overlays ni datos ficticios.
2. **Integridad de Datos**:
   - Lecturas en tiempo real calculadas directamente sobre ClickHouse.
   - Formato horario estricto 12h AM/PM en todos los componentes.
   - Eliminación de multiplicadores artificiales de ICA en perfiles de salud.
3. **Métricas y Series Temporales**:
   - Multi-sensor spaghetti chart en `TendenciaSemana` con curvas por estación individual en vivo.
   - Calibración de escalas físicas en `ContaminantesGrid` (PM2.5, CO₂, Temp, Humedad).
4. **Ruta Futura (Roadmap Gráficos Grafana)**:
   - Separación de gráficas de la sección temporal en paneles independientes dedicados (PM2.5, Temperatura, Humedad, CO₂ y Gauge 24h).



---

## 🚀 Instalación y Ejecución

### 1. Frontend
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (Vite)
npm run dev
```

### 2. Backend
```bash
# Navegar al directorio del backend
cd backend

# Instalar dependencias (FastAPI, Uvicorn, etc.)
pip install -r requirements.txt

# Ejecutar backend
uvicorn app.main:app --reload --port 8000
```
