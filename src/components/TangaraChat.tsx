// ===================================================
// TANGARA 2026 - TangaraChat.tsx
// Panel lateral del chatbot con IA simulada y jerga caleña
// ===================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { SendHorizontal, Bird, Circle, MoreHorizontal } from 'lucide-react';
import type { Message } from '../types';

// --------------------------------------------------
// Respuestas simuladas de la IA con jerga caleña
// --------------------------------------------------

interface QuickOption {
  label: string;
  emoji: string;
  query: string;
  responses: string[];
}

const QUICK_OPTIONS: QuickOption[] = [
  {
    label: 'Plan Pance',
    emoji: '🏞️',
    query: 'Plan Pance',
    responses: [
      '¡Uff, Pance es una verraquera, ciudadano! 🌿 Con un ICA de 58 (Moderado), te recomiendo ir tempranito antes de las 10am. Lleva hidratación, usa bloqueador y si eres de grupos sensibles, mejor esperar a que baje el ICA. El río está bueno pa\' refrescarse, eso sí.',
      '¡Mirá ve, qué plan tan chuzón! 🏞️ Pance está prendido. El ICA está moderado (58), así que pa grupos sensibles vamos con calma. Lleva un tapaboca ligero si es de los que les da la fiebre. ¡Y no olvides recoger la basura, que Cali es de todos!',
    ],
  },
  {
    label: 'Caminata Ecológica',
    emoji: '🥾',
    query: 'Caminata Ecológica',
    responses: [
      '¡Qué calidoso ese plan! 🥾 Para una caminata ecológica con el ICA actual en 58, te recomiendo los Farallones de Cali o el Bosque Municipal. La madrugada o el tardecito (después de las 4pm) son los mejores horarios porque el ozono baja. ¡Lleva bastante agua, parcero!',
      '¡Sí señor, a caminar se dijo! 🌄 Con aire moderado, la caminata va bien para la mayoría. Evita zonas de alto tráfico como la Calle 5a. Los cerros tutelares son una delicia visual y el aire allá arriba está más fresco. ¡Hay que aprovechar que Cali tiene esa variedad!',
    ],
  },
  {
    label: 'Ruta en Bici',
    emoji: '🚴',
    query: 'Ruta en Bici',
    responses: [
      '¡Ay, parcero, en bici por Cali es una chimba! 🚴 Con ICA 58, si eres ciclista frecuente, te recomiendo la Ciclovía del río Cali o la ruta hacia Ciudad Jardín. Usa tapaboca deportivo liviano y sal antes de las 7am cuando el tráfico y la contaminación están bajos. ¡El MIO te da el resto!',
      '¡Ruta en bici, qué bello plan, causita! 🚲 El Corredor Verde de la Carrera 100 está espectacular. Eso sí, con el ICA moderado de hoy, evita la Avenida Ciudad de Cali a las horas pico. Tempranito en la mañana es tu mejor ventana. ¡Y casco, que eso es ley!',
    ],
  },
  {
    label: 'Turístico / Borondo',
    emoji: '🗺️',
    query: 'Turístico / Borondo',
    responses: [
      '¡Eso es lo que necesitaba escuchar, el borondo! 🗺️ Para un recorrido turístico con este aire, te recomiendo: 1) San Antonio (callejuelas de arte ✨), 2) La Loma de la Cruz (vista épica), 3) Barrio Granada (gastronomía brutal). El centro también está bacano pero lleva tapaboca cerca del Mercado. ¡Cali es verraca!',
      '¡Viva Cali y las que se menean! 🎉 Borondo completo: empieza en el Museo La Tertulia, sube al Cristo Rey para ver toda la ciudad, y termina en Juanchito si quieres la versión nocturna. Con el ICA de hoy en 58, el plan está verde. ¡Lleva hidratación y no dejes de probar el lulada!',
    ],
  },
];

// Respuestas genéricas para mensajes de texto libre
const GENERIC_RESPONSES: string[] = [
  '¡Hola, ciudadano! 🌿 Basándome en el ICA de hoy en 58 (Moderado), te recomiendo un borondo activo pero con precaución en zonas de mayor tráfico. ¿Qué te gustaría hacer? ¿Caminata o bici?',
  '¡Claro que sí, parcero! Con el aire en nivel moderado, hay varias opciones bacanas pa disfrutar Cali sin riesgos. ¿Quieres que te cuente del plan al Pance o prefieres algo en el centro?',
  '¡Mirá ve! La calidad del aire en este momento es moderada (ICA 58). Los grupos sensibles deben tomar precauciones, pero para la mayoría el ambiente está bien. ¿En qué te puedo ayudar?',
  '¡Qué nota, ciudadano! 🌺 Tangara Chat está aquí para ayudarte a explorar Cali de forma inteligente y ecológica. Cuéntame más sobre qué plan tienes en mente.',
  '¡Eso está chuzón! Para esa actividad con el ICA actual, lo mejor es hacerlo en la mañana temprano o en la tarde después de las 4pm. ¿Necesitas más detalles del recorrido?',
];

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getRandomItem = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const formatTime = (date: Date): string =>
  date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

// --------------------------------------------------
// Sub-componentes
// --------------------------------------------------

interface TypingIndicatorProps {
  visible: boolean;
}

const TypingIndicator = ({ visible }: TypingIndicatorProps) => {
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

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
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
        <div
          className="rounded-2xl rounded-br-sm px-4 py-3 text-sm text-gray-800 leading-relaxed shadow-sm"
          style={{ backgroundColor: '#CBE4F9' }}
        >
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
// Mensaje inicial de bienvenida
// --------------------------------------------------
const INITIAL_MESSAGE: Message = {
  id: generateId(),
  sender: 'tangara-ai',
  text: '¡Hola, ciudadano! 🌿 Soy Tangara, tu guía de inteligencia ambiental. Basándome en el ICA de hoy en Cali (58 – Moderado), puedo recomendarte el mejor borondo para disfrutar la ciudad. ¿Qué plan tienes en mente?',
  timestamp: new Date(),
};

// --------------------------------------------------
// Componente principal
// --------------------------------------------------

const TangaraChat = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
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

    // Simula latencia de respuesta de IA (~700–1200ms)
    const delay = 700 + Math.random() * 500;
    setTimeout(() => {
      // Detectar si el texto coincide con alguna opción rápida
      const matchedOption = QUICK_OPTIONS.find(opt =>
        text.toLowerCase().includes(opt.label.toLowerCase()) ||
        text.toLowerCase().includes(opt.query.toLowerCase())
      );

      const responseText = matchedOption
        ? getRandomItem(matchedOption.responses)
        : getRandomItem(GENERIC_RESPONSES);

      const aiMsg: Message = {
        id: generateId(),
        sender: 'tangara-ai',
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [isTyping]);

  const handleSend = () => {
    sendUserMessage(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage(inputText);
    }
  };

  const handleQuickOption = (option: QuickOption) => {
    sendUserMessage(`${option.emoji} ${option.label}`);
  };

  return (
    <aside className="flex flex-col h-full bg-white border-l border-gray-100">
      {/* ---- Header ---- */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-palma flex items-center justify-center shadow-sm">
              <Bird size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 leading-tight">
                Tangara Chat
              </h2>
              <p className="text-[11px] text-gray-500 leading-tight">
                Tu guía de Borondo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de estado activo */}
            <div className="flex items-center gap-1.5">
              <Circle
                size={8}
                className="fill-green-500 text-green-500 animate-pulse-dot"
              />
              <span className="text-[11px] text-green-600 font-medium">Activo</span>
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              aria-label="Más opciones"
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Tu guía inteligente para explorar Cali
        </p>
      </div>

      {/* ---- Historial de mensajes ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <TypingIndicator visible={isTyping} />
        <div ref={messagesEndRef} />
      </div>

      {/* ---- Píldoras de acciones rápidas ---- */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          {QUICK_OPTIONS.map(option => (
            <button
              key={option.label}
              onClick={() => handleQuickOption(option)}
              disabled={isTyping}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: '#CBE4F9',
                color: '#0084B4',
              }}
              aria-label={`Preguntar sobre ${option.label}`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Input de texto ---- */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 focus-within:border-tangara focus-within:ring-2 focus-within:ring-tangara/10 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregúntale a Tangara por un plan hoy…"
            disabled={isTyping}
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none disabled:opacity-60"
            aria-label="Escribe tu pregunta para Tangara"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            style={{ backgroundColor: '#1E5E4A' }}
            aria-label="Enviar mensaje"
          >
            <SendHorizontal size={15} className="text-white" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TangaraChat;
