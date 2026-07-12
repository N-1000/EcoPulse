// ===================================================
// TANGARA 2026 - components/dashboard/PronosticoCard.tsx
// Tarjeta de pronóstico para mañana y días siguientes.
// ===================================================
import { Calendar, ChevronRight } from 'lucide-react';
import { forecast } from '../../mock/airQualityData';
import { getIcaLevel } from '../../utils/airQuality';

const PronosticoCard = () => {
  const today = forecast[0];
  const icaInfo = getIcaLevel(today.icaEstimated);

  return (
    <div className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Pronóstico para mañana</h3>
        <Calendar size={15} className="text-gray-400" />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{today.weatherIcon}</span>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-gray-900">{today.tempMax}°</span>
            <span className="text-sm text-gray-400">/ {today.tempMin}°</span>
          </div>
          <p className="text-xs text-gray-500">{today.date}</p>
        </div>
      </div>
      <div className="rounded-xl px-3 py-2 mb-3" style={{ backgroundColor: icaInfo.bgColor }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: icaInfo.color }}>
            ICA estimado {today.icaEstimated}
          </span>
          <span className="text-xs font-bold" style={{ color: icaInfo.color }}>
            {icaInfo.label}
          </span>
        </div>
      </div>
      {forecast.slice(1).map(day => (
        <div key={day.date} className="flex items-center justify-between py-2 border-t border-gray-50">
          <span className="text-xs text-gray-500 w-12">{day.dayName}</span>
          <span className="text-base">{day.weatherIcon}</span>
          <span className="text-xs font-semibold text-gray-700">{day.tempMax}° / {day.tempMin}°</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: getIcaLevel(day.icaEstimated).bgColor,
              color: getIcaLevel(day.icaEstimated).color,
            }}
          >
            {day.icaEstimated}
          </span>
        </div>
      ))}
      <button className="mt-3 text-xs font-semibold self-start flex items-center gap-1 hover:underline text-tangara">
        Ver análisis detallado
        <ChevronRight size={13} />
      </button>
    </div>
  );
};

export default PronosticoCard;
