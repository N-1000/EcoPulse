// ===================================================
// TANGARA 2026 - pages/AboutPage.tsx
// Acerca de la Plataforma Tangara
// ===================================================
import { Info, Code2, Database, LayoutTemplate, ShieldCheck } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Info className="text-tangara" />
            Sobre Tángara
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conoce la arquitectura técnica y el propósito de este proyecto de monitoreo ambiental y ciencia cívica.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Descripción general */}
        <div className="card p-5 lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">El Propósito</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tángara es una plataforma diseñada para empoderar a la comunidad de Cali en el monitoreo de la calidad del aire. Nace como una iniciativa de la <strong>Fundación Chispa</strong> para conectar la tecnología, los datos abiertos y la participación ciudadana en pro de la justicia ambiental y la salud pública de la ciudad.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            El sistema recopila lecturas automáticas en tiempo real de decenas de sensores urbanos de bajo costo instalados por ciudadanos en balcones, colegios y empresas, unificando toda la información en un data lake accesible para cualquier persona.
          </p>
        </div>

        {/* Ficha Técnica */}
        <div className="card p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Ficha Técnica</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400">Versión:</span>
                <span className="font-bold text-gray-800">2.0.0 (MVP)</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400">Licencia:</span>
                <span className="font-bold text-tangara">CC BY-SA 4.0</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-1.5">
                <span className="text-gray-400">Stack Backend:</span>
                <span className="font-bold text-gray-800">FastAPI, Python 3.12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stack Frontend:</span>
                <span className="font-bold text-gray-800">React, TypeScript, Vite</span>
              </div>
            </div>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-xs text-sky-800 flex gap-2 items-start">
            <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed">
              <strong>Proyecto de Código Abierto:</strong> Todo el código fuente está disponible públicamente en GitHub para auditoría del jurado de la hackathon.
            </p>
          </div>
        </div>
      </div>

      {/* Arquitectura de Datos */}
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Flujo y Arquitectura de Datos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <Code2 className="text-tangara" size={16} />
              <span className="font-bold text-gray-800">1. Captura (Hardware IoT)</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Sensores autónomos (ESP32/PMS5003) miden el PM2.5, codifican las coordenadas en un string Geohash e inyectan el dato por protocolo HTTPS POST o MQTT al broker.
            </p>
          </div>

          <div className="space-y-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <Database className="text-tangara" size={16} />
              <span className="font-bold text-gray-800">2. Almacenamiento (ClickHouse)</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              Base de datos columnar analítica de ClickHouse. Almacena +60 millones de filas históricas agrupadas en la capa de datos <strong>tangara_plata</strong> para consultas ultra veloces.
            </p>
          </div>

          <div className="space-y-2 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="text-tangara" size={16} />
              <span className="font-bold text-gray-800">3. Presentación (API & Web)</span>
            </div>
            <p className="text-gray-500 leading-relaxed">
              El backend en FastAPI limpia outliers y decodifica coordenadas. El frontend en React lo pinta sobre el mapa Leaflet, permitiendo calcular la ruta más limpia para el ciudadano.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
