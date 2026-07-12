# Contexto Activo

## Estado Actual
El MVP de frontend (Layout, Dashboard, TangaraChat) está implementado con datos mock. Se ha iniciado el **backend en FastAPI** (`backend/`) que consumirá la capa Silver (`tangara_plata`) de ClickHouse. El esqueleto está montado y verificado: configuración tipada, cliente ClickHouse de solo lectura, endpoint `/health` y router de introspección (`/api/meta/*`) para descubrir el esquema real.

## Enfoque Inmediato
1. Cargar las credenciales de ClickHouse en `backend/.env` (a partir de `.env.example`).
2. Introspeccionar el esquema real de `tangara_plata` vía `/api/meta/tables` y `/api/meta/columns`.
3. Construir los endpoints de datos (nodos + geolocalización, series temporales agregadas, estadísticas) con caché TTL.
4. Reemplazar los datos mock del frontend por llamadas al backend y sustituir el mapa SVG por un mapa real (Leaflet) con los nodos.
5. Construir el MVP estrella: "La Ruta Saludable".

## Decisiones Recientes
- Se optó por una arquitectura de frontend puro (Vite + React) para el MVP, facilitando el despliegue rápido.
- Se implementaron datos "mockeados" fuertemente tipados para permitir avanzar en la UI sin depender de un backend listo.
- Se decidió utilizar SVG puro y utilidades de Tailwind para los gráficos (Mapa y Tendencias) en lugar de bibliotecas pesadas de gráficos (como Chart.js o Recharts) para mantener el peso del bundle al mínimo durante el hackathon.
