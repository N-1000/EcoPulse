// ===================================================
// ECOPULSE 2026 - components/map/HealthyRoutePanel.tsx
// Panel modular para mostrar métricas y controles de la Ruta Saludable
// ===================================================
import { Footprints, MapPin, Bike, Activity, Wind, Zap, AlertTriangle } from 'lucide-react';
import type { RouteResult, TransportMode } from '../../types';

interface HealthyRoutePanelProps {
  routeResult: RouteResult;
  transportMode: TransportMode;
  onSelectTransportMode: (mode: TransportMode) => void;
  onClearRoute: () => void;
}

export const HealthyRoutePanel = ({
  routeResult,
  transportMode,
  onSelectTransportMode,
  onClearRoute,
}: HealthyRoutePanelProps) => {
  return (
    <div className="absolute bottom-14 left-4 z-[400] w-[270px] bg-white/95 backdrop-blur-md border border-emerald-100 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.06)] animate-slide-up">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <Footprints size={13} className="text-emerald-500" />
          <span className="text-xs font-black text-gray-800 uppercase tracking-wider">Ruta Saludable</span>
        </div>
        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{
          backgroundColor: routeResult.healthScore === 'A+' || routeResult.healthScore === 'A' ? '#D1FAE5' : '#FEF3C7',
          color: routeResult.healthScore === 'A+' || routeResult.healthScore === 'A' ? '#065F46' : '#92400E'
        }}>
          Score {routeResult.healthScore}
        </span>
      </div>

      {/* Destino */}
      <div className="flex items-center gap-2 mb-3 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
        <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
        <span className="text-[11px] font-bold text-emerald-800 truncate">{routeResult.destinationName}</span>
      </div>

      {/* Opciones de Transporte */}
      <div className="flex items-center gap-1.5 mb-3 bg-gray-50 rounded-xl p-1.5 border border-gray-100">
        {[
          { id: 'walk', icon: Footprints, label: 'Caminar' },
          { id: 'bike', icon: Bike, label: 'Bici' },
          { id: 'skates', icon: Activity, label: 'Patines' },
          { id: 'skateboard', icon: Wind, label: 'Skate' },
          { id: 'escooter', icon: Zap, label: 'Eléctrica' },
        ].map(mode => {
          const Icon = mode.icon;
          const isActive = transportMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onSelectTransportMode(mode.id as TransportMode)}
              title={mode.label}
              className={`flex-1 flex justify-center py-1.5 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white shadow-sm text-emerald-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200/50'
              }`}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Métricas en grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Distancia</p>
          <p className="text-sm font-black text-gray-800">{routeResult.distance} km</p>
        </div>
        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Duración</p>
          <p className="text-sm font-black text-gray-800">~{routeResult.durations[transportMode]} min</p>
        </div>
        <div className="bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Cobertura Verde</p>
          <p className="text-sm font-black text-emerald-700">{routeResult.greenCoverage}%</p>
        </div>
        <div className="rounded-xl px-3 py-2 border" style={{
          background: routeResult.averageICA <= 50 ? '#F0FDF4' : routeResult.averageICA <= 100 ? '#FEFCE8' : '#FEF2F2',
          borderColor: routeResult.averageICA <= 50 ? '#BBF7D0' : routeResult.averageICA <= 100 ? '#FDE68A' : '#FECACA',
        }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: routeResult.averageICA <= 50 ? '#16A34A' : routeResult.averageICA <= 100 ? '#CA8A04' : '#DC2626' }}>ICA Prom.</p>
          <p className="text-sm font-black" style={{ color: routeResult.averageICA <= 50 ? '#15803D' : routeResult.averageICA <= 100 ? '#A16207' : '#B91C1C' }}>{routeResult.averageICA}</p>
        </div>
      </div>

      {/* Métrica de CO2 Evitado */}
      <div className="flex items-center justify-between mb-3 bg-emerald-500/10 rounded-xl px-3 py-2 border border-emerald-500/20">
        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
          CO₂ Evitado vs Auto{routeResult.rushHour ? ' · Hora pico' : ''}
        </span>
        <span className="text-sm font-black text-emerald-600">~{routeResult.co2Saved} g</span>
      </div>

      {/* Alerta de tráfico */}
      {routeResult.trafficRisk === 'high' && (
        <div className="mb-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-2.5">
          <AlertTriangle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-orange-900 leading-snug">
            <strong className="font-bold block mb-0.5">
              🚗 Tráfico pesado{routeResult.rushHour ? ' — Hora pico' : ''}
            </strong>
            Esta ruta atraviesa avenidas con alta congestión. Considera ir por ciclovía o esperar a que baje el tráfico. El puntaje de salud se reduce.
          </p>
        </div>
      )}
      {routeResult.trafficRisk === 'medium' && (
        <div className="mb-3 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-2.5">
          <AlertTriangle size={14} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-yellow-900 leading-snug">
            <strong className="font-bold block mb-0.5">
              🟡 Tráfico moderado{routeResult.rushHour ? ' — Hora pico' : ''}
            </strong>
            Flujo vehicular intermitente. Mantén distancia de los carriles de autobús y prefiere aceras anchas.
          </p>
        </div>
      )}

      {/* Alerta de tráfico y contaminación */}
      {routeResult.averageICA > 100 && (
        <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-2.5">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-800 leading-snug">
            <strong className="font-bold block mb-0.5">⚠️ Aire perjudicial / Posible tráfico pesado</strong>
            ICA {routeResult.averageICA} — Evita esfuerzo intenso. Usa tapabocas y considera ir antes de las 7 a.m. o después de las 7 p.m.
          </p>
        </div>
      )}
      {routeResult.averageICA > 75 && routeResult.averageICA <= 100 && (
        <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-snug">
            <strong className="font-bold block mb-0.5">Moderado — Grupos sensibles</strong>
            ICA {routeResult.averageICA} — Niños, adultos mayores o personas con asma deben tomar precauciones en esta ruta.
          </p>
        </div>
      )}

      <button 
        onClick={onClearRoute}
        className="w-full py-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-xl text-xs font-bold transition-colors border border-gray-200 hover:border-red-100"
      >
        Limpiar Ruta
      </button>
    </div>
  );
};

export default HealthyRoutePanel;
