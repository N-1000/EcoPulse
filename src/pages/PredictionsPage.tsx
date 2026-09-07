// ===================================================
// ECOPULSE 2026 - pages/PredictionsPage.tsx
// Proyección Horaria de Calidad del Aire por nodo
// Curva paramétrica calibrada con histórico ClickHouse (65.4M datos).
// Transparencia: curva estimada, no modelo ML en producción.
// ===================================================
import { useState } from 'react';
import { Sparkles, Brain, ShieldCheck, Thermometer, Droplets, Wind, Info, FlaskConical } from 'lucide-react';
import { levelColor } from '../utils/airQuality';
import { useAirQuality } from '../hooks/useAirQuality';

// Nodos reales de la red Tángara con valores calibrados con ClickHouse
const NODES_PRED = [
  {
    id: 'S.Antonio',
    name: 'San Antonio',
    area: 'Centro Histórico / Ladera Oeste',
    baseline: 5.0, // PM2.5 µg/m³ base calibrado ClickHouse 2026
    peak: 9.7,     // pico matutino real ClickHouse (8-9 AM)
    hourPeak: '8:00 AM',
    cleanTime: '4:00 AM',
    desc: 'La brisa del oeste proveniente de Pance y los Farallones amortigua la acumulación nocturna. Registra el pico más suave de la red por su posición elevada y cobertura vegetal.',
    factor: 0.88,  // relativo al promedio de ciudad (< 1 = más limpio)
  },
  {
    id: 'Versalles',
    name: 'Versalles',
    area: 'Corredor Av. Américas',
    baseline: 6.6,
    peak: 12.5,
    hourPeak: '8:30 AM',
    cleanTime: '1:00 AM',
    desc: 'Pico pronunciado en la mañana por tráfico pesado en la Av. de las Américas y buses del MÍO. La inversión térmica matutina atrapa las emisiones vehiculares.',
    factor: 1.12,
  },
  {
    id: 'Ingenio',
    name: 'El Ingenio',
    area: 'Sur / Zona Verde',
    baseline: 4.8,
    peak: 8.4,
    hourPeak: '9:00 AM',
    cleanTime: '11:00 PM',
    desc: 'Zona amortiguada por gran cobertura verde del parque Metropolitano Buitrera. Calidad excelente la mayor parte del día gracias a los espacios abiertos.',
    factor: 0.82,
  },
  {
    id: 'Pance',
    name: 'Pance',
    area: 'Corredor ambiental sur',
    baseline: 3.8,
    peak: 6.3,
    hourPeak: '10:00 AM',
    cleanTime: '2:00 AM',
    desc: 'El nodo más limpio de la red. El corredor natural del río Pance y la reserva forestal de los Farallones mantienen un PM₂.₅ excepcionalmente bajo durante casi todo el día.',
    factor: 0.65,
  },
];

// ICA a partir de PM2.5 (fórmula EPA / Resolución 2254 MinAmbiente)
function pm25ToIca(pm25: number): number {
  const bp: [number, number, number, number][] = [
    [0, 12.0, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
  ];
  for (const [cl, ch, il, ih] of bp) {
    if (pm25 <= ch) return Math.round(((ih - il) / (ch - cl)) * (pm25 - cl) + il);
  }
  return 50;
}

function getLevel(ica: number): { label: string; color: string } {
  if (ica <= 50)  return { label: 'Buena',            color: '#16A34A' };
  if (ica <= 100) return { label: 'Moderada',          color: '#CA8A04' };
  if (ica <= 150) return { label: 'D. Sensibles',      color: '#EA580C' };
  return              { label: 'Dañina',              color: '#DC2626' };
}

const PredictionsPage = () => {
  const [selectedNode, setSelectedNode] = useState(NODES_PRED[0]);
  const { metrics } = useAirQuality();

  // Curva paramétrica gaussiana calibrada con el ciclo diario real de ClickHouse
  const generateChartPoints = () => {
    const points: { hour: number; pm25: number; ica: number }[] = [];
    const base    = selectedNode.baseline;
    const peak    = selectedNode.peak;
    const rawH    = parseInt(selectedNode.hourPeak.split(':')[0]);
    const isPm    = selectedNode.hourPeak.includes('PM');
    const peakH   = isPm && rawH !== 12 ? rawH + 12 : (rawH === 12 && !isPm ? 0 : rawH);

    for (let h = 0; h <= 24; h++) {
      // Curva gaussiana sobre el histórico real de Cali (pico mañana + pico tarde pequeño)
      const morningDist  = Math.abs(h - peakH);
      const eveningDist  = Math.abs(h - 18); // pico secundario tarde (5-8 PM)
      const morningGauss = (peak - base) * Math.exp(-Math.pow(morningDist / 2.5, 2));
      const eveningGauss = (peak - base) * 0.55 * Math.exp(-Math.pow(eveningDist / 2.0, 2));
      const pm25 = Math.max(1.5, base + morningGauss + eveningGauss);
      points.push({ hour: h, pm25, ica: pm25ToIca(pm25) });
    }
    return points;
  };

  const points  = generateChartPoints();
  const maxPm25 = Math.max(...points.map(p => p.pm25), 15);
  const peakPm25 = Math.max(...points.map(p => p.pm25));
  const peakIca  = pm25ToIca(peakPm25);
  const peakLevel = getLevel(peakIca);
  const currentPm25 = metrics.contaminants.find(c => c.id === 'pm25')?.value ?? selectedNode.baseline;
  const currentIca  = pm25ToIca(currentPm25 * selectedNode.factor);
  const currentLevel = getLevel(currentIca);

  const svgW = 620;
  const svgH = 200;
  const padX = 32;
  const padY = 18;
  const chartW = svgW - padX - 12;
  const chartH = svgH - padY * 2.4;

  const toX  = (h: number)   => padX + (h / 24) * chartW;
  const toY  = (v: number)   => padY + chartH - (v / maxPm25) * chartH;

  // Path smooth
  const coords = points.map(p => ({ x: toX(p.hour), y: toY(p.pm25) }));
  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const dx = (coords[i + 1].x - coords[i].x) * 0.4;
    path += ` C ${coords[i].x + dx} ${coords[i].y}, ${coords[i + 1].x - dx} ${coords[i + 1].y}, ${coords[i + 1].x} ${coords[i + 1].y}`;
  }
  const areaPath = `${path} L ${toX(24)} ${padY + chartH} L ${toX(0)} ${padY + chartH} Z`;

  return (
    <div className="p-5 pt-4 space-y-5 max-w-7xl mx-auto bg-[#F2E8D5] min-h-screen">

      {/* ── Encabezado ── */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDD5C4] shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
                <Brain size={16} />
              </div>
              <h2 className="text-base font-extrabold text-[#1A1A18] tracking-tight">
                Proyección Horaria por Nodo
              </h2>
            </div>
            <p className="text-xs text-[#6B6B67] leading-relaxed max-w-xl">
              Curva estimada de PM₂.₅ e ICA a lo largo del día, calibrada con el ciclo diurno real de los <strong>65.4 M+</strong> registros históricos de la Red Tángara en Cali (ClickHouse).
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Badge de transparencia */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold px-3 py-1.5 rounded-full">
              <Info size={11} />
              Proyección estimada · No es un modelo ML en producción
            </div>

            {/* Selector de nodo */}
            <div className="flex items-center bg-[#F2E8D5] px-3 py-1.5 rounded-xl border border-[#DDD5C4]/80">
              <select
                value={selectedNode.id}
                onChange={e => setSelectedNode(NODES_PRED.find(n => n.id === e.target.value) || NODES_PRED[0])}
                className="text-xs font-bold text-[#1A1A18] bg-transparent border-none outline-none cursor-pointer"
              >
                {NODES_PRED.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráfico + Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Gráfico PM2.5 */}
        <div className="bg-white rounded-3xl p-6 border border-[#DDD5C4] shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#1A1A18] tracking-tight">{selectedNode.name}</h3>
              <p className="text-[11px] text-[#6B6B67]">{selectedNode.area}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Ahora (~estimado)</span>
                <span className="text-sm font-black" style={{ color: currentLevel.color }}>
                  ICA ~{currentIca} · {currentLevel.label}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Pico esperado</span>
                <span className="text-sm font-black" style={{ color: peakLevel.color }}>
                  ICA ~{peakIca} · {peakLevel.label}
                </span>
              </div>
            </div>
          </div>

          {/* SVG curva de predicción */}
          <div className="relative w-full overflow-hidden bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8] p-2">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="pred-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2D6A4F" stopOpacity="0.35" />
                  <stop offset="70%"  stopColor="#2D6A4F" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0.0" />
                </linearGradient>
                <filter id="pred-glow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2D6A4F" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Guías horizontales */}
              {[maxPm25, maxPm25 * 0.66, maxPm25 * 0.33, 0].map((v, vi) => {
                const y = toY(v);
                return (
                  <g key={vi}>
                    <line x1={padX} y1={y} x2={svgW - 10} y2={y} stroke="#EBE4D8" strokeDasharray="4 4" strokeWidth="1" />
                    <text x={padX - 6} y={y + 3.5} textAnchor="end" fontSize="9" fill="#8C8C86" fontWeight="700">
                      {v.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Línea guía OMS PM2.5 = 15 µg/m³ */}
              {maxPm25 >= 15 && (
                <>
                  <line x1={padX} y1={toY(15)} x2={svgW - 10} y2={toY(15)} stroke="#D97706" strokeDasharray="5 3" strokeWidth="1.5" opacity="0.7" />
                  <text x={svgW - 12} y={toY(15) - 4} textAnchor="end" fontSize="8.5" fill="#D97706" fontWeight="800">Guía OMS</text>
                </>
              )}

              {/* Área rellena */}
              <path d={areaPath} fill="url(#pred-area-grad)" />

              {/* Trazo principal */}
              <path d={path} fill="none" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" filter="url(#pred-glow)" />

              {/* Puntos clave */}
              {points.map((p, idx) => {
                const show = p.hour % 6 === 0 || p.pm25 === peakPm25;
                if (!show) return null;
                const x = toX(p.hour);
                const y = toY(p.pm25);
                const lv = getLevel(p.ica);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4.5" fill={lv.color} />
                    <circle cx={x} cy={y} r="2" fill="#FFFFFF" />
                    <text x={x} y={y - 9} fontSize="8" fontWeight="900" textAnchor="middle" fill={lv.color}>
                      {p.pm25.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Eje X horas */}
              {Array.from({ length: 7 }).map((_, idx) => {
                const h = idx * 4;
                const x = toX(h);
                const h12 = h === 0 || h === 24 ? 12 : h > 12 ? h - 12 : h;
                const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
                return (
                  <text key={idx} x={x} y={svgH - 3} fontSize="9" fill="#8C8C86" textAnchor="middle" fontWeight="700">
                    {`${h12} ${ampm}`}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Leyenda inferior */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2E8D5]">
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#6B6B67]">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-[#2D6A4F] rounded-full inline-block" />
                PM₂.₅ proyectado (µg/m³)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0 border-t-2 border-dashed border-[#D97706] inline-block" />
                Guía OMS (15 µg/m³)
              </span>
            </div>
            <span className="text-[10px] text-[#8C8C86]">Curva gaussiana calibrada · ClickHouse 65.4M registros</span>
          </div>
        </div>

        {/* Panel de insights */}
        <div className="bg-white rounded-3xl p-6 border border-[#DDD5C4] shadow-sm flex flex-col gap-4">
          <div>
            <h4 className="text-xs font-extrabold text-[#1A1A18] uppercase tracking-widest flex items-center gap-1.5 mb-3">
              <Sparkles size={13} className="text-[#2D6A4F]" />
              Diagnóstico del Nodo
            </h4>
            <p className="text-xs text-[#6B6B67] leading-relaxed">{selectedNode.desc}</p>
          </div>

          <div className="space-y-2 border-t border-[#F2E8D5] pt-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8C8C86]">PM₂.₅ base histórico:</span>
              <span className="font-bold text-[#1A1A18]">{selectedNode.baseline} µg/m³</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8C8C86]">Pico esperado:</span>
              <span className="font-bold" style={{ color: peakLevel.color }}>{selectedNode.peak.toFixed(1)} µg/m³ ({selectedNode.hourPeak})</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8C8C86]">Hora más limpia:</span>
              <span className="font-bold text-[#2D6A4F]">{selectedNode.cleanTime}</span>
            </div>
          </div>

          <div className="bg-[#E8F5EE] border border-[#2D6A4F]/20 rounded-2xl p-3.5 text-xs text-[#1A3A2A] space-y-1">
            <span className="font-extrabold flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#2D6A4F]" />
              Mejor ventana para actividad física
            </span>
            <p className="text-[11px] leading-relaxed text-[#2D6A4F]">
              La hora más limpia en este nodo es <strong>{selectedNode.cleanTime}</strong>. Evita la franja de las <strong>{selectedNode.hourPeak}</strong> si tienes afecciones respiratorias.
            </p>
          </div>

          {/* Badge de transparencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[10px] text-amber-800 flex items-start gap-2">
            <Info size={12} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              <strong>Proyección estimada.</strong> Esta curva es un modelo paramétrico calibrado con el histórico real de Cali — no un modelo de machine learning en producción. Los valores pueden diferir del sensor en tiempo real.
            </p>
          </div>
        </div>
      </div>

      {/* ── Hoja de Ruta del Modelo IA ── */}
      <div className="bg-white rounded-3xl p-6 border border-[#DDD5C4] shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center">
            <FlaskConical size={16} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#1A1A18] tracking-tight">Hoja de Ruta — Modelo Predictivo Real</h3>
            <p className="text-[11px] text-[#6B6B67]">Arquitectura propuesta para la siguiente fase de desarrollo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="space-y-2 p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <span className="font-bold text-[#1A1A18] flex items-center gap-1.5">
              <Wind size={13} className="text-[#2D6A4F]" />
              Entradas del Modelo (Features)
            </span>
            <p className="text-[#6B6B67] leading-relaxed">
              PM₂.₅ con lag de 1–24h por nodo, temperatura y humedad de Open-Meteo, velocidad del viento, variables de día de la semana y festivos de Colombia.
            </p>
          </div>
          <div className="space-y-2 p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <span className="font-bold text-[#1A1A18] flex items-center gap-1.5">
              <Thermometer size={13} className="text-[#2D6A4F]" />
              Arquitectura Propuesta
            </span>
            <p className="text-[#6B6B67] leading-relaxed">
              XGBoost multivariado con interpolación espacial IDW entre nodos, entrenado sobre los 65.4M+ registros de ClickHouse con validación temporal en bloque (último mes).
            </p>
          </div>
          <div className="space-y-2 p-4 bg-[#FAF7F2] rounded-2xl border border-[#EBE4D8]">
            <span className="font-bold text-[#1A1A18] flex items-center gap-1.5">
              <Droplets size={13} className="text-[#2D6A4F]" />
              Métricas Objetivo
            </span>
            <p className="text-[#6B6B67] leading-relaxed">
              MAE objetivo &lt; 2.0 µg/m³ en ventana de 6h. Evaluación contra estación IDEAM de San Antonio. El modelo paramétrico actual sirve como <em>baseline</em> de referencia.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PredictionsPage;
