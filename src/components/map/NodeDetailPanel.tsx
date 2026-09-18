// ===================================================
// ECOPULSE 2026 - components/map/NodeDetailPanel.tsx
// Panel flotante de detalle del nodo seleccionado en el mapa
// ===================================================
import { useEffect, useState } from 'react';
import {
  Activity, Droplets, Footprints, History, LineChart, MapPin, Thermometer, Wind, X
} from 'lucide-react';
import { levelColor, getIcaLevel } from '../../utils/airQuality';
import { projectIca } from '../../utils/icaForecast';
import { fetchSeriePorSensor, type SeriePorSensorData, type SensorSerie } from '../../services/api';
import type { NodeCluster, TangaraNode } from '../../types';

const CALI_LAT = 3.4516;
const CALI_LNG = -76.5320;
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface DailyForecast {
  time: string[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  uv_index_max: number[];
}

const fetchDailyForecast = (): Promise<DailyForecast | null> =>
  fetch(
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${CALI_LAT}&longitude=${CALI_LNG}` +
    '&daily=precipitation_probability_max,wind_speed_10m_max,uv_index_max' +
    '&timezone=America%2FBogota'
  )
    .then(res => (res.ok ? res.json() : null))
    .then(data => data?.daily ?? null)
    .catch(() => null);

const NodeForecastRows = ({ node }: { node: TangaraNode }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [daily, setDaily] = useState<DailyForecast | null>(null);

  useEffect(() => {
    let active = true;
    fetchDailyForecast().then(res => {
      if (!active) return;
      if (res) { setDaily(res); setStatus('loaded'); } else { setStatus('error'); }
    });
    return () => { active = false; };
  }, []);

  if (status === 'loading') return <div className="text-[10px] text-gray-400 text-center py-3 animate-pulse">Cargando proyección…</div>;
  if (status === 'error' || !daily) return <div className="text-[10px] text-gray-400 text-center py-3">No se pudo cargar la proyección. Intentá de nuevo más tarde.</div>;

  const baseIca = node.measurements.ica > 0 ? node.measurements.ica : 22;

  return (
    <div>
      <div className="space-y-1.5">
        {[1, 2, 3].map(offset => {
          const dateStr = daily.time[offset];
          const d = dateStr ? new Date(dateStr) : null;
          const dayLabel = offset === 1 ? 'Mañana' : d ? DAYS_OF_WEEK[d.getDay()] : `+${offset}d`;
          const factors = {
            rainProbMax: daily.precipitation_probability_max[offset] ?? 45,
            windSpeedMax: daily.wind_speed_10m_max[offset] ?? 11,
            uvIndexMax: daily.uv_index_max[offset] ?? 7.5,
          };
          const projected = projectIca(baseIca, factors, offset);
          const level = getIcaLevel(projected);
          return (
            <div key={offset} className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-gray-500 w-16">{dayLabel}</span>
              <span className="font-black text-[13px]" style={{ color: level.color }}>{projected}</span>
              <span className="font-semibold" style={{ color: level.color }}>{level.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[8px] text-gray-400 mt-2 leading-tight">
        Estimación por fórmula a partir del clima (Open-Meteo), no un modelo de IA.
      </p>
    </div>
  );
};

const HistorySparkline = ({ serie, refValue, refLabel, unit }: {
  serie: SensorSerie; refValue: number; refLabel: string; unit: string;
}) => {
  const values = serie.points.map(p => p.v);
  const w = 249, h = 60, pad = 4;
  const maxVal = Math.max(...values, refValue * 1.15, 1);
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const toY = (v: number) => h - pad - (Math.max(v, 0) / maxVal) * (h - pad * 2);
  const pathD = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(pad + i * stepX).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  const refY = toY(refValue);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <line x1={pad} y1={refY} x2={w - pad} y2={refY} stroke="#CBD5C4" strokeWidth="1" strokeDasharray="3 3" />
        <path d={pathD} fill="none" stroke="#4A8C6F" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="flex items-center justify-between mt-1 text-[9px] text-gray-400">
        <span>Prom. 24h: <b className="text-gray-600">{serie.avg24h} {unit}</b></span>
        <span className="truncate ml-2">{refLabel}</span>
      </div>
    </div>
  );
};

interface NodeDetailPanelProps {
  cluster: NodeCluster;
  onClose: () => void;
  onStartHealthyRoute: (coords: [number, number]) => void;
}

export const NodeDetailPanel = ({ cluster, onClose, onStartHealthyRoute }: NodeDetailPanelProps) => {
  const [activeNodeId, setActiveNodeId] = useState(cluster.nodes[0].id);
  const node: TangaraNode = cluster.nodes.find(n => n.id === activeNodeId) ?? cluster.nodes[0];
  const color = levelColor(node.measurements.level);
  const isMulti = cluster.nodes.length > 1;

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<SeriePorSensorData | null>(null);
  const [historyStatus, setHistoryStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [showForecast, setShowForecast] = useState(false);

  const toggleHistory = () => {
    setShowForecast(false);
    if (showHistory) { setShowHistory(false); return; }
    setShowHistory(true);
    if (historyStatus === 'idle') {
      setHistoryStatus('loading');
      fetchSeriePorSensor()
        .then(res => {
          if (!res) { setHistoryStatus('error'); return; }
          setHistoryData(res);
          setHistoryStatus('loaded');
        })
        .catch(() => setHistoryStatus('error'));
    }
  };

  const toggleForecast = () => {
    setShowHistory(false);
    setShowForecast(prev => !prev);
  };

  const nodeSerie = historyData?.sensors.find(s => s.id === node.id) ?? null;

  const statusInfo: Record<TangaraNode['status'], { label: string; dot: string }> = {
    activo:      { label: 'Activo',         dot: '#22C55E' },
    inactivo:    { label: 'Inactivo',       dot: '#9CA3AF' },
    calibracion: { label: 'En calibración', dot: '#3B82F6' },
  };
  const status = statusInfo[node.status];

  const levelLabels: Record<string, string> = {
    'buena': 'Buena',
    'moderada': 'Moderada',
    'dañina-grupos-sensibles': 'Grupos Sensibles',
    'dañina': 'Dañina',
    'muy-dañina': 'Muy Dañina',
    'peligrosa': 'Peligrosa',
  };
  const levelLabel = levelLabels[node.measurements.level] ?? node.measurements.level;

  const lastUpdate = (() => {
    try {
      const d = new Date(node.lastUpdate);
      if (isNaN(d.getTime())) return 'Sin datos';
      return d.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Sin datos'; }
  })();

  const isCo2Node = node.sensorType === 'co2' || (node.measurements.ica === 0 && (node.measurements.co2 ?? 0) > 0);
  const CO2_BLUE = '#2563EB';
  const headerColor = isCo2Node ? CO2_BLUE : color;

  return (
    <div className="absolute top-4 left-4 z-[400] w-[285px] animate-slide-up bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-150 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${headerColor}15, ${headerColor}04)`, padding: '16px 18px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, boxShadow: `0 0 4px ${status.dot}` }} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{status.label}</span>
              {isCo2Node && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: CO2_BLUE, background: `${CO2_BLUE}15`, padding: '1px 6px', borderRadius: '6px', border: `1px solid ${CO2_BLUE}30` }}>
                  Sensor CO₂
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-gray-900 truncate leading-snug">{node.name}</h3>
            <p className="text-[11px] mt-0.5 flex items-center gap-1 text-gray-500">
              <MapPin size={10} className="text-gray-400" />
              {node.barrio} · {node.comuna}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200">
              <X size={13} className="text-gray-500" />
            </button>
            {/* Badge principal: CO2 ppm o ICA */}
            <div className="flex flex-col items-center" style={{
              background: `${headerColor}10`,
              border: `1.5px solid ${headerColor}35`,
              borderRadius: '10px',
              padding: '4px 10px',
            }}>
              {isCo2Node ? (
                <>
                  <span className="font-black text-xl leading-none" style={{ color: CO2_BLUE }}>{node.measurements.co2 ?? 0}</span>
                  <span className="text-[8px] font-bold tracking-wider mt-0.5" style={{ color: `${CO2_BLUE}bb` }}>ppm CO₂</span>
                </>
              ) : (
                <>
                  <span className="font-black text-xl leading-none" style={{ color }}>{node.measurements.ica}</span>
                  <span className="text-[8px] font-bold tracking-wider mt-0.5" style={{ color: `${color}bb` }}>ICA</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isMulti && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {cluster.nodes.map(n => (
              <button
                key={n.id}
                onClick={() => setActiveNodeId(n.id)}
                style={{
                  fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px',
                  background: n.id === node.id ? headerColor : 'rgba(0,0,0,0.05)',
                  color: n.id === node.id ? 'white' : '#4B5563',
                  transition: 'all 0.15s',
                }}
              >
                {n.id.replace('TANGARA_', 'T-')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Métricas */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="grid grid-cols-2 gap-2">
          {(isCo2Node ? [
            { icon: Thermometer, label: 'Temperatura', value: `${Number(node.measurements.temperature).toFixed(1)}°C`, c: '#F97316' },
            { icon: Droplets,    label: 'Humedad',     value: `${Math.round(Number(node.measurements.humidity))}%`,   c: '#0284C7' },
            { icon: Wind,        label: 'CO₂',         value: `${node.measurements.co2 ?? 0} ppm`,                   c: CO2_BLUE  },
            { icon: Activity,    label: 'Sensor',      value: 'TTGO CO₂',                                             c: CO2_BLUE  },
          ] : [
            { icon: Thermometer, label: 'Temperatura', value: `${Number(node.measurements.temperature).toFixed(1)}°C`, c: '#F97316' },
            { icon: Droplets,    label: 'Humedad',     value: `${Math.round(Number(node.measurements.humidity))}%`,    c: '#0284C7' },
            { icon: Wind,        label: 'PM2.5',       value: `${Number(node.measurements.pm25).toFixed(1)} µg/m³`,   c: '#8B5CF6' },
            { icon: Activity,    label: 'Nivel',       value: levelLabel,                                              c: color     },
          ]).map(row => (
            <div key={row.label} style={{
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '10px',
              padding: '8px 10px',
              border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <div className="flex items-center gap-1.5 mb-1">
                <row.icon size={11} style={{ color: row.c }} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{row.label}</span>
              </div>
              <span className="text-[12px] font-black text-gray-800 leading-none">{row.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2.5 px-1">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <History size={11} />
            Última actualización
          </span>
          <span className="text-[10px] text-gray-500">{lastUpdate}</span>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding: '12px 18px' }} className="grid grid-cols-3 gap-2">
        {[
          { icon: History,    label: 'Histórico' },
          { icon: LineChart,  label: 'Predicción' },
          { icon: Footprints, label: 'Ruta sana' },
        ].map(action => {
          const isActive = (action.label === 'Histórico' && showHistory) || (action.label === 'Predicción' && showForecast);
          return (
            <button
              key={action.label}
              onClick={() => {
                if (action.label === 'Ruta sana') {
                  if (node.coordinates) {
                    onStartHealthyRoute([node.coordinates.lat, node.coordinates.lng]);
                  }
                } else if (action.label === 'Histórico') {
                  toggleHistory();
                } else if (action.label === 'Predicción') {
                  toggleForecast();
                }
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                padding: '8px 4px', borderRadius: '10px',
                background: isActive ? `${color}15` : 'rgba(0,0,0,0.03)',
                border: `1px solid ${isActive ? `${color}40` : 'rgba(0,0,0,0.04)'}`,
                color: isActive ? color : '#4B5563',
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => {
                if (isActive) return;
                (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
                (e.currentTarget as HTMLButtonElement).style.color = color;
              }}
              onMouseOut={e => {
                if (isActive) return;
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.04)';
                (e.currentTarget as HTMLButtonElement).style.color = '#4B5563';
              }}
            >
              <action.icon size={13} />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Histórico 24h del nodo (PM2.5, serie real por sensor) */}
      {showHistory && (
        <div style={{ padding: '0 18px 14px' }}>
          {historyStatus === 'loading' && (
            <div className="text-[10px] text-gray-400 text-center py-3 animate-pulse">Cargando histórico…</div>
          )}
          {historyStatus === 'error' && (
            <div className="text-[10px] text-gray-400 text-center py-3">
              No se pudo cargar el histórico. Intentá de nuevo más tarde.
            </div>
          )}
          {historyStatus === 'loaded' && !nodeSerie && (
            <div className="text-[10px] text-gray-400 text-center py-3">
              Este nodo no tuvo suficientes lecturas en las últimas 24h para mostrar histórico.
            </div>
          )}
          {historyStatus === 'loaded' && nodeSerie && historyData && (
            <HistorySparkline
              serie={nodeSerie}
              refValue={historyData.refValue}
              refLabel={historyData.refLabel}
              unit={historyData.unit}
            />
          )}
        </div>
      )}

      {/* Predicción por nodo (proyección por fórmula climática, no ML) */}
      {showForecast && (
        <div style={{ padding: '0 18px 14px' }}>
          <NodeForecastRows node={node} />
        </div>
      )}
    </div>
  );
};

export default NodeDetailPanel;
