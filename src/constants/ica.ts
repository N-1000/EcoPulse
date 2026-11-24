// ===================================================
// ECOPULSE 2026 - constants/ica.ts
// Constantes oficiales de niveles ICA (Colombia / EPA)
// ===================================================
import type { AirQualityLevelInfo } from '../types';

export const ICA_LEVELS: AirQualityLevelInfo[] = [
  {
    level: 'buena',
    label: 'Buena',
    color: '#16A34A',
    bgColor: '#DCFCE7',
    range: [0, 50],
    description: 'La calidad del aire es satisfactoria y no representa riesgo para la salud.',
    recommendation: 'El aire es excelente. Es completamente seguro realizar actividades y ejercicio al aire libre.',
  },
  {
    level: 'moderada',
    label: 'Moderada',
    color: '#CA8A04',
    bgColor: '#FEF9C3',
    range: [51, 100],
    description: 'Aceptable para la mayoría. Puede afectar a personas extremadamente sensibles.',
    recommendation: 'Los niños y personas con asma pueden salir pero evitando esfuerzos físicos intensos y prolongados.',
  },
  {
    level: 'dañina-grupos-sensibles',
    label: 'Dañina para grupos sensibles',
    color: '#EA580C',
    bgColor: '#FFEDD5',
    range: [101, 150],
    description: 'Niños, adultos mayores y personas con enfermedades respiratorias deben reducir actividad al aire libre.',
    recommendation: 'Los niños y adultos mayores deben evitar correr o hacer ejercicio intenso al aire libre. Se aconseja reposar.',
  },
  {
    level: 'dañina',
    label: 'Dañina',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    range: [151, 200],
    description: 'Todos pueden experimentar efectos negativos en la salud.',
    recommendation: 'Se recomienda a toda la ciudadanía limitar el esfuerzo prolongado o pesado al aire libre.',
  },
  {
    level: 'muy-dañina',
    label: 'Muy Dañina',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    range: [201, 300],
    description: 'Alerta de salud. Todos los grupos de población experimentan efectos graves.',
    recommendation: 'Reducir al mínimo las actividades al aire libre. Personas sensibles deben permanecer en interiores.',
  },
  {
    level: 'peligrosa',
    label: 'Peligrosa',
    color: '#7F1D1D',
    bgColor: '#FEE2E2',
    range: [301, 500],
    description: 'Emergencia de salud. Evitar toda actividad al aire libre.',
    recommendation: 'Permanecer en interiores con purificación de aire. Suspensión total de actividades externas.',
  },
];

// Mismos breakpoints que backend/app/utils/ica.py::PM25_BREAKPOINTS (EPA / Res. 2254).
// Se usa solo para proyectar (modo Pronóstico) desde la última lectura real de PM2.5.
const PM25_BREAKPOINTS: ReadonlyArray<[number, number, number, number]> = [
  [0.0, 12.0, 0, 50],
  [12.1, 35.4, 51, 100],
  [35.5, 55.4, 101, 150],
  [55.5, 150.4, 151, 200],
  [150.5, 250.4, 201, 300],
  [250.5, 500.4, 301, 500],
];

/** ICA desde PM2.5 con la misma interpolación que el backend (calcular_ica_pm25). */
export const icaDesdePm25 = (pm25: number): number => {
  if (pm25 < 0) return 0;
  for (const [cLow, cHigh, iLow, iHigh] of PM25_BREAKPOINTS) {
    if (pm25 <= cHigh) return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
  }
  return 500;
};

export const getIcaLevel = (ica: number): AirQualityLevelInfo => {
  return ICA_LEVELS.find(l => ica >= l.range[0] && ica <= l.range[1]) ?? ICA_LEVELS[0];
};
