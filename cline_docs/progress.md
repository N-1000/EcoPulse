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

- [x] Esqueleto del backend FastAPI (`backend/`): config tipada, cliente ClickHouse de solo lectura, `/health` y router de introspección `/api/meta/*`. Verificado (arranca y responde).
- [x] Rediseño y modularización del frontend: `pages/`, `components/{layout,dashboard,chat,common}`, `hooks/`, `services/`, `utils/`.
- [x] Sidebar con menú hamburguesa animado (escritorio: riel de iconos; móvil: drawer con backdrop).
- [x] Chatbot flotante "Tangara AI": botón fijo del ave (bottom-left), panel que empuja el contenido en escritorio, preguntas sugeridas, logo en el encabezado.
- [x] Hero rediseñado con recreación del mural + slot para foto real (`public/hero-mural.jpg`) + logo "Inteligencia Ambiental Urbana / Cali - Valle del Cauca".
- [x] Vista "Explorar mapa": nodos mock con geohash, clusters de sensores co-ubicados (calibración), panel de detalle del nodo, zoom y leyenda ICA.
- [x] Documentación para desarrolladores: `docs/GUIA_FRONTEND.md`.

## Tareas Pendientes / Futuras
- [ ] Cargar credenciales ClickHouse en `backend/.env` e introspeccionar `tangara_plata`.
- [ ] Endpoints de datos: nodos+geolocalización, series temporales agregadas, estadísticas, con caché TTL.
- [ ] Conectar el frontend al backend (reemplazar mock) y mapa real (Leaflet) con nodos.
- [ ] MVP "La Ruta Saludable" (ruteo evitando zonas de mayor polución).
- [ ] Modelos de predicción por nodo.
- [ ] Integrar el TangaraChat con un modelo de lenguaje (LLM) en lugar de respuestas predefinidas.
- [ ] Desarrollar las vistas faltantes del menú lateral (Mapa detallado, Tendencias avanzadas, Reportes, etc.).
- [ ] Implementar sistema de autenticación de usuarios.
- [ ] Asegurar accesibilidad (a11y) y probar en múltiples dispositivos móviles.
