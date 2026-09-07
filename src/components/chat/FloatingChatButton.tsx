// ===================================================
// ECOPULSE 2026 - components/chat/FloatingChatButton.tsx
// Botón flotante del chatbot IA.
// - z-[9999]: Permanece SIEMPRE por encima de mapas, popups y overlays.
// - Tamaño compacto (w-12 h-12) y bordes redondeados para no tapar texto ni ser invasivo.
// - Se desliza suavemente al abrir el panel de chat.
// ===================================================
import { X } from 'lucide-react';
import EarthAvatar from '../common/EarthAvatar';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const FloatingChatButton = ({ isOpen, onToggle }: FloatingChatButtonProps) => (
  <div
    className={`
      fixed bottom-6 z-[9999] transition-all duration-300 ease-in-out
      ${isOpen ? 'right-6 lg:right-[385px]' : 'right-6'}
    `}
  >
    <button
      onClick={onToggle}
      className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#2D6A4F] text-white shadow-[0_8px_25px_rgba(45,106,79,0.45)] border border-white/20 backdrop-blur-md hover:bg-[#1F4A37] hover:scale-105 active:scale-95 transition-all duration-300"
      aria-label={isOpen ? 'Cerrar asistente EcoPulse AI' : 'Abrir asistente EcoPulse AI'}
      aria-expanded={isOpen}
    >
      {/* Halo de pulso continuo cuando está cerrado */}
      {!isOpen && (
        <span className="absolute -inset-1.5 rounded-full bg-[#2D6A4F]/30 animate-ping opacity-75 pointer-events-none" />
      )}

      {/* Ícono dinámico: EarthAvatar cuando cerrado, X cuando abierto */}
      {isOpen ? (
        <X size={20} className="relative z-10 transition-transform duration-300 rotate-90 group-hover:rotate-0" />
      ) : (
        <EarthAvatar size={40} className="relative z-10 group-hover:scale-105 transition-transform" />
      )}

      {/* Tooltip flotante en hover */}
      <span className="absolute right-14 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#1A1A18]/90 text-white text-[11px] font-bold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg border border-white/10 backdrop-blur-sm hidden sm:block">
        {isOpen ? 'Cerrar asistente' : 'Asistente EcoPulse AI'}
      </span>
    </button>
  </div>
);

export default FloatingChatButton;
