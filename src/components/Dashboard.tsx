// ===================================================
// TANGARA 2026 - Dashboard.tsx
// Panel central con Hero Banner, mapa, tendencias, contaminantes, pronóstico e histórico
// ===================================================

import { useState } from 'react';
import {
  MapPin, TrendingUp, TrendingDown, Minus, Wind,
  ChevronRight, Navigation, Leaf, Calendar, BarChart2,
  ExternalLink,
} from 'lucide-react';
import {
  airQualityMetrics,
  weeklyTrend,
  forecast,
  historicalData,
  news,
  getIcaLevel,
  comunasData,
  ICA_LEVELS,
} from '../mock/airQualityData';
import type { Contaminant, TrendPoint, NewsItem } from '../types';

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const TrendIcon = ({ trend }: { trend: Contaminant['trend'] }) => {
  if (trend === 'up')   return <TrendingUp  size={12} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={12} className="text-green-500" />;
  return <Minus size={12} className="text-gray-400" />;
};

const badgeClass = (level: string): string => {
  const map: Record<string, string> = {
    'buena':                    'bg-green-100 text-green-700',
    'moderada':                 'bg-yellow-100 text-yellow-700',
    'dañina-grupos-sensibles':  'bg-orange-100 text-orange-700',
    'dañina':                   'bg-red-100 text-red-700',
    'muy-dañina':               'bg-purple-100 text-purple-700',
    'peligrosa':                'bg-red-200 text-red-900',
  };
  return map[level] ?? 'bg-gray-100 text-gray-700';
};

const levelLabel = (level: string): string => {
  const map: Record<string, string> = {
    'buena':                    'Buena',
    'moderada':                 'Moderada',
    'dañina-grupos-sensibles':  'D. G. Sensibles',
    'dañina':                   'Dañina',
    'muy-dañina':               'Muy Dañina',
    'peligrosa':                'Peligrosa',
  };
  return map[level] ?? level;
};

const levelColor = (level: string): string => {
  const map: Record<string, string> = {
    'buena':                    '#16A34A',
    'moderada':                 '#CA8A04',
    'dañina-grupos-sensibles':  '#EA580C',
    'dañina':                   '#DC2626',
    'muy-dañina':               '#7C3AED',
    'peligrosa':                '#7F1D1D',
  };
  return map[level] ?? '#6B7280';
};

// --------------------------------------------------
// Hero Banner
// --------------------------------------------------
const HeroBanner = () => {
  const icaInfo = getIcaLevel(airQualityMetrics.icaGeneral);

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#FFD100', minHeight: '180px' }}
    >
      {/* Fondo decorativo — evocar murales del Túnel Mundialista */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Formas geométricas abstractas inspiradas en los murales */}
        <svg viewBox="0 0 800 200" className="absolute right-0 top-0 h-full w-3/5 opacity-30" preserveAspectRatio="xMaxYMid slice">
          {/* Rostro estilizado / silueta */}
          <ellipse cx="620" cy="80" rx="90" ry="110" fill="#1E5E4A" opacity="0.6"/>
          <ellipse cx="660" cy="60" rx="55" ry="75" fill="#0084B4" opacity="0.5"/>
          <rect x="520" y="30" width="80" height="160" rx="40" fill="#E67E00" opacity="0.4"/>
          {/* Plumas / hojas tropicales */}
          <path d="M700 0 Q760 50 750 120 Q700 80 700 0Z" fill="#1E5E4A" opacity="0.5"/>
          <path d="M750 10 Q800 70 785 150 Q740 100 750 10Z" fill="#2A7A62" opacity="0.4"/>
          <path d="M460 180 Q530 120 600 160 Q540 200 460 180Z" fill="#0084B4" opacity="0.35"/>
          {/* Círculos decorativos */}
          <circle cx="480" cy="40" r="35" fill="#E67E00" opacity="0.4"/>
          <circle cx="550" cy="170" r="25" fill="#1E5E4A" opacity="0.3"/>
          <circle cx="420" cy="100" r="15" fill="#0084B4" opacity="0.4"/>
          {/* Líneas geométricas */}
          <line x1="400" y1="0" x2="500" y2="200" stroke="#1E5E4A" strokeWidth="3" opacity="0.2"/>
          <line x1="440" y1="0" x2="540" y2="200" stroke="#0084B4" strokeWidth="2" opacity="0.15"/>
        </svg>
        {/* Gradiente suave para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFD100] via-[#FFD100]/80 to-transparent" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-6 flex flex-col justify-between h-full" style={{ minHeight: '180px' }}>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Así está el aire en Cali hoy 🌿
          </h1>
          <p className="text-sm text-gray-700 font-medium mt-0.5">
            Datos en tiempo real de nuestra ciudad
          </p>
        </div>

        {/* ICA Card flotante */}
        <div className="mt-4 inline-flex flex-col bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-white/50 max-w-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <Wind size={13} />
            Índice de Calidad del Aire (ICA)
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-5xl font-black text-gray-900">
              {airQualityMetrics.icaGeneral}
            </span>
            <div>
              <span
                className="text-base font-bold"
                style={{ color: icaInfo.color }}
              >
                {icaInfo.label}
              </span>
              <p className="text-xs text-gray-600 mt-0.5">{icaInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Botón Mapa en vivo */}
        <button
          className="mt-4 self-start flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#1E5E4A' }}
        >
          <Navigation size={14} />
          Ver mapa en vivo
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Mapa de Comunas (SVG interactivo)
// --------------------------------------------------
const MapaComunas = () => {
  const [hoveredComuna, setHoveredComuna] = useState<number | null>(null);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Calidad del aire por comunas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Promedio ICA hoy</p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E5E4A' }}
        >
          <Leaf size={12} />
          Explorar Mapa
        </button>
      </div>

      <div className="flex gap-4">
        {/* SVG del mapa */}
        <div className="relative flex-1">
          <svg viewBox="0 0 310 330" className="w-full" style={{ maxHeight: '280px' }}>
            {/* Contorno de Cali estilizado */}
            <path
              d="M80 50 Q100 30 140 35 Q180 25 220 45 Q250 55 240 90 Q260 120 245 160 Q255 200 240 240 Q230 280 200 300 Q170 320 140 310 Q100 300 80 270 Q55 240 60 200 Q45 160 60 120 Q65 85 80 50Z"
              fill="#F3F4F6"
              stroke="#D1D5DB"
              strokeWidth="2"
            />

            {/* Puntos de comunas */}
            {comunasData.map(comuna => {
              const isHovered = hoveredComuna === comuna.id;
              return (
                <g key={comuna.id}>
                  <circle
                    cx={comuna.position.x}
                    cy={comuna.position.y}
                    r={isHovered ? 10 : 7}
                    fill={comuna.color}
                    opacity={isHovered ? 1 : 0.85}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredComuna(comuna.id)}
                    onMouseLeave={() => setHoveredComuna(null)}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {isHovered && (
                    <text
                      x={comuna.position.x + 12}
                      y={comuna.position.y + 4}
                      fontSize="9"
                      fill="#1F2937"
                      fontWeight="600"
                      className="pointer-events-none"
                    >
                      {comuna.name} ({comuna.ica})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Label Comunas */}
            <text x="150" y="320" textAnchor="middle" fontSize="9" fill="#9CA3AF" fontWeight="500">
              Comunas de Cali
            </text>
          </svg>
        </div>

        {/* Leyenda */}
        <div className="flex flex-col justify-center gap-2 min-w-[130px]">
          {ICA_LEVELS.slice(0, 4).map(lvl => (
            <div key={lvl.level} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: lvl.color }}
              />
              <div className="text-[10px] text-gray-600 leading-tight">
                <span className="font-semibold block">{lvl.label}</span>
                <span className="text-gray-400">({lvl.range[0]}–{lvl.range[1]})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Tendencia de los últimos 7 días (SVG gráfica lineal)
// --------------------------------------------------
const TendenciaSemana = () => {
  const [selectedMetric, setSelectedMetric] = useState<'ica' | 'pm25' | 'pm10'>('ica');
  const points = weeklyTrend.points;

  const values = points.map(p =>
    selectedMetric === 'ica' ? p.ica : selectedMetric === 'pm25' ? (p.pm25 ?? 0) : (p.pm10 ?? 0)
  );
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

  const polyline = points
    .map((p, i) => {
      const v = selectedMetric === 'ica' ? p.ica : selectedMetric === 'pm25' ? (p.pm25 ?? 0) : (p.pm10 ?? 0);
      return `${toX(i)},${toY(v)}`;
    })
    .join(' ');

  const areaPath =
    `M${toX(0)},${toY(values[0])} ` +
    points.slice(1).map((p, i) => {
      const v = selectedMetric === 'ica' ? p.ica : selectedMetric === 'pm25' ? (p.pm25 ?? 0) : (p.pm10 ?? 0);
      return `L${toX(i + 1)},${toY(v)}`;
    }).join(' ') +
    ` L${toX(points.length - 1)},${svgH} L${toX(0)},${svgH} Z`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Tendencia de los últimos 7 días</h3>
        </div>
        <div className="flex gap-1">
          {(['ica', 'pm25', 'pm10'] as const).map(m => (
            <button
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedMetric === m
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              style={selectedMetric === m ? { backgroundColor: '#0084B4' } : {}}
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
        {points.map((p, i) => {
          const v = selectedMetric === 'ica' ? p.ica : selectedMetric === 'pm25' ? (p.pm25 ?? 0) : (p.pm10 ?? 0);
          return (
            <g key={p.date}>
              <circle cx={toX(i)} cy={toY(v)} r="4" fill="white" stroke="#0084B4" strokeWidth="2" />
              <text x={toX(i)} y={svgH} textAnchor="middle" fontSize="8" fill="#9CA3AF">
                {p.date.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
        <TrendingUp size={11} />
        La calidad del aire ha sido estable en los últimos días.
      </p>
    </div>
  );
};

// --------------------------------------------------
// Tarjeta de contaminante individual
// --------------------------------------------------
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
      <span
        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${badgeClass(c.level)}`}
      >
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

// --------------------------------------------------
// Grid de contaminantes
// --------------------------------------------------
const ContaminantesGrid = () => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-900">¿Qué contaminantes medimos?</h3>
      <button className="text-xs text-tangara font-semibold hover:underline flex items-center gap-1" style={{ color: '#0084B4' }}>
        Conoce más sobre contaminantes
        <ExternalLink size={11} />
      </button>
    </div>
    <div className="grid grid-cols-3 gap-3">
      {airQualityMetrics.contaminants.map(c => (
        <ContaminantCard key={c.id} c={c} />
      ))}
    </div>
  </div>
);

// --------------------------------------------------
// Pronóstico para mañana
// --------------------------------------------------
const PronosticoCard = () => {
  const today = forecast[0];
  const icaInfo = getIcaLevel(today.icaEstimated);
  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Pronóstico para mañana</h3>
        <Calendar size={15} className="text-gray-400" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{today.weatherIcon}</span>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{today.tempMax}°</span>
            <span className="text-sm text-gray-400">/ {today.tempMin}°</span>
          </div>
          <p className="text-xs text-gray-500">{today.date}</p>
        </div>
      </div>
      <div
        className="rounded-xl px-3 py-2 mb-3"
        style={{ backgroundColor: icaInfo.bgColor }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: icaInfo.color }}>
            ICA estimado {today.icaEstimated}
          </span>
          <span className="text-xs font-bold" style={{ color: icaInfo.color }}>
            {icaInfo.label}
          </span>
        </div>
      </div>
      {forecast.slice(1).map(day => (
        <div key={day.date} className="flex items-center justify-between py-2 border-t border-gray-50">
          <span className="text-xs text-gray-500 w-12">{day.dayName}</span>
          <span className="text-base">{day.weatherIcon}</span>
          <span className="text-xs font-semibold text-gray-700">{day.tempMax}° / {day.tempMin}°</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: getIcaLevel(day.icaEstimated).bgColor, color: getIcaLevel(day.icaEstimated).color }}
          >
            {day.icaEstimated}
          </span>
        </div>
      ))}
      <button
        className="mt-3 text-xs font-semibold self-start flex items-center gap-1 hover:underline"
        style={{ color: '#0084B4' }}
      >
        Ver análisis detallado
        <ChevronRight size={13} />
      </button>
    </div>
  );
};

// --------------------------------------------------
// Histórico mensual (gráfica de barras SVG)
// --------------------------------------------------
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
            <g key={d.month}>
              <rect
                x={x}
                y={100 - barH}
                width="22"
                height={barH}
                rx="4"
                fill={color}
                opacity="0.85"
              />
              <text x={x + 11} y="109" textAnchor="middle" fontSize="8" fill="#6B7280">
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

// --------------------------------------------------
// Noticias ambientales
// --------------------------------------------------

const categoryStyle: Record<string, string> = {
  'COMUNIDAD': 'bg-blue-100 text-blue-700',
  'PROGRESO':  'bg-green-100 text-green-700',
  'ALERTA':    'bg-red-100 text-red-700',
  'CIENCIA':   'bg-purple-100 text-purple-700',
};

const NewsCard = ({ item }: { item: NewsItem }) => (
  <div className="card card-hover p-4 cursor-pointer">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#E2E8F0' }}>
        <Leaf size={18} className="text-palma" style={{ color: '#1E5E4A' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${categoryStyle[item.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {item.category}
          </span>
          <span className="text-[10px] text-gray-400">{item.date}</span>
        </div>
        <h4 className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{item.title}</h4>
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{item.summary}</p>
      </div>
    </div>
  </div>
);

const NoticiasSection = () => (
  <div className="card p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold text-gray-900">Noticias ambientales</h3>
      <button
        className="text-xs font-semibold flex items-center gap-1 hover:underline"
        style={{ color: '#0084B4' }}
      >
        Ver todas <ChevronRight size={13} />
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {news.map(item => <NewsCard key={item.id} item={item} />)}
    </div>
  </div>
);

// --------------------------------------------------
// Barra superior del dashboard
// --------------------------------------------------
const TopBar = () => {
  const icaInfo = getIcaLevel(airQualityMetrics.icaGeneral);
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Buscador */}
      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
        <MapPin size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Busca barrios, zonas o temas ambientales…"
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          aria-label="Buscar"
        />
      </div>

      {/* Avatar + ICA general */}
      <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 leading-tight">Índice actual (Cali)</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: icaInfo.color }}
            />
            <span className="text-sm font-bold text-gray-900">{airQualityMetrics.icaGeneral}</span>
            <span className="text-xs text-gray-500">{icaInfo.label}</span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-palma to-tangara flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E5E4A, #0084B4)' }}>
          SE
        </div>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Dashboard principal
// --------------------------------------------------
const Dashboard = () => {
  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-5 space-y-4">
      <TopBar />
      <HeroBanner />

      {/* Grid 2 columnas: mapa + tendencia */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MapaComunas />
        <TendenciaSemana />
      </div>

      {/* Contaminantes full width */}
      <ContaminantesGrid />

      {/* Grid 2 columnas: pronóstico + histórico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PronosticoCard />
        <HistoricoMensual />
      </div>

      {/* Noticias */}
      <NoticiasSection />
    </main>
  );
};

export default Dashboard;
