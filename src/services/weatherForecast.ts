// ===================================================
// ECOPULSE 2026 - services/weatherForecast.ts
// Pronóstico diario de Cali (Open-Meteo): lluvia, viento y UV máximos.
// Fuente compartida por NodeDetailPanel y por el modo "Pronóstico" de useNodes.
// ===================================================

const CALI_LAT = 3.4516;
const CALI_LNG = -76.5320;

export interface DailyForecast {
  time: string[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
}

export const fetchDailyForecast = (): Promise<DailyForecast | null> =>
  fetch(
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${CALI_LAT}&longitude=${CALI_LNG}` +
    '&daily=precipitation_probability_max,wind_speed_10m_max,uv_index_max' +
    '&timezone=America%2FBogota'
  )
    .then(res => (res.ok ? res.json() : null))
    .then(data => data?.daily ?? null)
    .catch(() => null);
