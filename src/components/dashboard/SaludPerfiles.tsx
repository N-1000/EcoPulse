// ===================================================
// ECOPULSE 2026 - components/dashboard/SaludPerfiles.tsx
// Indice de Salud Respiratoria por grupo etario
// Recomendaciones médicas coherentes con el ICA real de Cali
// ===================================================
import { useMemo } from 'react';
import { Baby, User, UserCheck } from 'lucide-react';
import { useNodes } from '../../hooks/useNodes';
import { calculateNodeMetrics } from '../../utils/nodeMetrics';
import { getIcaLevel } from '../../utils/airQuality';
import type { AirQualityLevel } from '../../types';

interface GroupRisk {
  status: string;
  badgeBg: string;
  badgeText: string;
  rec: string;
}

interface Profile {
  id: string;
  label: string;
  range: string;
  Icon: React.ElementType;
  accent: string;
  risks: Record<AirQualityLevel, GroupRisk>;
}

const PROFILES: Profile[] = [
  {
    id: 'ninos',
    label: 'Niños',
    range: '0 – 12 años',
    Icon: Baby,
    accent: '#16A34A',
    risks: {
      'buena': {
        status: 'Sin riesgo',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        rec: 'Condiciones óptimas. Seguro para recreos escolares, clases de educación física y juegos al aire libre.',
      },
      'moderada': {
        status: 'Riesgo bajo',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        rec: 'Apto para actividades cotidianas. Niños con asma o rinitis alérgica deben tener precaución.',
      },
      'dañina-grupos-sensibles': {
        status: 'Precaución',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-800',
        rec: 'Reducir actividades físicas intensas en exteriores. Mantener a niños con asma en aulas ventiladas.',
      },
      'dañina': {
        status: 'Alto riesgo',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-800',
        rec: 'Suspender recreos y deportes al aire libre. Permanecer en interiores con ventanas cerradas.',
      },
      'muy-dañina': {
        status: 'Alerta severa',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        rec: 'No salir al exterior. Alto riesgo de crisis respiratoria infantil.',
      },
      'peligrosa': {
        status: 'Emergencia',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-900',
        rec: 'Emergencia sanitaria. Permanecer en espacios cerrados con purificación de aire.',
      },
    },
  },
  {
    id: 'adultos',
    label: 'Adultos',
    range: '13 – 64 años',
    Icon: User,
    accent: '#2563EB',
    risks: {
      'buena': {
        status: 'Sin riesgo',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        rec: 'Condiciones ideales para ciclismo, trote, entrenamientos y vida cotidiana al aire libre.',
      },
      'moderada': {
        status: 'Aceptable',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        rec: 'Calidad del aire aceptable. Personas con hipersensibilidad respiratoria moderar esfuerzo prolongado.',
      },
      'dañina-grupos-sensibles': {
        status: 'Moderado',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        rec: 'Población general puede realizar actividades normales; reducir ejercicios muy extenuantes cerca a vías.',
      },
      'dañina': {
        status: 'No saludable',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-800',
        rec: 'Evitar entrenamientos intensos al aire libre. Usar transporte protegido en corredores con tráfico.',
      },
      'muy-dañina': {
        status: 'Alto riesgo',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        rec: 'Permanecer en interiores. Usar mascarilla con filtro (N95) si es indispensable desplazarse.',
      },
      'peligrosa': {
        status: 'Emergencia',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-900',
        rec: 'Restricción total de actividades exteriores para toda la población.',
      },
    },
  },
  {
    id: 'mayores',
    label: 'Adultos Mayores',
    range: '65+ años',
    Icon: UserCheck,
    accent: '#EA580C',
    risks: {
      'buena': {
        status: 'Sin riesgo',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        rec: 'Excelente momento para caminatas recreativas en parques y actividad física suave.',
      },
      'moderada': {
        status: 'Vigilancia',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        rec: 'Seguro para caminatas habituales. Personas con antecedentes cardíacos o EPOC evitar horas de tráfico.',
      },
      'dañina-grupos-sensibles': {
        status: 'Precaución',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-800',
        rec: 'Limitar salidas al exterior a lo estrictamente necesario. Mantener medicamentos a mano.',
      },
      'dañina': {
        status: 'Alto riesgo',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-800',
        rec: 'Riesgo elevado de complicaciones cardiopulmonares. Permanecer en casa con ambiente ventilado.',
      },
      'muy-dañina': {
        status: 'Peligro severo',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        rec: 'No salir al exterior. Solicitar asistencia médica inmediata ante dificultad para respirar.',
      },
      'peligrosa': {
        status: 'Emergencia',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-900',
        rec: 'Emergencia crítica. Aislamiento preventivo en interiores con aire filtrado.',
      },
    },
  },
];

const SaludPerfiles = () => {
  const { nodes } = useNodes();
  const metrics = useMemo(() => calculateNodeMetrics(nodes), [nodes]);
  const ica = metrics.icaGeneral || 35;
  const levelInfo = getIcaLevel(ica);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
            Impacto en la Salud
          </span>
          <h3
            className="text-2xl sm:text-3xl font-black text-[#1A1A18]"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            ¿Quién puede salir hoy?
          </h3>
          <p className="text-sm text-[#6B6B67] mt-1">
            Guía médica de prevención según el aire medido en Cali en este momento:
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#DDD5C4] shadow-2xs">
          <span className="text-xs text-[#8C8C86] font-medium">Aire actual:</span>
          <span className="text-sm font-black" style={{ color: levelInfo.color }}>
            ICA {ica} · {levelInfo.label}
          </span>
        </div>
      </div>

      {/* Tiras de Perfiles */}
      <div className="space-y-3">
        {PROFILES.map(profile => {
          const currentRisk = profile.risks[levelInfo.level as AirQualityLevel] || profile.risks['buena'];
          const Icon = profile.Icon;

          return (
            <div
              key={profile.id}
              className="w-full rounded-2xl overflow-hidden bg-white border border-[#DDD5C4] shadow-2xs transition-all duration-150 hover:shadow-xs"
            >
              <div className="flex items-stretch">
                {/* Franja lateral con el color del ICA real */}
                <div
                  className="w-2 flex-shrink-0"
                  style={{ backgroundColor: levelInfo.color }}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 flex-1">
                  
                  {/* Grupo Etario */}
                  <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${profile.accent}18` }}
                    >
                      <Icon size={20} style={{ color: profile.accent }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#1A1A18]">{profile.label}</p>
                      <p className="text-[11px] text-[#6B6B67] font-medium">{profile.range}</p>
                    </div>
                  </div>

                  {/* Estado de Riesgo en este momento */}
                  <div className="flex-shrink-0 sm:w-36">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${currentRisk.badgeBg} ${currentRisk.badgeText}`}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelInfo.color }} />
                      {currentRisk.status}
                    </span>
                  </div>

                  {/* Divisor vertical */}
                  <div className="hidden sm:block w-px self-stretch bg-[#DDD5C4]/60" />

                  {/* Recomendación Médica Específica */}
                  <p className="text-xs sm:text-sm text-[#4A4A46] leading-relaxed flex-1">
                    {currentRisk.rec}
                  </p>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SaludPerfiles;
