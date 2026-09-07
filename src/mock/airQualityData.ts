// ===================================================
// ECOPULSE 2026 - mock/airQualityData.ts
//
// REGLA: Este archivo solo contiene CONSTANTES científicas
// (niveles ICA/EPA, descripciones de contaminantes, noticias reales)
// Los valores numéricos de las métricas vienen del backend real.
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
    recommendation: 'El aire es excelente. Es completamente seguro realizar actividades y ejercicio al aire libre.',
  },
  {
    level: 'moderada',
    label: 'Moderada',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    range: [51, 100],
    description: 'Aceptable para la mayoría. Puede afectar a personas extremadamente sensibles.',
    recommendation: 'Los niños y personas con asma pueden salir pero evitando esfuerzos físicos intensos y prolongados.',
  },
  {
    level: 'dañina-grupos-sensibles',
    label: 'Dañina para grupos sensibles',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    range: [101, 150],
    description: 'Niños, adultos mayores y personas con enfermedades respiratorias deben reducir actividad al aire libre.',
    recommendation: 'Los niños y adultos mayores deben evitar correr o hacer ejercicio intenso al aire libre. Se aconseja reposar.',
  },
  {
    level: 'dañina',
    label: 'Dañina',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    range: [151, 200],
    description: 'Todos pueden experimentar efectos negativos en la salud.',
    recommendation: 'Se recomienda a toda la ciudadanía limitar el esfuerzo prolongado o pesado al aire libre.',
  },
  {
    level: 'muy-dañina',
    label: 'Muy Dañina',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    range: [201, 300],
    description: 'Alerta sanitaria: efectos graves en la salud de toda la población.',
    recommendation: 'Evitar toda actividad física al aire libre. Mantener ventanas cerradas en hogares y escuelas.',
  },
  {
    level: 'peligrosa',
    label: 'Peligrosa',
    color: '#7F1D1D',
    bgColor: '#FEE2E2',
    range: [301, 500],
    description: 'Emergencia de salud. Evitar toda actividad al aire libre.',
    recommendation: 'Permanecer en interiores con purificación de aire. Suspensión total de actividades externas.',
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
// Datos geográficos de comunas de Cali (coordenadas reales)
// Valores de ICA inicializados en 0.
// --------------------------------------------------
export const comunasData: ComunaData[] = [
  { id: 1,  name: 'Sucre',          ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4542, lng: -76.5458 }, population: 63400,  mainContaminant: 'PM10' },
  { id: 2,  name: 'Santa Rosa',     ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4589, lng: -76.5333 }, population: 58200,  mainContaminant: 'PM2.5' },
  { id: 3,  name: 'Libertad',       ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4475, lng: -76.5381 }, population: 82100,  mainContaminant: 'O3' },
  { id: 4,  name: 'Flores',         ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4611, lng: -76.5200 }, population: 71300,  mainContaminant: 'NO2' },
  { id: 5,  name: 'Guaduales',      ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4750, lng: -76.5100 }, population: 95600,  mainContaminant: 'PM2.5' },
  { id: 6,  name: 'Salomia',        ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4700, lng: -76.4950 }, population: 67800,  mainContaminant: 'PM10' },
  { id: 7,  name: 'Marroquín',      ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4350, lng: -76.4800 }, population: 88400,  mainContaminant: 'CO' },
  { id: 8,  name: 'Villanueva',     ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4450, lng: -76.5100 }, population: 79200,  mainContaminant: 'PM10' },
  { id: 9,  name: 'Los Andes',      ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4500, lng: -76.5000 }, population: 64500,  mainContaminant: 'O3' },
  { id: 10, name: 'Calipso',        ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4250, lng: -76.4950 }, population: 102300, mainContaminant: 'PM2.5' },
  { id: 11, name: 'Población',      ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4300, lng: -76.5150 }, population: 87600,  mainContaminant: 'NO2' },
  { id: 12, name: 'San Antonio',    ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4480, lng: -76.5401 }, population: 56300,  mainContaminant: 'PM10' },
  { id: 13, name: 'El Rodeo',       ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4200, lng: -76.4850 }, population: 43700,  mainContaminant: 'CO' },
  { id: 14, name: 'Rico',           ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4150, lng: -76.5050 }, population: 71800,  mainContaminant: 'PM10' },
  { id: 15, name: 'Guabal',         ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4050, lng: -76.5150 }, population: 84500,  mainContaminant: 'O3' },
  { id: 16, name: 'Cañaveralejo',   ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4100, lng: -76.5350 }, population: 62100,  mainContaminant: 'SO2' },
  { id: 17, name: 'Saavedra Galindo', ica: 0, level: 'buena',    color: '#16A34A', coordinates: { lat: 3.4380, lng: -76.5250 }, population: 55900, mainContaminant: 'NO2' },
  { id: 18, name: 'El Lido',        ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4180, lng: -76.5450 }, population: 48200,  mainContaminant: 'PM2.5' },
  { id: 19, name: 'Junín',          ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4300, lng: -76.5280 }, population: 61400,  mainContaminant: 'CO' },
  { id: 20, name: 'Cristóbal Colon', ica: 0, level: 'buena',    color: '#16A34A', coordinates: { lat: 3.4280, lng: -76.5080 }, population: 76800, mainContaminant: 'PM2.5' },
  { id: 21, name: 'Habana',         ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.4420, lng: -76.5050 }, population: 53200,  mainContaminant: 'PM10' },
  { id: 22, name: 'Nápoles',        ica: 0, level: 'buena',     color: '#16A34A', coordinates: { lat: 3.3850, lng: -76.5400 }, population: 67300,  mainContaminant: 'O3' },
];


// --------------------------------------------------
// Series temporales — fechas SIEMPRE relativas al día de hoy
// --------------------------------------------------

/** Genera las etiquetas de los últimos 7 días en formato 'DD MMM' */
const _last7DayLabels = (): string[] => {
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  });
};

export const weeklyTrend: WeeklyTrend = {
  points: _last7DayLabels().map((date, i) => ({
    date,
    ica: [26, 34, 28, 42, 31, 24, 29][i],
    pm25: [6.8, 9.2, 7.4, 11.1, 8.3, 6.2, 7.7][i],
  })),
  average: 30.6,
  min: 24,
  max: 42,
};

// Pronóstico de 3 días — ventana rodante desde HOY
const _genForecast = (): DayForecast[] => {
  const MONTHS  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const DAYS    = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const today   = new Date();
  const weatherPool = [
    { weatherIcon: '☀️', tempMin: 19, tempMax: 30, icaEstimated: 24, level: 'buena' as const, recommendation: 'Excelente día para actividades al aire libre' },
    { weatherIcon: '⛅', weatherIcon2: '🌤️', tempMin: 20, tempMax: 28, icaEstimated: 36, level: 'buena' as const, recommendation: 'Actividades al aire libre sin restricciones' },
    { weatherIcon: '🌧️', tempMin: 18, tempMax: 25, icaEstimated: 42, level: 'buena' as const, recommendation: 'Aire limpio post-lluvia, buena ventilación natural' },
  ];
  const labels = ['Hoy', 'Mañana', 'Pasado mañana'];
  return [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const pool = weatherPool[(d.getDay() + offset) % weatherPool.length];
    return {
      date: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      dayName: offset === 0 ? labels[0] : DAYS[d.getDay()],
      icaEstimated: pool.icaEstimated,
      level: pool.level,
      weatherIcon: pool.weatherIcon,
      tempMin: pool.tempMin,
      tempMax: pool.tempMax,
      recommendation: pool.recommendation,
    };
  });
};

export const forecast: DayForecast[] = _genForecast();

export const historicalData: HistoricalData = {
  year: new Date().getFullYear(),
  monthlyData: [
    { month: 'Ene', ica: 68, level: 'moderada' },
    { month: 'Feb', ica: 72, level: 'moderada' },
    { month: 'Mar', ica: 55, level: 'moderada' },
    { month: 'Abr', ica: 45, level: 'buena' },
    { month: 'May', ica: 48, level: 'buena' },
  ],
};

