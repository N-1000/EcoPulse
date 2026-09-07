// ===================================================
// ECOPULSE 2026 - components/dashboard/PulsoNarrativo.tsx
// Narrativa editorial en vivo — texto puro sobre la página
// Sin cajas. Sin contenedores. Solo tipografía y datos.
// ===================================================
import { useMemo } from 'react';
import { useNodes } from '../../hooks/useNodes';
import { calculateNodeMetrics } from '../../utils/nodeMetrics';
import { getIcaLevel } from '../../utils/airQuality';

function getCause(ica: number, hour: number): string {
  if (hour >= 6  && hour <= 9)  return 'el pico de tráfico matutino';
  if (hour >= 17 && hour <= 20) return 'el pico vehicular de la tarde y noche (retorno laboral)';
  if (hour >= 21 || hour <= 5)  return 'la dispersión nocturna y brisa del Pacífico';
  if (ica <= 35)                 return 'los vientos de los Farallones';
  if (ica >= 80)                 return 'acumulación de partículas sin viento';
  return 'condiciones atmosféricas mixtas';
}

function getTrend(hour: number): { label: string; color: string } {
  if ((hour >= 6 && hour <= 8) || (hour >= 17 && hour <= 20))
    return { label: 'subiendo', color: '#D05A3F' };
  if ((hour >= 9 && hour <= 11) || hour >= 21)
    return { label: 'bajando',  color: '#2D6A4F' };
  return { label: 'estable', color: '#8C8C86' };
}

const PulsoNarrativo = () => {
  const { nodes, isLoading } = useNodes();
  const metrics = useMemo(() => calculateNodeMetrics(nodes), [nodes]);

  const ica   = metrics.icaGeneral;
  const pm25  = metrics.contaminants.find(c => c.id === 'pm25')?.value ?? 0;
  const temp  = metrics.contaminants.find(c => c.id === 'tmp')?.value  ?? 0;
  const hum   = metrics.contaminants.find(c => c.id === 'hum')?.value  ?? 0;
  const level = getIcaLevel(ica);
  const hour  = new Date().getHours();
  const cause = getCause(ica, hour);
  const trend = getTrend(hour);
  const count = nodes.filter(n => !n.status || n.status === 'activo').length || nodes.length;

  // Mientras carga — placeholder tipográfico, no skeleton de caja
  if (isLoading && ica === 0) {
    return (
      <div className="w-full py-2">
        <div className="h-1 w-12 bg-[#2D6A4F] mb-8 rounded-full" />
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-[#DDD5C4]/50 rounded w-full" />
          <div className="h-12 bg-[#DDD5C4]/50 rounded w-4/5" />
          <div className="h-12 bg-[#DDD5C4]/40 rounded w-3/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Línea decorativa superior — sustituye cualquier borde de caja */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-10 h-0.5 bg-[#2D6A4F]" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D6A4F] opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#2D6A4F]" />
          </span>
          <span className="text-[10px] font-black text-[#2D6A4F] uppercase tracking-[0.25em]">
            En vivo · Cali
          </span>
        </div>
      </div>

      {/* Línea 1: ICA y nivel */}
      <p
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-[#1A1A18]"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {count > 0 && (
          <span className="text-[#8C8C86] font-normal">{count} sensores. </span>
        )}
        <span>ICA </span>
        <span style={{ color: level.color }}>{ica > 0 ? ica : '—'}</span>
        <span className="text-[#8C8C86] font-normal"> — </span>
        <span style={{ color: level.color }}>{level.label}.</span>
      </p>

      {/* Línea 2: Tendencia (mismo margen izquierdo, tamaño menor) */}
      <p
        className="text-2xl sm:text-3xl md:text-4xl font-black leading-[1.1] tracking-tight mb-12"
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        <span className="text-[#8C8C86] font-normal">Tendencia </span>
        <span style={{ color: trend.color }}>{trend.label}</span>
        <span className="text-[#8C8C86] font-normal"> por {cause}.</span>
      </p>


      {/* Tres métricas — solo números y etiquetas, sin ninguna caja */}
      <div className="flex flex-wrap gap-x-12 gap-y-6">
        {[
          { label: 'PM₂.₅',      value: pm25 > 0 ? pm25 : '—', unit: 'µg/m³' },
          { label: 'Temperatura', value: temp > 0 ? temp : '—', unit: '°C'    },
          { label: 'Humedad',     value: hum  > 0 ? hum  : '—', unit: '%'     },
        ].map(m => (
          <div key={m.label} className="flex flex-col">
            <span className="text-[10px] font-black text-[#8C8C86] uppercase tracking-[0.2em] mb-1">
              {m.label}
            </span>
            <span className="text-4xl sm:text-5xl font-black text-[#1A1A18] leading-none tabular-nums">
              {m.value}
              <span className="text-base font-normal text-[#8C8C86] ml-1.5">{m.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PulsoNarrativo;


