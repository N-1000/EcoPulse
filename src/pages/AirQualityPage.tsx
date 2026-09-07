// ===================================================
// ECOPULSE 2026 - pages/AirQualityPage.tsx
// Detalle de Calidad del Aire y Recomendaciones
// ===================================================
import { useState } from 'react';
import { Shield, Info, Heart, HelpCircle, Activity } from 'lucide-react';
import ContaminantesGrid from '../components/dashboard/ContaminantesGrid';
import { ICA_LEVELS } from '../constants/ica';
import { levelColor, levelLabel } from '../utils/airQuality';

const ADVISORIES = {
  'buena': {
    general: 'La calidad del aire es satisfactoria y presenta poco o ningún riesgo para la salud.',
    groups: 'Ideal para realizar actividades al aire libre para toda la población.',
    sport: 'Perfecto para entrenamiento de alta intensidad al aire libre.',
  },
  'moderada': {
    general: 'La calidad del aire es aceptable. Sin embargo, puede haber preocupación moderada para algunos contaminantes.',
    groups: 'Las personas extremadamente sensibles deben considerar reducir el esfuerzo físico prolongado.',
    sport: 'Se puede realizar deporte con normalidad, vigilando síntomas respiratorios leves.',
  },
  'dañina-grupos-sensibles': {
    general: 'Los miembros de grupos sensibles (niños, adultos mayores, asmáticos) pueden experimentar efectos de salud.',
    groups: 'Niños y adultos mayores deben evitar el esfuerzo físico prolongado al aire libre.',
    sport: 'Evitar entrenamientos exigentes al aire libre. Preferir espacios cerrados.',
  },
  'dañina': {
    general: 'Cualquier persona puede comenzar a experimentar efectos en la salud; grupos sensibles pueden sentir efectos graves.',
    groups: 'Se aconseja que todos limiten el tiempo prolongado en exteriores.',
    sport: 'Suspender actividades deportivas al aire libre. Usar tapabocas si es necesario salir.',
  },
  'muy-dañina': {
    general: 'Alerta de salud por condiciones de emergencia. Toda la población es propensa a ser afectada.',
    groups: 'Niños, ancianos y personas con enfermedades deben permanecer en interiores.',
    sport: 'Prohibido el deporte al aire libre. Mantener ventanas cerradas.',
  },
  'peligrosa': {
    general: 'Advertencia de salud por condiciones de emergencia extrema. Efectos graves garantizados.',
    groups: 'Toda la población debe permanecer bajo techo con purificadores de aire activos.',
    sport: 'Evitar cualquier tipo de ventilación del exterior. Emergencia sanitaria activa.',
  },
};

const AirQualityPage = () => {
  const [testIca, setTestIca] = useState(65);

  // Encontrar el nivel correspondiente al ICA del slider
  const currentLevel = ICA_LEVELS.find(l => testIca >= l.range[0] && testIca <= l.range[1]) ?? ICA_LEVELS[0];
  const adv = ADVISORIES[currentLevel.level as keyof typeof ADVISORIES];

  return (
    <div className="p-5 pt-4 space-y-5 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Activity className="text-tangara" />
            Calidad del Aire en Cali
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprende los índices, contaminantes medidos y cómo proteger tu salud según las lecturas en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-xs text-emerald-800">
          <Shield size={16} />
          <span>Datos calculados según la metodología EPA / OMS 2021</span>
        </div>
      </div>

      {/* Simulador Interactivo de Salud Ciudadana */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <HelpCircle size={16} className="text-tangara" />
              Calculador e Interpretador del ICA
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Mueve el deslizador para simular un puntaje de ICA y ver qué recomendaciones de salud aplican en tu barrio.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Puntaje ICA Simulado:</span>
                <span className="text-3xl font-black" style={{ color: levelColor(currentLevel.level) }}>
                  {testIca}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                value={testIca}
                onChange={e => setTestIca(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-tangara"
                style={{
                  background: `linear-gradient(to right, #16A34A 10%, #CA8A04 20%, #EA580C 30%, #DC2626 40%, #7C3AED 60%, #7F1D1D 100%)`
                }}
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-bold px-1">
                <span>0 (Bueno)</span>
                <span>100 (Moderado)</span>
                <span>150 (Sensibles)</span>
                <span>200 (Dañino)</span>
                <span>300 (Muy Dañino)</span>
                <span>500 (Peligroso)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black text-lg shadow-sm"
              style={{ backgroundColor: levelColor(currentLevel.level) }}
            >
              {testIca}
            </div>
            <div>
              <span
                className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ backgroundColor: `${levelColor(currentLevel.level)}20`, color: levelColor(currentLevel.level) }}
              >
                {levelLabel(currentLevel.level)}
              </span>
              <p className="text-xs font-semibold text-gray-800 mt-1">
                {adv?.general}
              </p>
            </div>
          </div>
        </div>

        {/* Recomendaciones específicas */}
        <div className="card p-5 space-y-4">
          <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
            <Heart size={14} className="text-tangara" />
            Recomendaciones de Actividad
          </h4>

          <div className="space-y-3">
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Grupos Sensibles (Niños y Ancianos)</span>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{adv?.groups}</p>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deporte al aire libre</span>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{adv?.sport}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Contaminantes */}
      <ContaminantesGrid />

      {/* Comparativa Normas */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
          <Info size={16} className="text-tangara" />
          Estándares de Calidad de Aire (PM2.5)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400">
                <th className="py-2 font-bold">Estándar / Organización</th>
                <th className="py-2 font-bold">Límite Diario (24h)</th>
                <th className="py-2 font-bold">Límite Anual</th>
                <th className="py-2 font-bold">Objetivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-3 font-semibold text-gray-900">OMS (Directrices 2021)</td>
                <td className="py-3 text-emerald-600 font-bold">15 µg/m³</td>
                <td className="py-3 text-emerald-600 font-bold">5 µg/m³</td>
                <td className="py-3 text-gray-500">Nivel de protección óptimo para la salud humana.</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-gray-900">Norma Nacional (Colombia Res. 2254/2017)</td>
                <td className="py-3 text-amber-600 font-bold">37 µg/m³</td>
                <td className="py-3 text-amber-600 font-bold">15 µg/m³</td>
                <td className="py-3 text-gray-500">Estándar regulado por el Ministerio de Ambiente.</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-gray-900">Tángara (Red de Ciencia Cívica)</td>
                <td className="py-3 text-tangara font-bold">12 µg/m³ (Alerta temprana)</td>
                <td className="py-3 text-gray-500">-</td>
                <td className="py-3 text-gray-500">Monitorear microclimas en comunas vulnerables de Cali.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AirQualityPage;
