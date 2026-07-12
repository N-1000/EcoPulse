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

La arquitectura está limpia y modularizada para permitir la futura conexión con bases de datos o ETLs de calidad de aire en tiempo real:

- `src/types/index.ts`: Interfaces estrictamente tipadas para el chat, contaminantes y comunas.
- `src/mock/airQualityData.ts`: Datos simulados para 22 comunas de Cali, tendencias de 7 días, histórico mensual y pronóstico de clima.
- `src/components/Layout.tsx`: Contenedor responsivo de 3 columnas (Sidebar, Dashboard y Chatbot).
- `src/components/Dashboard.tsx`: Dashboard analítico con mapa interactivo SVG de comunas, gráficos de tendencias y grid de contaminantes.
- `src/components/TangaraChat.tsx`: Chatbot inteligente que responde con jerga caleña sobre actividades ecológicas ("borondos").

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
