// ===================================================
// TANGARA 2026 - components/dashboard/TendenciaSemana.tsx
// Gráfica lineal SVG de la tendencia de los últimos 7 días
// con selector de métrica (ICA / PM2.5 / PM10).
// ===================================================
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { weeklyTrend } from '../../mock/airQualityData';

type Metric = 'ica' | 'pm25' | 'pm10';

const getValue = (point: { ica: number; pm25?: number; pm10?: number }, metric: Metric): number =>
  metric === 'ica' ? point.ica : metric === 'pm25' ? (point.pm25 ?? 0) : (point.pm10 ?? 0);

const TendenciaSemana = () => {
  const [selectedMetric, setSelectedMetric] = useState<Metric>('ica');
  const points = weeklyTrend.points;

  const values = points.map(p => getValue(p, selectedMetric));
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  const svgW = 400;
  const svgH = 120;
  const padX = 30;
  const padY = 15;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padY * 2;

  const toX = (i: number) => padX + (i / (points.length - 1)) * chartW;
  const toY = (v: number) => padY + chartH - ((v - minVal) / range) * chartH;

  const polyline = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPath =
    `M${toX(0)},${toY(values[0])} ` +
    values.slice(1).map((v, i) => `L${toX(i + 1)},${toY(v)}`).join(' ') +
    ` L${toX(points.length - 1)},${svgH} L${toX(0)},${svgH} Z`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Tendencia de los últimos 7 días</h3>
        <div className="flex gap-1">
          {(['ica', 'pm25', 'pm10'] as const).map(m => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedMetric === m
                  ? 'text-white shadow-sm bg-tangara'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ height: '130px' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = padY + chartH * (1 - pct / 100);
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={padX - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#9CA3AF">
                {Math.round(minVal + range * (pct / 100))}
              </text>
            </g>
          );
        })}

        {/* Área bajo la curva */}
        <path d={areaPath} fill="#0084B4" opacity="0.08" />

        {/* Línea */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#0084B4"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Puntos */}
        {points.map((p, i) => (
          <g key={p.date}>
            <circle cx={toX(i)} cy={toY(values[i])} r="4" fill="white" stroke="#0084B4" strokeWidth="2" />
            <text x={toX(i)} y={svgH} textAnchor="middle" fontSize="8" fill="#9CA3AF">
              {p.date.split(' ')[0]}
            </text>
          </g>
        ))}
      </svg>

      <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
        <TrendingUp size={11} />
        La calidad del aire ha sido estable en los últimos días.
      </p>
    </div>
  );
};

export default TendenciaSemana;
