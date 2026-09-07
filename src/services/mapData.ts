// ===================================================
// ECOPULSE 2026 - services/mapData.ts
// >>> FUENTE ÚNICA DE VERDAD PARA CAPAS DE MAPAS <<<
// Centraliza capas WMS (IDESC / Alcaldía de Cali),
// vientos en vivo (Open-Meteo) y proyección geográfica.
// ===================================================

export interface WMSLayerConfig {
  id: string;
  url: string;
  layers: string;
  format: string;
  transparent: boolean;
  version: string;
  opacity: number;
  attribution: string;
}

/** Capas WMS oficiales de Santiago de Cali (IDESC / DAPM / POT 2014) */
export const CALI_WMS_LAYERS: WMSLayerConfig[] = [
  {
    id: 'espacio_publico',
    url: 'https://ws-idesc.cali.gov.co/geoserver/dapm/wms',
    layers: 'dapm:epou_epu_espacio_publico_efectivo',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    opacity: 0.55,
    attribution: '&copy; <a href="https://datos.cali.gov.co">Alcaldía de Cali / DAPM</a>',
  },
  {
    id: 'recurso_hidrico',
    url: 'https://ws-idesc.cali.gov.co/geoserver/pot_2014/wms',
    layers: 'pot_2014:amb_eep_afp_recurso_hidrico',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    opacity: 0.5,
    attribution: '&copy; <a href="https://datos.cali.gov.co">Alcaldía de Cali / POT 2014</a>',
  },
  {
    id: 'rio_cauca',
    url: 'https://ws-idesc.cali.gov.co/geoserver/pot_2014/wms',
    layers: 'pot_2014:amb_eep_aeie_proteccion_ambiental_rio_cauca',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    opacity: 0.45,
    attribution: '&copy; <a href="https://datos.cali.gov.co">Alcaldía de Cali / POT 2014</a>',
  },
  {
    id: 'farallones_zona',
    url: 'https://ws-idesc.cali.gov.co/geoserver/pot_2014/wms',
    layers: 'pot_2014:amb_eep_aeie_zona_amortiguadora_pnnf',
    format: 'image/png',
    transparent: true,
    version: '1.1.0',
    opacity: 0.35,
    attribution: '&copy; <a href="https://datos.cali.gov.co">Alcaldía de Cali / POT 2014</a>',
  },
];

export interface WindData {
  speed: number;        // km/h
  direction: number;    // grados (0-360)
  streams: [number, number][][]; // polilíneas [lat, lng][]
  animationDuration: string;
}

export const CALI_CENTER: [number, number] = [3.4372, -76.5225];

/** Genera polilíneas de corrientes de viento dinámicas según dirección y velocidad */
export const generateWindStreams = (direction: number, center = CALI_CENTER): [number, number][][] => {
  const rad = (direction * Math.PI) / 180;
  const dLat = -Math.cos(rad);
  const dLng = -Math.sin(rad);
  const pLat = -dLng;
  const pLng = dLat;

  const offsets = [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06];
  return offsets.map(offsetFactor => {
    const points: [number, number][] = [];
    for (let t = -0.12; t <= 0.12; t += 0.015) {
      const wave = Math.sin(t * 160) * 0.0035;
      const lat = center[0] + (offsetFactor * pLat) + (t * dLat) + (wave * pLat);
      const lng = center[1] + (offsetFactor * pLng) + (t * dLng) + (wave * pLng);
      points.push([lat, lng]);
    }
    return points;
  });
};

/** Consulta velocidad y dirección real del viento en Cali vía Open-Meteo API */
export const fetchRealWind = async (): Promise<{ speed: number; direction: number }> => {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=3.4516&longitude=-76.5320&current=wind_speed_10m,wind_direction_10m');
    const data = await res.json();
    if (data?.current) {
      return {
        speed: data.current.wind_speed_10m ?? 10,
        direction: data.current.wind_direction_10m ?? 270,
      };
    }
  } catch (e) {
    console.warn('[EcoPulse] Error al consultar Open-Meteo viento, usando por defecto:', e);
  }
  return { speed: 10, direction: 270 };
};
