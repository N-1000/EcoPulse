// ===================================================
// TANGARA 2026 - mock/chatData.ts
// Contenido simulado del chatbot (Tangara AI).
// Aquí se editan: mensaje de bienvenida, preguntas sugeridas,
// planes rápidos ("borondos") y respuestas genéricas.
// Cuando se integre la IA real, este archivo se reemplaza por
// llamadas a `src/services/api.ts` (askChatbot).
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
    text: '¿Qué barrios tuvieron mayor contaminación durante diciembre de 2024?',
    answer:
      '¡Buena pregunta, ciudadano! 📊 Según el histórico simulado, en diciembre de 2024 ' +
      'los niveles más altos de PM2.5 se registraron en el centro y el oriente de Cali ' +
      '(zonas de alto tráfico y actividad comercial), con promedios en nivel Moderado a ' +
      'Dañino para grupos sensibles. Cuando conecte la base de datos real de Tangara podré ' +
      'darte el detalle exacto por barrio y por nodo. 😉',
  },
  {
    id: 'sq2',
    text: '¿Cuál será la calidad del aire mañana?',
    answer:
      '🔮 El pronóstico simulado para mañana estima un ICA de 62 (Moderado), con máxima de ' +
      '27°C. Recomendación: actividades al aire libre con precaución, especialmente para ' +
      'grupos sensibles. Muy pronto este pronóstico saldrá de un modelo predictivo real ' +
      'entrenado con los datos históricos de la red Tangara.',
  },
  {
    id: 'sq3',
    text: '¿Qué ruta es más saludable para salir a correr?',
    answer:
      '🏃 ¡La Ruta Saludable es mi especialidad! Con las condiciones actuales, las zonas con ' +
      'mejor aire son Pance (ICA 16) y Ciudad Jardín (ICA 23). Te recomiendo correr por el ' +
      'corredor del río Pance o la ciclovía de la Cra 100 antes de las 9am. Evita el centro, ' +
      'que hoy está en nivel Dañino para grupos sensibles. Pronto podré trazarte la ruta ' +
      'cuadra a cuadra desde tu ubicación. 🗺️',
  },
  {
    id: 'sq4',
    text: '¿Qué nodo presentó más fallas este año?',
    answer:
      '🔧 En los datos simulados, el nodo TANGARA_302 (Alfonso López, Comuna 7) es el que más ' +
      'interrupciones ha tenido: está inactivo desde el 10 de julio. También hay 3 nodos en ' +
      'calibración en Univalle que comparten ubicación — eso es normal, están en banco de ' +
      'pruebas antes de instalarse definitivamente.',
  },
];

/** Planes rápidos ("borondos") con jerga caleña. */
export const QUICK_OPTIONS: QuickOption[] = [
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

/** Respuestas genéricas para texto libre no reconocido. */
export const GENERIC_RESPONSES: string[] = [
  '¡Hola, ciudadano! 🌿 Basándome en el ICA de hoy en 58 (Moderado), te recomiendo un borondo activo pero con precaución en zonas de mayor tráfico. ¿Qué te gustaría hacer? ¿Caminata o bici?',
  '¡Claro que sí, parcero! Con el aire en nivel moderado, hay varias opciones bacanas pa disfrutar Cali sin riesgos. ¿Quieres que te cuente del plan al Pance o prefieres algo en el centro?',
  '¡Mirá ve! La calidad del aire en este momento es moderada (ICA 58). Los grupos sensibles deben tomar precauciones, pero para la mayoría el ambiente está bien. ¿En qué te puedo ayudar?',
  '¡Qué nota, ciudadano! 🌺 Tangara AI está aquí para ayudarte a explorar Cali de forma inteligente y ecológica. Cuéntame más sobre qué plan tienes en mente.',
  '¡Eso está chuzón! Para esa actividad con el ICA actual, lo mejor es hacerlo en la mañana temprano o en la tarde después de las 4pm. ¿Necesitas más detalles del recorrido?',
];
