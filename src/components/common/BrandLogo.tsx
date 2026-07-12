// ===================================================
// TANGARA 2026 - components/common/BrandLogo.tsx
// Logotipo del proyecto: pájaro azul (tangara) +
// "Inteligencia Ambiental Urbana" / "Cali - Valle del Cauca".
// Reutilizado en: sidebar, hero banner y encabezado del chatbot.
// ===================================================
import { Bird } from 'lucide-react';

interface BrandLogoProps {
  /** Tamaño general del logo. */
  size?: 'sm' | 'md' | 'lg';
  /** Colores adaptados a fondos oscuros/amarillos ('dark') o claros ('light'). */
  variant?: 'light' | 'dark';
}

const SIZES = {
  sm: { icon: 16, box: 'w-8 h-8',  title: 'text-sm',  subtitle: 'text-[10px]' },
  md: { icon: 20, box: 'w-10 h-10', title: 'text-base', subtitle: 'text-[11px]' },
  lg: { icon: 26, box: 'w-12 h-12', title: 'text-xl',  subtitle: 'text-xs' },
} as const;

const BrandLogo = ({ size = 'md', variant = 'light' }: BrandLogoProps) => {
  const s = SIZES[size];
  const titleColor = variant === 'light' ? 'text-gray-900' : 'text-white';
  const subtitleColor = variant === 'light' ? 'text-tangara' : 'text-white/85';

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {/* Pájaro azul tangara */}
      <div
        className={`${s.box} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-tangara`}
      >
        <Bird size={s.icon} className="text-white" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className={`${s.title} ${titleColor} font-black truncate`}>
          Inteligencia Ambiental Urbana
        </p>
        <p className={`${s.subtitle} ${subtitleColor} font-semibold tracking-wide truncate`}>
          Cali - Valle del Cauca
        </p>
      </div>
    </div>
  );
};

export default BrandLogo;
