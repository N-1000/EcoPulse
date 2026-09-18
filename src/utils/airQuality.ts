// ===================================================
// ECOPULSE 2026 - utils/airQuality.ts
// Helpers de presentación para niveles de calidad del aire.
// Único lugar donde se mapea nivel -> color/etiqueta/badge.
// ===================================================
import type { AirQualityLevel, TangaraNode } from '../types';
import { getIcaLevel } from '../constants/ica';

export { ICA_LEVELS, getIcaLevel } from '../constants/ica';

// Breakpoints EPA / Resolución 2254 (C_low, C_high, I_low, I_high) — mismos
// que backend/app/utils/ica.py. Única fórmula para derivar ICA desde PM2.5
// en el frontend, para no reinventarla cada vez que hace falta.
const PM25_BREAKPOINTS: readonly [number, number, number, number][] = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.4, 301, 500],
];

/** Deriva el ICA a partir de una concentración de PM2.5 (µg/m³), interpolación lineal EPA. */
export const icaFromPm25 = (pm25: number): number => {
  if (pm25 == null || pm25 < 0) return 0;
  for (const [cLow, cHigh, iLow, iHigh] of PM25_BREAKPOINTS) {
    if (pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return 500;
};

/** Color HEX principal de cada nivel ICA. */
export const levelColor = (level: AirQualityLevel | string): string => {
  const map: Record<string, string> = {
    'buena':                    '#16A34A',
    'moderada':                 '#CA8A04',
    'dañina-grupos-sensibles':  '#EA580C',
    'dañina':                   '#DC2626',
    'muy-dañina':               '#7C3AED',
    'peligrosa':                '#7F1D1D',
  };
  return map[level] ?? '#6B7280';
};

/** Clases Tailwind para el badge de cada nivel. */
export const badgeClass = (level: AirQualityLevel | string): string => {
  const map: Record<string, string> = {
    'buena':                    'bg-green-100 text-green-700',
    'moderada':                 'bg-yellow-100 text-yellow-700',
    'dañina-grupos-sensibles':  'bg-orange-100 text-orange-700',
    'dañina':                   'bg-red-100 text-red-700',
    'muy-dañina':               'bg-purple-100 text-purple-700',
    'peligrosa':                'bg-red-200 text-red-900',
  };
  return map[level] ?? 'bg-gray-100 text-gray-700';
};

/** Estandariza el cálculo de métricas visuales para clústeres de nodos en todos los mapas. */
export const getClusterMetrics = (cluster: { nodes: TangaraNode[] }) => {
  const isCo2Cluster = cluster.nodes.every(
    n => n.sensorType === 'co2' || (n.measurements.ica === 0 && (n.measurements.co2 ?? 0) > 0)
  );

  if (isCo2Cluster) {
    const avgCo2 = Math.round(
      cluster.nodes.reduce((sum, n) => sum + (n.measurements.co2 ?? 0), 0) / cluster.nodes.length
    );
    return {
      isCo2: true,
      displayValue: avgCo2,
      unit: 'ppm',
      level: 'buena',
      color: '#2563EB',
    };
  }

  const icaNodes = cluster.nodes.filter(n => n.measurements.ica > 0);
  const avgIca = icaNodes.length
    ? Math.round(icaNodes.reduce((sum, n) => sum + n.measurements.ica, 0) / icaNodes.length)
    : 0;

  const icaInfo = getIcaLevel(avgIca);
  return {
    isCo2: false,
    displayValue: avgIca,
    unit: 'ICA',
    level: icaInfo.level,
    color: icaInfo.color,
  };
};
