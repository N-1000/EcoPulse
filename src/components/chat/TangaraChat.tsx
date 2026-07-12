// ===================================================
// TANGARA 2026 - components/chat/TangaraChat.tsx
// Ventana del chatbot "Tangara AI".
// - Encabezado con el logo del proyecto y "Cali - Valle del Cauca".
// - Preguntas sugeridas al iniciar la conversación.
// - Píldoras de planes rápidos ("borondos") y entrada de texto.
//
// INTEGRACIÓN FUTURA: las respuestas se generan localmente desde
// `src/mock/chatData.ts`. Cuando exista el backend, se reemplaza la
// lógica de `respondTo()` por una llamada a POST /api/chat.
// ===================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bird, Circle, MessageCircleQuestion, SendHorizontal, X } from 'lucide-react';
import type { Message, SuggestedQuestion } from '../../types';
import {
  GENERIC_RESPONSES,
  QUICK_OPTIONS,
  SUGGESTED_QUESTIONS,
  WELCOME_MESSAGE,
  type QuickOption,
} from '../../mock/chatData';

// --------------------------------------------------
// Helpers
// --------------------------------------------------
const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

/** Decide la respuesta simulada para un texto del usuario. */
const respondTo = (text: string): string => {
  const lower = text.toLowerCase();
  const suggested = SUGGESTED_QUESTIONS.find(q => lower === q.text.toLowerCase());
  if (suggested) return suggested.answer;
  const matched = QUICK_OPTIONS.find(opt =>
    lower.includes(opt.label.toLowerCase()) || lower.includes(opt.query.toLowerCase())
  );
  return matched ? getRandomItem(matched.responses) : getRandomItem(GENERIC_RESPONSES);
};

// --------------------------------------------------
// Sub-componentes
// --------------------------------------------------
const TypingIndicator = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-palma flex items-center justify-center flex-shrink-0">
        <Bird size={14} className="text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-4">
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 block" />
          <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400 block" />
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message }: { message: Message }) => {
  const isAI = message.sender === 'tangara-ai';

  if (isAI) {
    return (
      <div className="flex items-end gap-2 animate-slide-up">
        <div className="w-7 h-7 rounded-full bg-palma flex items-center justify-center flex-shrink-0">
          <Bird size={14} className="text-white" />
        </div>
        <div className="flex flex-col max-w-[85%]">
          <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-700 leading-relaxed shadow-sm">
            {message.text}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 ml-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 flex-row-reverse animate-slide-up">
      <div className="flex flex-col items-end max-w-[85%]">
        <div className="rounded-2xl rounded-br-sm px-4 py-3 text-sm text-gray-800 leading-relaxed shadow-sm bg-pastel">
          {message.text}
        </div>
        <span className="text-[10px] text-gray-400 mt-1 mr-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

// --------------------------------------------------
// Componente principal
// --------------------------------------------------
const INITIAL_MESSAGE: Message = {
  id: generateId(),
  sender: 'tangara-ai',
  text: WELCOME_MESSAGE,
  timestamp: new Date(),
};

interface TangaraChatProps {
  /** Cierra la ventana del chat (controlada por el Layout). */
  onClose: () => void;
}

const TangaraChat = ({ onClose }: TangaraChatProps) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Las sugerencias se muestran solo al inicio de la conversación.
  const showSuggestions = messages.length <= 1;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendUserMessage = useCallback((text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = {
      id: generateId(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simula latencia de la IA (~700–1200ms).
    const delay = 700 + Math.random() * 500;
    setTimeout(() => {
      const aiMsg: Message = {
        id: generateId(),
        sender: 'tangara-ai',
        text: respondTo(text),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(inputText);
    }
  };

  const handleQuickOption = (option: QuickOption) => {
    sendUserMessage(`${option.emoji} ${option.label}`);
  };

  const handleSuggested = (q: SuggestedQuestion) => {
    sendUserMessage(q.text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ---- Header con el logo del proyecto ---- */}
      <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-2">
          {/* Logo: pájaro + Inteligencia Ambiental Urbana / Cali - Valle del Cauca */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm bg-tangara">
              <Bird size={18} className="text-white" />
            </div>
            <div className="min-w-0 leading-tight">
              <h2 className="text-[13px] font-black text-gray-900 truncate">
                Inteligencia Ambiental Urbana
              </h2>
              <p className="text-[10px] text-tangara font-semibold tracking-wide truncate">
                Cali - Valle del Cauca
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 mr-1">
              <Circle size={8} className="fill-green-500 text-green-500 animate-pulse-dot" />
              <span className="text-[11px] text-green-600 font-medium hidden sm:inline">Activo</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              aria-label="Cerrar chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Tangara AI · Tu guía inteligente para explorar Cali
        </p>
      </div>

      {/* ---- Historial de mensajes ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Preguntas sugeridas (solo al inicio) */}
        {showSuggestions && !isTyping && (
          <div className="animate-fade-in">
            <p className="text-[11px] font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <MessageCircleQuestion size={13} />
              Preguntas sugeridas
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleSuggested(q)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-700 font-medium hover:border-tangara hover:text-tangara hover:shadow-sm transition-all"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <TypingIndicator visible={isTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Píldoras de planes rápidos ---- */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
        <div className="grid grid-cols-2 gap-2">
          {QUICK_OPTIONS.map(option => (
            <button
              key={option.label}
              onClick={() => handleQuickOption(option)}
              disabled={isTyping}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] bg-pastel text-tangara"
              aria-label={`Preguntar sobre ${option.label}`}
            >
              <span>{option.emoji}</span>
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Input de texto ---- */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-white">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 focus-within:border-tangara focus-within:ring-2 focus-within:ring-tangara/10 transition-all">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta…"
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none disabled:opacity-60 min-w-0"
            aria-label="Escribe tu pregunta para Tangara AI"
          />
          <button
            onClick={() => sendUserMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95 bg-palma"
            aria-label="Enviar mensaje"
          >
            <SendHorizontal size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TangaraChat;
