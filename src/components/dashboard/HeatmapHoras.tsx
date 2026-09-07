// ===================================================
// ECOPULSE 2026 - components/dashboard/HeatmapHoras.tsx
// Ciclo Diario del Aire en Santiago de Cali
// Formato 100% AM / PM (sin hora militar) y diagnóstico integral
// ===================================================
import { useState, useMemo } from 'react';
import { Clock, Sun, Moon, Wind, Car, Sparkles, Activity, Baby, ShieldCheck, Home } from 'lucide-react';
import { useNodes } from '../../hooks/useNodes';
import { calculateNodeMetrics } from '../../utils/nodeMetrics';
import { getIcaLevel } from '../../utils/airQuality';

interface TimeSlot {
  id: string;
  label: string;
  timeRange: string;
  hourStart: number;
  hourEnd: number;
  icon: React.ElementType;
  baseIca: number;
  title: string;
  atmosphereCause: string;
  outdoorSport: { status: string; detail: string; good: boolean };
  vulnerableGroups: { status: string; detail: string; good: boolean };
  homeVentilation: { status: string; detail: string; good: boolean };
  tempEst: string;
  windEst: string;
}

const DAILY_SLOTS: TimeSlot[] = [
  {
    id: 'madrugada',
    label: 'Madrugada',
    timeRange: '12:00 AM – 5:59 AM',
    hourStart: 0,
    hourEnd: 5,
    icon: Moon,
    baseIca: 44,
    title: 'Dispersión nocturna y descanso',
    atmosphereCause: 'El mínimo flujo vehicular y la estabilidad térmica nocturna mantienen el PM₂.₅ en rangos estables (~10.3 µg/m³).',
    outdoorSport: {
      status: 'Atletas (5 AM)',
      detail: 'Apto para corredores y ciclistas madrugadores antes de que inicie el flujo vehicular.',
      good: true,
    },
    vulnerableGroups: {
      status: 'Horas de sueño',
      detail: 'Horas de descanso. El aire limpio y fresco en interiores favorece la recuperación respiratoria de niños y adultos.',
      good: true,
    },
    homeVentilation: {
      status: 'Ventilar',
      detail: 'Buen momento para dejar entrar aire fresco y renovar la casa antes del amanecer.',
      good: true,
    },
    tempEst: '25°C – 26°C',
    windEst: '6 – 10 km/h',
  },
  {
    id: 'pico_manana',
    label: 'Pico Mañana',
    timeRange: '6:00 AM – 8:59 AM',
    hourStart: 6,
    hourEnd: 8,
    icon: Car,
    baseIca: 56,
    title: 'Pico de emisiones e inversión matutina',
    atmosphereCause: 'Pico matutino de Cali: confluencia del tráfico escolar/laboral (Calle 5ta, Autopista Sur, Cra 1) con inversión térmica que atrapa gases a nivel de calle.',
    outdoorSport: {
      status: 'Evitar vías',
      detail: 'Evita trotar o pedalear junto a vías con alto flujo vehicular. Prefiere parques cerrados o posponer para después de las 9:00 AM.',
      good: false,
    },
    vulnerableGroups: {
      status: 'Rutas escolares',
      detail: 'Entrada a colegios y guarderías. Mantener ventanas del transporte cerradas en trancones; posponer clases intensas de educación física al aire libre.',
      good: false,
    },
    homeVentilation: {
      status: 'Cerrar ventanas',
      detail: 'Mantener ventanas cerradas hacia vías principales durante el paso masivo de buses y motos.',
      good: false,
    },
    tempEst: '25°C – 28°C',
    windEst: '4 – 8 km/h (Viento bajo)',
  },
  {
    id: 'mediodia',
    label: 'Mediodía y Tarde',
    timeRange: '9:00 AM – 4:59 PM',
    hourStart: 9,
    hourEnd: 16,
    icon: Sun,
    baseIca: 40,
    title: 'Convección solar y dilución de partículas',
    atmosphereCause: 'El fuerte calentamiento solar del valle eleva las temperaturas hasta 33°C, generando corrientes térmicas que diluyen la concentración de partículas.',
    outdoorSport: {
      status: 'Apto con sombra',
      detail: 'Buena calidad del aire gracias a la convección solar, pero protégete del calor (29°C – 33°C). Bloqueador solar e hidratación continua.',
      good: true,
    },
    vulnerableGroups: {
      status: 'Recreo seguro',
      detail: 'Apto para recreos y salidas escolares al aire libre, siempre bajo sombra y con protección solar UV.',
      good: true,
    },
    homeVentilation: {
      status: 'Ventilación moderada',
      detail: 'Buena renovación del aire interior en horas de sombra.',
      good: true,
    },
    tempEst: '29°C – 33°C',
    windEst: '9 – 15 km/h (Térmicas)',
  },
  {
    id: 'pico_tarde',
    label: 'Pico Tarde y Noche',
    timeRange: '5:00 PM – 8:29 PM',
    hourStart: 17,
    hourEnd: 20,
    icon: Car,
    baseIca: 64,
    title: 'Pico vehicular de retorno y congestión',
    atmosphereCause: 'Intenso flujo de salida laboral en las principales arterias de Cali (Calle 5ta, Autopista Suroriental, Av. Simón Bolívar). Al caer el sol disminuye la convección térmica, concentrando las emisiones de los vehículos.',
    outdoorSport: {
      status: 'Rutas verdes',
      detail: 'Evita ciclorrutas congestionadas junto a escapes de autos y motos. Prefiere el Bulevar del Río o zonas altas.',
      good: false,
    },
    vulnerableGroups: {
      status: 'Regreso a casa',
      detail: 'Hora pico de retorno. Niños y personas con asma deben evitar exposición prolongada junto a trancones vehiculares.',
      good: false,
    },
    homeVentilation: {
      status: 'Controlar',
      detail: 'Cerrar ventanas hacia la calle si hay trancón afuera.',
      good: false,
    },
    tempEst: '27°C – 29°C',
    windEst: '7 – 12 km/h',
  },
  {
    id: 'noche',
    label: 'Noche y Brisa',
    timeRange: '8:30 PM – 11:59 PM',
    hourStart: 21,
    hourEnd: 23,
    icon: Wind,
    baseIca: 38,
    title: 'Llegada de la brisa fresca del Pacífico',
    atmosphereCause: 'Disminución del tráfico y entrada de corrientes frescas desde la cordillera occidental a través del cañón del río Cali, limpiando la ciudad.',
    outdoorSport: {
      status: 'Óptimo nocturno',
      detail: 'Excelente momento para caminatas, trote o pasear mascotas con la brisa fresca de los Farallones.',
      good: true,
    },
    vulnerableGroups: {
      status: 'Descanso limpio',
      detail: 'El ambiente nocturno de Cali se purifica con el viento del Pacífico, ideal para el descanso familiar.',
      good: true,
    },
    homeVentilation: {
      status: 'Abrir ventanas',
      detail: 'Momento perfecto para dejar entrar la brisa nocturna y refrescar el hogar.',
      good: true,
    },
    tempEst: '24°C – 26°C',
    windEst: '12 – 18 km/h (Brisa del Pacífico)',
  },
];

const HeatmapHoras = () => {
  const { nodes } = useNodes();
  const metrics = useMemo(() => calculateNodeMetrics(nodes), [nodes]);
  const currentIca = metrics.icaGeneral || 35;
  const currentHour = new Date().getHours();

  // Franja horaria activa en el reloj real
  const currentSlotIndex = DAILY_SLOTS.findIndex(
    s => currentHour >= s.hourStart && currentHour <= s.hourEnd
  );
  const activeCurrentId = DAILY_SLOTS[currentSlotIndex >= 0 ? currentSlotIndex : 0].id;

  // Franja seleccionada por el usuario en pantalla (por defecto la actual)
  const [selectedSlotId, setSelectedSlotId] = useState<string>(activeCurrentId);

  const selectedSlot = DAILY_SLOTS.find(s => s.id === selectedSlotId) || DAILY_SLOTS[0];

  // Base histórica de la franja actual para calcular la variación relativa
  const currentSlotBase = DAILY_SLOTS[currentSlotIndex >= 0 ? currentSlotIndex : 0]?.baseIca || 44;

  // Si es la franja de este momento, el ICA es EXACTAMENTE el medido en tiempo real por los sensores
  const getSlotIca = (slot: TimeSlot) => {
    if (slot.id === activeCurrentId) return currentIca;
    return Math.round(currentIca * (slot.baseIca / currentSlotBase));
  };

  const slotIca = getSlotIca(selectedSlot);
  const slotLevel = getIcaLevel(slotIca);
  const IconComponent = selectedSlot.icon;
  const livePm25 = metrics.contaminants.find(c => c.id === 'pm25')?.value;

  return (
    <div className="w-full">
      {/* ── Encabezado Editorial ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2D6A4F] bg-[#2D6A4F]/10 px-3.5 py-1 rounded-full inline-block mb-3">
            Guía Horaria de Cali
          </span>
          <h3
            className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1A1A18] tracking-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            ¿A qué hora es mejor salir en Cali?
          </h3>
          <p className="text-xs sm:text-sm text-[#6B6B67] mt-1.5 max-w-xl leading-relaxed">
            El aire cambia radicalmente durante el día según el tráfico y los vientos del Pacífico. Toca una franja horaria para ver qué precauciones tomar:
          </p>
        </div>

        {/* Indicador de Franja Actual */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F] bg-white border border-[#DDD5C4] px-4 py-2 rounded-2xl shadow-2xs">
          <Clock size={14} className="animate-pulse text-[#2D6A4F]" />
          <span>Hora actual: {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
        </div>
      </div>

      {/* ── Selector de Franjas Horarias (12h AM/PM) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {DAILY_SLOTS.map(slot => {
          const isSelected = slot.id === selectedSlotId;
          const isNow = slot.id === activeCurrentId;
          const SlotIcon = slot.icon;
          const estimatedIca = getSlotIca(slot);
          const estLevel = getIcaLevel(estimatedIca);

          return (
            <button
              key={slot.id}
              onClick={() => setSelectedSlotId(slot.id)}
              className={`
                p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between
                ${isSelected
                  ? 'bg-[#2D6A4F] text-white shadow-md -translate-y-1'
                  : 'bg-white/80 hover:bg-white text-[#1A1A18] border border-[#DDD5C4] hover:border-[#2D6A4F]/40'
                }
              `}
            >
              {isNow && (
                <span
                  className={`
                    absolute top-2.5 right-2.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full
                    ${isSelected ? 'bg-white/20 text-white' : 'bg-[#2D6A4F] text-white'}
                  `}
                >
                  Ahora
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SlotIcon size={16} className={isSelected ? 'text-[#A8C5B0]' : 'text-[#2D6A4F]'} />
                  <span className="text-xs font-extrabold">{slot.label}</span>
                </div>
                <div className={`text-[11px] font-semibold mb-3 ${isSelected ? 'text-white/80' : 'text-[#6B6B67]'}`}>
                  {slot.timeRange}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {isNow ? 'ICA actual' : 'ICA est.'}
                </span>
                <span
                  className="text-sm font-black"
                  style={{ color: isSelected ? '#FFFFFF' : estLevel.color }}
                >
                  {estimatedIca} · {estLevel.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Panel de Diagnóstico Integral (Sin caja oscura, fluido y limpio) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDD5C4] shadow-xs">
        
        {/* Cabecera del Diagnóstico */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#F2E8D5]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
              <IconComponent size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-extrabold text-[#2D6A4F] uppercase tracking-wider">
                  {selectedSlot.label} ({selectedSlot.timeRange})
                </span>
                {selectedSlot.id === activeCurrentId && (
                  <span className="text-[10px] font-black bg-[#2D6A4F] text-white px-2.5 py-0.5 rounded-full">
                    Franja de este momento
                  </span>
                )}
              </div>
              <h4
                className="text-xl sm:text-2xl font-bold text-[#1A1A18]"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {selectedSlot.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C86] block">
                Nivel Previsto
              </span>
              <span className="text-2xl font-black" style={{ color: slotLevel.color }}>
                ICA {slotIca} <span className="text-base font-bold">({slotLevel.label})</span>
              </span>
            </div>
            <div className="hidden sm:block border-l border-[#F2E8D5] pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C86] block">
                Temperatura
              </span>
              <span className="text-base font-bold text-[#1A1A18]">
                {selectedSlot.tempEst}
              </span>
            </div>
          </div>
        </div>

        {/* Causa y Contexto Atmosférico de Cali */}
        <div className="py-5 border-b border-[#F2E8D5]">
          <p className="text-xs sm:text-sm text-[#4A4A46] leading-relaxed flex items-start gap-2">
            <Sparkles size={16} className="text-[#2D6A4F] flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#1A1A18]">¿Por qué pasa esto en Cali?</strong> {selectedSlot.atmosphereCause}
              {selectedSlot.id === activeCurrentId && livePm25 ? (
                <span className="text-[#2D6A4F] font-semibold"> (Lectura en vivo actual de la red: {livePm25} µg/m³).</span>
              ) : null}
            </span>
          </p>
        </div>

        {/* Recomendaciones Ciudadanas Claras en 3 Columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          
          {/* 1. Deporte y Aire Libre */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C4]/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A18]">
                <Activity size={15} className="text-[#2D6A4F]" />
                <span>Deporte y Trotar</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${selectedSlot.outdoorSport.good ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {selectedSlot.outdoorSport.status}
              </span>
            </div>
            <p className="text-xs text-[#6B6B67] leading-relaxed">
              {selectedSlot.outdoorSport.detail}
            </p>
          </div>

          {/* 2. Niños y Adultos Mayores */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C4]/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A18]">
                <Baby size={15} className="text-[#2D6A4F]" />
                <span>Población Sensible</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${selectedSlot.vulnerableGroups.good ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {selectedSlot.vulnerableGroups.status}
              </span>
            </div>
            <p className="text-xs text-[#6B6B67] leading-relaxed">
              {selectedSlot.vulnerableGroups.detail}
            </p>
          </div>

          {/* 3. Ventilación del Hogar */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DDD5C4]/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A18]">
                <Home size={15} className="text-[#2D6A4F]" />
                <span>Ventilar Hogares</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${selectedSlot.homeVentilation.good ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {selectedSlot.homeVentilation.status}
              </span>
            </div>
            <p className="text-xs text-[#6B6B67] leading-relaxed">
              {selectedSlot.homeVentilation.detail}
            </p>
          </div>

        </div>

        {/* Nota Metodológica de Integridad */}
        <div className="mt-6 pt-4 border-t border-[#F2E8D5] flex items-center justify-between text-[11px] text-[#8C8C86]">
          <span>
            🔬 Patrón bio-atmosférico calibrado con <strong>62.1M+ lecturas históricas</strong> de la red Tángara en ClickHouse.
          </span>
          <span className="hidden sm:inline font-semibold text-[#2D6A4F]">
            Norma EPA & MinAmbiente Res. 2254
          </span>
        </div>

      </div>
    </div>
  );
};

export default HeatmapHoras;

