// ===================================================
// ECOPULSE 2026 - components/map/MapLegend.tsx
// Leyenda flotante unificada de ICA + Nivel de Tráfico
// ===================================================
import { Car } from 'lucide-react';
import { ICA_LEVELS } from '../../constants/ica';
import type { RouteResult } from '../../types';

interface MapLegendProps {
  routeResult: RouteResult | null;
}

export const MapLegend = ({ routeResult }: MapLegendProps) => {
  return (
    <div className="absolute bottom-14 right-4 z-[400] bg-white/90 backdrop-blur-md border border-gray-150 rounded-2xl px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.05)] min-w-[180px]">
      {/* Sección ICA */}
      <p className="text-[10px] font-black uppercase tracking-wider mb-2.5 text-gray-400">
        Calidad del Aire · ICA
      </p>
      <div className="space-y-2">
        {ICA_LEVELS.slice(0, 5).map(lvl => (
          <div key={lvl.level} className="flex items-center gap-2.5">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: lvl.color, flexShrink: 0 }} />
            <div className="flex items-center justify-between flex-1 gap-2">
              <span className="text-[10px] font-bold text-gray-600">{lvl.label}</span>
              <span className="text-[9px] font-mono text-gray-400">({lvl.range[0]}–{lvl.range[1]})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Tráfico — solo con ruta activa */}
      {routeResult && (
        <>
          <div className="my-2.5 border-t border-gray-100" />
          <p className="text-[10px] font-black uppercase tracking-wider mb-2 text-gray-400 flex items-center gap-1.5">
            <Car size={10} /> Tráfico · Ruta
          </p>
          <div className="space-y-1.5">
            {([
              { risk: 'low',    color: '#0284C7', label: 'Fluido' },
              { risk: 'medium', color: '#D97706', label: 'Moderado' },
              { risk: 'high',   color: '#DC2626', label: 'Pesado' },
            ] as const).map(({ risk, color, label }) => (
              <div key={risk} className="flex items-center gap-2">
                <div style={{
                  width: 28, height: 5, borderRadius: 4, background: color,
                  opacity: routeResult.trafficRisk === risk ? 1 : 0.25,
                  transition: 'opacity 0.3s',
                }} />
                <span className={`text-[10px] font-bold ${routeResult.trafficRisk === risk ? 'text-gray-800' : 'text-gray-400'}`}>
                  {label}{routeResult.trafficRisk === risk && routeResult.rushHour ? ' · Pico' : ''}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MapLegend;
