// ===================================================
// TANGARA 2026 - pages/TrendsPage.tsx
// Historial y Tendencias Temporales
// ===================================================
import { useState } from 'react';
import { Filter, Info, TrendingUp } from 'lucide-react';
import TendenciaSemana from '../components/dashboard/TendenciaSemana';
import HistoricoMensual from '../components/dashboard/HistoricoMensual';


const CALI_ZONES = [
  'Comuna 2 (Norte - San Vicente)',
  'Comuna 3 (Oeste - San Antonio)',
  'Comuna 17 (Sur - El Ingenio)',
  'Comuna 22 (Sur - Ciudad Jardín)',
  'Comuna 21 (Oriente - Desepaz)',
  'Comuna 13 (Oriente - Calipso)',
];

const TrendsPage = () => {
  const [selectedZone, setSelectedZone] = useState(CALI_ZONES[0]);
  const [selectedMetric, setSelectedMetric] = useState<'pm25' | 'temperature' | 'humidity'>('pm25');

  return (
    <div className="p-5 pt-4 space-y-4 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-tangara" />
            Tendencias de Calidad del Aire
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Analiza el comportamiento histórico del aire a lo largo de los días y meses en las diferentes comunas de Cali.
          </p>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Filter size={13} className="text-gray-400" />
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent border-none outline-none cursor-pointer"
            >
              {CALI_ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setSelectedMetric('pm25')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                selectedMetric === 'pm25' ? 'bg-tangara text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              PM2.5
            </button>
            <button
              onClick={() => setSelectedMetric('temperature')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                selectedMetric === 'temperature' ? 'bg-tangara text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Temp
            </button>
            <button
              onClick={() => setSelectedMetric('humidity')}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition ${
                selectedMetric === 'humidity' ? 'bg-tangara text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Humedad
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Gráficas de Tendencias */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <TendenciaSemana />
        <HistoricoMensual />
      </div>

      {/* Tarjeta Informativa de Comportamiento */}
      <div className="card p-5 flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900">Análisis de la Comuna Seleccionada</h4>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            Actualmente estás viendo los datos analíticos para la <strong>{selectedZone}</strong>. Históricamente, el oriente de Cali presenta un promedio de PM₂.₅ superior al oeste en un 28% debido a factores de viento y polvo vial. El mejor horario para realizar actividad al aire libre en esta comuna es entre las <strong>9:00 PM y las 6:00 AM</strong> del día siguiente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrendsPage;
