# Contexto Activo

## Estado Actual
El MVP de Tangara 2026 ha sido inicializado y desplegado localmente. La estructura base, los tipos, los datos simulados y los tres componentes principales (Layout, Dashboard, TangaraChat) están implementados y funcionales visualmente.

## Enfoque Inmediato
No hay tareas de desarrollo activas en este momento. El proyecto está listo para ser expandido, ya sea añadiendo nuevas vistas al Sidebar, conectando el chatbot a una API real (como OpenAI/Anthropic), o reemplazando los datos estáticos por llamadas a servicios web de calidad del aire.

## Decisiones Recientes
- Se optó por una arquitectura de frontend puro (Vite + React) para el MVP, facilitando el despliegue rápido.
- Se implementaron datos "mockeados" fuertemente tipados para permitir avanzar en la UI sin depender de un backend listo.
- Se decidió utilizar SVG puro y utilidades de Tailwind para los gráficos (Mapa y Tendencias) en lugar de bibliotecas pesadas de gráficos (como Chart.js o Recharts) para mantener el peso del bundle al mínimo durante el hackathon.
