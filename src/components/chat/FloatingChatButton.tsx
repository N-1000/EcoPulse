// ===================================================
// TANGARA 2026 - components/chat/FloatingChatButton.tsx
// Botón flotante (ave) que abre/cierra el chatbot.
// Permanece SIEMPRE visible con position:fixed en la esquina
// inferior izquierda, incluso al hacer scroll.
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
      fixed bottom-5 left-5 z-[60] w-14 h-14 rounded-full shadow-lg
      flex items-center justify-center transition-all duration-300
      hover:scale-110 active:scale-95
      ${isOpen ? 'bg-tangara rotate-6' : 'bg-palma'}
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
