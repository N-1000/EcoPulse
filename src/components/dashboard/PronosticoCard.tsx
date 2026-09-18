// ===================================================
// ECOPULSE 2026 - components/dashboard/PronosticoCard.tsx
// Pronóstico Meteorológico y Atmosférico de Alta Precisión para Cali.
// Conectado en tiempo real con Open-Meteo (temperaturas, lluvia, UV, viento,
// desglose horario y proyección de calidad del aire ICA).
// ===================================================
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sun,
  CloudRain,
  CloudSun,
  Cloud,
  Wind,
  Zap,
  Droplets,
  Umbrella,
  RefreshCw,
  Compass,
  Clock,
} from 'lucide-react';
import { useAirQuality } from '../../hooks/useAirQuality';
import { useCurrentWeather } from '../../hooks/useCurrentWeather';
import { projectIca } from '../../utils/icaForecast';
import { mapWmoToWeather, degreesToCompass, type WeatherType } from '../../utils/weatherCode';

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface DayForecastData {
  id: string;
  dayOffset: number;
  dateKey: string;
  dayName: string;
  fullDateStr: string;
  weather: WeatherType;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainProb: number;
  uvIndex: number;
  windSpeed: number;
  humidityMax: number;
  icaEstimated: number;
  icaLabel: string;
  icaColor: string;
  hourly: Array<{
    timeLabel: string;
    temp: number;
    weather: WeatherType;
    rainProb: number;
  }>;
}

const getUvSeverity = (uv: number): { label: string; color: string } => {
  if (uv <= 2) return { label: 'Bajo', color: '#16A34A' };
  if (uv <= 5) return { label: 'Moderado', color: '#CA8A04' };
  if (uv <= 7) return { label: 'Alto', color: '#EA580C' };
  if (uv <= 10) return { label: 'Muy Alto', color: '#DC2626' };
  return { label: 'Extremo', color: '#7E22CE' };
};

const PronosticoCard = () => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const { metrics } = useAirQuality();
  const currentWind = useCurrentWeather();
  const [apiData, setApiData] = useState<any | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeatherData = useCallback(() => {
    setIsRefreshing(true);
    fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=3.4516&longitude=-76.5320' +
      '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,uv_index_max,wind_speed_10m_max' +
      '&hourly=temperature_2m,precipitation_probability,weather_code' +
      '&timezone=America%2FBogota'
    )
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.daily) {
          setApiData(data);
          setLastUpdated(new Date());
        }
        setIsRefreshing(false);
      })
      .catch(() => {
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    fetchWeatherData();
    // Auto refresco cada 15 minutos
    const interval = setInterval(fetchWeatherData, 900000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Procesa 5 días de pronóstico continuo
  const daysList: DayForecastData[] = useMemo(() => {
    const today = new Date();
    const daily = apiData?.daily;
    const hourly = apiData?.hourly;

    const currentIcaBase = metrics.icaGeneral > 0 ? metrics.icaGeneral : 22;

    return [0, 1, 2, 3, 4].map(offset => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);

      const dayName = offset === 0 ? 'Hoy' : offset === 1 ? 'Mañana' : DAYS_OF_WEEK[d.getDay()];
      const fullDateStr = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
      const dateKey = d.toISOString().split('T')[0];

      const tMax = daily?.temperature_2m_max?.[offset] !== undefined
        ? Math.round(daily.temperature_2m_max[offset])
        : 28 + (offset % 2);
      const tMin = daily?.temperature_2m_min?.[offset] !== undefined
        ? Math.round(daily.temperature_2m_min[offset])
        : 19 + (offset % 2);
      // El código "resumen del día" de Open-Meteo toma el momento más
      // severo de las 24h (ej. una llovizna de la tarde) y lo usa como
      // titular del día completo, aunque el mediodía esté despejado.
      // Se usa el código de una hora representativa en vez del resumen:
      // la hora actual para "Hoy", el mediodía para los días futuros
      // (todavía no tienen una "hora actual" propia).
      const representativeHourIdx = offset === 0 ? today.getHours() : offset * 24 + 12;
      const wCode = hourly?.weather_code?.[representativeHourIdx]
        ?? daily?.weather_code?.[offset]
        ?? (offset === 0 ? 1 : 2);
      const rainProb = daily?.precipitation_probability_max?.[offset] ?? (offset === 0 ? 35 : 45);
      const uv = daily?.uv_index_max?.[offset] ?? 7.5;
      const wind = daily?.wind_speed_10m_max?.[offset] ? Math.round(daily.wind_speed_10m_max[offset]) : 11;
      const hum = 70 + (offset * 3) % 15;

      const wInfo = mapWmoToWeather(wCode);

      const projectedIca = projectIca(currentIcaBase, { rainProbMax: rainProb, windSpeedMax: wind, uvIndexMax: uv }, offset);
      const icaLabel = projectedIca <= 50 ? 'Buena' : projectedIca <= 100 ? 'Moderada' : 'Dañina (Sensible)';
      const icaColor = projectedIca <= 50 ? '#2D6A4F' : projectedIca <= 100 ? '#D97706' : '#EA580C';

      // Desglose de 6 horas representativas del día
      const dayStartHour = offset * 24;
      const hoursKeyPoints = [6, 9, 12, 15, 18, 21];
      const hoursData = hoursKeyPoints.map(h => {
        const idx = dayStartHour + h;
        const temp = hourly?.temperature_2m?.[idx] !== undefined
          ? Math.round(hourly.temperature_2m[idx])
          : (h === 12 || h === 15 ? tMax : h === 6 ? tMin : Math.round((tMax + tMin) / 2));
        const pCode = hourly?.weather_code?.[idx] ?? wCode;
        const pRain = hourly?.precipitation_probability?.[idx] ?? Math.round(rainProb * (h === 15 ? 1.2 : 0.6));

        const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        return {
          timeLabel: `${hour12}:00 ${ampm}`,
          temp,
          weather: mapWmoToWeather(pCode).weather,
          rainProb: Math.min(100, pRain),
        };
      });

      return {
        id: `day-${offset}`,
        dayOffset: offset,
        dateKey,
        dayName,
        fullDateStr,
        weather: wInfo.weather,
        tempMax: tMax,
        tempMin: tMin,
        condition: wInfo.condition,
        rainProb,
        uvIndex: Math.round(uv * 10) / 10,
        windSpeed: wind,
        humidityMax: hum,
        icaEstimated: projectedIca,
        icaLabel,
        icaColor,
        hourly: hoursData,
      };
    });
  }, [apiData, metrics.icaGeneral]);

  const activeDay = daysList[selectedDayIdx] || daysList[0];
  const uvInfo = getUvSeverity(activeDay.uvIndex);
  // Antes del primer fetch, daysList ya devuelve 5 días con valores de
  // reemplazo (28°C, 35% lluvia, etc.) para no romper el render — pero
  // mostrarlos tal cual es un dato falso servido como real. Mientras
  // apiData es null (nunca resolvió ni una vez), se muestra un skeleton
  // en vez de esos números.
  const isInitialLoading = apiData === null;

  const renderWeatherIcon = (type: WeatherType, size = 26) => {
    switch (type) {
      case 'sun':       return <Sun       size={size} className="text-amber-500"  />;
      case 'rain':      return <CloudRain size={size} className="text-sky-500"    />;
      case 'drizzle':   return <CloudRain size={size} className="text-sky-400"    />;
      case 'cloud-sun': return <CloudSun  size={size} className="text-amber-600"  />;
      case 'cloud':     return <Cloud     size={size} className="text-slate-500"  />;
      case 'storm':     return <Zap       size={size} className="text-violet-600" />;
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#DDD5C4] shadow-sm flex flex-col justify-between">
      
      {/* ── Encabezado Principal ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#F2E8D5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] animate-pulse" />
            <h3 className="text-base sm:text-lg font-extrabold text-[#1A1A18] tracking-tight">
              Pronóstico Atmosférico y Meteorológico
            </h3>
          </div>
          <p className="text-xs text-[#6B6B67] mt-0.5">
            Santiago de Cali · Datos en tiempo real de Open-Meteo y Modelo Bioclimático EcoPulse
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-[#8C8C86] hidden sm:inline-flex items-center gap-1">
            <Clock size={12} />
            Actualizado {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>

          <button
            onClick={fetchWeatherData}
            disabled={isRefreshing}
            title="Actualizar pronóstico meteorológico"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F2E8D5] hover:bg-[#E8E0D0] text-[#1A1A18] text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-[#2D6A4F]' : ''} />
            <span>{isRefreshing ? 'Cargando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="animate-pulse">
          {/* ── Skeleton del carrusel de 5 días ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-2xl p-3.5 h-[148px] bg-[#F5F2EB] border border-[#E8E0D0]" />
            ))}
          </div>
          {/* ── Skeleton del panel de detalle ── */}
          <div className="rounded-2xl h-[260px] bg-[#F5F2EB] border border-[#E8E0D0]" />
        </div>
      ) : (
        <>
      {/* ── Carrusel de 5 Días ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {daysList.map((d, idx) => {
          const isSelected = selectedDayIdx === idx;
          return (
            <div
              key={d.id}
              onClick={() => setSelectedDayIdx(idx)}
              className={`
                rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-300 relative border
                ${isSelected
                  ? 'bg-[#FAF7F2] border-[#2D6A4F] shadow-md scale-[1.02] ring-2 ring-[#2D6A4F]/20'
                  : 'bg-white border-[#E8E0D0] hover:border-[#2D6A4F]/40 hover:bg-[#FAF7F2]/50'
                }
              `}
            >
              {/* Badge Hoy / Mañana */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-xs font-black ${isSelected ? 'text-[#2D6A4F]' : 'text-[#1A1A18]'}`}>
                  {d.dayName}
                </span>
                <span className="text-[10px] text-[#8C8C86] font-semibold">
                  {d.fullDateStr}
                </span>
              </div>

              {/* Icono del clima */}
              <div className="my-2 p-2 rounded-2xl bg-white shadow-xs">
                {renderWeatherIcon(d.weather, 28)}
              </div>

              {/* Temperaturas */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#1A1A18]">{d.tempMax}°</span>
                <span className="text-xs font-bold text-[#8C8C86]">/ {d.tempMin}°</span>
              </div>

              {/* Probabilidad de lluvia */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-sky-700 mt-1">
                <Umbrella size={12} className="text-sky-500" />
                <span>{d.rainProb}%</span>
              </div>

              {/* Píldora de proyección ICA */}
              <div
                className="mt-2 w-full py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wide text-center"
                style={{
                  background: isSelected ? '#E8F5EE' : '#F5F2EB',
                  color: d.icaColor,
                }}
              >
                ICA ~{d.icaEstimated} · {d.icaLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Panel de Detalle del Día Seleccionado ── */}
      <div className="bg-[#FAF7F2] rounded-2xl p-5 sm:p-6 border border-[#E8E0D0]">
        
        {/* Cabecera del día activo */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-sm">
              {renderWeatherIcon(activeDay.weather, 32)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-extrabold text-[#1A1A18]">
                  {activeDay.dayName}, {activeDay.fullDateStr}
                </h4>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F5EE] text-[#2D6A4F]">
                  Pronóstico detallado
                </span>
              </div>
              <p className="text-xs text-[#6B6B67] font-medium">{activeDay.condition}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#8C8C86] block">Proyección ICA</span>
              <span className="text-base font-black" style={{ color: activeDay.icaColor }}>
                ICA {activeDay.icaEstimated} · {activeDay.icaLabel}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Micro-indicadores climáticos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-white border border-[#E8E0D0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Droplets size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Lluvia Máx</span>
              <span className="text-sm font-black text-[#1A1A18]">{activeDay.rainProb}% prob.</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E8E0D0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Sun size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Índice UV</span>
              <span className="text-sm font-black" style={{ color: uvInfo.color }}>
                {activeDay.uvIndex} ({uvInfo.label})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E8E0D0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#2D6A4F] flex items-center justify-center flex-shrink-0">
              <Wind size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Viento</span>
              <span className="text-sm font-black text-[#1A1A18]">{activeDay.windSpeed} km/h</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E8E0D0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Compass size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#8C8C86] uppercase block">Brisa de Cali</span>
              <span className="text-sm font-black text-[#1A1A18]">
                {currentWind.windDirection !== null ? degreesToCompass(currentWind.windDirection) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Desglose Horario del Día ── */}
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B6B67] block mb-3">
            Comportamiento Horario Estimado ({activeDay.dayName})
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {activeDay.hourly.map((h, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-xl border border-[#E8E0D0] flex flex-col items-center text-center shadow-2xs"
              >
                <span className="text-[10px] font-bold text-[#8C8C86]">{h.timeLabel}</span>
                <div className="my-1.5">{renderWeatherIcon(h.weather, 20)}</div>
                <span className="text-sm font-black text-[#1A1A18]">{h.temp}°</span>
                <span className="text-[9.5px] font-bold text-sky-600 mt-0.5">{h.rainProb}% lluvia</span>
              </div>
            ))}
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
};

export default PronosticoCard;
