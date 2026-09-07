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
 * Calcula las métricas agregadas globales (ICA promedio, PM2.5, CO2, Temp, Hum)
 * a partir de una lista de nodos de la red.
 */
export const calculateNodeMetrics = (nodes: TangaraNode[]): AirQualityMetrics => {
  const activeNodes = nodes.filter(n => !n.status || n.status === 'activo');
  if (activeNodes.length === 0) return { ...EMPTY_METRICS, updatedAt: new Date() };

  const icaNodes  = activeNodes.filter(n => n.measurements.ica > 0);
  const pm25Nodes = activeNodes.filter(n => n.measurements.pm25 > 0);
  const co2Nodes  = activeNodes.filter(n => (n.measurements.co2 ?? 0) > 0);
  const tempNodes = activeNodes.filter(n => n.measurements.temperature > 0);
  const humNodes  = activeNodes.filter(n => n.measurements.humidity > 0);

  const avgICA  = icaNodes.length  ? Math.round(icaNodes.reduce((a, n) => a + n.measurements.ica, 0) / icaNodes.length) : 0;
  const avgPM25 = pm25Nodes.length ? parseFloat((pm25Nodes.reduce((a, n) => a + n.measurements.pm25, 0) / pm25Nodes.length).toFixed(1)) : 0;
  const avgCO2  = co2Nodes.length  ? parseFloat((co2Nodes.reduce((a, n) => a + (n.measurements.co2 ?? 0), 0) / co2Nodes.length).toFixed(1)) : 0;
  const avgTemp = tempNodes.length ? parseFloat((tempNodes.reduce((a, n) => a + n.measurements.temperature, 0) / tempNodes.length).toFixed(1)) : 0;
  const avgHum  = humNodes.length  ? parseFloat((humNodes.reduce((a, n) => a + n.measurements.humidity, 0) / humNodes.length).toFixed(1)) : 0;

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
