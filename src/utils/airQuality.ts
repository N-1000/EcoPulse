// ===================================================
// ECOPULSE 2026 - utils/airQuality.ts
// Helpers de presentación para niveles de calidad del aire.
// Único lugar donde se mapea nivel -> color/etiqueta/badge.
// ===================================================
import type { AirQualityLevel, TangaraNode } from '../types';
import { getIcaLevel } from '../constants/ica';

export { ICA_LEVELS, getIcaLevel } from '../constants/ica';

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

/** Etiqueta corta legible de cada nivel. */
export const levelLabel = (level: AirQualityLevel | string): string => {
  const map: Record<string, string> = {
    'buena':                    'Buena',
    'moderada':                 'Moderada',
    'dañina-grupos-sensibles':  'D. G. Sensibles',
    'dañina':                   'Dañina',
    'muy-dañina':               'Muy Dañina',
    'peligrosa':                'Peligrosa',
  };
  return map[level] ?? level;
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
