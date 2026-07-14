// ===================================================
// TANGARA 2026 - mock/chatData.ts
// Texto de la interfaz del chatbot Tangara AI.
// Las respuestas se generarán desde el backend cuando se conecte la IA real.
// ===================================================
import type { SuggestedQuestion } from '../types';

export interface QuickOption {
  label: string;
  emoji: string;
  query: string;
  responses: string[];
}

/** Mensaje inicial del asistente. */
export const WELCOME_MESSAGE =
  'Hola, soy Tangara AI. 🌿 Puedo ayudarte a analizar la calidad del aire, ' +
  'generar predicciones y responder preguntas sobre los datos históricos de Cali. ' +
  '¿En qué puedo ayudarte hoy?';

/** Preguntas sugeridas que aparecen al abrir el chat. */
export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    id: 'sq1',
    text: '¿Cuál es el nodo con mayor contaminación ahora mismo?',
    answer:
      '📊 Estoy consultando los datos en tiempo real de la red Tángara... ' +
      'Revisa el mapa para ver el semáforo actualizado por nodo.',
  },
  {
    id: 'sq2',
    text: '¿Cuál será la calidad del aire mañana?',
    answer:
      '🔮 El modelo predictivo de Tángara estima la calidad del aire para las próximas 24 horas. ' +
      'Ve a la sección "Predicciones" para ver el pronóstico detallado por zona.',
  },
  {
    id: 'sq3',
    text: '¿Qué ruta es más saludable para salir a correr?',
    answer:
      '🏃 ¡La Ruta Saludable es mi especialidad! Dirígete a la sección "Mapa" y activa la ' +
      'herramienta de Ruta Saludable para trazar el camino con menor ICA desde tu ubicación.',
  },
  {
    id: 'sq4',
    text: '¿Qué comunas tienen el aire más limpio en Cali?',
    answer:
      '🌿 Históricamente, las comunas del sur (Pance, Ciudad Jardín) y el occidente tienen ' +
      'menor concentración de PM2.5 gracias a la influencia de los vientos de los Farallones. ' +
      'Consulta "Estadísticas" para el ranking actualizado.',
  },
];

/** Planes rápidos ("borondos") con jerga caleña. */
export const QUICK_OPTIONS: QuickOption[] = [
  {
    label: 'Plan Pance',
    emoji: '🏞️',
    query: 'Plan Pance',
    responses: [
      '¡Uff, Pance es una verraquera, ciudadano! 🌿 Consulta el sensor más cercano en el mapa para ver el ICA en tiempo real antes de salir. El río está bueno pa\' refrescarse, eso sí.',
      '¡Mirá ve, qué plan tan chuzón! 🏞️ Revisa el semáforo del nodo Pance en el mapa. Si está verde, ¡vamos! ¡Y no olvides recoger la basura, que Cali es de todos!',
    ],
  },
  {
    label: 'Caminata Ecológica',
    emoji: '🥾',
    query: 'Caminata Ecológica',
    responses: [
      '¡Qué calidoso ese plan! 🥾 Antes de salir, revisa el ICA de tu zona en el mapa Tángara. La madrugada o el tardecito (después de las 4pm) suelen ser los mejores horarios. ¡Lleva bastante agua, parcero!',
      '¡Sí señor, a caminar se dijo! 🌄 Usa la Ruta Saludable del mapa para evitar zonas de alto tráfico. Los cerros tutelares tienen el aire más fresco de la ciudad.',
    ],
  },
  {
    label: 'Ruta en Bici',
    emoji: '🚴',
    query: 'Ruta en Bici',
    responses: [
      '¡Ay, parcero, en bici por Cali es una chimba! 🚴 Activa la modalidad "Bicicleta" en la Ruta Saludable del mapa para encontrar el camino con mejor calidad del aire. ¡Y casco, que eso es ley!',
      '¡Ruta en bici, qué bello plan, causita! 🚲 Consulta el mapa para ver qué nodos están en verde hoy. Sal tempranito antes de las 7am cuando el tráfico y la contaminación están bajos.',
    ],
  },
  {
    label: 'Turístico / Borondo',
    emoji: '🗺️',
    query: 'Turístico / Borondo',
    responses: [
      '¡Eso es lo que necesitaba escuchar, el borondo! 🗺️ Revisa el semáforo del mapa Tángara para los barrios del plan: San Antonio, La Loma de la Cruz, Barrio Granada. Si están en verde, ¡vamos que Cali es verraca!',
      '¡Viva Cali! 🎉 Antes del borondo, chequea el ICA en el mapa. Empieza en el Museo La Tertulia, sube al Cristo Rey y termina donde el cuerpo aguante. ¡Hidratación y protector solar!',
    ],
  },
];

/** Respuestas genéricas para texto libre no reconocido. */
export const GENERIC_RESPONSES: string[] = [
  '¡Hola, ciudadano! 🌿 Revisa el mapa Tángara para ver la calidad del aire en tiempo real en tu zona. ¿Qué te gustaría hacer hoy?',
  '¡Claro que sí, parcero! Consulta el semáforo ICA en el mapa para planear tu actividad de forma segura. ¿Caminata, bici o borondo?',
  '¡Mirá ve! La red Tángara tiene datos en tiempo real del aire de Cali. ¿En qué te puedo ayudar?',
  '¡Qué nota, ciudadano! 🌺 Tangara AI está aquí para ayudarte a explorar Cali de forma inteligente y ecológica. Cuéntame más sobre qué plan tienes en mente.',
  '¡Eso está chuzón! Para esa actividad, lo mejor es revisar el ICA en el mapa antes de salir. ¿Necesitas más información?',
];
