// ===================================================
// ECOPULSE 2026 - components/chat/FloatingChatButton.tsx
// Botón flotante del chatbot IA.
// - z-[9999]: Permanece SIEMPRE por encima de mapas, popups y overlays.
// - Cerrado: píldora con texto ("Pregúntale al aire de Cali") -- antes era
//   un círculo genérico sin texto, indistinguible de cualquier otro FAB
//   (feedback de diseño: EcoPulse existe para generar conversaciones reales
//   contra MuadDib, un ícono mudo no invita a nadie a escribir).
// - Abierto: colapsa a un círculo compacto (X) para no competir con el
//   panel de chat ya visible.
// - Se desliza suavemente al abrir el panel de chat.
// ===================================================
import { MessageCircle, X } from 'lucide-react';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Oculto por default -- ver el comentario en Layout.tsx sobre por qué (choca con el
   * Hero en viewports bajos). Siempre visible una vez que el padre decide mostrarlo. */
  visible: boolean;
}

const FloatingChatButton = ({ isOpen, onToggle, visible }: FloatingChatButtonProps) => (
  <div
    className={`
      fixed bottom-6 z-[9999] transition-all duration-300 ease-in-out
      ${isOpen ? 'right-6 lg:right-[385px]' : 'right-6'}
      ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-3 pointer-events-none'}
    `}
    aria-hidden={!visible}
  >
    <button
      onClick={onToggle}
      className={`group relative flex items-center justify-center rounded-full bg-lima text-noche shadow-[0_8px_25px_rgba(163,230,53,0.45)] border border-white/40 backdrop-blur-md hover:bg-lima-dark hover:scale-105 active:scale-95 transition-all duration-300 ${
        isOpen ? 'w-12 h-12' : 'h-12 pl-4 pr-5 gap-2'
      }`}
      aria-label={isOpen ? 'Cerrar asistente EcoPulse AI' : 'Pregúntale al aire de Cali'}
      aria-expanded={isOpen}
    >
      {/* Halo de pulso continuo cuando está cerrado */}
      {!isOpen && (
        <span className="absolute -inset-1.5 rounded-full bg-lima/30 animate-ping opacity-75 pointer-events-none" />
      )}

      {isOpen ? (
        <X size={20} className="relative z-10 transition-transform duration-300 rotate-90 group-hover:rotate-0" />
      ) : (
        <>
          <MessageCircle size={20} className="relative z-10 flex-shrink-0" />
          <span className="relative z-10 text-sm font-bold whitespace-nowrap">
            Pregúntale al aire de Cali
          </span>
        </>
      )}
    </button>
  </div>
);

export default FloatingChatButton;
