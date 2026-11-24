// ===================================================
// ECOPULSE 2026 - utils/icaForecast.ts
// Proyección de ICA basada en clima (Open-Meteo) — estimación por fórmula,
// NO es un modelo de ML en producción. Fuente única compartida entre
// PronosticoCard (proyección de ciudad) y NodeDetailPanel (proyección por
// nodo): la fórmula es la misma, solo cambia el ICA base de partida.
// ===================================================

import type { TangaraNode } from '../types';
import { getIcaLevel, icaDesdePm25 } from '../constants/ica';

export interface IcaForecastFactors {
  rainProbMax: number;
  windSpeedMax: number;
  uvIndexMax: number;
}

/**
 * Ajusta un ICA base según lluvia/viento/UV del pronóstico:
 * lluvia >50% lava partículas (-20%), viento >13 km/h dispersa (-10%),
 * calor/sequedad (UV alto + poca lluvia) las acumula (+15%). `dayOffset`
 * agrega una leve deriva de incertidumbre a más días de distancia.
 */
export const projectIca = (baseIca: number, factors: IcaForecastFactors, dayOffset: number): number => {
  let icaFactor = 1.0;
  if (factors.rainProbMax > 50) icaFactor -= 0.20;
  else if (factors.rainProbMax < 20 && factors.uvIndexMax > 8) icaFactor += 0.15;
  if (factors.windSpeedMax > 13) icaFactor -= 0.10;

  return Math.max(12, Math.round(baseIca * (icaFactor + dayOffset * 0.04)));
};

/**
 * Proyecta las mediciones de un nodo con la misma fórmula que projectIca,
 * aplicada como factor multiplicativo (ICA y PM2.5 se escalan igual, así
 * siguen siendo coherentes entre sí). No usa projectIca directamente sobre
 * el ICA del nodo porque esa función fija un mínimo de 12 pensado para los
 * días siguientes: inflaría artificialmente los nodos con aire muy limpio.
 *
 * Los nodos sin ICA (sensores CO₂) y las variables que no dependen del
 * material particulado (CO₂, temperatura, humedad) se dejan intactos.
 * El resultado queda marcado con dataSource 'forecast': es una estimación.
 */
export const projectNodeForecast = (node: TangaraNode, factors: IcaForecastFactors): TangaraNode => {
  // Se proyecta desde el último PM2.5 real, no desde el ICA: un nodo inactivo
  // llega con ica = null (sin dato), pero conserva su última lectura de PM2.5.
  // Sin PM2.5 (sensor CO₂ o nodo sin ninguna lectura) no hay nada que proyectar.
  const { pm25 } = node.measurements;
  if (pm25 == null || pm25 <= 0 || node.sensorType === 'co2') return { ...node, dataSource: 'forecast' };

  const factor = projectIca(100, factors, 0) / 100;
  const projectedPm25 = Math.round(pm25 * factor * 10) / 10;
  const projectedIca = icaDesdePm25(projectedPm25);
  return {
    ...node,
    dataSource: 'forecast',
    measurements: {
      ...node.measurements,
      ica: projectedIca,
      level: getIcaLevel(projectedIca).level,
      pm25: projectedPm25,
    },
  };
};
