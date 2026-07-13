// ===================================================
// TANGARA 2026 - components/dashboard/MapaComunas.tsx
// Mini-mapa interactivo de comunas — Light Mode Premium
// El botón "Explorar Mapa" navega a la vista completa del mapa.
// ===================================================
import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { comunasData } from '../../mock/airQualityData';
import { ICA_LEVELS } from '../../utils/airQuality';

// --------------------------------------------------
// Custom DivIcon para las comunas (diseño premium light)
// --------------------------------------------------
const createComunaIcon = (comuna: any, isHovered: boolean) => {
  const color = comuna.color;
  const size = isHovered ? 26 : 20;
  const haloSize = isHovered ? 58 : 44;

  const html = `
    <div style="position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
      <!-- Halo suave pulsante -->
      <div class="neon-halo" style="
        position:absolute;
        width:${haloSize}px; height:${haloSize}px;
        border-radius:50%;
        background: radial-gradient(circle, ${color}25 0%, ${color}00 70%);
        animation: comunaPulse 2.5s cubic-bezier(0.4,0,0.6,1) infinite;
      "></div>

      <!-- Badge principal -->
      <div style="
        position:absolute;
        width:${size}px; height:${size}px;
        border-radius:50%;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.95);
        display:flex; align-items:center; justify-content:center;
        box-shadow: 0 0 10px ${color}55, 0 4px 12px rgba(0,0,0,0.12);
        transition: all 0.2s ease-in-out;
      ">
        <span style="
          color:white;
          font-weight:900;
          font-size:${isHovered ? '10px' : '8px'};
          letter-spacing:-0.5px;
          line-height:1;
          font-family: Inter, system-ui, sans-serif;
        ">${comuna.ica}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'bg-transparent border-none',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

interface MapaComunasProps {
  onExploreMap: () => void;
}

const MapaComunas = ({ onExploreMap }: MapaComunasProps) => {
  const [hoveredComuna, setHoveredComuna] = useState<number | null>(null);

  // Centro aproximado de Cali para el mini-mapa
  const caliCenter: [number, number] = [3.4350, -76.5180];

  return (
    <div className="card p-5">
      {/* Keyframes para halos de los marcadores */}
      <style>{`
        @keyframes comunaPulse {
          0%, 100% { transform: scale(0.88); opacity: 0.5; }
          50%       { transform: scale(1.25); opacity: 0.15; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Calidad del aire por comunas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Promedio ICA hoy</p>
        </div>
        <button
          onClick={onExploreMap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] bg-palma z-[400]"
        >
          <Leaf size={12} />
          Explorar Mapa
        </button>
      </div>

      <div className="flex gap-4">
        {/* Mini-mapa Leaflet (Light Mode — CartoDB Positron) */}
        <div className="relative flex-1 h-[280px] rounded-xl overflow-hidden border border-gray-200 shadow-[inset_0_1px_4px_rgba(0,0,0,0.04)]">
          <MapContainer 
            center={caliCenter} 
            zoom={11} 
            className="w-full h-full z-0 relative"
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {comunasData.map(comuna => {
              const isHovered = hoveredComuna === comuna.id;
              if (!comuna.coordinates) return null;
              
              return (
                <Marker
                  key={comuna.id}
                  position={[comuna.coordinates.lat, comuna.coordinates.lng]}
                  icon={createComunaIcon(comuna, isHovered)}
                  eventHandlers={{
                    mouseover: () => setHoveredComuna(comuna.id),
                    mouseout: () => setHoveredComuna(null),
                  }}
                >
                  <Tooltip 
                    direction="top" 
                    offset={[0, -10]} 
                    opacity={0.97}
                    className="!bg-white !text-gray-800 !border !border-gray-100 !rounded-xl !px-3 !py-2 !text-[11px] !font-bold !shadow-lg"
                  >
                    {comuna.name} · ICA {comuna.ica}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Leyenda ICA */}
        <div className="flex flex-col justify-center gap-2.5 min-w-[130px] z-[400]">
          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Leyenda ICA</p>
          {ICA_LEVELS.slice(0, 4).map(lvl => (
            <div key={lvl.level} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: lvl.color }}
              />
              <div className="text-[10px] text-gray-600 leading-tight">
                <span className="font-bold block text-gray-700">{lvl.label}</span>
                <span className="text-gray-400">({lvl.range[0]}–{lvl.range[1]})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapaComunas;
