// ===================================================
// TANGARA 2026 - services/api.ts
// >>> PUNTO ÚNICO DE INTEGRACIÓN CON EL BACKEND (FastAPI) <<<
//
// Hoy: devuelve datos simulados (mock) con la MISMA forma que
// entregará el backend. Cuando FastAPI + ClickHouse estén listos,
// solo se reemplaza el cuerpo de estas funciones por `fetch()`
// a los endpoints indicados — ningún componente cambia.
//
// Endpoints previstos del backend:
//   GET  /api/nodes                  -> TangaraNode[] (coordenadas ya decodificadas del geohash)
//   GET  /api/nodes/{id}/history     -> serie temporal agregada del nodo
//   GET  /api/air-quality/current    -> AirQualityMetrics
//   GET  /api/air-quality/trend      -> WeeklyTrend
//   GET  /api/air-quality/forecast   -> DayForecast[]
//   POST /api/chat                   -> respuesta del chatbot IA
// ===================================================
import type {
  AirQualityMetrics,
  DayForecast,
  TangaraNode,
  WeeklyTrend,
} from '../types';
import { airQualityMetrics, forecast, weeklyTrend } from '../mock/airQualityData';
import { tangaraNodes } from '../mock/nodesData';

/** URL base del futuro backend. Se moverá a variable de entorno VITE_API_URL. */
export const API_BASE_URL = 'http://localhost:8000';

/** Simula latencia de red para que la UI ya maneje estados de carga. */
const simulateNetwork = <T,>(data: T, ms = 150): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

export const fetchNodes = (): Promise<TangaraNode[]> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/nodes`).then(r => r.json());
  simulateNetwork(tangaraNodes);

export const fetchCurrentAirQuality = (): Promise<AirQualityMetrics> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/current`).then(r => r.json());
  simulateNetwork(airQualityMetrics);

export const fetchWeeklyTrend = (): Promise<WeeklyTrend> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/trend`).then(r => r.json());
  simulateNetwork(weeklyTrend);

export const fetchForecast = (): Promise<DayForecast[]> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/forecast`).then(r => r.json());
  simulateNetwork(forecast);
