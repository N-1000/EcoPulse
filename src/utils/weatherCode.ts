// ===================================================
// ECOPULSE 2026 - utils/weatherCode.ts
// Mapeo de códigos WMO (Open-Meteo) a tipo/condición legible.
// Única fuente compartida entre PronosticoCard (pronóstico por día) y
// MapPage (clima actual en la tarjeta del mapa) — antes cada uno tenía
// su propia copia, o en el caso del mapa, un valor hardcodeado.
// ===================================================

export type WeatherType = 'sun' | 'rain' | 'drizzle' | 'cloud-sun' | 'cloud' | 'storm';

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** Convierte grados (0-360) a punto cardinal de 8 direcciones. */
export const degreesToCompass = (deg: number): string => {
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return COMPASS_POINTS[idx];
};

export const mapWmoToWeather = (code: number): { weather: WeatherType; condition: string } => {
  if (code === 0)                        return { weather: 'sun',       condition: 'Despejado y soleado' };
  if (code <= 2)                         return { weather: 'cloud-sun', condition: 'Parcialmente nublado' };
  if (code === 3)                        return { weather: 'cloud',     condition: 'Mayormente nublado' };
  if (code >= 45 && code <= 48)          return { weather: 'cloud',     condition: 'Niebla en Farallones' };
  if (code >= 51 && code <= 55)          return { weather: 'drizzle',   condition: 'Llovizna dispersa' };
  if (code >= 56 && code <= 57)          return { weather: 'drizzle',   condition: 'Llovizna fría' };
  if (code >= 61 && code <= 63)          return { weather: 'rain',      condition: 'Lluvia moderada' };
  if (code === 65)                       return { weather: 'rain',      condition: 'Lluvia fuerte' };
  if (code >= 80 && code <= 82)          return { weather: 'drizzle',   condition: 'Chubascos intermitentes' };
  if (code >= 95 && code <= 99)          return { weather: 'storm',     condition: 'Tormenta eléctrica' };
  return { weather: 'cloud-sun', condition: 'Parcialmente nublado' };
};
