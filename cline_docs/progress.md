# Progreso del Proyecto

## Completado
- [x] Configuración inicial del repositorio y Vite.
- [x] Instalación y configuración de Tailwind CSS y dependencias (Lucide).
- [x] Estructura de carpetas y definición de Tipos TypeScript (`src/types/index.ts`).
- [x] Creación de Mock Data para alimentar la UI (`src/mock/airQualityData.ts`).
- [x] Desarrollo del componente de Chat Interactivo con respuestas locales (`src/components/TangaraChat.tsx`).
- [x] Desarrollo del Dashboard Analítico con gráficas y mapa (`src/components/Dashboard.tsx`).
- [x] Desarrollo del Layout general y navegación lateral (`src/components/Layout.tsx`).
- [x] Creación de README.md, LICENSE y archivos de configuración para asistentes IA (este sistema de memoria).
- [x] Subida a GitHub (repositorio público).
- [x] Esqueleto del backend FastAPI (`backend/`): config tipada, cliente ClickHouse de solo lectura, `/health` y router de introspección `/api/meta/*`.
- [x] Rediseño y modularización del frontend: `pages/`, `components/`, `hooks/`, `services/`, `utils/`.
- [x] Sidebar con menú hamburguesa animado (escritorio: riel de iconos; móvil: drawer con backdrop).
- [x] Chatbot flotante "Tangara AI" en el frontend.
- [x] Hero rediseñado con recreación del mural y logo "Inteligencia Ambiental Urbana / Cali - Valle del Cauca".
- [x] Conexión del frontend al backend a través de `src/services/api.ts` (API real con fallback local automático si el backend está offline).
- [x] Integración de mapa real interactivo con Leaflet (`react-leaflet`) renderizando sensores (nodos) y clusters por Geohash.
- [x] **MVP "La Ruta Saludable"**: Motor de ruteo multipropósito (peatón, bicicleta, carro, skates, scooter) consultando OSRM en tiempo real según el perfil.
- [x] **Tráfico en tiempo real/horarios**: Algoritmo en `traffic.py` que calcula riesgos de tráfico usando Overpass API (OSM tags) y multiplicadores basados en la zona horaria y hora local de Cali.
- [x] **Zonas Verdes Exactas**: Geometría exacta con rectángulos (`<Rectangle>` de Leaflet) en el mapa basados en Bounding Boxes precisos de 15 parques de Cali. Algoritmo de cobertura verde (`greenCoverage`) basado en intersección rectangular estricta.
- [x] Limpieza del repositorio (remoción de READMEs/LICENSE redundantes de paquetes y carpetas internas).

## Tareas Pendientes / Futuras
- [ ] Cargar credenciales reales de ClickHouse en `backend/.env` e introspeccionar base de datos de producción (`tangara_plata`).
- [ ] Integrar el TangaraChat con un modelo de lenguaje real (LLM / OpenAI o Gemini API con Tool Calling / Function Calling para consultar la API de Tangara en vivo).
- [ ] Modelos de predicción predictiva por nodo (FASE 4 - IA - forecasting de series temporales).
- [ ] Desarrollar firmware real del ESP32 (Fase 7 - IoT) para transmitir mediciones físicas en vivo al endpoint de ingesta.
- [ ] Desarrollar la aplicación móvil nativa en Flutter (Fase 6).
- [ ] Implementar sistema de autenticación de usuarios completo con JWT.
