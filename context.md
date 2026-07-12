# Tangara 2026 - Contexto del Proyecto

Este archivo sirve como mapa mental y radiografía del proyecto para asistentes de IA.

## Tech Stack
- **Framework**: React 18
- **Lenguaje**: TypeScript (Estricto)
- **Bundler**: Vite
- **Estilos**: Tailwind CSS
- **Iconografía**: Lucide React
- **Datos Actuales**: Simulados en el frontend (`src/mock/airQualityData.ts`). Preparado para consumir APIs (ETL) en el futuro.

## Arquitectura (Estructura de Carpetas)

```text
src/
├── components/          # Componentes visuales de React
│   ├── Layout.tsx       # Cascarón principal (3 columnas, responsive)
│   ├── Dashboard.tsx    # Panel central analítico (Hero, Mapas, Gráficos)
│   └── TangaraChat.tsx  # Chatbot inteligente interactivo
├── mock/                # Datos estáticos para simular backend
│   └── airQualityData.ts# Datos de ICA, comunas, tendencias, noticias
├── types/               # Tipos e interfaces TypeScript globales
│   └── index.ts         # Definiciones de Message, AirQualityMetrics, etc.
├── App.tsx              # Componente raíz
├── main.tsx             # Punto de entrada de React
└── index.css            # Estilos globales y configuración base de Tailwind
```

## Reglas del Proyecto

1. **TypeScript Estricto**: Cero uso de `any`. Todas las interfaces y tipos deben estar definidos en `src/types/index.ts` si son compartidos.
2. **Modularidad Visual**: Mantener los componentes de la interfaz de usuario desacoplados de la lógica de datos tanto como sea posible. Los datos deben inyectarse a través de props o hooks personalizados.
3. **Diseño Caleño y Ambiental**: La paleta de colores (definida en `tailwind.config.js`) debe respetarse estrictamente para evocar la naturaleza (Verde Palma), el cielo/río (Azul Tangara) y el Túnel Mundialista (Amarillo Cítrico).
4. **Chatbot (Tangara Chat)**: Las respuestas simuladas deben incluir jerga amigable y respetuosa de Cali, Colombia (ej. "borondo", "parcero", "mirá ve").
5. **No Backend (Aún)**: Toda la funcionalidad actual es un MVP frontend. No agregar dependencias de base de datos ni intentar levantar servidores backend. Todo debe funcionar estáticamente o con datos mockeados.
