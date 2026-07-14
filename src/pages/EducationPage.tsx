// ===================================================
// TANGARA 2026 - pages/EducationPage.tsx
// Educación Ambiental y Guía del Aire de Cali
// ===================================================
import { useState } from 'react';
import { Leaf, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';
import { ICA_LEVELS } from '../mock/airQualityData';
import { levelColor } from '../utils/airQuality';

const FAQS = [
  {
    q: '¿Qué es el material particulado PM2.5?',
    a: 'Son partículas ultra finas suspendidas en el aire con un diámetro menor a 2.5 micrómetros (100 veces más delgadas que un cabello humano). Debido a su tamaño minúsculo, pueden ingresar profundamente en los pulmones e incluso llegar al torrente sanguíneo, representando el mayor factor de riesgo respiratorio y cardiovascular en entornos urbanos.',
  },
  {
    q: '¿De dónde provienen estas emisiones en Cali?',
    a: 'En Cali, más del 80% del material particulado PM2.5 proviene de fuentes móviles de transporte (vehículos de combustión diésel, buses antiguos, camiones de carga y motocicletas de 2 tiempos). También influyen las fuentes fijas (industrias manufactureras en el norte y Yumbo) y fenómenos estacionales como incendios forestales en los cerros tutelares.',
  },
  {
    q: '¿Qué mide exactamente la red Tángara?',
    a: 'La red ciudadana Tángara utiliza sensores de dispersión óptica de bajo costo calibrados para reportar concentraciones de PM2.5, temperatura y humedad relativa minuto a minuto, transmitiendo los datos mediante microcontroladores ESP32 a nuestra base de datos analítica ClickHouse.',
  },
  {
    q: '¿Cómo puedo reducir la exposición personal?',
    a: '1. Consulta el mapa Tángara antes de hacer ejercicio al aire libre.\n2. Evita transitar cerca de avenidas principales durante las horas pico de tráfico.\n3. Si el semáforo ICA marca Naranja o superior en tu comuna, limita las actividades físicas en exteriores y utiliza tapabocas convencional o N95 si debes salir.',
  },
];

const EducationPage = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Leaf className="text-tangara" />
            Educación Ambiental
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conoce los conceptos científicos clave y las directrices globales sobre el aire que respiramos en la ciudad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Acordeón de FAQs */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={16} className="text-tangara" />
            Preguntas Frecuentes
          </h3>

          <div className="space-y-2">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/20">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50/50 transition"
                  >
                    <span className="text-xs font-bold text-gray-800">{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 border-t border-gray-50 bg-white">
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla de Niveles del Semáforo */}
        <div className="card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle size={16} className="text-tangara" />
              Guía del Semáforo ICA
            </h3>
            <div className="space-y-2">
              {ICA_LEVELS.map(l => (
                <div key={l.level} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: levelColor(l.level) }}
                  />
                  <div>
                    <span className="font-bold text-gray-800">{l.label}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({l.range[0]} - {l.range[1]})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 pt-3 border-t border-gray-100 leading-relaxed">
            Metodología basada en el cálculo EPA (Environmental Protection Agency) de EE.UU. adoptada por Tángara para la estandarización de ciencia cívica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EducationPage;
