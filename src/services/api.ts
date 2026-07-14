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
import { tangaraNodes } from '../mock/nodesData';
import { airQualityMetrics, forecast, weeklyTrend } from '../mock/airQualityData';

/** URL base del futuro backend. Se moverá a variable de entorno VITE_API_URL. */
export const API_BASE_URL = 'http://localhost:8000';

/** Simula latencia de red para que la UI ya maneje estados de carga. */
const simulateNetwork = <T,>(data: T, ms = 150): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

export const fetchNodes = (): Promise<TangaraNode[]> =>
  fetch(`${API_BASE_URL}/api/nodes`)
    .then(r => {
      if (!r.ok) throw new Error('Error al obtener nodos');
      return r.json();
    })
    .catch(err => {
      console.warn("Backend de Python no disponible, usando nodos mock de fallback:", err);
      return simulateNetwork(tangaraNodes);
    });


export const fetchCurrentAirQuality = (): Promise<AirQualityMetrics> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/current`).then(r => r.json());
  simulateNetwork(airQualityMetrics);

export const fetchWeeklyTrend = (): Promise<WeeklyTrend> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/trend`).then(r => r.json());
  simulateNetwork(weeklyTrend);

export const fetchForecast = (): Promise<DayForecast[]> =>
  // FUTURO: return fetch(`${API_BASE_URL}/api/air-quality/forecast`).then(r => r.json());
  simulateNetwork(forecast);

// ─── Parques curados de Cali (réplica del backend, para fallback offline) ───
const CALI_PARKS = [
  { lat: 3.4568, lng: -76.5260, name: 'Boulevard del Río',         isGreen: true, bounds: [[3.4520, -76.5280], [3.4590, -76.5240]] as [[number,number],[number,number]] },
  { lat: 3.3830, lng: -76.5290, name: 'Parque del Ingenio',        isGreen: true, bounds: [[3.3780, -76.5320], [3.3850, -76.5260]] as [[number,number],[number,number]] },
  { lat: 3.3350, lng: -76.5400, name: 'Ecoparque Pance',           isGreen: true, bounds: [[3.3250, -76.5500], [3.3450, -76.5300]] as [[number,number],[number,number]] },
  { lat: 3.4612, lng: -76.5370, name: 'Parque Versalles',          isGreen: true, bounds: [[3.4597, -76.5385], [3.4627, -76.5355]] as [[number,number],[number,number]] },
  { lat: 3.4470, lng: -76.5430, name: 'Parque del Perro',          isGreen: true, bounds: [[3.4462, -76.5438], [3.4478, -76.5422]] as [[number,number],[number,number]] },
  { lat: 3.4542, lng: -76.5420, name: 'Parque de San Antonio',     isGreen: true, bounds: [[3.4530, -76.5432], [3.4554, -76.5408]] as [[number,number],[number,number]] },
  { lat: 3.4810, lng: -76.5120, name: 'Parque de La Flora',        isGreen: true, bounds: [[3.4770, -76.5150], [3.4840, -76.5080]] as [[number,number],[number,number]] },
  { lat: 3.4380, lng: -76.5230, name: 'Parque Las Banderas',       isGreen: true, bounds: [[3.4365, -76.5245], [3.4395, -76.5215]] as [[number,number],[number,number]] },
  { lat: 3.4190, lng: -76.5445, name: 'Ecoparque Las Tres Cruces', isGreen: true, bounds: [[3.4150, -76.5500], [3.4250, -76.5380]] as [[number,number],[number,number]] },
  { lat: 3.4500, lng: -76.5610, name: 'Parque Ecológico Bataclán', isGreen: true, bounds: [[3.4450, -76.5650], [3.4550, -76.5550]] as [[number,number],[number,number]] },
  { lat: 3.4370, lng: -76.5390, name: 'Parque Obrero',             isGreen: true, bounds: [[3.4360, -76.5400], [3.4380, -76.5380]] as [[number,number],[number,number]] },
  { lat: 3.4640, lng: -76.5290, name: 'Parque Cabal',              isGreen: true, bounds: [[3.4625, -76.5305], [3.4655, -76.5275]] as [[number,number],[number,number]] },
  { lat: 3.4520, lng: -76.4900, name: 'Parque Olímpico Pasoancho', isGreen: true, bounds: [[3.4505, -76.4915], [3.4535, -76.4885]] as [[number,number],[number,number]] },
  { lat: 3.4090, lng: -76.5400, name: 'Parque Pisamos',            isGreen: true, bounds: [[3.4075, -76.5415], [3.4105, -76.5385]] as [[number,number],[number,number]] },
  { lat: 3.4730, lng: -76.5350, name: 'Parque Julio Rincón',       isGreen: true, bounds: [[3.4715, -76.5365], [3.4745, -76.5335]] as [[number,number],[number,number]] },
];

// Haversine mínima (sólo para fallback offline)
const _haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Selección de destino óptimo local
const _selectBestDest = (origin: [number, number]) => {
  const MIN = 0.3, MAX = 3.5;
  const candidates = CALI_PARKS
    .map(p => ({ p, d: _haversine(origin[0], origin[1], p.lat, p.lng) }))
    .filter(({ d }) => d >= MIN && d <= MAX)
    .sort((a, b) => a.d - b.d);
  return candidates.length ? candidates[0].p : CALI_PARKS[0];
};

// Cálculo de ruta local offline (sin backend — solo geometría y ICA mock)
const _calcRouteLocal = (start: [number, number], end: [number, number], destName: string) => {
  const distance = parseFloat(_haversine(start[0], start[1], end[0], end[1]).toFixed(2));
  const path: [number, number][] = [start, end];
  const co2Saved = Math.round(distance * 120);
  const durations = { walk: Math.round(distance * 12), bike: Math.round(distance * 4), skates: Math.round(distance * 5), skateboard: Math.round(distance * 6), escooter: Math.round(distance * 3) };

  const sampled = [start, end];
  let totalICA = 0, greenPts = 0;
  sampled.forEach(pt => {
    const nearPark = CALI_PARKS.some(p => _haversine(pt[0], pt[1], p.lat, p.lng) < 0.4);
    if (nearPark) greenPts++;
    const nearest = tangaraNodes.reduce((best, n) => {
      if (!n.coordinates) return best;
      const d = _haversine(pt[0], pt[1], n.coordinates.lat, n.coordinates.lng);
      return d < best.d ? { d, ica: n.measurements.ica } : best;
    }, { d: Infinity, ica: 50 });
    totalICA += nearest.ica;
  });
  const averageICA = Math.round(totalICA / sampled.length);
  const greenCoverage = Math.round((greenPts / sampled.length) * 100);
  const healthScore = averageICA <= 50 && greenCoverage >= 40 ? 'A+' : averageICA <= 75 && greenCoverage >= 25 ? 'A' : averageICA > 100 ? 'C' : 'B';

  // Sin backend no hay datos de tráfico reales — neutro
  return { path, distance, durations, co2Saved, greenCoverage, averageICA, healthScore, destinationName: destName,
           trafficRisk: 'low' as const, trafficLabel: 'Sin datos de tráfico', rushHour: false };
};

// ─── Métodos de ruteo — Backend Python con fallback local ───────────────────

export const fetchGreenZones = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/api/routing/green-zones`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .catch(() => Promise.resolve(CALI_PARKS));

export const fetchBestDestination = (lat: number, lng: number): Promise<any> =>
  fetch(`${API_BASE_URL}/api/routing/best-destination?lat=${lat}&lng=${lng}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .catch(() => Promise.resolve(_selectBestDest([lat, lng])));

export const fetchHealthyRoute = (start: [number, number], end: [number, number], transportMode: string): Promise<any> =>
  fetch(`${API_BASE_URL}/api/routing/healthy-route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end, transport_mode: transportMode })
  })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .catch(() => {
      console.warn('Backend offline — calculando ruta saludable localmente');
      const dest = _selectBestDest(start);
      return Promise.resolve(_calcRouteLocal(start, end, dest.name));
    });


