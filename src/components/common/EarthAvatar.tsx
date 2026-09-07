// ===================================================
// ECOPULSE 2026 - components/common/EarthAvatar.tsx
// Avatar ESTÁTICO de la Tierra (Planeta azul con continentes verdes y rejilla)
// con dos hojas creciendo en la parte superior.
// ===================================================

interface EarthAvatarProps {
  size?: number;
  className?: string;
}

export const EarthAvatar = ({ size = 28, className = '' }: EarthAvatarProps) => (
  <div
    className={`relative flex-shrink-0 flex items-center justify-center rounded-full shadow-md overflow-hidden bg-gradient-to-br from-[#0F3854] via-[#0A2540] to-[#051525] ${className}`}
    style={{ width: size, height: size }}
  >
    <svg
      width={size * 0.85}
      height={size * 0.85}
      viewBox="0 0 24 24"
      fill="none"
      className="relative z-10"
    >
      {/* ── Océano Azul Tierra ── */}
      <circle cx="12" cy="14" r="7.5" fill="#0D4B75" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.6" />

      {/* ── Continentes en Verde Vivo ── */}
      {/* América del Norte */}
      <path
        d="M6.8 9.5C7.2 8.5 8.5 8.8 9.2 9.8C9.8 10.8 8.8 11.8 7.8 11.8C6.8 11.8 6.4 10.5 6.8 9.5Z"
        fill="#22C55E"
      />
      {/* América del Sur */}
      <path
        d="M7.5 13C8 12.5 9.2 13 9 14.8C8.8 16.2 7.5 16.8 7 15.8C6.6 14.8 7 13.5 7.5 13Z"
        fill="#16A34A"
      />
      {/* Europa / África */}
      <path
        d="M13 9.8C14.2 8.8 15.8 9.5 15.2 11C14.6 12.5 15.2 14.5 14 15.8C13 16.5 12.4 14.8 13 13.5C13.6 12.2 12 11 13 9.8Z"
        fill="#22C55E"
      />

      {/* ── Rejilla Global (Ecuador + Meridiano) ── */}
      <ellipse cx="12" cy="14" rx="7.5" ry="2.3" stroke="white" strokeWidth="0.7" strokeOpacity="0.4" fill="none" />
      <ellipse cx="12" cy="14" rx="3.5" ry="7.5" stroke="white" strokeWidth="0.7" strokeOpacity="0.35" fill="none" />

      {/* ── Anillo Atmosférico Celesta ── */}
      <circle cx="12" cy="14" r="7.5" stroke="#7DD3FC" strokeWidth="1" strokeOpacity="0.45" fill="none" />

      {/* ── Hojas Creciendo (Estáticas) ── */}
      <g>
        {/* Tallo central */}
        <path d="M12 9.5V3.2" stroke="#4ADE80" strokeWidth="1.6" strokeLinecap="round" />

        {/* Hoja izquierda */}
        <path
          d="M12 6.8C9.2 5.6 8 3.5 10.2 2.4C11.6 3.1 12 5.6 12 6.8Z"
          fill="#4ADE80"
          stroke="#16A34A"
          strokeWidth="0.4"
        />

        {/* Hoja derecha */}
        <path
          d="M12 5.2C14.8 4 16 1.8 13.8 0.8C12.4 1.5 12 4 12 5.2Z"
          fill="#22C55E"
          stroke="#15803D"
          strokeWidth="0.4"
        />
      </g>
    </svg>

    {/* Resplandor atmosférico fino */}
    <div className="absolute inset-0 rounded-full border border-sky-300/30 pointer-events-none" />
  </div>
);

export default EarthAvatar;
