// ===================================================
// ECOPULSE 2026 - utils/nodeMetrics.ts
// Función pura central para agregar y promediar métricas
// de los nodos de la red Tangara.
// ===================================================
import type { TangaraNode, AirQualityMetrics } from '../types';
import { getIcaLevel } from './airQuality';

export const EMPTY_METRICS: AirQualityMetrics = {
  icaGeneral: 0,
  level: 'buena',
  updatedAt: new Date(),
  contaminants: [
    { id: 'pm25', name: 'PM₂.₅', fullName: 'Material Particulado 2.5µm', value: 0, unit: 'µg/m³', level: 'buena', description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' },
    { id: 'co2',  name: 'CO₂',   fullName: 'Dióxido de Carbono',          value: 0, unit: 'ppm',   level: 'buena', description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' },
    { id: 'tmp',  name: 'Temp.', fullName: 'Temperatura Ambiental',        value: 0, unit: '°C',   level: 'buena', description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' },
    { id: 'hum',  name: 'Hum.',  fullName: 'Humedad Relativa',             value: 0, unit: '%',    level: 'buena', description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' },
  ],
};

/**
 * ¿El nodo aporta mediciones para mostrar? Activo en vivo, o con una proyección
 * estimada (modo Pronóstico) cuando la red entera dejó de reportar.
 */
export const isNodeReporting = (n: TangaraNode): boolean =>
  !n.status || n.status === 'activo' || n.dataSource === 'forecast';

/** Nodo realmente inactivo: sin lectura en vivo y sin proyección mostrada. */
export const isNodeInactive = (n: TangaraNode): boolean =>
  n.status === 'inactivo' && (n.dataSource === undefined || n.dataSource === 'live');

/** Descarta los "sin dato" (null/undefined) y los valores no positivos. */
const positiveValues = (values: Array<number | null | undefined>): number[] =>
  values.filter((v): v is number => v != null && v > 0);

/** Promedio con un decimal; 0 si no hay valores (la UI lo trata como "sin datos"). */
const averageOf = (values: number[]): number =>
  values.length ? parseFloat((values.reduce((a, v) => a + v, 0) / values.length).toFixed(1)) : 0;

/**
 * Calcula las métricas agregadas globales (ICA promedio, PM2.5, CO2, Temp, Hum)
 * a partir de una lista de nodos de la red.
 */
export const calculateNodeMetrics = (nodes: TangaraNode[]): AirQualityMetrics => {
  const activeNodes = nodes.filter(isNodeReporting);
  if (activeNodes.length === 0) return { ...EMPTY_METRICS, updatedAt: new Date() };

  const icaValues = positiveValues(activeNodes.map(n => n.measurements.ica));
  const pm25Values = positiveValues(activeNodes.map(n => n.measurements.pm25));
  const co2Values  = positiveValues(activeNodes.map(n => n.measurements.co2));
  const tempValues = positiveValues(activeNodes.map(n => n.measurements.temperature));
  const humValues  = positiveValues(activeNodes.map(n => n.measurements.humidity));

  const avgICA  = icaValues.length ? Math.round(icaValues.reduce((a, v) => a + v, 0) / icaValues.length) : 0;
  const avgPM25 = averageOf(pm25Values);
  const avgCO2  = averageOf(co2Values);
  const avgTemp = averageOf(tempValues);
  const avgHum  = averageOf(humValues);

  const icaLevelInfo = getIcaLevel(avgICA);

  return {
    icaGeneral: avgICA,
    level: icaLevelInfo.level,
    updatedAt: new Date(),
    contaminants: [
      { id: 'pm25', name: 'PM₂.₅', fullName: 'Material Particulado 2.5µm', value: avgPM25, unit: 'µg/m³', level: icaLevelInfo.level, description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' as const },
      { id: 'co2',  name: 'CO₂',   fullName: 'Dióxido de Carbono',          value: avgCO2,  unit: 'ppm',   level: 'buena' as const, description: avgCO2 > 0 ? 'Promedio en tiempo real' : 'Sin sensores CO₂ activos', source: avgCO2 > 0 ? 'Sensores TTGO' : 'Sin datos', trend: 'stable' as const },
      { id: 'tmp',  name: 'Temp.', fullName: 'Temperatura Ambiental',        value: avgTemp, unit: '°C',   level: 'buena' as const, description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' as const },
      { id: 'hum',  name: 'Hum.',  fullName: 'Humedad Relativa',             value: avgHum,  unit: '%',    level: 'buena' as const, description: 'Promedio en tiempo real', source: 'Sensores activos', trend: 'stable' as const },
    ],
  };
};
