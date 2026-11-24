// ===================================================
// ECOPULSE 2026 - components/common/DataModeBanner.tsx
// Barra fija que aparece SOLO cuando la red Tangara no reporta en vivo
// (ClickHouse sin lecturas recientes). Permite alternar entre:
//   · Real        → solo lo que hay en vivo: ningún nodo reporta, todo en cero.
//   · Pronóstico  → proyección estimada a partir de la última lectura real de
//                   cada nodo antes del corte, ajustada con el clima de hoy.
// Con datos en vivo no se renderiza nada.
// ===================================================
import { useDataMode, type DataMode } from '../../hooks/useNodes';

const OPCIONES: Array<{ id: DataMode; label: string }> = [
  { id: 'real', label: 'Real' },
  { id: 'pronostico', label: 'Pronóstico' },
];

/** "hace 3 h 20 min", "hace 12 min", "hace 2 días". */
const formatearAntiguedad = (desde: Date, ahora: Date = new Date()): string => {
  const min = Math.max(0, Math.round((ahora.getTime() - desde.getTime()) / 60_000));
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 48) return `hace ${horas} h${min % 60 ? ` ${min % 60} min` : ''}`;
  return `hace ${Math.floor(horas / 24)} días`;
};

/** Hora en 12h AM/PM (regla del proyecto), ej. "7 nov, 12:50 a. m.". */
const formatearHora = (fecha: Date): string =>
  fecha.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

const DataModeBanner = () => {
  const { mode, setMode, sinDatosEnVivo, ultimaLectura, forecastStatus } = useDataMode();
  if (!sinDatosEnVivo) return null;

  const esPronostico = mode === 'pronostico';
  const sinClima = esPronostico && forecastStatus === 'error';

  let nota = 'Solo datos en vivo: ningún nodo está reportando, por eso todo aparece en cero. Usa Pronóstico para ver una estimación.';
  if (esPronostico && forecastStatus === 'loading') nota = 'Cargando el clima de hoy…';
  else if (sinClima) nota = 'No se pudo obtener el clima: se muestra la última lectura antes del corte, sin ajustar. No es una medición.';
  else if (esPronostico) nota = 'Estimación: última lectura real antes del corte, ajustada con lluvia, viento y UV de hoy (Open-Meteo). No es una medición.';

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100vw-1.5rem)] max-w-[560px] rounded-2xl bg-[#0F1F17]/95 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md border border-white/10 px-4 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[12px] font-bold leading-tight">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            Sin datos en vivo de la red Tangara
          </p>
          {ultimaLectura && (
            <p className="text-[11px] text-[#A8C5B0] leading-tight mt-0.5">
              Última lectura: {formatearHora(ultimaLectura)} · {formatearAntiguedad(ultimaLectura)}
            </p>
          )}
        </div>

        <div role="group" aria-label="Tipo de datos a mostrar" className="flex shrink-0 rounded-xl bg-white/10 p-0.5">
          {OPCIONES.map(op => {
            const activo = mode === op.id;
            return (
              <button
                key={op.id}
                type="button"
                aria-pressed={activo}
                onClick={() => setMode(op.id)}
                className={`px-3.5 py-1.5 rounded-[10px] text-[12px] font-bold transition-colors ${
                  activo ? 'bg-[#D05A3F] text-white' : 'text-[#A8C5B0] hover:text-white'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[10.5px] text-white/60 leading-snug mt-1.5">{nota}</p>
    </div>
  );
};

export default DataModeBanner;
