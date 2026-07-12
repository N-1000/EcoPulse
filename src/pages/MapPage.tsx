// ===================================================
// TANGARA 2026 - pages/MapPage.tsx
// Vista "Explorar mapa": mapa interactivo de Cali con los nodos
// de la red Tangara y panel lateral con la información del nodo.
//
// NOTAS DE INTEGRACIÓN:
// - Los nodos llegan por el hook useNodes() (hoy mock, mañana FastAPI).
// - Los sensores reportan Geohash; aquí se usan las coordenadas YA
//   decodificadas (`node.coordinates`) que entregará el backend.
// - Varios sensores pueden compartir ubicación (calibración): se agrupan
//   con clusterNodesByLocation() y se muestra un contador.
// - El lienzo actual es un SVG estilizado de Cali. Cuando se integre un
//   mapa real (Leaflet/MapLibre), solo se reemplaza <MapCanvas/> —
//   el panel, la leyenda y los datos no cambian.
// ===================================================
import { useMemo, useState } from 'react';
import {
  Activity, CloudSun, Crosshair, Droplets, History, Layers,
  LineChart, MapPin, Minus, Plus, Thermometer, Wind, X, Footprints,
} from 'lucide-react';
import { useNodes } from '../hooks/useNodes';
import { clusterNodesByLocation, projectToCanvas } from '../utils/geo';
import { ICA_LEVELS, levelColor } from '../utils/airQuality';
import type { NodeCluster, TangaraNode } from '../types';

// Dimensiones del lienzo SVG.
const CANVAS_W = 620;
const CANVAS_H = 740;

// --------------------------------------------------
// Fondo del mapa: Cali estilizada (colinas, río, retícula vial)
// --------------------------------------------------
const MapBackground = () => (
  <g aria-hidden="true">
    {/* Base */}
    <rect width={CANVAS_W} height={CANVAS_H} fill="#F1F4F7" />

    {/* Zona montañosa occidental (Farallones) */}
    <path
      d={`M0 0 L${CANVAS_W * 0.22} 0 Q${CANVAS_W * 0.13} ${CANVAS_H * 0.3} ${CANVAS_W * 0.18} ${CANVAS_H * 0.55} Q${CANVAS_W * 0.1} ${CANVAS_H * 0.8} ${CANVAS_W * 0.16} ${CANVAS_H} L0 ${CANVAS_H} Z`}
      fill="#DCEDDC"
    />
    <path
      d={`M0 0 L${CANVAS_W * 0.12} 0 Q${CANVAS_W * 0.06} ${CANVAS_H * 0.35} ${CANVAS_W * 0.09} ${CANVAS_H * 0.6} Q${CANVAS_W * 0.03} ${CANVAS_H * 0.85} ${CANVAS_W * 0.07} ${CANVAS_H} L0 ${CANVAS_H} Z`}
      fill="#CBE3CB"
    />

    {/* Río Cali (diagonal noreste) */}
    <path
      d={`M${CANVAS_W * 0.2} ${CANVAS_H * 0.42} Q${CANVAS_W * 0.42} ${CANVAS_H * 0.33} ${CANVAS_W * 0.58} ${CANVAS_H * 0.22} Q${CANVAS_W * 0.72} ${CANVAS_H * 0.12} ${CANVAS_W * 0.85} 0`}
      fill="none" stroke="#A8CDEF" strokeWidth="7" strokeLinecap="round" opacity="0.9"
    />
    {/* Río Cauca (borde oriental) */}
    <path
      d={`M${CANVAS_W * 0.97} ${CANVAS_H * 0.05} Q${CANVAS_W * 0.9} ${CANVAS_H * 0.35} ${CANVAS_W * 0.94} ${CANVAS_H * 0.6} Q${CANVAS_W * 0.98} ${CANVAS_H * 0.8} ${CANVAS_W * 0.92} ${CANVAS_H}`}
      fill="none" stroke="#A8CDEF" strokeWidth="10" strokeLinecap="round" opacity="0.75"
    />

    {/* Retícula vial */}
    {[0.18, 0.3, 0.42, 0.54, 0.66, 0.78].map(fy => (
      <line key={`h${fy}`} x1={CANVAS_W * 0.12} y1={CANVAS_H * fy} x2={CANVAS_W * 0.95} y2={CANVAS_H * (fy - 0.06)} stroke="#E1E7ED" strokeWidth="4" />
    ))}
    {[0.3, 0.45, 0.6, 0.75, 0.88].map(fx => (
      <line key={`v${fx}`} x1={CANVAS_W * fx} y1={CANVAS_H * 0.04} x2={CANVAS_W * (fx - 0.08)} y2={CANVAS_H * 0.96} stroke="#E1E7ED" strokeWidth="3" />
    ))}

    {/* Etiquetas de referencia */}
    <text x={CANVAS_W * 0.47} y={CANVAS_H * 0.47} fontSize="20" fontWeight="800" fill="#64748B">Cali</text>
    <text x={CANVAS_W * 0.5} y={CANVAS_H * 0.14} fontSize="10" fill="#94A3B8">Chipichape</text>
    <text x={CANVAS_W * 0.55} y={CANVAS_H * 0.3} fontSize="10" fill="#94A3B8">San Vicente</text>
    <text x={CANVAS_W * 0.36} y={CANVAS_H * 0.56} fontSize="10" fill="#94A3B8">San Antonio</text>
    <text x={CANVAS_W * 0.72} y={CANVAS_H * 0.52} fontSize="10" fill="#94A3B8">Aguablanca</text>
    <text x={CANVAS_W * 0.42} y={CANVAS_H * 0.78} fontSize="10" fill="#94A3B8">Meléndez</text>
    <text x={CANVAS_W * 0.35} y={CANVAS_H * 0.95} fontSize="10" fill="#94A3B8">Pance</text>
  </g>
);

// --------------------------------------------------
// Marcador de un cluster de nodos
// --------------------------------------------------
interface MarkerProps {
  cluster: NodeCluster;
  isSelected: boolean;
  onSelect: (cluster: NodeCluster) => void;
}

const ClusterMarker = ({ cluster, isSelected, onSelect }: MarkerProps) => {
  const node = cluster.nodes[0];
  const { x, y } = projectToCanvas(cluster.coordinates, CANVAS_W, CANVAS_H);
  const color = levelColor(node.measurements.level);
  const isMulti = cluster.nodes.length > 1;
  const inactive = cluster.nodes.every(n => n.status === 'inactivo');

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer"
      onClick={() => onSelect(cluster)}
      role="button"
      aria-label={`${node.name}, ICA ${node.measurements.ica}`}
    >
      {/* Halo de contaminación */}
      <circle r={isSelected ? 30 : 24} fill={color} opacity="0.18" />
      {/* Punto principal */}
      <circle
        r={isSelected ? 15 : 12}
        fill={inactive ? '#9CA3AF' : color}
        stroke="white"
        strokeWidth="2.5"
        className="transition-all duration-150"
      />
      <text
        textAnchor="middle"
        dy="3.5"
        fontSize="10"
        fontWeight="800"
        fill="white"
        className="pointer-events-none select-none"
      >
        {node.measurements.ica}
      </text>
      {/* Contador de sensores co-ubicados (calibración/pruebas) */}
      {isMulti && (
        <g transform="translate(10, -12)">
          <circle r="7.5" fill="#0084B4" stroke="white" strokeWidth="1.5" />
          <text textAnchor="middle" dy="2.8" fontSize="8" fontWeight="800" fill="white" className="pointer-events-none select-none">
            {cluster.nodes.length}
          </text>
        </g>
      )}
    </g>
  );
};

// --------------------------------------------------
// Panel lateral con la información del nodo seleccionado
// --------------------------------------------------
interface NodePanelProps {
  cluster: NodeCluster;
  onClose: () => void;
}

const NodePanel = ({ cluster, onClose }: NodePanelProps) => {
  const [activeNodeId, setActiveNodeId] = useState(cluster.nodes[0].id);
  const node: TangaraNode =
    cluster.nodes.find(n => n.id === activeNodeId) ?? cluster.nodes[0];
  const color = levelColor(node.measurements.level);
  const isMulti = cluster.nodes.length > 1;

  const statusInfo: Record<TangaraNode['status'], { label: string; class: string }> = {
    activo:      { label: 'Activo',         class: 'text-green-600 bg-green-50' },
    inactivo:    { label: 'Inactivo',       class: 'text-gray-500 bg-gray-100' },
    calibracion: { label: 'En calibración', class: 'text-blue-600 bg-blue-50' },
  };
  const status = statusInfo[node.status];

  const lastUpdate = new Date(node.lastUpdate).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="absolute top-4 left-4 z-20 w-[280px] max-w-[calc(100%-2rem)] card shadow-xl animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <h3 className="text-sm font-bold text-gray-900 truncate">{node.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.class}`}>
              {status.label}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              aria-label="Cerrar panel del nodo"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
          <MapPin size={11} />
          {node.comuna} · {node.barrio}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">geohash: {node.geohash}</p>

        {/* Selector cuando varios sensores comparten ubicación */}
        {isMulti && (
          <div className="mt-2.5">
            <p className="text-[10px] text-blue-600 font-medium mb-1.5">
              {cluster.nodes.length} sensores en esta ubicación (banco de pruebas)
            </p>
            <div className="flex flex-wrap gap-1">
              {cluster.nodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => setActiveNodeId(n.id)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
                    n.id === node.id
                      ? 'bg-tangara text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {n.id.replace('TANGARA_', 'T-')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mediciones */}
      <div className="px-4 py-3 space-y-2.5">
        {[
          { icon: Thermometer, label: 'Temperatura', value: `${node.measurements.temperature} °C` },
          { icon: Droplets,    label: 'Humedad',     value: `${node.measurements.humidity} %` },
          { icon: Wind,        label: 'PM2.5',       value: `${node.measurements.pm25} µg/m³` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-gray-500">
              <row.icon size={14} className="text-gray-400" />
              {row.label}
            </span>
            <span className="text-xs font-bold text-gray-800">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <Activity size={14} className="text-gray-400" />
            ICA
          </span>
          <span className="text-xs font-bold" style={{ color }}>
            {node.measurements.ica} ({node.measurements.level === 'dañina-grupos-sensibles' ? 'D. G. Sensibles' : node.measurements.level.charAt(0).toUpperCase() + node.measurements.level.slice(1)})
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="flex items-center gap-2 text-[11px] text-gray-400">
            <History size={13} />
            Última actualización
          </span>
          <span className="text-[11px] text-gray-500">{lastUpdate}</span>
        </div>
      </div>

      {/* Acciones (se conectarán a vistas reales en próximas etapas) */}
      <div className="px-4 pb-4 grid grid-cols-3 gap-2">
        {[
          { icon: History,    label: 'Ver histórico' },
          { icon: LineChart,  label: 'Predicción' },
          { icon: Footprints, label: 'Ruta saludable' },
        ].map(action => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl bg-pastel/60 text-tangara text-[10px] font-semibold hover:bg-pastel transition-colors leading-tight"
          >
            <action.icon size={15} />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// --------------------------------------------------
// Página del mapa
// --------------------------------------------------
const MapPage = () => {
  const { nodes, isLoading } = useNodes();
  const [selectedGeohash, setSelectedGeohash] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const clusters = useMemo(() => clusterNodesByLocation(nodes), [nodes]);
  const selectedCluster = clusters.find(c => c.geohash === selectedGeohash) ?? null;

  // Zoom centrado recalculando el viewBox.
  const vw = CANVAS_W / zoom;
  const vh = CANVAS_H / zoom;
  const vx = (CANVAS_W - vw) / 2;
  const vy = (CANVAS_H - vh) / 2;

  return (
    <div className="h-full p-5 pt-4">
      <div className="relative h-full card overflow-hidden">
        {/* ---- Lienzo del mapa ---- */}
        <svg
          viewBox={`${vx} ${vy} ${vw} ${vh}`}
          className="w-full h-full transition-all duration-300"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Mapa de nodos de calidad del aire en Cali"
        >
          <MapBackground />
          {clusters.map(cluster => (
            <ClusterMarker
              key={cluster.geohash}
              cluster={cluster}
              isSelected={cluster.geohash === selectedGeohash}
              onSelect={c => setSelectedGeohash(c.geohash === selectedGeohash ? null : c.geohash)}
            />
          ))}
        </svg>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-30">
            <p className="text-sm text-gray-500 font-medium animate-pulse">Cargando nodos…</p>
          </div>
        )}

        {/* ---- Controles superiores izquierdos ---- */}
        {!selectedCluster && (
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <button className="flex items-center gap-2 bg-white rounded-xl px-3.5 py-2.5 shadow-md border border-gray-100 text-xs font-semibold text-gray-700 hover:shadow-lg transition-shadow">
              <Layers size={14} className="text-tangara" />
              Capas del mapa
            </button>
            <div className="bg-white rounded-xl px-3.5 py-2.5 shadow-md border border-gray-100 flex items-center gap-2.5">
              <CloudSun size={20} className="text-yellow-500" />
              <div className="leading-tight">
                <p className="text-sm font-bold text-gray-900">27.8°C</p>
                <p className="text-[10px] text-gray-500">Cielo parcialmente nublado</p>
              </div>
            </div>
          </div>
        )}

        {/* ---- Panel del nodo seleccionado ---- */}
        {selectedCluster && (
          <NodePanel
            key={selectedCluster.geohash}
            cluster={selectedCluster}
            onClose={() => setSelectedGeohash(null)}
          />
        )}

        {/* ---- Controles de zoom (derecha) ---- */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.4, 2.6))}
            className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-palma transition-colors"
            aria-label="Acercar"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.4, 1))}
            className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-palma transition-colors"
            aria-label="Alejar"
          >
            <Minus size={16} />
          </button>
          <button
            className="w-9 h-9 bg-white rounded-xl shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:text-tangara transition-colors mt-1"
            aria-label="Mi ubicación"
          >
            <Crosshair size={15} />
          </button>
        </div>

        {/* ---- Leyenda ICA (inferior derecha) ---- */}
        <div className="absolute bottom-4 right-4 z-10 bg-white rounded-xl px-4 py-3 shadow-md border border-gray-100 max-w-[220px]">
          <p className="text-[11px] font-bold text-gray-800 mb-2">Índice de Calidad del Aire (ICA)</p>
          <div className="space-y-1.5">
            {ICA_LEVELS.slice(0, 5).map(lvl => (
              <div key={lvl.level} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: lvl.color }} />
                <span className="text-[10px] text-gray-600">
                  {lvl.label} ({lvl.range[0]}–{lvl.range[1]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
