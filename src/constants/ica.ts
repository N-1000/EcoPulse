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

export const getIcaLevel = (ica: number): AirQualityLevelInfo => {
  return ICA_LEVELS.find(l => ica >= l.range[0] && ica <= l.range[1]) ?? ICA_LEVELS[0];
};
