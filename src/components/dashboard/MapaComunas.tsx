// ===================================================
// TANGARA 2026 - components/dashboard/MapaComunas.tsx
// Tarjeta con el mini-mapa SVG de comunas y leyenda ICA.
// El botón "Explorar Mapa" navega a la vista completa del mapa.
// ===================================================
import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { comunasData } from '../../mock/airQualityData';
import { ICA_LEVELS } from '../../utils/airQuality';

interface MapaComunasProps {
  onExploreMap: () => void;
}

const MapaComunas = ({ onExploreMap }: MapaComunasProps) => {
  const [hoveredComuna, setHoveredComuna] = useState<number | null>(null);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Calidad del aire por comunas</h3>
          <p className="text-xs text-gray-500 mt-0.5">Promedio ICA hoy</p>
        </div>
        <button
          onClick={onExploreMap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 bg-palma"
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

export default MapaComunas;
