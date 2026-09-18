// ===================================================
// ECOPULSE 2026 - utils/icaForecast.ts
// Proyección de ICA basada en clima (Open-Meteo) — estimación por fórmula,
// NO es un modelo de ML en producción. Fuente única compartida entre
// PronosticoCard (proyección de ciudad) y NodeDetailPanel (proyección por
// nodo): la fórmula es la misma, solo cambia el ICA base de partida.
// ===================================================

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
