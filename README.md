# Tangara 2026: Inteligencia Ambiental Urbana 🌿

MVP desarrollado para la hackathon **Tangara 2026** en la ciudad de Cali, Colombia. Una plataforma moderna y responsiva de monitoreo ambiental que permite visualizar la calidad del aire de la ciudad mediante un mapa interactivo, dashboards analíticos y un chatbot inteligente ("Tangara Chat").

## 🚀 Tecnologías

El proyecto fue construido utilizando únicamente:
- **React** (v18) + **TypeScript**
- **Vite** (para compilación ultra rápida)
- **Tailwind CSS** (estilos profesionales y responsivos)
- **Lucide React** (iconografía)

## 🎨 Paleta de Colores e Identidad Visual

Inspirada en la biodiversidad de Cali y los icónicos murales del Túnel Mundialista:
- **Verde Palma (`#1E5E4A`)**: Elementos activos, menús, botones de acción.
- **Azul Tangara (`#0084B4`)**: Títulos de componentes y enlaces secundarios.
- **Amarillo Cítrico (`#FFD100`)**: Banner principal (mural del túnel).
- **Azul Pastel (`#CBE4F9`)**: Mensajes de usuario y burbujas de interacción.

## 📦 Estructura del Proyecto

Arquitectura modular preparada para integrar FastAPI + ClickHouse (ver la guía completa en [`docs/GUIA_FRONTEND.md`](docs/GUIA_FRONTEND.md)):

- `src/pages/`: Vistas de la app — `HomePage` (dashboard), `MapPage` ("Explorar mapa" con los nodos Tangara) y placeholders.
- `src/components/layout/`: `Layout` (orquestador), `Sidebar` (menú hamburguesa animado y responsive) y `TopBar`.
- `src/components/dashboard/`: Widgets del dashboard (hero con mural, comunas, tendencias, contaminantes, pronóstico, histórico, noticias).
- `src/components/chat/`: Chatbot flotante "Tangara AI" (botón fijo del ave + ventana con preguntas sugeridas).
- `src/hooks/` y `src/services/api.ts`: Capa de datos — hoy mock, punto único de conexión futura con el backend.
- `src/mock/`: Datos simulados (calidad del aire, nodos con geohash, contenido del chat).
- `src/types/index.ts`: Interfaces estrictamente tipadas de toda la aplicación.
- `backend/`: Esqueleto FastAPI + ClickHouse (capa Silver `tangara_plata`) para las siguientes etapas.

## ⚙️ Instalación y Ejecución Local

1. Asegúrate de tener **Node.js** instalado.
2. Abre la carpeta del proyecto en tu terminal.
3. Instala las dependencias:
   ```bash
   npm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre [http://localhost:5173/](http://localhost:5173/) en tu navegador.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
