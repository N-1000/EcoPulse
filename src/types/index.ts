// ===================================================
// TANGARA 2026 - Inteligencia Ambiental Urbana
// types/index.ts — Interfaces y tipos centrales
// ===================================================

// --------------------------------------------------
// CHATBOT
// --------------------------------------------------

export type MessageSender = 'user' | 'tangara-ai';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: Date;
}

// --------------------------------------------------
// CALIDAD DEL AIRE
// --------------------------------------------------

export type AirQualityLevel =
  | 'buena'
  | 'moderada'
  | 'dañina-grupos-sensibles'
  | 'dañina'
  | 'muy-dañina'
  | 'peligrosa';

export interface AirQualityLevelInfo {
  level: AirQualityLevel;
  label: string;
  color: string;          // Color HEX para UI
  bgColor: string;        // Color de fondo para badges / gráficas
  range: [number, number];// Rango ICA [min, max]
  description: string;
}

export interface Contaminant {
  id: string;
  name: string;           // e.g. "PM2.5"
  fullName: string;       // e.g. "Material Particulado 2.5µm"
  value: number;
  unit: string;           // e.g. "µg/m³"
  level: AirQualityLevel;
  description: string;    // Descripción legible para el usuario
  source: string;         // Principal fuente de emisión
  trend: 'up' | 'down' | 'stable';
}

export interface AirQualityMetrics {
  icaGeneral: number;
  level: AirQualityLevel;
  updatedAt: Date;
  contaminants: Contaminant[];
}

// --------------------------------------------------
// COMUNAS Y MAPA
// --------------------------------------------------

export interface ComunaData {
  id: number;
  name: string;           // Nombre de la comuna
  ica: number;            // Índice de calidad del aire
  level: AirQualityLevel;
  color: string;          // Color HEX para el mapa
  position: { x: number; y: number }; // Coordenada relativa en SVG del mapa
  population: number;
  mainContaminant: string;
}

// --------------------------------------------------
// TENDENCIAS
// --------------------------------------------------

export interface TrendPoint {
  date: string;           // e.g. "12 May"
  ica: number;
  pm25?: number;
  pm10?: number;
}

export interface WeeklyTrend {
  points: TrendPoint[];
  average: number;
  min: number;
  max: number;
}

// --------------------------------------------------
// PRONÓSTICO Y ESTADÍSTICAS
// --------------------------------------------------

export interface DayForecast {
  date: string;
  dayName: string;
  icaEstimated: number;
  level: AirQualityLevel;
  weatherIcon: string;    // emoji representativo
  tempMin: number;
  tempMax: number;
  recommendation: string;
}

export interface MonthlyAvg {
  month: string;          // e.g. "Ene"
  ica: number;
  level: AirQualityLevel;
}

export interface HistoricalData {
  year: number;
  monthlyData: MonthlyAvg[];
}

// --------------------------------------------------
// NOTICIAS AMBIENTALES
// --------------------------------------------------

export type NewsCategory = 'COMUNIDAD' | 'PROGRESO' | 'ALERTA' | 'CIENCIA';

export interface NewsItem {
  id: string;
  title: string;
  category: NewsCategory;
  summary: string;
  date: string;
  imageUrl?: string;
}

// --------------------------------------------------
// USUARIO / PERFIL
// --------------------------------------------------

export interface UserProfile {
  name: string;
  subtitle: string;
  avatarInitials: string;
  notificationCount: number;
}

// --------------------------------------------------
// NAVEGACIÓN
// --------------------------------------------------

export interface NavItem {
  id: string;
  label: string;
  icon: string;           // Nombre del icono Lucide
  href?: string;
  isActive?: boolean;
  badge?: number;
}
