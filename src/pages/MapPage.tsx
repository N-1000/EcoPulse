// ===================================================
// TANGARA 2026 - pages/MapPage.tsx  —  Light Mode + Ruta Saludable
// ===================================================
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Activity, CloudSun, Droplets, History,
  LineChart, MapPin, Thermometer, Wind, X, Footprints,
  Bike, Zap, AlertTriangle, Car
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Rectangle, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useNodes } from '../hooks/useNodes';
import { clusterNodesByLocation } from '../utils/geo';
import { ICA_LEVELS, levelColor } from '../utils/airQuality';
import { fetchGreenZones, fetchBestDestination, fetchHealthyRoute } from '../services/api';
import type { NodeCluster, TangaraNode, RoutePoint, RouteResult, TransportMode } from '../types';


// Paleta de brillo para modo claro (halos más suaves y elegantes)
const getGlowColor = (color: string) => {
  const map: Record<string, { glow: string; ring: string }> = {
    '#16A34A': { glow: '0 0 14px #16A34A99, 0 0 30px #16A34A33', ring: '#16A34A' },
    '#CA8A04': { glow: '0 0 14px #CA8A0499, 0 0 30px #CA8A0433', ring: '#CA8A04' },
    '#EA580C': { glow: '0 0 14px #EA580C99, 0 0 30px #EA580C33', ring: '#EA580C' },
    '#DC2626': { glow: '0 0 14px #DC262699, 0 0 30px #DC262633', ring: '#DC2626' },
    '#7C3AED': { glow: '0 0 14px #7C3AED99, 0 0 30px #7C3AED33', ring: '#7C3AED' },
  };
  return map[color] ?? { glow: `0 0 14px ${color}99, 0 0 30px ${color}33`, ring: color };
};

// --------------------------------------------------
// Custom DivIcon para Leaflet (diseño claro premium)
// --------------------------------------------------
const createClusterIcon = (cluster: NodeCluster, isSelected: boolean) => {
  const node = cluster.nodes[0];
  const color = levelColor(node.measurements.level);
  const inactive = cluster.nodes.every(n => n.status === 'inactivo');
  const isMulti = cluster.nodes.length > 1;
  const glowInfo = getGlowColor(color);
  const c = inactive ? '#9CA3AF' : color;
  const size = isSelected ? 30 : 24;
  const haloSize = isSelected ? 68 : 52;

  const html = `
    <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
      
      <!-- Halo exterior pulsante -->
      <div class="neon-halo" style="
        position:absolute;
        width:${haloSize}px; height:${haloSize}px;
        border-radius:50%;
        background: radial-gradient(circle, ${c}25 0%, ${c}00 70%);
        box-shadow: 0 0 15px ${c}22, 0 0 30px ${c}11;
        animation: neonPulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>
      
      <!-- Anillo intermedio (solo seleccionado) -->
      ${isSelected ? `
        <div style="
          position:absolute;
          width:42px; height:42px;
          border-radius:50%;
          border: 1.5px solid ${c}66;
          box-shadow: 0 0 8px ${c}44;
          animation: neonRingExpand 1.8s ease-in-out infinite;
        "></div>
      ` : ''}

      <!-- Badge principal -->
      <div style="
        position:absolute;
        width:${size}px; height:${size}px;
        border-radius:50%;
        background: ${c};
        border: 2px solid rgba(255,255,255,0.95);
        display:flex; align-items:center; justify-content:center;
        box-shadow: ${glowInfo.glow}, 0 4px 10px rgba(0,0,0,0.15);
        transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      ">
        <span style="
          color:white;
          font-weight:900;
          font-size:${isSelected ? '11px' : '9px'};
          letter-spacing:-0.5px;
          line-height:1;
          font-family: Inter, system-ui, sans-serif;
        ">${node.measurements.ica}</span>
      </div>

      <!-- Contador multi-nodo -->
      ${isMulti ? `
        <div style="
          position:absolute;
          top:-3px; right:-3px;
          width:15px; height:15px;
          border-radius:50%;
          background:#0284C7;
          border: 1.5px solid white;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 2px 6px rgba(2,132,199,0.3);
        ">
          <span style="color:white; font-size:8px; font-weight:900; line-height:1;">${cluster.nodes.length}</span>
        </div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'bg-transparent border-none',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

// --------------------------------------------------
// Panel lateral — glassmorphism claro premium
// --------------------------------------------------
interface NodePanelProps {
  cluster: NodeCluster;
  onClose: () => void;
  onStartHealthyRoute: (coords: [number, number]) => void;
}

const NodePanel = ({ cluster, onClose, onStartHealthyRoute }: NodePanelProps) => {
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

  const lastUpdate = new Date(node.lastUpdate).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="absolute top-4 left-4 z-[400] w-[285px] animate-slide-up bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-150 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
      {/* Header con color de fondo sutil adaptado al ICA */}
      <div style={{ background: `linear-gradient(135deg, ${color}15, ${color}04)`, padding: '16px 18px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, boxShadow: `0 0 4px ${status.dot}` }} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{status.label}</span>
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
            {/* ICA badge grande */}
            <div className="flex flex-col items-center" style={{
              background: `${color}10`,
              border: `1.5px solid ${color}35`,
              borderRadius: '10px',
              padding: '4px 10px',
            }}>
              <span className="font-black text-xl leading-none" style={{ color }}>{node.measurements.ica}</span>
              <span className="text-[8px] font-bold tracking-wider mt-0.5" style={{ color: `${color}bb` }}>ICA</span>
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
                  background: n.id === node.id ? color : 'rgba(0,0,0,0.05)',
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
          {[
            { icon: Thermometer, label: 'Temperatura', value: `${node.measurements.temperature}°C`, c: '#F97316' },
            { icon: Droplets,    label: 'Humedad',     value: `${node.measurements.humidity}%`,     c: '#0284C7' },
            { icon: Wind,        label: 'PM2.5',       value: `${node.measurements.pm25} µg/m³`,   c: '#8B5CF6' },
            { icon: Activity,    label: 'Nivel',       value: node.measurements.level === 'dañina-grupos-sensibles' ? 'D.G.Sensibles' : (node.measurements.level.charAt(0).toUpperCase() + node.measurements.level.slice(1)), c: color },
          ].map(row => (
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

// Map auto-focus
const MapController = ({ selectedCluster }: { selectedCluster: NodeCluster | null }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedCluster?.coordinates) {
      map.setView([selectedCluster.coordinates.lat, selectedCluster.coordinates.lng], 14, { animate: true });
    }
  }, [selectedCluster, map]);
  return null;
};

// Capturador de clics en el mapa para el modo de ruteo
const MapEvents = ({ clickHandlerRef }: { clickHandlerRef: React.MutableRefObject<(e: L.LeafletMouseEvent) => void> }) => {
  useMapEvents({
    click: (e) => clickHandlerRef.current(e),
  });
  return null;
};

// Coordenadas geográficas para los ríos y zonas verdes
const RIO_CALI: [number, number][] = [
  [3.4502, -76.5492],
  [3.4516, -76.5413],
  [3.4568, -76.5332],
  [3.4682, -76.5255],
  [3.4770, -76.5165],
  [3.4860, -76.5020],
  [3.4910, -76.4910],
  [3.4980, -76.4810]
];

const RIO_CAUCA: [number, number][] = [
  [3.3900, -76.4750],
  [3.4150, -76.4710],
  [3.4420, -76.4740],
  [3.4710, -76.4880],
  [3.4950, -76.4850]
];

const ZONA_FARALLONES: [number, number][] = [
  [3.4900, -76.5800],
  [3.4800, -76.5600],
  [3.4600, -76.5550],
  [3.4400, -76.5650],
  [3.4200, -76.5600],
  [3.4000, -76.5700],
  [3.3800, -76.5750],
  [3.3500, -76.5800],
  [3.3300, -76.5900],
  [3.3200, -76.5600],
  [3.3500, -76.5500],
  [3.3800, -76.5450],
  [3.4100, -76.5400],
  [3.4500, -76.5480],
  [3.4750, -76.5550]
];

const PARQUE_INGENIO: [number, number][] = [
  [3.3840, -76.5330],
  [3.3870, -76.5300],
  [3.3830, -76.5270],
  [3.3800, -76.5300]
];

const ECOPARQUE_PANCE: [number, number][] = [
  [3.3380, -76.5500],
  [3.3420, -76.5400],
  [3.3350, -76.5350],
  [3.3300, -76.5450]
];

// Generador dinámico de corrientes de viento
const generateWindStreams = (direction: number, center: [number, number]): [number, number][][] => {
  const rad = (direction * Math.PI) / 180;
  const dLat = -Math.cos(rad);
  const dLng = -Math.sin(rad);
  const pLat = -dLng;
  const pLng = dLat;

  const offsets = [-0.035, -0.015, 0.015, 0.035];
  return offsets.map(offsetFactor => {
    const points: [number, number][] = [];
    for (let t = -0.09; t <= 0.09; t += 0.015) {
      const wave = Math.sin(t * 130) * 0.0035;
      const lat = center[0] + (offsetFactor * pLat) + (t * dLat) + (wave * pLat);
      const lng = center[1] + (offsetFactor * pLng) + (t * dLng) + (wave * pLng);
      points.push([lat, lng]);
    }
    return points;
  });
};

// --------------------------------------------------
// Página principal del mapa
// --------------------------------------------------
const MapPage = () => {
  const { nodes, isLoading } = useNodes();
  const [selectedGeohash, setSelectedGeohash] = useState<string | null>(null);
  
  // Viento real desde Open-Meteo. Por defecto Oeste a 10 km/h
  const [wind, setWind] = useState<{ speed: number; direction: number }>({ speed: 10, direction: 270 });

  // Estados para el ruteo saludable
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [parks, setParks] = useState<RoutePoint[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('walk');

  const clusters = useMemo(() => clusterNodesByLocation(nodes), [nodes]);
  const selectedCluster = clusters.find(c => c.geohash === selectedGeohash) ?? null;

  const caliCenter: [number, number] = [3.4350, -76.5200];

  // Fetch de viento real en Cali
  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=3.4516&longitude=-76.5320&current=wind_speed_10m,wind_direction_10m')
      .then(res => res.json())
      .then(data => {
        if (data?.current) {
          setWind({
            speed: data.current.wind_speed_10m,
            direction: data.current.wind_direction_10m,
          });
        }
      })
      .catch(err => console.error("Error al obtener datos de viento de Open-Meteo:", err));
  }, []);

  // Fetch de parques con Overpass API en Cali al iniciar
  useEffect(() => {
    fetchGreenZones().then(data => setParks(data));
  }, []);

  // Calcular ruta saludable reactivamente al tener Origen y Destino (async OSRM vía Backend)
  useEffect(() => {
    if (routeStart && routeEnd) {
      setIsRouteLoading(true);
      const destPark = parks.find(
        p => p.lat === routeEnd[0] && p.lng === routeEnd[1]
      );
      const destName = destPark?.name ?? 'Destino';
      fetchHealthyRoute(routeStart, routeEnd, transportMode)
        .then(result => {
          // Aseguramos que conserve el nombre correcto del destino
          setRouteResult({ ...result, destinationName: destName });
        })
        .catch(() => setRouteResult(null))
        .finally(() => setIsRouteLoading(false));
    } else {
      setRouteResult(null);
    }
  }, [routeStart, routeEnd, transportMode]);

  // Generación de las polilíneas de viento dinámicas según la dirección actual
  const windStreams = useMemo(() => {
    return generateWindStreams(wind.direction, caliCenter);
  }, [wind.direction]);

  // Velocidad de animación
  const animationDuration = useMemo(() => {
    const duration = Math.max(3, Math.min(18, 90 / Math.max(1, wind.speed)));
    return `${duration}s`;
  }, [wind.speed]);

  // Controlar clics del mapa para modo de ruteo
  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isRoutingMode) return;
    const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
    if (!routeStart) {
      setRouteStart(coords);
    } else if (!routeEnd) {
      setRouteEnd(coords);
    }
  };

  const clickHandlerRef = useRef(handleMapClick);
  useEffect(() => {
    clickHandlerRef.current = handleMapClick;
  }, [handleMapClick]);

  const clearRoute = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setRouteResult(null);
  };

  const toggleRoutingMode = () => {
    setIsRoutingMode(!isRoutingMode);
    clearRoute();
  };

  const handleStartHealthyRoute = (nodeCoords: [number, number]) => {
    setIsRoutingMode(true);
    setRouteResult(null);
    setRouteStart(nodeCoords);
    
    fetchBestDestination(nodeCoords[0], nodeCoords[1])
      .then(dest => {
        if (dest) {
          setRouteEnd([dest.lat, dest.lng]);
        }
      })
      .catch(err => console.error("Error al obtener el mejor destino:", err));
  };

  // Iconos personalizados para los puntos A y B
  const startIcon = useMemo(() => L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-lg text-white font-extrabold text-xs animate-bounce" style="box-shadow: 0 0 10px rgba(14, 165, 233, 0.4)">A</div>`,
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }), []);

  const endIcon = useMemo(() => L.divIcon({
    html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg text-white font-extrabold text-xs animate-bounce" style="box-shadow: 0 0 10px rgba(16, 185, 129, 0.4)">B</div>`,
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  }), []);

  return (
    <div className="h-full p-5 pt-4 animate-fade-in">
      <style>{`
        @keyframes neonPulse {
          0%, 100% { transform: scale(0.88); opacity: 0.45; }
          50%       { transform: scale(1.22); opacity: 0.15; }
        }
        @keyframes neonRingExpand {
          0%   { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        @keyframes windDash {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        .wind-line {
          animation: windDash var(--wind-duration, 6s) linear infinite;
          stroke-dasharray: 8, 22;
          stroke-linecap: round;
        }
        @keyframes riverDash {
          from { stroke-dashoffset: 120; }
          to   { stroke-dashoffset: 0; }
        }
        .river-line {
          animation: riverDash 10s linear infinite;
          stroke-dasharray: 10, 20;
          stroke-linecap: round;
        }
        .green-zone-light {
          transition: all 0.3s ease;
        }
        .green-zone-light:hover {
          fill-opacity: 0.22;
          stroke-opacity: 0.6;
        }
        @keyframes routeFlow {
          from { stroke-dashoffset: 80; }
          to   { stroke-dashoffset: 0; }
        }
        .route-line {
          animation: routeFlow 5s linear infinite;
          stroke-dasharray: 8, 12;
          stroke-linecap: round;
          filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3));
        }
      `}</style>

      <div 
        className="relative h-full rounded-2xl overflow-hidden border border-gray-200" 
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
          ['--wind-duration' as any]: animationDuration
        }}
      >
        {/* Mapa claro — Voyager de CartoDB (limpio, elegante) */}
        <MapContainer
          center={caliCenter}
          zoom={13}
          className="w-full h-full"
          zoomControl={false}
          style={{ background: '#F8FAFC' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <ZoomControl position="bottomright" />

          {/* Capturador de eventos de clic en el mapa */}
          <MapEvents clickHandlerRef={clickHandlerRef} />

          {/* Zonas Verdes / Reservas */}
          <Polygon
            positions={ZONA_FARALLONES}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.12,
              weight: 1.5,
              opacity: 0.4,
              className: 'green-zone-light'
            }}
          />
          <Polygon
            positions={PARQUE_INGENIO}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.15,
              weight: 1.2,
              opacity: 0.4,
              className: 'green-zone-light'
            }}
          />
          <Polygon
            positions={ECOPARQUE_PANCE}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 0.15,
              weight: 1.2,
              opacity: 0.4,
              className: 'green-zone-light'
            }}
          />

          {/* Ríos */}
          <Polyline
            positions={RIO_CALI}
            pathOptions={{
              color: '#009DD4',
              weight: 3.5,
              opacity: 0.7,
              className: 'river-line'
            }}
          />
          <Polyline
            positions={RIO_CAUCA}
            pathOptions={{
              color: '#0084B4',
              weight: 5,
              opacity: 0.6,
              className: 'river-line'
            }}
          />

          {/* Corrientes de viento */}
          {windStreams.map((pts, i) => (
            <Polyline
              key={i}
              positions={pts}
              pathOptions={{
                color: '#0EA5E9',
                weight: 1.2,
                opacity: 0.35,
                className: 'wind-line',
              }}
            />
          ))}

          {/* Marcadores de origen y destino A y B */}
          {routeStart && (
            <Marker position={routeStart} icon={startIcon} />
          )}
          {routeEnd && (
            <Marker position={routeEnd} icon={endIcon} />
          )}

          {/* Trayecto de la Ruta Saludable — colorizado por nivel de tráfico */}
          {routeResult && (() => {
            const risk = routeResult.trafficRisk;
            // Colores fuertemente contrastantes para cada nivel
            const routeColor = risk === 'high'   ? '#DC2626'   // rojo intenso
                             : risk === 'medium' ? '#D97706'   // ámbar oscuro
                             :                    '#0284C7';   // azul cielo (≠ verde del mapa)
            const glowColor  = risk === 'high'   ? '#DC262680'
                             : risk === 'medium' ? '#D9770680'
                             :                    '#0284C780';

            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            const path = routeResult.path;
            const pt33: [number, number] = path.length >= 3
              ? path[Math.round((path.length - 1) * 0.33)] as [number, number]
              : [lerp(path[0][0], path[path.length-1][0], 0.33), lerp(path[0][1], path[path.length-1][1], 0.33)];
            const pt66: [number, number] = path.length >= 3
              ? path[Math.round((path.length - 1) * 0.66)] as [number, number]
              : [lerp(path[0][0], path[path.length-1][0], 0.66), lerp(path[0][1], path[path.length-1][1], 0.66)];

            const markerBg     = risk === 'high' ? '#DC2626' : '#D97706';
            const markerShadow = risk === 'high' ? '#DC262640' : '#D9770640';
            const trafficIcon  = () => L.divIcon({
              html: `<div style="background:${markerBg};border:2px solid white;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 5px ${markerShadow};font-size:13px;animation:trafficPulse 1.4s ease-in-out infinite;">🚗</div>`,
              className: 'bg-transparent border-none',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            return (
              <>
                {/* Capa 1: sombra/halo */}
                <Polyline positions={routeResult.path} pathOptions={{ color: glowColor, weight: 18, opacity: 0.4 }} />
                {/* Capa 2: línea sólida principal */}
                <Polyline positions={routeResult.path} pathOptions={{ color: routeColor, weight: 6, opacity: 1 }} />
                {/* Capa 3: guiones blancos animados */}
                <Polyline
                  positions={routeResult.path}
                  pathOptions={{ color: '#FFFFFF', weight: 2, opacity: 0.7, dashArray: '8 14', className: 'route-dash-anim' }}
                />
                {/* Marcadores 🚗 en posiciones geográficas reales — solo medium/high */}
                {risk !== 'low' && (
                  <>
                    <Marker key="traffic-33" position={pt33} icon={trafficIcon()} />
                    <Marker key="traffic-66" position={pt66} icon={trafficIcon()} />
                  </>
                )}
              </>
            );
          })()}

          {/* Zonas Verdes Exáctas */}
          {parks.map((park, idx) => {
            if (park.bounds) {
              return (
                <Rectangle
                  key={`park-${idx}`}
                  bounds={park.bounds}
                  pathOptions={{ color: '#10b981', weight: 1, fillOpacity: 0.15, fillColor: '#10b981' }}
                />
              );
            }
            return null;
          })}

          {/* Marcadores de nodos */}
          {clusters.map(cluster => {
            if (!cluster.coordinates) return null;
            return (
              <Marker
                key={cluster.geohash}
                position={[cluster.coordinates.lat, cluster.coordinates.lng]}
                icon={createClusterIcon(cluster, cluster.geohash === selectedGeohash)}
                eventHandlers={{
                  click: () => {
                    if (!isRoutingMode) {
                      setSelectedGeohash(cluster.geohash === selectedGeohash ? null : cluster.geohash);
                    }
                  },
                }}
              />
            );
          })}

          <MapController selectedCluster={selectedCluster} />
        </MapContainer>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-[500] bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0084B4', borderTopColor: 'transparent' }} />
              <p className="text-sm font-semibold text-gray-500">Cargando nodos…</p>
            </div>
          </div>
        )}

        {/* Instrucción visual flotante en modo ruteo */}
        {isRoutingMode && !routeResult && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur-md border border-emerald-100 rounded-xl px-4 py-2 shadow-lg text-xs font-bold text-emerald-800 flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {!routeStart 
              ? 'Haz clic en el mapa para marcar el Origen (A)' 
              : 'Haz clic en el mapa para marcar el Destino (B)'}
          </div>
        )}

        {/* Panel superior izquierdo — controles y clima */}
        <div className="absolute top-4 left-4 z-[400] space-y-2">
          {/* Tarjeta del clima */}
          {!selectedCluster && !isRoutingMode && (
            <div className="bg-white/90 backdrop-blur-md border border-gray-150 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <CloudSun size={22} className="text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-black text-gray-800 leading-tight">27.8°C</p>
                <p className="text-[10px] text-gray-400 font-bold">Parcialmente nublado</p>
              </div>
            </div>
          )}

          {/* Botón de Ruteo Saludable */}
          <button 
            onClick={toggleRoutingMode}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 shadow-md border text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isRoutingMode 
                ? 'bg-red-500 border-red-500 text-white shadow-[0_4px_15px_rgba(239,68,68,0.2)]' 
                : 'bg-white border-gray-150 text-gray-700 hover:shadow-lg'
            }`}
          >
            <Footprints size={14} className={isRoutingMode ? 'animate-pulse' : 'text-emerald-500'} />
            {isRoutingMode ? 'Salir de Ruteo' : 'Ruta Saludable'}
          </button>
        </div>

        {/* Panel del nodo seleccionado */}
        {selectedCluster && !isRoutingMode && (
          <NodePanel
            key={selectedCluster.geohash}
            cluster={selectedCluster}
            onClose={() => setSelectedGeohash(null)}
            onStartHealthyRoute={handleStartHealthyRoute}
          />
        )}

        {/* Loading spinner mientras OSRM calcula la ruta */}
        {isRouteLoading && (
          <div className="absolute bottom-14 left-4 z-[400] w-[265px] bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex items-center gap-3 animate-slide-up">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin flex-shrink-0" />
            <div>
              <p className="text-xs font-black text-gray-700">Calculando ruta…</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">Trazando calles reales</p>
            </div>
          </div>
        )}

        {/* Panel con métricas de la ruta saludable calculada */}
        {routeResult && !isRouteLoading && (
          <div className="absolute bottom-14 left-4 z-[400] w-[270px] bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] animate-slide-up">
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Footprints size={13} className="text-emerald-500" />
                <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Ruta Saludable</span>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{
                backgroundColor: routeResult.healthScore === 'A+' || routeResult.healthScore === 'A' ? '#D1FAE5' : '#FEF3C7',
                color: routeResult.healthScore === 'A+' || routeResult.healthScore === 'A' ? '#065F46' : '#92400E'
              }}>
                Score {routeResult.healthScore}
              </span>
            </div>

            {/* Destino */}
            <div className="flex items-center gap-2 mb-3 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
              <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
              <span className="text-[11px] font-bold text-emerald-800 truncate">{routeResult.destinationName}</span>
            </div>

            {/* Opciones de Transporte */}
            <div className="flex items-center gap-1.5 mb-3 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
              {[
                { id: 'walk', icon: Footprints, label: 'Caminar' },
                { id: 'bike', icon: Bike, label: 'Bici' },
                { id: 'skates', icon: Activity, label: 'Patines' },
                { id: 'skateboard', icon: Wind, label: 'Skate' },
                { id: 'escooter', icon: Zap, label: 'Eléctrica' },
              ].map(mode => {
                const Icon = mode.icon;
                const isActive = transportMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setTransportMode(mode.id as TransportMode)}
                    title={mode.label}
                    className={`flex-1 flex justify-center py-1.5 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-white shadow-sm text-emerald-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>

            {/* Métricas en grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Distancia</p>
                <p className="text-sm font-black text-gray-800">{routeResult.distance} km</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duración</p>
                <p className="text-sm font-black text-gray-800">~{routeResult.durations[transportMode]} min</p>
              </div>
              <div className="bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Cobertura Verde</p>
                <p className="text-sm font-black text-emerald-700">{routeResult.greenCoverage}%</p>
              </div>
              <div className="rounded-xl px-3 py-2 border" style={{
                background: routeResult.averageICA <= 50 ? '#F0FDF4' : routeResult.averageICA <= 100 ? '#FEFCE8' : '#FEF2F2',
                borderColor: routeResult.averageICA <= 50 ? '#BBF7D0' : routeResult.averageICA <= 100 ? '#FDE68A' : '#FECACA',
              }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: routeResult.averageICA <= 50 ? '#16A34A' : routeResult.averageICA <= 100 ? '#CA8A04' : '#DC2626' }}>ICA Prom.</p>
                <p className="text-sm font-black" style={{ color: routeResult.averageICA <= 50 ? '#15803D' : routeResult.averageICA <= 100 ? '#A16207' : '#B91C1C' }}>{routeResult.averageICA}</p>
              </div>
            </div>

            {/* Métrica de CO2 Evitado */}
            <div className="flex items-center justify-between mb-3 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
              <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                CO₂ Evitado vs Auto{routeResult.rushHour ? ' · Hora pico' : ''}
              </span>
              <span className="text-sm font-black text-emerald-600">~{routeResult.co2Saved} g</span>
            </div>

            {/* Alerta de tráfico */}
            {routeResult.trafficRisk === 'high' && (
              <div className="mb-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-2.5">
                <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-900 leading-snug">
                  <strong className="font-bold block mb-0.5">
                    🚗 Tráfico pesado{routeResult.rushHour ? ' — Hora pico' : ''}
                  </strong>
                  Esta ruta atraviesa avenidas con alta congestión. Considera ir por ciclovía o esperar a que baje el tráfico. El puntaje de salud se reduce.
                </p>
              </div>
            )}
            {routeResult.trafficRisk === 'medium' && (
              <div className="mb-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5">
                <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-900 leading-snug">
                  <strong className="font-bold block mb-0.5">
                    🟡 Tráfico moderado{routeResult.rushHour ? ' — Hora pico' : ''}
                  </strong>
                  Flujo vehicular intermitente. Mantén distancia de los carriles de autobús y prefiere aceras anchas.
                </p>
              </div>
            )}

            {/* Alerta de tráfico y contaminación — dos niveles */}
            {routeResult.averageICA > 100 && (
              <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-800 leading-snug">
                  <strong className="font-bold block mb-0.5">⚠️ Aire perjudicial / Posible tráfico pesado</strong>
                  ICA {routeResult.averageICA} — Evita esfuerzo intenso. Usa tapabocas y considera ir antes de las 7 a.m. o después de las 7 p.m.
                </p>
              </div>
            )}
            {routeResult.averageICA > 75 && routeResult.averageICA <= 100 && (
              <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-snug">
                  <strong className="font-bold block mb-0.5">Moderado — Grupos sensibles</strong>
                  ICA {routeResult.averageICA} — Niños, adultos mayores o personas con asma deben tomar precauciones en esta ruta.
                </p>
              </div>
            )}

            <button 
              onClick={clearRoute}
              className="w-full py-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl text-xs font-bold transition-colors border border-gray-200 hover:border-red-100"
            >
              Limpiar Ruta
            </button>
          </div>
        )}

        {/* Leyenda unificada ICA + Tráfico — inferior derecha */}
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


        {/* Indicador de viento en tiempo real — esquina inferior izquierda */}
        <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 bg-white/90 backdrop-blur-md border border-sky-100 rounded-xl px-3 py-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <Wind size={12} className="animate-pulse text-sky-500" />
          <span className="text-[10px] font-bold text-sky-600">
            Viento real: {wind.speed} km/h · Dir: {wind.direction}°
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default MapPage;
