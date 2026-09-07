// ===================================================
// ECOPULSE 2026 - components/dashboard/IcaActual.tsx
// Componente unificado: Encabezado estandarizado, squircle ICA (25 / ICA), estado y timestamp.
// ===================================================
import { useAirQuality } from '../../hooks/useAirQuality';
import { getIcaLevel } from '../../utils/airQuality';

const IcaActual = () => {
  const { metrics } = useAirQuality();
  const icaInfo = getIcaLevel(metrics.icaGeneral);

  return (
    <div className="flex flex-col items-center text-center gap-3 w-full">
      {/* Encabezado unificado de sección */}
      <div className="h-6 flex items-center justify-start w-full">
        <h3 className="text-xs font-extrabold text-[#1A1A18] uppercase tracking-wider">
          Calidad del aire ahora
        </h3>
      </div>

      {/* Squircle / Cuadro verde oscuro */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[22px] bg-[#1E4D3B] shadow-md flex flex-col items-center justify-center text-white my-1">
        <span className="text-3xl sm:text-4xl font-black leading-none tracking-tight">
          {metrics.icaGeneral}
        </span>
        <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
          ICA
        </span>
      </div>

      {/* Estado y Timestamp */}
      <div>
        <p className="text-base font-bold text-[#1A1A18]">
          Calidad{' '}
          <span style={{ color: icaInfo.color }}>
            {icaInfo.label}
          </span>
        </p>
        <p className="text-[10px] text-[#8C8C86] font-medium mt-0.5">
          Última actualización: {new Date(metrics.updatedAt).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

export default IcaActual;
