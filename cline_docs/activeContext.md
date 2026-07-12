# Contexto Activo

## Estado Actual
El frontend fue **rediseñado y modularizado por completo** (etapa "solo frontend"): páginas (`HomePage`, `MapPage`), layout con sidebar hamburguesa animado/responsive, chatbot flotante "Tangara AI" (botón fijo del ave, panel que empuja el contenido), hero con el logo "Inteligencia Ambiental Urbana / Cali - Valle del Cauca" y vista "Explorar mapa" con nodos mock (geohash + coordenadas, clusters de calibración). Capa de datos preparada para FastAPI en `src/services/api.ts` + hooks. Documentación completa en `docs/GUIA_FRONTEND.md`. El esqueleto del backend FastAPI (`backend/`) sigue listo y NO se tocó en esta etapa.

## Enfoque Inmediato
1. (Opcional) Colocar la foto real del mural como `public/hero-mural.jpg`.
2. Cargar credenciales de ClickHouse en `backend/.env` e introspeccionar `tangara_plata`.
3. Construir endpoints de datos reales y cambiar `src/services/api.ts` a `fetch()`.
4. Mapa real (Leaflet/MapLibre) reemplazando solo el lienzo SVG de `MapPage`.
5. MVP estrella: "La Ruta Saludable"; luego chatbot con IA real (POST /api/chat).

## Decisiones Recientes
- Se optó por una arquitectura de frontend puro (Vite + React) para el MVP, facilitando el despliegue rápido.
- Se implementaron datos "mockeados" fuertemente tipados para permitir avanzar en la UI sin depender de un backend listo.
- Se decidió utilizar SVG puro y utilidades de Tailwind para los gráficos (Mapa y Tendencias) en lugar de bibliotecas pesadas de gráficos (como Chart.js o Recharts) para mantener el peso del bundle al mínimo durante el hackathon.
