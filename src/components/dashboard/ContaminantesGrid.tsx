// ===================================================
// TANGARA 2026 - components/dashboard/ContaminantesGrid.tsx
// Grid de tarjetas de contaminantes (PM2.5, PM10, O3, NO2, CO, SO2).
// ===================================================
import { ExternalLink, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { airQualityMetrics } from '../../mock/airQualityData';
import { badgeClass, levelColor, levelLabel } from '../../utils/airQuality';
import type { Contaminant } from '../../types';

const TrendIcon = ({ trend }: { trend: Contaminant['trend'] }) => {
  if (trend === 'up')   return <TrendingUp  size={12} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={12} className="text-green-500" />;
  return <Minus size={12} className="text-gray-400" />;
};

const ContaminantCard = ({ c }: { c: Contaminant }) => (
  <div className="card card-hover p-4 cursor-default group">
    <div className="flex items-start justify-between mb-3">
      <div>
        <span className="text-lg font-black text-gray-900">{c.name}</span>
        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{c.fullName}</p>
      </div>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${levelColor(c.level)}18` }}
      >
        <TrendIcon trend={c.trend} />
      </div>
    </div>
    <div className="flex items-end justify-between">
      <div>
        <span className="text-2xl font-bold text-gray-800">{c.value}</span>
        <span className="text-xs text-gray-400 ml-1">{c.unit}</span>
      </div>
      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${badgeClass(c.level)}`}>
        {levelLabel(c.level)}
      </span>
    </div>
    <div className="mt-2 h-1 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min((c.value / 150) * 100, 100)}%`,
          backgroundColor: levelColor(c.level),
        }}
      />
    </div>
    <p className="text-[10px] text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {c.source}
    </p>
  </div>
);

const ContaminantesGrid = () => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-900">¿Qué contaminantes medimos?</h3>
      <button className="text-xs font-semibold hover:underline flex items-center gap-1 text-tangara">
        Conoce más sobre contaminantes
        <ExternalLink size={11} />
      </button>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {airQualityMetrics.contaminants.map(c => (
        <ContaminantCard key={c.id} c={c} />
      ))}
    </div>
  </div>
);

export default ContaminantesGrid;
