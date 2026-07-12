// ===================================================
// TANGARA 2026 - components/dashboard/HeroBanner.tsx
// Banner principal: "Así está el aire en Cali hoy" sobre el mural
// del Túnel Mundialista, con el logo del proyecto arriba a la derecha.
//
// IMAGEN DEL MURAL: coloca la fotografía real en `public/hero-mural.jpg`.
// Si el archivo existe, se muestra automáticamente; si no, se renderiza
// una recreación SVG inspirada en el mural (aves, fauna, flora y figuras).
// ===================================================
import { useState } from 'react';
import { ChevronRight, Navigation, Wind } from 'lucide-react';
import { airQualityMetrics } from '../../mock/airQualityData';
import { getIcaLevel } from '../../utils/airQuality';
import BrandLogo from '../common/BrandLogo';

/** Recreación SVG del mural (fallback cuando no existe public/hero-mural.jpg). */
const MuralArt = () => (
  <svg
    viewBox="0 0 900 220"
    className="absolute inset-0 w-full h-full"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    {/* Fondo amarillo mural */}
    <rect width="900" height="220" fill="#FFD100" />
    {/* Colinas verdes */}
    <path d="M0 220 Q120 130 260 185 Q380 230 470 195 L470 220 Z" fill="#1E5E4A" opacity="0.75" />
    <path d="M0 220 Q90 160 200 200 L200 220 Z" fill="#2A7A62" opacity="0.8" />
    {/* Sol / mandala */}
    <circle cx="620" cy="70" r="52" fill="#E67E00" opacity="0.55" />
    <circle cx="620" cy="70" r="34" fill="#FFD100" opacity="0.9" />
    <circle cx="620" cy="70" r="20" fill="#0084B4" opacity="0.45" />
    {/* Río */}
    <path d="M700 220 Q740 170 810 160 Q870 152 900 120 L900 220 Z" fill="#0084B4" opacity="0.55" />
    <path d="M730 220 Q770 185 830 175 Q880 168 900 150 L900 220 Z" fill="#009DD4" opacity="0.4" />
    {/* Rostros / figuras estilizadas */}
    <ellipse cx="450" cy="120" rx="55" ry="75" fill="#B45309" opacity="0.55" />
    <ellipse cx="530" cy="130" rx="42" ry="62" fill="#92400E" opacity="0.45" />
    <circle cx="530" cy="112" r="16" fill="#0084B4" opacity="0.5" />
    {/* Pájaro tangara grande */}
    <g opacity="0.85">
      <ellipse cx="120" cy="95" rx="38" ry="26" fill="#0084B4" />
      <circle cx="150" cy="78" r="14" fill="#111827" />
      <path d="M158 76 L178 72 L160 84 Z" fill="#374151" />
      <path d="M88 92 Q60 76 48 96 Q72 104 88 100 Z" fill="#009DD4" />
      <ellipse cx="118" cy="102" rx="22" ry="12" fill="#CBE4F9" opacity="0.9" />
    </g>
    {/* Flor / orquídea */}
    <g opacity="0.7">
      <circle cx="815" cy="70" r="12" fill="#DB2777" />
      <ellipse cx="800" cy="55" rx="12" ry="18" fill="#EC4899" transform="rotate(-30 800 55)" />
      <ellipse cx="830" cy="55" rx="12" ry="18" fill="#EC4899" transform="rotate(30 830 55)" />
      <ellipse cx="815" cy="92" rx="12" ry="18" fill="#EC4899" />
    </g>
    {/* Hojas tropicales */}
    <path d="M330 0 Q370 60 340 120 Q300 60 330 0Z" fill="#1E5E4A" opacity="0.4" />
    <path d="M700 0 Q760 50 750 120 Q700 80 700 0Z" fill="#1E5E4A" opacity="0.45" />
    <path d="M760 10 Q815 65 795 140 Q750 95 760 10Z" fill="#2A7A62" opacity="0.4" />
  </svg>
);

interface HeroBannerProps {
  /** Navega a la vista "Explorar mapa". */
  onExploreMap: () => void;
}

const HeroBanner = ({ onExploreMap }: HeroBannerProps) => {
  const icaInfo = getIcaLevel(airQualityMetrics.icaGeneral);
  const [muralLoaded, setMuralLoaded] = useState(false);

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-card"
      style={{ backgroundColor: '#FFD100', minHeight: '210px' }}
    >
      {/* Fondo: mural (foto real si existe; si no, arte SVG) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!muralLoaded && <MuralArt />}
        <img
          src="/hero-mural.jpg"
          alt=""
          aria-hidden="true"
          onLoad={() => setMuralLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            muralLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {/* Degradado para legibilidad del texto a la izquierda */}
        <div className="absolute inset-0 bg-gradient-to-r from-citrico via-citrico/70 to-transparent" />
      </div>

      {/* Logo del proyecto (esquina superior derecha, como en el mural) */}
      <div className="absolute top-4 right-5 z-10 hidden sm:block">
        <div className="bg-white/85 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm border border-white/60">
          <BrandLogo size="sm" variant="light" />
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-6 flex flex-col justify-between" style={{ minHeight: '210px' }}>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
            Así está el aire en Cali hoy 🌿
          </h1>
          <p className="text-sm text-gray-800 font-medium mt-0.5">
            Datos en tiempo real de nuestra ciudad
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mt-4">
          {/* ICA Card flotante */}
          <div className="inline-flex flex-col bg-white/85 backdrop-blur-sm rounded-xl px-5 py-3 shadow-sm border border-white/50 max-w-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              <Wind size={13} />
              Índice de Calidad del Aire (ICA)
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-5xl font-black text-gray-900">
                {airQualityMetrics.icaGeneral}
              </span>
              <div>
                <span className="text-base font-bold" style={{ color: icaInfo.color }}>
                  {icaInfo.label}
                </span>
                <p className="text-xs text-gray-600 mt-0.5">{icaInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Botón Mapa en vivo */}
          <button
            onClick={onExploreMap}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105 active:scale-95 bg-palma"
          >
            <Navigation size={14} />
            Ver mapa en vivo
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
