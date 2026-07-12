# Guía del Frontend — Tangara 2026 · Inteligencia Ambiental Urbana

> Documentación para desarrolladores. Explica la arquitectura del frontend,
> qué hace cada archivo, dónde modificar cada cosa y dónde se integrarán
> FastAPI, ClickHouse y la IA en las próximas etapas.

---

## 1. Arquitectura general

```text
src/
├── components/            # Componentes visuales reutilizables
│   ├── common/            #   Compartidos por toda la app
│   │   └── BrandLogo.tsx  #   Logo (pájaro + nombre + "Cali - Valle del Cauca")
│   ├── layout/            #   Estructura de la aplicación
│   │   ├── Layout.tsx     #   Orquestador: sidebar + topbar + páginas + chat
│   │   ├── Sidebar.tsx    #   Menú lateral (hamburguesa, animado, responsive)
│   │   └── TopBar.tsx     #   Barra superior (hamburguesa, buscador, ICA)
│   ├── dashboard/         #   Widgets de la página principal
│   │   ├── HeroBanner.tsx #   "Así está el aire en Cali hoy" + mural + logo
│   │   ├── MapaComunas.tsx
│   │   ├── TendenciaSemana.tsx
│   │   ├── ContaminantesGrid.tsx
│   │   ├── PronosticoCard.tsx
│   │   ├── HistoricoMensual.tsx
│   │   └── NoticiasSection.tsx
│   └── chat/              #   Chatbot flotante
│       ├── TangaraChat.tsx        # Ventana del chat (Tangara AI)
│       └── FloatingChatButton.tsx # Botón fijo del ave (abre/cierra)
├── pages/                 # Vistas completas (una por sección del menú)
│   ├── HomePage.tsx       #   Inicio (compone los widgets del dashboard)
│   ├── MapPage.tsx        #   "Explorar mapa": nodos + panel de detalle
│   └── PlaceholderPage.tsx#   Secciones en construcción
├── hooks/                 # Hooks de acceso a datos
│   └── useNodes.ts        #   Nodos de la red Tangara (hoy mock, mañana API)
├── services/
│   └── api.ts             #   ★ PUNTO ÚNICO de integración con FastAPI
├── mock/                  # Datos simulados (se eliminan al conectar el backend)
│   ├── airQualityData.ts  #   ICA, comunas, tendencias, pronóstico, noticias
│   ├── nodesData.ts       #   Nodos con geohash + coordenadas + mediciones
│   └── chatData.ts        #   Bienvenida, preguntas sugeridas, borondos
├── utils/                 # Utilidades puras
│   ├── airQuality.ts      #   Colores/etiquetas/badges por nivel ICA
│   └── geo.ts             #   Proyección al lienzo y agrupación por geohash
├── types/index.ts         # TODAS las interfaces TypeScript compartidas
├── App.tsx                # Raíz (solo monta Layout)
├── main.tsx               # Bootstrap de React
└── index.css              # Estilos globales, clases .card, scrollbars
```

Fuera de `src/`:
- `backend/` — esqueleto FastAPI + ClickHouse (etapa posterior; no tocar en esta fase).
- `public/` — archivos estáticos servidos tal cual (favicon, imagen del mural).
- `tailwind.config.js` — paleta de colores institucional.

---

## 2. Flujo de navegación (sin librería de rutas)

La navegación es un **enrutado ligero por estado** en
[`Layout.tsx`](../src/components/layout/Layout.tsx): el estado `activePage`
(tipo `PageId`, definido en `types/index.ts`) decide qué página renderizar
en `renderPage()`.

**Para agregar una página nueva:**
1. Crea `src/pages/MiSeccionPage.tsx`.
2. Agrega el caso en el `switch` de `renderPage()` en `Layout.tsx`.
3. (El ítem del menú ya existe en `Sidebar.tsx` → `PRIMARY_NAV`; si es una
   sección nueva, agrega también su `PageId` en `types/index.ts`.)

---

## 3. Dónde modificar cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| **Textos del hero** ("Así está el aire…") | `components/dashboard/HeroBanner.tsx` |
| **Nombre/subtítulo del proyecto** (logo) | `components/common/BrandLogo.tsx` |
| **Imagen del mural del hero** | Colocar foto como `public/hero-mural.jpg` (ver §4) |
| **Colores de la paleta** | `tailwind.config.js` (`palma`, `tangara`, `citrico`, `pastel`) |
| **Colores por nivel ICA** | `utils/airQuality.ts` y `mock/airQualityData.ts` (ICA_LEVELS) |
| **Ítems del menú lateral** | `components/layout/Sidebar.tsx` → `PRIMARY_NAV` |
| **Textos/respuestas del chatbot** | `mock/chatData.ts` (bienvenida, sugeridas, borondos) |
| **Comportamiento/estética del chat** | `components/chat/TangaraChat.tsx` |
| **Botón flotante del ave** | `components/chat/FloatingChatButton.tsx` |
| **Datos simulados del dashboard** | `mock/airQualityData.ts` |
| **Nodos del mapa (mock)** | `mock/nodesData.ts` |
| **Fondo estilizado del mapa** | `pages/MapPage.tsx` → `<MapBackground/>` |
| **Panel de detalle del nodo** | `pages/MapPage.tsx` → `<NodePanel/>` |
| **Agregar un dashboard/widget nuevo** | Crear componente en `components/dashboard/` y montarlo en `pages/HomePage.tsx` |

### Componentes únicamente visuales (sin lógica de datos)
`BrandLogo`, `HeroBanner` (salvo el ICA que lee del mock), `PlaceholderPage`,
`FloatingChatButton`, `NoticiasSection`, `PronosticoCard`, `HistoricoMensual`,
el fondo `MapBackground` y los controles de capas/zoom/leyenda de `MapPage`.

### Dónde agregar imágenes nuevas
- **Estáticas y públicas** (se sirven tal cual): carpeta `public/` → se referencian como `/nombre.jpg`.
- **Importadas por componentes** (procesadas por Vite): crea `src/assets/` e importa `import img from '../assets/img.png'`.

---

## 4. Imagen del mural (hero)

`HeroBanner.tsx` intenta cargar **`public/hero-mural.jpg`**:
- Si existe, la foto real del mural se muestra con un degradado amarillo a la
  izquierda para que el texto sea legible.
- Si no existe, se renderiza una **recreación SVG** del mural (componente
  `MuralArt` en el mismo archivo).

Para usar la fotografía real del Túnel Mundialista: guarda el archivo como
`public/hero-mural.jpg` (idealmente ≥1600px de ancho, formato horizontal). No
hay que tocar código.

---

## 5. Integración futura con FastAPI (dónde y cómo)

**Único punto de cambio: [`src/services/api.ts`](../src/services/api.ts).**

Hoy cada función (`fetchNodes`, `fetchCurrentAirQuality`, `fetchWeeklyTrend`,
`fetchForecast`) devuelve datos mock con la **misma forma** que entregará el
backend. Para conectar el backend real:

1. Define `VITE_API_URL` en un `.env` del frontend.
2. Reemplaza el cuerpo de cada función por `fetch()` al endpoint indicado en
   el comentario `// FUTURO:` de cada una.
3. Ningún componente ni hook cambia: todos consumen `services/api.ts` a través
   de los hooks (`useNodes`, etc.).

Endpoints previstos (ya montados como esqueleto en `backend/`):
```
GET  /api/nodes                 GET  /api/air-quality/current
GET  /api/nodes/{id}/history    GET  /api/air-quality/trend
POST /api/chat                  GET  /api/air-quality/forecast
```

### Dónde conectar ClickHouse
**En el backend, nunca en el frontend.** El flujo es:
`React → FastAPI (backend/) → ClickHouse (tangara_plata)`.
El cliente ClickHouse de solo lectura ya existe en
`backend/app/db/clickhouse.py`. El frontend jamás consulta ClickHouse
directamente ni conoce sus credenciales.

### Chatbot con IA real
Sustituir la función `respondTo()` de `components/chat/TangaraChat.tsx` por una
llamada a `POST /api/chat` (agregar `askChatbot()` en `services/api.ts`).
Los textos simulados viven en `mock/chatData.ts` y se eliminarán entonces.

---

## 6. Geohash y ubicación de los nodos

- El firmware de los sensores Tangara reporta la ubicación como **Geohash**
  (http://geohash.co/) para reducir el tamaño de los paquetes.
- **El frontend NO decodifica geohash.** El backend entregará cada nodo con
  `coordinates: { lat, lng }` ya decodificadas (`TangaraNode` en `types/index.ts`).
- **Varios sensores pueden compartir el mismo geohash** mientras están en
  calibración o pruebas — es un estado normal, no un error. La utilidad
  `clusterNodesByLocation()` (`utils/geo.ts`) los agrupa y `MapPage` los
  muestra con un contador azul y un selector en el panel del nodo.
- La proyección lat/lng → lienzo SVG está en `utils/geo.ts`
  (`projectToCanvas`, `CALI_BOUNDS`). Cuando se integre un mapa real
  (Leaflet/MapLibre), solo se reemplaza el lienzo SVG de `MapPage`; el panel,
  la leyenda, los hooks y los tipos no cambian.

---

## 7. Archivos que NO deben modificarse a la ligera

| Archivo | Motivo |
|---|---|
| `types/index.ts` | Contrato de datos de TODA la app (y del futuro backend). Cambiarlo rompe componentes y la integración con FastAPI. Solo agregar, evitar renombrar. |
| `services/api.ts` | Es el límite frontend/backend. No importar mocks directamente en componentes nuevos: siempre pasar por aquí (vía hooks). |
| `utils/geo.ts` | Encapsula la política de geohash/clustering acordada con los organizadores de Tangara. |
| `tailwind.config.js` | Paleta institucional del proyecto. No agregar colores fuera de la identidad sin acuerdo del equipo. |
| `backend/` | Esqueleto de la etapa siguiente; fuera del alcance del frontend. |
| `index.css` | Clases base (`.card`, scrollbars). Estilos nuevos van en los componentes con Tailwind, no aquí. |

---

## 8. Paleta de colores (referencia rápida)

| Uso | Color | Clase Tailwind |
|---|---|---|
| Fondo general de la UI | `#E5E7EB` | `bg-gray-200` |
| Tarjetas y contenedores | `#FFFFFF` | `.card` (con sombra) |
| Principal (menús, botones de acción) | `#1E5E4A` Verde Palma | `bg-palma` / `text-palma` |
| Secundario (títulos, enlaces) | `#0084B4` Azul Tangara | `bg-tangara` / `text-tangara` |
| Acentos (banner hero) | `#FFD100` Amarillo Cítrico | `bg-citrico` |
| Mensajes de usuario / píldoras del chat | `#CBE4F9` Azul pastel | `bg-pastel` |

---

## 9. Comandos

```bash
npm install        # dependencias
npm run dev        # desarrollo -> http://localhost:5173
npm run build      # verificación TypeScript + build de producción (dist/)
npm run lint       # ESLint
```
