// ===================================================
// EcoPulse 2026 - services/api.ts
// >>> PUNTO ÚNICO DE INTEGRACIÓN CON EL BACKEND (FastAPI) <<<
//
// Endpoints del backend:
//   GET  /api/nodes                          -> TangaraNode[]
//   GET  /api/v1/air-quality/trends-24h      -> WeeklyTrend
//   GET  /api/v1/air-quality/monthly-historical -> MonthRecord[]
//   GET  /api/v1/air-quality/forecast        -> DayForecast[]
//   GET  /api/routing/green-zones            -> park[]
//   GET  /api/routing/best-destination       -> park
//   POST /api/routing/healthy-route          -> RouteResult
// ===================================================
import type {
  AirQualityMetrics,
  DayForecast,
  TangaraNode,
  WeeklyTrend,
  UIAction,
} from '../types';
import { calculateNodeMetrics, EMPTY_METRICS } from '../utils/nodeMetrics';

export { EMPTY_METRICS };

/** URL base del backend. Se puede sobreescribir con variable de entorno VITE_API_URL. */
export const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

// --------------------------------------------------
// Nodos
// --------------------------------------------------
export const fetchNodes = (): Promise<TangaraNode[]> =>
  fetch(`${API_BASE_URL}/api/nodes`)
    .then(r => {
      if (!r.ok) throw new Error('nodes_error');
      return r.json() as Promise<TangaraNode[]>;
    })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — sin nodos.');
      return [] as TangaraNode[];
    });

// --------------------------------------------------
// Calidad del aire actual (delegada a calculateNodeMetrics)
// --------------------------------------------------
export const fetchCurrentAirQuality = (): Promise<AirQualityMetrics> =>
  fetchNodes()
    .then(nodes => calculateNodeMetrics(nodes))
    .catch(() => ({ ...EMPTY_METRICS, updatedAt: new Date() }));

// --------------------------------------------------
// Tendencia 24h / por métrica (vacío si backend no disponible)
// --------------------------------------------------
export const fetchWeeklyTrend = (): Promise<WeeklyTrend> =>
  fetch(`${API_BASE_URL}/api/v1/air-quality/trends-24h?metric=24h`)
    .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<WeeklyTrend>; })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — tendencia 24h vacía.');
      return { points: [], average: 0, min: 0, max: 0 } as WeeklyTrend;
    });

export const fetch24hTrends = (metric = '24h'): Promise<any> =>
  fetch(`${API_BASE_URL}/api/v1/air-quality/trends-24h?metric=${metric}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — sin tendencias 24h.');
      return null;
    });

// --------------------------------------------------
// Series PM2.5 por sensor individual (spaghetti chart)
// --------------------------------------------------
export interface SensorPoint { t: string; v: number; }
export interface SensorSerie { id: string; avg24h: number; points: SensorPoint[]; }
export interface SeriePorSensorData {
  sensors: SensorSerie[];
  labels: string[];
  average: number[];
  refValue: number;
  refLabel: string;
  unit: string;
}

export const fetchSeriePorSensor = (): Promise<SeriePorSensorData | null> =>
  fetch(`${API_BASE_URL}/api/v1/air-quality/serie-por-sensor`)
    .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<SeriePorSensorData>; })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — sin serie por sensor.');
      return null;
    });


// --------------------------------------------------
// Histórico mensual (vacío si backend no disponible)
// --------------------------------------------------
export const fetchMonthlyHistorical = (year = '2026'): Promise<any[]> =>
  fetch(`${API_BASE_URL}/api/v1/air-quality/monthly-historical?year=${year}`)
    .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<any[]>; })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — histórico mensual vacío.');
      return [] as any[];
    });

// --------------------------------------------------
// Pronóstico (vacío si backend no disponible)
// --------------------------------------------------
export const fetchForecast = (): Promise<DayForecast[]> =>
  fetch(`${API_BASE_URL}/api/v1/air-quality/forecast`)
    .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<DayForecast[]>; })
    .catch(() => {
      console.warn('[EcoPulse] Backend no disponible — pronóstico vacío.');
      return [] as DayForecast[];
    });

// --------------------------------------------------
// Noticias en tiempo real (Cali & Valle del Cauca - 100% En Vivo)
// --------------------------------------------------
export const fetchLiveNews = async (): Promise<any[]> => {
  // 1. Intentar backend local FastAPI
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE_URL}/api/v1/news`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Backend offline o timeout
  }

  // 2. Feed RSS en vivo directo de Google News (Cali ambiental, CVC, DAGMA)
  try {
    const rssQuery = encodeURIComponent('Cali ambiental OR DAGMA Cali OR CVC Cali OR aire Cali');
    const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${rssQuery}&hl=es-419&gl=CO&ceid=CO:es-419`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'ok' && Array.isArray(json.items) && json.items.length > 0) {
        const freshItems = json.items.filter((it: any) => {
          if (!it.pubDate) return false;
          const diffDays = (Date.now() - new Date(it.pubDate).getTime()) / (1000 * 86400);
          return diffDays <= 14.0;
        });

        const mapped = freshItems.map((it: any, i: number) => {
          let title = it.title || '';
          let source = 'Prensa Cali';
          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            title = parts.slice(0, -1).join(' - ');
            source = parts[parts.length - 1];
          }
          const text = (it.description || '').replace(/<[^>]+>/g, '').trim();
          const summary = text.length > 30 ? text : `Información ambiental y de calidad del aire en Cali reportada por ${source}.`;
          
          let cat = 'PROGRESO';
          const lower = `${title} ${summary}`.toLowerCase();
          if (lower.includes('alerta') || lower.includes('olor') || lower.includes('humo') || lower.includes('contamin') || lower.includes('riesgo')) cat = 'ALERTA';
          else if (lower.includes('árbol') || lower.includes('parque') || lower.includes('comuna') || lower.includes('comunidad') || lower.includes('fauna')) cat = 'COMUNIDAD';
          else if (lower.includes('estudio') || lower.includes('sensor') || lower.includes('ciencia') || lower.includes('datos') || lower.includes('smart city')) cat = 'CIENCIA';

          const pubDate = new Date(it.pubDate);
          const diffSec = Math.floor((Date.now() - pubDate.getTime()) / 1000);
          let timeAgo = 'Reciente';
          if (diffSec < 3600) timeAgo = `Hace ${Math.max(1, Math.floor(diffSec / 60))} min`;
          else if (diffSec < 86400) timeAgo = `Hace ${Math.floor(diffSec / 3600)}h`;
          else if (diffSec < 172800) timeAgo = 'Ayer';
          else timeAgo = `Hace ${Math.floor(diffSec / 86400)} días`;

          return {
            id: `live-news-${i + 1}`,
            title,
            summary,
            category: cat,
            source,
            url: it.link || it.guid || 'https://www.elpais.com.co/cali',
            timeAgo,
            publishedAt: pubDate.toISOString(),
          };
        });

        // Ordenar estrictamente de la más reciente a la más antigua
        mapped.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        return mapped.slice(0, 18);
      }
    }
  } catch {
    // RSS proxy timeout
  }

  return [];
};

// ─── Parques curados de Cali (réplica del backend para fallback offline) ─────
const CALI_PARKS = [
  { lat: 3.4568, lng: -76.5260, name: 'Boulevard del Río', isGreen: true, bounds: [[3.4520, -76.5280], [3.4590, -76.5240]] as [[number, number], [number, number]] },
  { lat: 3.3830, lng: -76.5290, name: 'Parque del Ingenio', isGreen: true, bounds: [[3.3780, -76.5320], [3.3850, -76.5260]] as [[number, number], [number, number]] },
  { lat: 3.3350, lng: -76.5400, name: 'Ecoparque Pance', isGreen: true, bounds: [[3.3250, -76.5500], [3.3450, -76.5300]] as [[number, number], [number, number]] },
  { lat: 3.4612, lng: -76.5370, name: 'Parque Versalles', isGreen: true, bounds: [[3.4597, -76.5385], [3.4627, -76.5355]] as [[number, number], [number, number]] },
  { lat: 3.4470, lng: -76.5430, name: 'Parque del Perro', isGreen: true, bounds: [[3.4462, -76.5438], [3.4478, -76.5422]] as [[number, number], [number, number]] },
  { lat: 3.4542, lng: -76.5420, name: 'Parque de San Antonio', isGreen: true, bounds: [[3.4530, -76.5432], [3.4554, -76.5408]] as [[number, number], [number, number]] },
  { lat: 3.4810, lng: -76.5120, name: 'Parque de La Flora', isGreen: true, bounds: [[3.4770, -76.5150], [3.4840, -76.5080]] as [[number, number], [number, number]] },
  { lat: 3.4380, lng: -76.5230, name: 'Parque Las Banderas', isGreen: true, bounds: [[3.4365, -76.5245], [3.4395, -76.5215]] as [[number, number], [number, number]] },
  { lat: 3.4190, lng: -76.5445, name: 'Ecoparque Las Tres Cruces', isGreen: true, bounds: [[3.4150, -76.5500], [3.4250, -76.5380]] as [[number, number], [number, number]] },
  { lat: 3.4500, lng: -76.5610, name: 'Parque Ecológico Bataclán', isGreen: true, bounds: [[3.4450, -76.5650], [3.4550, -76.5550]] as [[number, number], [number, number]] },
  { lat: 3.4370, lng: -76.5390, name: 'Parque Obrero', isGreen: true, bounds: [[3.4360, -76.5400], [3.4380, -76.5380]] as [[number, number], [number, number]] },
  { lat: 3.4640, lng: -76.5290, name: 'Parque Cabal', isGreen: true, bounds: [[3.4625, -76.5305], [3.4655, -76.5275]] as [[number, number], [number, number]] },
  { lat: 3.4520, lng: -76.4900, name: 'Parque Olímpico Pasoancho', isGreen: true, bounds: [[3.4505, -76.4915], [3.4535, -76.4885]] as [[number, number], [number, number]] },
  { lat: 3.4090, lng: -76.5400, name: 'Parque Pisamos', isGreen: true, bounds: [[3.4075, -76.5415], [3.4105, -76.5385]] as [[number, number], [number, number]] },
  { lat: 3.4730, lng: -76.5350, name: 'Parque Julio Rincón', isGreen: true, bounds: [[3.4715, -76.5365], [3.4745, -76.5335]] as [[number, number], [number, number]] },
];

// Haversine mínima para fallback offline de ruteo
const _haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const _selectBestDest = (origin: [number, number]) => {
  const MIN = 0.3, MAX = 3.5;
  const candidates = CALI_PARKS
    .map(p => ({ p, d: _haversine(origin[0], origin[1], p.lat, p.lng) }))
    .filter(({ d }) => d >= MIN && d <= MAX)
    .sort((a, b) => a.d - b.d);
  return candidates.length ? candidates[0].p : CALI_PARKS[0];
};

const _calcRouteLocal = (start: [number, number], end: [number, number], destName: string) => {
  const distance = parseFloat(_haversine(start[0], start[1], end[0], end[1]).toFixed(2));
  const co2Saved = Math.round(distance * 120);
  const durations = { walk: Math.round(distance * 12), bike: Math.round(distance * 4), skates: Math.round(distance * 5), skateboard: Math.round(distance * 6), escooter: Math.round(distance * 3) };
  const greenPts = [start, end].filter(pt => CALI_PARKS.some(p => _haversine(pt[0], pt[1], p.lat, p.lng) < 0.4)).length;
  const greenCoverage = Math.round((greenPts / 2) * 100);
  return { path: [start, end], distance, durations, co2Saved, greenCoverage, averageICA: 0, healthScore: 'B' as const, destinationName: destName, trafficRisk: 'low' as const, trafficLabel: 'Sin datos de tráfico', rushHour: false };
};

// --------------------------------------------------
// Ruteo
// --------------------------------------------------
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
      console.warn('[EcoPulse] Backend offline — ruta calculada localmente (sin ICA real).');
      const dest = _selectBestDest(start);
      return Promise.resolve(_calcRouteLocal(start, end, dest.name));
    });

// --------------------------------------------------
// Chatbot (IA)
// --------------------------------------------------

/**
 * Envía la pregunta del usuario al agente de IA en FastAPI.
 * @param message - El texto de la consulta que escribió el usuario.
 * @param currentPage - La vista en la que se encuentra el usuario (ej: 'mapa', 'inicio').
 * @returns Promesa con la respuesta de la IA y sus acciones sobre la interfaz.
 */
export const askChatbot = async (
  message: string,
  currentPage: string = 'inicio'
): Promise<{ reply: string; aiActions?: UIAction[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        current_page: currentPage,
      }),
    });
    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }
    const data = await response.json();
    return {
      reply: data.reply ?? data.response ?? '',
      aiActions: data.aiActions ?? data.ai_actions ?? [],
    };
  } catch (error) {
    console.warn('[EcoPulse] Backend offline o error en IA — usando fallback local.');
    return {
      reply: '¡Pai! Se me cayó la señal con los nodos en Cali. Intenta de nuevo en un ratico.',
      aiActions: [],
    };
  }
};
