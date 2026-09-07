// ===================================================
// ECOPULSE 2026 - components/dashboard/MapaComunas.tsx
// Widget de Mapa del Dashboard — Consume la fuente unificada useMapData.
// ===================================================
import { Leaf } from 'lucide-react';
import { MapContainer, TileLayer, WMSTileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useMapData } from '../../hooks/useMapData';
import { getClusterMetrics } from '../../utils/airQuality';
import type { TangaraNode } from '../../types';

const iconCache = new Map<string, L.DivIcon>();

const createClusterIcon = (cluster: { nodes: TangaraNode[] }) => {
  const metrics = getClusterMetrics(cluster);
  const cacheKey = `${cluster.nodes.map(n => n.id).sort().join(',')}:${metrics.displayValue}:${metrics.color}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const color = metrics.color;
  const fontSize = metrics.isCo2 ? '8px' : '10px';

  const html = `
    <div style="position:relative; width:32px; height:32px; display:flex; align-items:center; justify-content:center;">
      <div style="
        position:absolute; inset:0; border-radius:50%;
        background:${color}; opacity:${metrics.isCo2 ? 0.25 : 0.3}; transform:scale(1.3);
      "></div>
      <div style="
        position:relative; width:24px; height:24px; border-radius:50%;
        background:${color}; border:2px solid #ffffff;
        box-shadow:0 2px 6px ${metrics.isCo2 ? 'rgba(37,99,235,0.4)' : 'rgba(0,0,0,0.3)'};
        display:flex; align-items:center; justify-content:center;
        color:#ffffff; font-size:${fontSize}; font-weight:900; font-family:Inter,sans-serif;
      ">
        ${metrics.displayValue}
      </div>
    </div>
  `;

  const icon = L.divIcon({ html, className: 'custom-clean-marker', iconSize: [32, 32], iconAnchor: [16, 16] });
  iconCache.set(cacheKey, icon);
  return icon;
};

interface MapaComunasProps {
  onExploreMap: () => void;
}

const MapaComunas = ({ onExploreMap }: MapaComunasProps) => {
  const { clusters, wind, wmsLayers, center, isLoading } = useMapData();

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Encabezado unificado de sección */}
      <div className="h-6 flex items-center justify-between">
        <h3 className="text-xs font-extrabold text-[#1A1A18] uppercase tracking-wider">
          Monitor de Red Espacial
        </h3>
        <button
          onClick={onExploreMap}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white bg-[#2D6A4F] hover:bg-[#1F4A37] transition-all shadow-sm"
        >
          <Leaf size={12} />
          Explorar mapa completo
        </button>
      </div>

      {/* Contenedor del Mapa */}
      <div className="relative h-[360px] w-full rounded-2xl overflow-hidden border border-[#E8E8E4] shadow-sm">
        <MapContainer
          center={center}
          zoom={12.5}
          className="w-full h-full"
          zoomControl={true}
          style={{ background: '#EAE6DF' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Capas WMS de IDESC (Espacio público, ríos) */}
          {wmsLayers.slice(0, 2).map((wms) => (
            <WMSTileLayer
              key={wms.id}
              url={wms.url}
              layers={wms.layers}
              format={wms.format}
              transparent={wms.transparent}
              version={wms.version}
              opacity={wms.opacity}
            />
          ))}

          {/* Vientos reales (Open-Meteo) */}
          {wind.streams.map((stream, idx) => (
            <Polyline
              key={idx}
              positions={stream}
              pathOptions={{
                color: '#2D6A4F',
                weight: 2.5,
                opacity: 0.5,
                className: 'wind-flow-normal',
              }}
            />
          ))}

          {/* Nodos activos agrupados */}
          {clusters.map((cluster, idx) => {
            if (!cluster.coordinates) return null;
            return (
              <Marker
                key={cluster.geohash || idx}
                position={[cluster.coordinates.lat, cluster.coordinates.lng]}
                icon={createClusterIcon(cluster)}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                  <div className="text-xs font-bold p-1">
                    {cluster.nodes.every((n: TangaraNode) => n.sensorType === 'co2' || (n.measurements.ica === 0 && (n.measurements.co2 ?? 0) > 0))
                      ? `${cluster.nodes.length} Sensor CO₂ · ${Math.round(cluster.nodes.reduce((s: number, n: TangaraNode) => s + (n.measurements.co2 ?? 0), 0) / cluster.nodes.length)} ppm`
                      : `${cluster.nodes.length} Sensor(es) · ICA: ${Math.round(cluster.nodes.filter((n: TangaraNode) => n.measurements.ica > 0).reduce((s: number, n: TangaraNode) => s + n.measurements.ica, 0) / Math.max(cluster.nodes.filter((n: TangaraNode) => n.measurements.ica > 0).length, 1))}`
                    }
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[500]">
            <span className="text-xs font-bold text-[#2D6A4F]">Cargando red de monitoreo…</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapaComunas;
