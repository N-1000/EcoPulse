// ===================================================
// TANGARA 2026 - components/dashboard/HistoricoMensual.tsx
// Gráfica de barras SVG con el histórico mensual del ICA.
// ===================================================
import { BarChart2 } from 'lucide-react';
import { historicalData } from '../../mock/airQualityData';
import { levelColor } from '../../utils/airQuality';

const HistoricoMensual = () => {
  const data = historicalData.monthlyData;
  const maxIca = Math.max(...data.map(d => d.ica));

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Histórico mensual (ICA promedio)</h3>
        <BarChart2 size={15} className="text-gray-400" />
      </div>

      <svg viewBox="0 0 220 110" className="w-full" style={{ height: '110px' }}>
        {/* Eje Y */}
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1="25" y1={100 - (v / 100) * 80} x2="210" y2={100 - (v / 100) * 80} stroke="#F3F4F6" strokeWidth="1" />
            <text x="20" y={103 - (v / 100) * 80} textAnchor="end" fontSize="8" fill="#9CA3AF">{v}</text>
          </g>
        ))}

        {/* Barras */}
        {data.map((d, i) => {
          const barH = (d.ica / maxIca) * 75;
          const x = 30 + i * 38;
          const color = levelColor(d.level);
          return (
            <g key={d.month} className="group cursor-pointer">
              <rect x={x} y={100 - barH} width="22" height={barH} rx="4" fill={color} opacity="0.85" className="transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1" />
              <text x={x + 11} y="109" textAnchor="middle" fontSize="8" fill="#6B7280" className="group-hover:font-bold transition-all">
                {d.month}
              </text>
              <text x={x + 11} y={97 - barH} textAnchor="middle" fontSize="8" fill={color} fontWeight="600">
                {d.ica}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-[10px] text-gray-400 mt-2">Promedio calculado con estaciones activas en Cali.</p>
    </div>
  );
};

export default HistoricoMensual;
