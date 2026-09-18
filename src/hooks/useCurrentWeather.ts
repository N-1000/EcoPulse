// ===================================================
// ECOPULSE 2026 - hooks/useCurrentWeather.ts
// Temperatura y humedad ACTUALES de Cali desde Open-Meteo — mismo
// proveedor externo que ya usa PronosticoCard.
//
// Por qué no viene de los sensores Tangara: la temperatura reportada
// por la mayoría de los nodos (36-41°C) está sesgada por autocalentamiento
// del gabinete (ESP32 + sensor PM2.5 cerca del sensor de temperatura),
// confirmado comparando contra Open-Meteo y viendo que un solo nodo
// (mejor ventilado) reporta un valor plausible mientras el resto no.
// Se usa este dato independiente para los indicadores generales de la
// portada en vez de inventar un factor de corrección sin calibración real.
// ===================================================
import { useEffect, useState } from 'react';

const CALI_LAT = 3.4516;
const CALI_LNG = -76.5320;
const REFRESH_MS = 15 * 60 * 1000; // 15 min, mismo intervalo que PronosticoCard

interface CurrentWeather {
  temperature: number | null;
  humidity: number | null;
  weatherCode: number | null;
  windDirection: number | null;
}

export const useCurrentWeather = (): CurrentWeather => {
  const [weather, setWeather] = useState<CurrentWeather>({ temperature: null, humidity: null, weatherCode: null, windDirection: null });

  useEffect(() => {
    let active = true;

    const fetchWeather = () => {
      fetch(
        'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${CALI_LAT}&longitude=${CALI_LNG}` +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_direction_10m' +
        '&timezone=America%2FBogota'
      )
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (!active || !data?.current) return;
          const { temperature_2m, relative_humidity_2m, weather_code, wind_direction_10m } = data.current;
          setWeather({
            temperature: typeof temperature_2m === 'number' ? temperature_2m : null,
            humidity: typeof relative_humidity_2m === 'number' ? relative_humidity_2m : null,
            weatherCode: typeof weather_code === 'number' ? weather_code : null,
            windDirection: typeof wind_direction_10m === 'number' ? wind_direction_10m : null,
          });
        })
        .catch(() => {
          // Sin fallback inventado: si Open-Meteo falla, el consumidor
          // decide qué mostrar (ver ContaminantesGrid/PulsoNarrativo).
        });
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return weather;
};
