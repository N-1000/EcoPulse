import { useAirQuality } from '../../hooks/useAirQuality';
import { ScrollReveal } from '../common/ScrollReveal';

const WavyTrend = ({ trend, color }: { trend: 'up' | 'down' | 'stable'; color: string }) => {
  const paths: Record<string, { wave: string; arrow: string }> = {
    up:     { wave: "M2 11 Q10 13 18 7 T30 4", arrow: "M25 3 L31 4 L29 9" },
    down:   { wave: "M2 3 Q10 1 18 7 T30 10", arrow: "M25 11 L31 10 L29 5" },
    stable: { wave: "M2 7 Q10 6 18 7 T30 7",  arrow: "M27 4 L33 7 L27 10" },
  };
  const { wave, arrow } = paths[trend] ?? paths.stable;
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" fill="none">
      <path d={wave} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d={arrow} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const RingGauge = ({ value, max = 100, color }: { value: number; max?: number; color: string }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value, 0) / max, 1);
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="52" height="52" viewBox="0 0 46 46">
        {/* Pista de fondo */}
        <circle cx="23" cy="23" r={r} fill="none" stroke="#DDD5C4" strokeWidth="3.5" opacity="0.6" />
        {/* Arco de progreso */}
        <circle
          cx="23" cy="23" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Indicador de centro de pulso sutil */}
      <div 
        className="absolute w-2 h-2 rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};


const ContaminantesGrid = () => {
  const { metrics } = useAirQuality();

  const getMetricVal = (id: string) => {
    const found = metrics.contaminants?.find(c => c.id === id);
    return found ? found.value : 0;
  };

  const formattedUpdate = metrics.updatedAt
    ? new Date(metrics.updatedAt).toLocaleString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const getStatus = (id: string, val: number) => {
    switch (id) {
      case 'pm25':
        if (val <= 12) return { text: 'Nivel Óptimo', desc: 'Material particulado fino que penetra en los pulmones.', tip: 'Excelente para actividades al aire libre.', badgeColor: 'bg-emerald-100 text-emerald-800' };
        if (val <= 37) return { text: 'Aceptable', desc: 'Material particulado fino respirable.', tip: 'Calidad moderada, apto para la mayoría.', badgeColor: 'bg-yellow-100 text-yellow-800' };
        if (val <= 55) return { text: 'Dañino p/ Sensibles', desc: 'Concentración elevada de partículas finas.', tip: 'Personas con asma deben reducir esfuerzo.', badgeColor: 'bg-orange-100 text-orange-800' };
        return { text: 'Alto / Alerta', desc: 'Alto contenido de micropartículas tóxicas.', tip: 'Evitar ejercicio intenso al aire libre.', badgeColor: 'bg-red-100 text-red-800' };

      case 'co2':
        if (val <= 450) return { text: 'Aire Fresco Exterior', desc: 'Dióxido de carbono en niveles naturales del ambiente.', tip: 'Ventilación y pureza ideales.', badgeColor: 'bg-emerald-100 text-emerald-800' };
        if (val <= 800) return { text: 'Aceptable', desc: 'Niveles típicos de zonas urbanas o interiores.', tip: 'Buen nivel de oxígeno.', badgeColor: 'bg-emerald-100 text-emerald-800' };
        if (val <= 1200) return { text: 'Moderado', desc: 'Concentración de CO2 ligeramente alta.', tip: 'Posible sensación de pesadez.', badgeColor: 'bg-yellow-100 text-yellow-800' };
        return { text: 'Elevado', desc: 'Nivel alto de CO2 acumulado.', tip: 'Requiere ventilación y flujo de aire.', badgeColor: 'bg-orange-100 text-orange-800' };

      case 'tmp':
        if (val < 18) return { text: 'Fresco / Frío', desc: 'Temperatura ambiental baja.', tip: 'Sensación fresca típica de noche/madrugada.', badgeColor: 'bg-blue-100 text-blue-800' };
        if (val <= 27) return { text: 'Confort Térmico', desc: 'Temperatura agradable y templada.', tip: 'Clima ideal para la ciudad.', badgeColor: 'bg-emerald-100 text-emerald-800' };
        if (val <= 32) return { text: 'Cálido', desc: 'Temperatura alta característica de Cali.', tip: 'Mantente hidratado.', badgeColor: 'bg-orange-100 text-orange-800' };
        return { text: 'Calor Extremo', desc: 'Temperatura muy elevada.', tip: 'Busca sombra e hidratación constante.', badgeColor: 'bg-red-100 text-red-800' };

      case 'hum':
        if (val < 40) return { text: 'Aire Seco', desc: 'Baja humedad relativa en el ambiente.', tip: 'Puede resecar vías respiratorias.', badgeColor: 'bg-yellow-100 text-yellow-800' };
        if (val <= 70) return { text: 'Humedad Ideal', desc: 'Rango óptimo para el bienestar humano.', tip: 'Humedad equilibrada y confortable.', badgeColor: 'bg-emerald-100 text-emerald-800' };
        return { text: 'Humedad Alta', desc: 'Vapor de agua elevado en la atmósfera.', tip: 'Sensación de bochorno o probabilidad de lluvia.', badgeColor: 'bg-blue-100 text-blue-800' };

      default:
        return { text: 'Normal', desc: 'Medición ambiental.', tip: 'En rangos esperados.', badgeColor: 'bg-stone-100 text-stone-800' };
    }
  };

  const items = [
    // Arriba Izquierda: entra desde la izquierda
    { id: 'pm25', name: 'PM2.5 (Partículas)', value: getMetricVal('pm25'), max: 50, unit: 'µg/m³', color: '#4A8C6F', trend: 'down' as const, direction: 'right' as const, delay: 0 },
    // Arriba Derecha: entra desde arriba
    { id: 'co2',  name: 'CO₂ (Dióxido)',   value: getMetricVal('co2'),  max: 1000, unit: 'ppm',   color: '#537A8C', trend: 'stable' as const, direction: 'down' as const, delay: 100 },
    // Abajo Izquierda: entra desde abajo
    { id: 'tmp',  name: 'Temperatura',      value: getMetricVal('tmp'),  max: 45, unit: '°C',    color: '#D07C60', trend: 'up' as const, direction: 'up' as const, delay: 150 },
    // Abajo Derecha: entra desde la derecha
    { id: 'hum',  name: 'Humedad',          value: getMetricVal('hum'),  max: 100, unit: '%',     color: '#4B6B7C', trend: 'stable' as const, direction: 'left' as const, delay: 200 },
  ];


  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-extrabold text-[#1A1A18] uppercase tracking-wider">
          Indicadores clave
        </h3>
        {formattedUpdate && (
          <span className="flex items-center gap-1 text-[10px] text-[#8C8C86] font-semibold">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Actualizado {formattedUpdate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 w-full">
        {items.map((item) => {
          const status = getStatus(item.id, item.value);

          return (
            <ScrollReveal
              key={item.id}
              direction={item.direction}
              delay={item.delay}
              className="w-full h-full"
            >
              <div className="group relative flex flex-col items-center justify-between p-6 h-full text-center bg-[#E5DBC6]/50 rounded-2xl border border-[#DDD5C4] hover:bg-[#EDE3CE] hover:border-[#C4B9A3] hover:shadow-lg transition-all duration-300 cursor-help">
                
                {/* ── TOOLTIP FLOTANTE EN HOVER ── */}
                <div className="opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 transform group-hover:-translate-y-1 absolute bottom-[calc(100%+10px)] inset-x-2 z-30 p-3.5 bg-[#1F2923] text-white rounded-xl shadow-2xl border border-[#2D6A4F]/40 text-left">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-bold text-xs text-white">{item.name}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${status.badgeColor}`}>
                      {status.text}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#D8E2DC] leading-relaxed mb-1.5">
                    {status.desc}
                  </p>
                  <div className="pt-1.5 border-t border-white/10 flex items-center gap-1 text-[10px] text-[#A8C5B0]">
                    <span className="font-semibold">💡 Impacto:</span> {status.tip}
                  </div>

                  {/* Flecha inferior del tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-[#1F2923]" />
                </div>

                {/* ── CONTENIDO DE LA TARJETA ── */}
                <span className="text-sm font-bold text-[#1A1A18] mb-1">
                  {item.name}
                </span>

                <div className="my-3 scale-110">
                  <RingGauge value={item.value} max={item.max} color={item.color} />
                </div>


                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-[#1A1A18]">{item.value}</span>
                  <span className="text-xs font-semibold text-[#6B6B67]">{item.unit}</span>
                </div>

                <div className="mt-2">
                  <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${status.badgeColor}`}>
                    {status.text}
                  </span>
                </div>

                <div className="mt-2.5">
                  <WavyTrend trend={item.trend} color={item.color} />
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
};

export default ContaminantesGrid;
