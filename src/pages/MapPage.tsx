// ===================================================
// ECOPULSE 2026 - pages/MapPage.tsx  —  Light Mode + Ruta Saludable
// ===================================================
import { useMemo, useState, useEffect, useRef, Fragment } from 'react';
import { CloudSun, Wind, Footprints, Bike, Zap, Activity } from 'lucide-react';
import { MapContainer, TileLayer, WMSTileLayer, Marker, Polyline, useMap, ZoomControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMapData } from '../hooks/useMapData';
import { getClusterMetrics } from '../utils/airQuality';
import { fetchGreenZones, fetchBestDestination, fetchHealthyRoute } from '../services/api';
import type { NodeCluster, RouteResult, TransportMode } from '../types';
import { NodeDetailPanel } from '../components/map/NodeDetailPanel';
import { HealthyRoutePanel } from '../components/map/HealthyRoutePanel';
import { MapLegend } from '../components/map/MapLegend';


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
const mapPageIconCache = new Map<string, L.DivIcon>();

const createClusterIcon = (cluster: NodeCluster, isSelected: boolean) => {
  const metrics = getClusterMetrics(cluster);
  const cacheKey = `${cluster.nodes.map(n => n.id).sort().join(',')}:${metrics.displayValue}:${metrics.color}:${isSelected ? '1' : '0'}`;

  if (mapPageIconCache.has(cacheKey)) {
    return mapPageIconCache.get(cacheKey)!;
  }

  let icon: L.DivIcon;
  if (metrics.isCo2) {
    const CO2_BLUE = metrics.color;
    const size = isSelected ? 30 : 24;
    const haloSize = isSelected ? 68 : 52;
    const html = `
      <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
        <div style="
          position:absolute; width:${haloSize}px; height:${haloSize}px; border-radius:50%;
          background: radial-gradient(circle, ${CO2_BLUE}25 0%, ${CO2_BLUE}00 70%);
          animation: neonPulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
        "></div>
        <div style="
          position:absolute; width:${size}px; height:${size}px; border-radius:50%;
          background: ${CO2_BLUE}; border: 2px solid rgba(255,255,255,0.95);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 0 14px ${CO2_BLUE}99, 0 4px 10px rgba(0,0,0,0.15);
        ">
          <span style="color:white; font-weight:900; font-size:${isSelected ? '9px' : '7px'}; line-height:1; font-family:Inter,system-ui,sans-serif;">${metrics.displayValue}</span>
        </div>
      </div>
    `;
    icon = L.divIcon({ html, className: 'bg-transparent border-none', iconSize: [60, 60], iconAnchor: [30, 30] });
    mapPageIconCache.set(cacheKey, icon);
    return icon;
  }

  const color = metrics.color;
  const inactive = cluster.nodes.every(n => n.status === 'inactivo');
  const isMulti = cluster.nodes.length > 1;
  const glowInfo = getGlowColor(color);
  const c = inactive ? '#9CA3AF' : color;
  const size = isSelected ? 30 : 24;
  const haloSize = isSelected ? 68 : 52;

  const html = `
    <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
      ${inactive ? '' : `
        <div style="
          position:absolute; width:${haloSize}px; height:${haloSize}px; border-radius:50%;
          background: radial-gradient(circle, ${glowInfo.glow}30 0%, ${glowInfo.glow}00 70%);
          animation: neonPulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
        "></div>
      `}
      <div style="
        position:absolute; width:${size}px; height:${size}px; border-radius:50%;
        background: ${c}; border: 2px solid rgba(255,255,255,0.95);
        display:flex; align-items:center; justify-content:center;
        box-shadow: 0 0 14px ${glowInfo.glow}99, 0 4px 10px rgba(0,0,0,0.15);
      ">
        <span style="color:white; font-weight:900; font-size:${isSelected ? '12px' : '9px'}; line-height:1; font-family:Inter,system-ui,sans-serif;">${metrics.displayValue}</span>
        ${isMulti ? `
          <div style="
            position:absolute; top:-3px; right:-3px; width:12px; height:12px;
            border-radius:50%; background:#1F2937; color:white; font-size:7px;
            font-weight:700; display:flex; align-items:center; justify-content:center;
            border: 1px solid white;
          ">${cluster.nodes.length}</div>
        ` : ''}
      </div>
    </div>
  `;

  icon = L.divIcon({ html, className: 'bg-transparent border-none', iconSize: [60, 60], iconAnchor: [30, 30] });
  mapPageIconCache.set(cacheKey, icon);
  return icon;
};

// --------------------------------------------------
// Panel lateral — delegado a NodeDetailPanel
// --------------------------------------------------
const NodePanel = ({ cluster, onClose, onStartHealthyRoute }: {
  cluster: NodeCluster;
  onClose: () => void;
  onStartHealthyRoute: (coords: [number, number]) => void;
}) => {
  return (
    <NodeDetailPanel
      cluster={cluster}
      onClose={onClose}
      onStartHealthyRoute={onStartHealthyRoute}
    />
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


// Generador dinámico de corrientes de viento
const generateWindStreams = (direction: number, center: [number, number]): [number, number][][] => {
  const rad = (direction * Math.PI) / 180;
  const dLat = -Math.cos(rad);
  const dLng = -Math.sin(rad);
  const pLat = -dLng;
  const pLng = dLat;

  // 7 corrientes de viento con espaciado ideal de 0.02 grados
  const offsets = [-0.06, -0.04, -0.02, 0, 0.02, 0.04, 0.06];
  return offsets.map(offsetFactor => {
    const points: [number, number][] = [];
    for (let t = -0.12; t <= 0.12; t += 0.015) {
      const wave = Math.sin(t * 160) * 0.0035;
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
  const { clusters, wind, wmsLayers, center: caliCenter, isLoading } = useMapData();
  const [selectedGeohash, setSelectedGeohash] = useState<string | null>(null);

  // Estados para el ruteo saludable
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [parks, setParks] = useState<RoutePoint[]>([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('walk');

  const selectedCluster = clusters.find(c => c.geohash === selectedGeohash) ?? null;

  // Fetch de parques con Overpass API en Cali al iniciar
  useEffect(() => {
    fetchGreenZones().then(data => setParks(data));
  }, []);

  // Calcular ruta saludable reactivamente al tener Origen y Destino (async OSRM vía Backend)
  useEffect(() => {
    let active = true;
    if (routeStart && routeEnd) {
      setIsRouteLoading(true);
      const destPark = parks.find(
        p => p.lat === routeEnd[0] && p.lng === routeEnd[1]
      );
      const destName = destPark?.name ?? 'Destino';
      fetchHealthyRoute(routeStart, routeEnd, transportMode)
        .then(result => {
          if (active) setRouteResult({ ...result, destinationName: destName });
        })
        .catch(() => { if (active) setRouteResult(null); })
        .finally(() => { if (active) setIsRouteLoading(false); });
    } else {
      setRouteResult(null);
    }
    return () => { active = false; };
  }, [routeStart, routeEnd, transportMode, parks]);

  const windStreams = wind.streams;
  const animationDuration = wind.animationDuration;

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
        @keyframes fluir-viento {
          from { stroke-dashoffset: 40; }
          to   { stroke-dashoffset: 0; }
        }
        .wind-flow-normal {
          animation: fluir-viento 2.5s linear infinite;
          stroke-dasharray: 10, 30;
          stroke-linecap: round;
        }
        .wind-flow-fast {
          animation: fluir-viento 1.2s linear infinite;
          stroke-dasharray: 10, 20;
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ZoomControl position="bottomright" />

          {/* Capturador de eventos de clic en el mapa */}
          <MapEvents clickHandlerRef={clickHandlerRef} />


          {/* === CAPAS OFICIALES WMS — Alcaldía de Cali / IDESC === */}
          {wmsLayers.map(wms => (
            <WMSTileLayer
              key={wms.id}
              url={wms.url}
              layers={wms.layers}
              format={wms.format}
              transparent={wms.transparent}
              version={wms.version}
              opacity={wms.opacity}
              attribution={wms.attribution}
            />
          ))}

          {/* Corrientes de viento duales (base glow + flow animado) */}
          {windStreams.map((pts, i) => (
            <Fragment key={i}>
              <Polyline
                positions={pts}
                pathOptions={{
                  color: '#38BDF8',
                  weight: 5,
                  opacity: 0.18,
                  className: 'wind-glow-line',
                }}
              />
              <Polyline
                positions={pts}
                pathOptions={{
                  color: wind.speed > 12 ? '#E0F2FE' : '#7DD3FC',
                  weight: 1.8,
                  opacity: 0.85,
                  className: wind.speed > 12 ? 'wind-flow-fast' : 'wind-flow-normal',
                }}
              />
            </Fragment>
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
          <HealthyRoutePanel
            routeResult={routeResult}
            transportMode={transportMode}
            onSelectTransportMode={setTransportMode}
            onClearRoute={clearRoute}
          />
        )}

        {/* Leyenda unificada ICA + Tráfico — inferior derecha */}
        <MapLegend routeResult={routeResult} />


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
