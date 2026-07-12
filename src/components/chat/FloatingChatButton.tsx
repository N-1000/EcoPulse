// ===================================================
// TANGARA 2026 - components/chat/FloatingChatButton.tsx
// Botón flotante (ave) que abre/cierra el chatbot.
// Permanece SIEMPRE visible con position:fixed en la esquina
// inferior DERECHA, incluso al hacer scroll.
// - Chat cerrado: esquina inferior derecha (right-5).
// - Chat abierto (escritorio): se desliza a la izquierda del panel
//   del chat (370px + margen) para no quedar cubierto por él.
// - Chat abierto (móvil): se oculta, porque el panel ocupa casi
//   toda la pantalla y tiene su propio botón de cierre (X).
// ===================================================
import { Bird } from 'lucide-react';

interface FloatingChatButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

const FloatingChatButton = ({ isOpen, onToggle }: FloatingChatButtonProps) => (
  <button
    onClick={onToggle}
    className={`
      fixed bottom-5 z-[60] w-14 h-14 rounded-full shadow-lg
      items-center justify-center transition-all duration-300
      hover:scale-110 active:scale-95
      ${isOpen
        ? 'hidden lg:flex lg:right-[386px] bg-tangara rotate-6'
        : 'flex right-5 bg-palma'}
    `}
    aria-label={isOpen ? 'Cerrar Tangara AI' : 'Abrir Tangara AI'}
    aria-expanded={isOpen}
  >
    {/* Anillo decorativo cuando está cerrado */}
    {!isOpen && (
      <span className="absolute -inset-1 rounded-full border-2 border-palma/30" />
    )}
    <Bird size={24} className="text-white relative z-10" />
  </button>
);

export default FloatingChatButton;
