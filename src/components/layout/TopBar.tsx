// ===================================================
// TANGARA 2026 - components/layout/TopBar.tsx
// Barra superior: botón hamburguesa (abre/cierra el sidebar),
// buscador y chip con el ICA actual de Cali.
// ===================================================
import { Menu, Search } from 'lucide-react';
import { airQualityMetrics } from '../../mock/airQualityData';
import { getIcaLevel } from '../../utils/airQuality';

interface TopBarProps {
  onToggleSidebar: () => void;
}

const TopBar = ({ onToggleSidebar }: TopBarProps) => {
  const icaInfo = getIcaLevel(airQualityMetrics.icaGeneral);

  return (
    <div className="flex items-center gap-3 px-5 pt-4 pb-1 flex-shrink-0">
      {/* Hamburger menu */}
      <button
        onClick={onToggleSidebar}
        className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 text-gray-600 hover:text-palma hover:shadow-card-hover transition-all flex-shrink-0"
        aria-label="Abrir o cerrar menú lateral"
      >
        <Menu size={17} />
      </button>

      {/* Buscador */}
      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-gray-100 min-w-0">
        <Search size={15} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Busca barrios, zonas o temas ambientales…"
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
          aria-label="Buscar"
        />
      </div>

      {/* ICA actual + avatar */}
      <div className="hidden sm:flex items-center gap-3 bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100 flex-shrink-0">
        <div className="text-right">
          <p className="text-[10px] text-gray-500 leading-tight">Índice actual (Cali)</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: icaInfo.color }} />
            <span className="text-sm font-bold text-gray-900">{airQualityMetrics.icaGeneral}</span>
            <span className="text-xs text-gray-500">{icaInfo.label}</span>
          </div>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1E5E4A, #0084B4)' }}
        >
          CI
        </div>
      </div>
    </div>
  );
};

export default TopBar;
