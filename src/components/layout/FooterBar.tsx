// ===================================================
// ECOPULSE 2026 - components/dashboard/FooterBar.tsx
// Barra inferior: navegación pills + redes sociales + logos
// ===================================================
import type { PageId } from '../../types';

interface FooterBarProps {
  onNavigate: (page: PageId) => void;
}

const FooterBar = ({ onNavigate }: FooterBarProps) => {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 px-8 py-4 border-t border-[#DDD5C4] bg-[#EDE3CE] mt-6">
      {/* Navegación pills izquierda */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-[#5A5A56]">
        <button className="opacity-50">‹</button>
        {(['inicio', 'mapa', 'calidad-aire', 'sobre'] as PageId[]).map((id, i) => {
          const labels: Record<string, string> = {
            'inicio': 'Inicio', 'mapa': 'Mapas',
            'calidad-aire': 'Datos', 'sobre': 'Nosotros',
          };
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="hover:text-[#1A1A18] transition-colors"
            >
              {labels[id]}
            </button>
          );
        })}
      </nav>

      {/* Redes sociales centro */}
      <div className="flex items-center gap-3">
        {[
          { label: 'f', href: '#' },
          { label: '𝕏', href: '#' },
          { label: '◯', href: '#' },
          { label: '▶', href: '#' },
        ].map((s, i) => (
          <a
            key={i}
            href={s.href}
            className="w-8 h-8 rounded-full bg-[#3A3A36] flex items-center justify-center text-white text-xs font-bold hover:bg-[#2D6A4F] transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Logos derecha */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-[8px] font-black">🌱</div>
          <span className="text-xs font-bold text-[#2D6A4F]">EcoPulse</span>
        </div>
        <div className="w-px h-5 bg-[#C8BFA8]" />
        <span className="text-[9px] text-[#8C8C86] font-semibold uppercase tracking-wide">Alcaldía de Cali</span>
        <div className="w-px h-5 bg-[#C8BFA8]" />
        <span className="text-[9px] text-[#8C8C86] font-semibold uppercase tracking-wide">CVC</span>
      </div>
    </footer>
  );
};

export default FooterBar;
