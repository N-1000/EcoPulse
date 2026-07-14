// ===================================================
// TANGARA 2026 - mock/airQualityData.ts
//
// REGLA: Este archivo solo contiene CONSTANTES científicas
// (niveles ICA/EPA, descripciones de contaminantes, noticias reales)
// Los valores numéricos de las métricas vienen del backend real.
// ===================================================

import type {
  AirQualityMetrics,
  AirQualityLevelInfo,
  WeeklyTrend,
  DayForecast,
  HistoricalData,
  NewsItem,
} from '../types';

// --------------------------------------------------
// Definición de niveles ICA (Colombia / EPA)
// Fuente: EPA breakpoints para PM2.5 24h
// --------------------------------------------------
export const ICA_LEVELS: AirQualityLevelInfo[] = [
  {
    level: 'buena',
    label: 'Buena',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    range: [0, 50],
    description: 'La calidad del aire es satisfactoria y no representa riesgo para la salud.',
  },
  {
    level: 'moderada',
    label: 'Moderada',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    range: [51, 100],
    description: 'Aceptable para la mayoría. Puede afectar a personas extremadamente sensibles.',
  },
  {
    level: 'dañina-grupos-sensibles',
    label: 'Dañina para grupos sensibles',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    range: [101, 150],
    description: 'Niños, adultos mayores y personas con enfermedades respiratorias deben reducir actividad al aire libre.',
  },
  {
    level: 'dañina',
    label: 'Dañina',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    range: [151, 200],
    description: 'Todos pueden experimentar efectos negativos en la salud.',
  },
  {
    level: 'muy-dañina',
    label: 'Muy Dañina',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    range: [201, 300],
    description: 'Alerta sanitaria: efectos graves en la salud de toda la población.',
  },
  {
    level: 'peligrosa',
    label: 'Peligrosa',
    color: '#7F1D1D',
    bgColor: '#FEE2E2',
    range: [301, 500],
    description: 'Emergencia de salud. Evitar toda actividad al aire libre.',
  },
];

export const getIcaLevel = (ica: number): AirQualityLevelInfo => {
  return ICA_LEVELS.find(l => ica >= l.range[0] && ica <= l.range[1]) ?? ICA_LEVELS[0];
};

// --------------------------------------------------
// Descripción de contaminantes medidos (no valores)
// Los valores reales vienen del backend.
// --------------------------------------------------
export const airQualityMetrics: AirQualityMetrics = {
  icaGeneral: 0,
  level: 'buena',
  updatedAt: new Date(),
  contaminants: [
    {
      id: 'pm25',
      name: 'PM₂.₅',
      fullName: 'Material Particulado 2.5µm',
      value: 0,
      unit: 'µg/m³',
      level: 'buena',
      description: 'Partículas finas presentes en el aire. Principal contaminante medido por la red Tángara.',
      source: 'Tráfico vehicular y combustión',
      trend: 'stable',
    },
    {
      id: 'co2',
      name: 'CO₂',
      fullName: 'Dióxido de Carbono',
      value: 0,
      unit: 'ppm',
      level: 'buena',
      description: 'Gas de efecto invernadero, indicador de ventilación y actividad humana.',
      source: 'Respiración, combustión, industria',
      trend: 'stable',
    },
    {
      id: 'tmp',
      name: 'Temp.',
      fullName: 'Temperatura Ambiental',
      value: 0,
      unit: '°C',
      level: 'buena',
      description: 'Temperatura del ambiente medida en el sensor. Influye en la dispersión de partículas.',
      source: 'Sensor Tángara ESP32',
      trend: 'stable',
    },
    {
      id: 'hum',
      name: 'Humedad',
      fullName: 'Humedad Relativa',
      value: 0,
      unit: '%',
      level: 'buena',
      description: 'Humedad relativa del aire. Una humedad alta favorece la acumulación de material particulado.',
      source: 'Sensor Tángara ESP32',
      trend: 'stable',
    },
  ],
};

// --------------------------------------------------
// Series temporales: vacías — se poblarán desde el backend
// --------------------------------------------------
export const weeklyTrend: WeeklyTrend = {
  points: [],
  average: 0,
  min: 0,
  max: 0,
};

export const forecast: DayForecast[] = [];

export const historicalData: HistoricalData = {
  year: new Date().getFullYear(),
  monthlyData: [],
};

// --------------------------------------------------
// Noticias ambientales reales de contexto
// --------------------------------------------------
export const news: NewsItem[] = [
  {
    id: 'n1',
    title: 'CVC avanza en plan de reforestación urbana en Cali',
    category: 'Comunidad',
    summary: 'La Corporación Autónoma del Valle plantará 5.000 árboles nativos en comunas del nororiente de Cali como parte del Plan de Acción Climática 2024-2026.',
    date: '11 May 2026',
  },
  {
    id: 'n2',
    title: 'Tángara suma 87 sensores activos en tiempo real',
    category: 'Progreso',
    summary: 'La red de ciencia cívica Tángara alcanza cobertura en las principales comunas de Cali con más de 63 millones de lecturas históricas disponibles para la ciudadanía.',
    date: '23 May 2026',
  },
  {
    id: 'n3',
    title: 'OMS actualiza directrices de PM2.5: límite baja a 5 µg/m³ anual',
    category: 'Comunidad',
    summary: 'Las nuevas guías 2021 de la Organización Mundial de la Salud establecen límites más estrictos para el material particulado fino, evidenciando la necesidad de monitoreo continuo.',
    date: '9 May 2026',
  },
  {
    id: 'n4',
    title: 'Hackathon Ciudadano por el Aire de Cali — YAWA 2026',
    category: 'Progreso',
    summary: 'La Fundación Chispa lanzó el primer hackathon abierto sobre datos de calidad del aire, invitando a ciudadanos, investigadores y periodistas de datos a contar la historia del aire de Cali.',
    date: '23 May 2026',
  },
];
