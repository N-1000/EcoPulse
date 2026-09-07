// ===================================================
// ECOPULSE 2026 - components/map/NodeDetailPanel.tsx
// Panel flotante de detalle del nodo seleccionado en el mapa
// ===================================================
import { useState } from 'react';
import {
  Activity, Droplets, Footprints, History, LineChart, MapPin, Thermometer, Wind, X
} from 'lucide-react';
import { levelColor } from '../../utils/airQuality';
import type { NodeCluster, TangaraNode } from '../../types';

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
        ].map(action => (
          <button
            key={action.label}
            onClick={() => {
              if (action.label === 'Ruta sana') {
                if (node.coordinates) {
                  onStartHealthyRoute([node.coordinates.lat, node.coordinates.lng]);
                }
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              padding: '8px 4px', borderRadius: '10px',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.04)',
              color: '#4B5563',
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.02em',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => {
              (e.currentTarget as HTMLButtonElement).style.background = `${color}15`;
              (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
              (e.currentTarget as HTMLButtonElement).style.color = color;
            }}
            onMouseOut={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.04)';
              (e.currentTarget as HTMLButtonElement).style.color = '#4B5563';
            }}
          >
            <action.icon size={13} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NodeDetailPanel;
