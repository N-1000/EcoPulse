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
  coordinates: GeoPoint;  // Coordenadas reales (Lat/Lng)
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

/** Identificadores de las páginas/vistas de la aplicación. */
export type PageId =
  | 'inicio'
  | 'mapa'
  | 'calidad-aire'
  | 'tendencias'
  | 'predicciones'
  | 'estadisticas'
  | 'reportes'
  | 'educacion'
  | 'participa'
  | 'noticias'
  | 'sobre';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;           // Nombre del icono Lucide
  href?: string;
  isActive?: boolean;
  badge?: number;
}

// --------------------------------------------------
// NODOS TANGARA (SENSORES)
// --------------------------------------------------

/** Coordenada geográfica decodificada (la entregará el backend). */
export interface GeoPoint {
  lat: number;
  lng: number;
}

export type NodeStatus = 'activo' | 'inactivo' | 'calibracion';

/** Últimas mediciones reportadas por un nodo. */
export interface NodeMeasurements {
  temperature: number;    // °C
  humidity: number;       // % humedad relativa
  pm25: number;           // µg/m³
  ica: number;            // Índice de Calidad del Aire derivado
  level: AirQualityLevel;
}

/**
 * Nodo sensor de la red Tangara.
 *
 * IMPORTANTE (integración futura con ClickHouse):
 * - El firmware de los sensores reporta la ubicación como **Geohash**
 *   (no lat/lng) para reducir el tamaño de los paquetes.
 * - `coordinates` contiene la posición ya decodificada; en producción la
 *   entregará directamente el backend (FastAPI). El frontend NO decodifica.
 * - Varios sensores pueden compartir el mismo geohash mientras están en
 *   calibración o pruebas: NO es un error. La UI debe agruparlos.
 */
export interface TangaraNode {
  id: string;             // ej. "TANGARA_260"
  name: string;
  geohash: string;        // ubicación original reportada por el firmware
  coordinates: GeoPoint | null; // decodificada por el backend (null si aún no)
  comuna: string;
  barrio: string;
  status: NodeStatus;
  lastUpdate: string;     // ISO 8601
  measurements: NodeMeasurements;
}

/** Grupo de nodos que comparten la misma ubicación (mismo geohash). */
export interface NodeCluster {
  geohash: string;
  coordinates: GeoPoint;
  nodes: TangaraNode[];
}

// --------------------------------------------------
// CHATBOT — PREGUNTAS SUGERIDAS
// --------------------------------------------------

export interface SuggestedQuestion {
  id: string;
  text: string;           // Pregunta mostrada al usuario
  answer: string;         // Respuesta simulada (luego la generará la IA real)
}

export type TransportMode = 'walk' | 'bike' | 'skates' | 'skateboard' | 'escooter';

export interface RoutePoint {
  lat: number;
  lng: number;
  name?: string;
  isGreen?: boolean;
  bounds?: [[number, number], [number, number]];
}

export interface RouteResult {
  path: [number, number][];
  distance: number;
  durations: Record<TransportMode, number>;
  co2Saved: number;
  greenCoverage: number;
  averageICA: number;
  healthScore: 'A+' | 'A' | 'B' | 'C';
  destinationName: string;
  // Tráfico
  trafficRisk: 'low' | 'medium' | 'high';
  trafficLabel: string;
  rushHour: boolean;
}

