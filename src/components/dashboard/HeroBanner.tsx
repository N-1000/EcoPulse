// ===================================================
// ECOPULSE 2026 - components/dashboard/HeroBanner.tsx
// Hero inmersivo 100vh (Full Viewport): imagen panorámica
// completa de Cali, titulares, píldora ICA y botón de scroll.
// ===================================================
import { useAirQuality } from '../../hooks/useAirQuality';
import { getIcaLevel } from '../../utils/airQuality';
import { ChevronDown } from 'lucide-react';

interface HeroBannerProps {
  onExploreMap: () => void;
}

const HeroBanner = ({ onExploreMap }: HeroBannerProps) => {
  const { metrics } = useAirQuality();
  const icaInfo = getIcaLevel(metrics.icaGeneral);

  const scrollToDatos = () => {
    document.getElementById('sec-datos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#162A1F]">

      {/* ── Nueva Ilustración HD de Cali (16:9 de ultra alta resolución) ── */}
      <img
        src="/images/cali.png"
        alt="Santiago de Cali - Cristo Rey y Farallones"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] opacity-95 scale-100"
      />

      {/* ── Sombra superior para alto contraste del título ── */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 via-black/25 to-transparent pointer-events-none" />

      {/* ── Sombra inferior suave que conecta con el fondo crema ── */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F2E8D5] via-[#F2E8D5]/65 to-transparent pointer-events-none" />

      {/* ── Contenido central editorial a pantalla completa ── */}
      <div className="relative z-10 w-full max-w-[1380px] mx-auto flex-1 flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-16 pb-8">

        {/* Encabezado superior */}
        <div className="flex flex-col items-center max-w-3xl mt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-white text-xs font-semibold uppercase tracking-widest mb-5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            EcoPulse · Red Ambiental de Cali
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.08] mb-4 select-none drop-shadow-2xl"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
          >
            Respira la ciudad con certeza.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-emerald-50 font-medium max-w-xl mx-auto drop-shadow-lg" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            Monitoreo atmosférico de alta resolución en tiempo real para proteger tu salud y planificar tus actividades al aire libre.
          </p>
        </div>

        {/* ── Píldora ICA interactiva central ── */}
        <div className="my-auto py-6 flex flex-col items-center gap-3">
          <button
            onClick={onExploreMap}
            className="group inline-flex items-center gap-4 px-9 py-4 rounded-full shadow-2xl border border-white/80 hover:border-white transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
          >
            {/* Ícono de Hoja */}
            <div className="w-11 h-11 rounded-full bg-[#2D6A4F] group-hover:bg-[#1E4D38] transition-colors flex items-center justify-center shadow-md flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 6C5 4.8 8 4.8 11 6C14 7.2 17 7.2 21 6" stroke="#A7F3D0" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
                <path d="M1 10C4 8.8 7 8.8 10 10" stroke="#A7F3D0" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.65" />
                <path d="M11 20A7 7 0 0 0 18 13V7h-6a7 7 0 0 0-7 7 7 7 0 0 0 6 6Z" fill="#22C55E" stroke="white" strokeWidth="1.5" />
                <path d="M11 20v-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-5xl font-black text-[#1A1A18] tracking-tight">
                ICA {metrics.icaGeneral}
              </span>
              <span className="text-2xl text-[#9C9C92] font-light">·</span>
              <span className="text-3xl sm:text-5xl font-black" style={{ color: icaInfo.color }}>
                {icaInfo.label}
              </span>
            </div>

            <span className="text-xs font-bold text-[#2D6A4F] ml-2 group-hover:translate-x-1 transition-transform">
              Ver mapa →
            </span>
          </button>

          <div
            className="px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: icaInfo.color,
              backdropFilter: 'blur(10px)',
            }}
          >
            Calidad del aire {icaInfo.label.toLowerCase()} en Santiago de Cali
          </div>
        </div>

        {/* ── Pie del Hero: Indicadores y botón de scroll ── */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-stone-800 font-bold bg-white/75 backdrop-blur-md px-6 py-2 rounded-full border border-white/60 shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>Sensores IoT en tiempo real</span>
            </div>
            <div className="hidden sm:inline-block text-stone-400">·</div>
            <div className="flex items-center gap-2">
              <span className="text-[#2D6A4F] font-bold">22 Comunas</span>
              <span>monitoreadas</span>
            </div>
            <div className="hidden sm:inline-block text-stone-400">·</div>
            <div className="flex items-center gap-2">
              <span className="text-[#D05A3F] font-bold">Ruta Saludable</span>
              <span>calculada con IA</span>
            </div>
          </div>

          <button
            onClick={scrollToDatos}
            className="flex flex-col items-center text-[#2D6A4F] text-xs font-bold hover:text-[#1A1A18] transition-colors pt-2 group cursor-pointer"
          >
            <span className="text-[11px] uppercase tracking-widest text-stone-700 group-hover:text-[#1A1A18]">
              Desliza para explorar
            </span>
            <ChevronDown size={18} className="animate-bounce mt-0.5 text-[#2D6A4F]" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default HeroBanner;
