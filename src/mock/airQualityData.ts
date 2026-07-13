// ===================================================
// TANGARA 2026 - Mock Data
// mock/airQualityData.ts — Datos simulados para el MVP
// ===================================================

import type {
  AirQualityMetrics,
  AirQualityLevelInfo,
  ComunaData,
  WeeklyTrend,
  DayForecast,
  HistoricalData,
  NewsItem,
} from '../types';

// --------------------------------------------------
// Definición de niveles ICA (Colombia / EPA)
// --------------------------------------------------
export const ICA_LEVELS: AirQualityLevelInfo[] = [
  {
    level: 'buena',
    label: 'Buena',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    range: [0, 50],
    description: 'La calidad del aire es satisfactoria.',
  },
  {
    level: 'moderada',
    label: 'Moderada',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    range: [51, 100],
    description: 'Puede afectar a grupos sensibles.',
  },
  {
    level: 'dañina-grupos-sensibles',
    label: 'Dañina para grupos sensibles',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    range: [101, 150],
    description: 'Niños, adultos mayores y personas con enf. respiratorias deben reducir actividad.',
  },
  {
    level: 'dañina',
    label: 'Dañina',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    range: [151, 200],
    description: 'Todos pueden experimentar efectos a la salud.',
  },
  {
    level: 'muy-dañina',
    label: 'Muy Dañina',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    range: [201, 300],
    description: 'Alerta sanitaria: efectos graves para la salud.',
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
// Métricas generales de calidad del aire
// --------------------------------------------------
export const airQualityMetrics: AirQualityMetrics = {
  icaGeneral: 58,
  level: 'moderada',
  updatedAt: new Date(),
  contaminants: [
    {
      id: 'pm25',
      name: 'PM₂.₅',
      fullName: 'Material Particulado 2.5µm',
      value: 24.3,
      unit: 'µg/m³',
      level: 'moderada',
      description: 'Partículas finas del tráfico',
      source: 'Tráfico vehicular',
      trend: 'down',
    },
    {
      id: 'pm10',
      name: 'PM₁₀',
      fullName: 'Material Particulado 10µm',
      value: 48.7,
      unit: 'µg/m³',
      level: 'moderada',
      description: 'Polvos medianos del entorno',
      source: 'Polvo vial',
      trend: 'stable',
    },
    {
      id: 'o3',
      name: 'O₃',
      fullName: 'Ozono Troposférico',
      value: 62.1,
      unit: 'ppb',
      level: 'moderada',
      description: 'Smog fotoquímico',
      source: 'Reacción solar / NOx',
      trend: 'up',
    },
    {
      id: 'no2',
      name: 'NO₂',
      fullName: 'Dióxido de Nitrógeno',
      value: 31.4,
      unit: 'µg/m³',
      level: 'buena',
      description: 'Gases de combustión',
      source: 'Motores y fábricas',
      trend: 'stable',
    },
    {
      id: 'co',
      name: 'CO',
      fullName: 'Monóxido de Carbono',
      value: 1.2,
      unit: 'ppm',
      level: 'buena',
      description: 'Combustión incompleta',
      source: 'Tráfico vehicular',
      trend: 'down',
    },
    {
      id: 'so2',
      name: 'SO₂',
      fullName: 'Dióxido de Azufre',
      value: 8.9,
      unit: 'µg/m³',
      level: 'buena',
      description: 'Industria y combustibles',
      source: 'Industria local',
      trend: 'stable',
    },
  ],
};

// --------------------------------------------------
// Datos de comunas de Cali (posiciones SVG relativas)
// --------------------------------------------------
export const comunasData: ComunaData[] = [
  { id: 1,  name: 'Sucre',          ica: 42, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4542, lng: -76.5458 }, population: 63400,  mainContaminant: 'PM10' },
  { id: 2,  name: 'Santa Rosa',     ica: 56, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4589, lng: -76.5333 }, population: 58200,  mainContaminant: 'PM2.5' },
  { id: 3,  name: 'Libertad',       ica: 65, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4475, lng: -76.5381 }, population: 82100,  mainContaminant: 'O3' },
  { id: 4,  name: 'Flores',         ica: 38, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4611, lng: -76.5200 }, population: 71300,  mainContaminant: 'NO2' },
  { id: 5,  name: 'Guaduales',      ica: 72, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4750, lng: -76.5100 }, population: 95600,  mainContaminant: 'PM2.5' },
  { id: 6,  name: 'Salomia',        ica: 48, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4700, lng: -76.4950 }, population: 67800,  mainContaminant: 'PM10' },
  { id: 7,  name: 'Marroquín',      ica: 55, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4350, lng: -76.4800 }, population: 88400,  mainContaminant: 'CO' },
  { id: 8,  name: 'Villanueva',     ica: 44, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4450, lng: -76.5100 }, population: 79200,  mainContaminant: 'PM10' },
  { id: 9,  name: 'Los Andes',      ica: 61, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4500, lng: -76.5000 }, population: 64500,  mainContaminant: 'O3' },
  { id: 10, name: 'Calipso',        ica: 118, level: 'dañina-grupos-sensibles', color: '#EA580C', coordinates: { lat: 3.4250, lng: -76.4950 }, population: 102300, mainContaminant: 'PM2.5' },
  { id: 11, name: 'Población',      ica: 83, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4300, lng: -76.5150 }, population: 87600,  mainContaminant: 'NO2' },
  { id: 12, name: 'San Antonio',    ica: 52, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4480, lng: -76.5401 }, population: 56300,  mainContaminant: 'PM10' },
  { id: 13, name: 'El Rodeo',       ica: 35, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4200, lng: -76.4850 }, population: 43700,  mainContaminant: 'CO' },
  { id: 14, name: 'Rico',           ica: 47, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4150, lng: -76.5050 }, population: 71800,  mainContaminant: 'PM10' },
  { id: 15, name: 'Guabal',         ica: 79, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4050, lng: -76.5150 }, population: 84500,  mainContaminant: 'O3' },
  { id: 16, name: 'Cañaveralejo',   ica: 41, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4100, lng: -76.5350 }, population: 62100,  mainContaminant: 'SO2' },
  { id: 17, name: 'Saavedra Galindo', ica: 59, level: 'moderada', color: '#CA8A04', coordinates: { lat: 3.4380, lng: -76.5250 }, population: 55900, mainContaminant: 'NO2' },
  { id: 18, name: 'El Lido',        ica: 66, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.4180, lng: -76.5450 }, population: 48200,  mainContaminant: 'PM2.5' },
  { id: 19, name: 'Junín',          ica: 44, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4300, lng: -76.5280 }, population: 61400,  mainContaminant: 'CO' },
  { id: 20, name: 'Cristóbal Colon', ica: 108, level: 'dañina-grupos-sensibles', color: '#EA580C', coordinates: { lat: 3.4280, lng: -76.5080 }, population: 76800, mainContaminant: 'PM2.5' },
  { id: 21, name: 'Habana',         ica: 37, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4420, lng: -76.5050 }, population: 53200,  mainContaminant: 'PM10' },
  { id: 22, name: 'Nápoles',        ica: 76, level: 'moderada',  color: '#CA8A04', coordinates: { lat: 3.3850, lng: -76.5400 }, population: 67300,  mainContaminant: 'O3' },
];

// --------------------------------------------------
// Tendencia de los últimos 7 días
// --------------------------------------------------
export const weeklyTrend: WeeklyTrend = {
  points: [
    { date: '12 May', ica: 62, pm25: 26.1, pm10: 51.2 },
    { date: '13 May', ica: 55, pm25: 22.4, pm10: 46.8 },
    { date: '14 May', ica: 70, pm25: 29.8, pm10: 58.3 },
    { date: '15 May', ica: 48, pm25: 19.3, pm10: 41.5 },
    { date: '16 May', ica: 81, pm25: 35.2, pm10: 63.7 },
    { date: '17 May', ica: 63, pm25: 26.8, pm10: 52.4 },
    { date: '18 May', ica: 58, pm25: 24.3, pm10: 48.7 },
  ],
  average: 62.4,
  min: 48,
  max: 81,
};

// --------------------------------------------------
// Pronóstico
// --------------------------------------------------
export const forecast: DayForecast[] = [
  {
    date: '15 de mayo',
    dayName: 'Mañana',
    icaEstimated: 62,
    level: 'moderada',
    weatherIcon: '⛅',
    tempMin: 19,
    tempMax: 27,
    recommendation: 'Actividades al aire libre con precaución',
  },
  {
    date: '16 de mayo',
    dayName: 'Pasado',
    icaEstimated: 75,
    level: 'moderada',
    weatherIcon: '🌤️',
    tempMin: 20,
    tempMax: 29,
    recommendation: 'Grupos sensibles evitar ejercicio intenso',
  },
  {
    date: '17 de mayo',
    dayName: 'Sab',
    icaEstimated: 45,
    level: 'buena',
    weatherIcon: '☀️',
    tempMin: 18,
    tempMax: 26,
    recommendation: '¡Excelente día para borondo!',
  },
];

// --------------------------------------------------
// Histórico mensual
// --------------------------------------------------
export const historicalData: HistoricalData = {
  year: 2026,
  monthlyData: [
    { month: 'Ene', ica: 71, level: 'moderada' },
    { month: 'Feb', ica: 65, level: 'moderada' },
    { month: 'Mar', ica: 84, level: 'moderada' },
    { month: 'Abr', ica: 56, level: 'moderada' },
    { month: 'May', ica: 58, level: 'moderada' },
  ],
};

// --------------------------------------------------
// Noticias ambientales
// --------------------------------------------------
export const news: NewsItem[] = [
  {
    id: 'n1',
    title: 'Cat avanza en plan de reforestación urbana',
    category: 'COMUNIDAD',
    summary: 'La Corporación Autónoma del Valle plantará 5.000 árboles nativos en comunas del nororiente de Cali.',
    date: '11 May 2026',
  },
  {
    id: 'n2',
    title: 'Más arbolado en el MIO: nueva iniciativa verde',
    category: 'PROGRESO',
    summary: 'El sistema de transporte masivo incorporará zonas verdes en 12 estaciones de la ciudad.',
    date: '10 May 2026',
  },
  {
    id: 'n3',
    title: 'Monitoreo en tiempo real llega a comunas del sur',
    category: 'PROGRESO',
    summary: 'Se instalarán 8 nuevas estaciones de medición de calidad del aire en el sur de Cali.',
    date: '9 May 2026',
  },
];
