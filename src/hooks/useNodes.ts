// ===================================================
// ECOPULSE 2026 - hooks/useNodes.ts
// Hook de acceso a los nodos de la red Tangara.
//
// SINGLETON: todos los componentes que llamen a useNodes()
// comparten exactamente el mismo fetch — nunca se hacen dos
// peticiones distintas al backend en paralelo. Esto garantiza
// que el mapa miniatura y el mapa completo muestren SIEMPRE
// los mismos valores de ICA/CO₂.
// ===================================================
import { useEffect, useState } from 'react';
import type { TangaraNode } from '../types';
import { fetchNodes } from '../services/api';
import { fetchDailyForecast } from '../services/weatherForecast';
import { projectNodeForecast, type IcaForecastFactors } from '../utils/icaForecast';

// ── Modo de visualización cuando la red Tangara no reporta en vivo ──
// 'real'       → solo lo que hay en vivo: sin nodos reportando, todo queda en cero / sin dato.
// 'pronostico' → proyección ESTIMADA a partir de la última lectura real de cada
//                nodo (antes del corte) + clima de hoy.
// Con datos en vivo el modo no tiene efecto: se muestran siempre los reales.
export type DataMode = 'real' | 'pronostico';
export type ForecastStatus = 'idle' | 'loading' | 'ok' | 'error';

interface UseNodesResult {
  nodes: TangaraNode[];
  isLoading: boolean;
  error: string | null;
}

interface UseDataModeResult {
  mode: DataMode;
  setMode: (mode: DataMode) => void;
  /** true si hay nodos pero ninguno está activo (la ingesta a ClickHouse se cortó). */
  sinDatosEnVivo: boolean;
  /** Última lectura real de toda la red, o null si no hay nodos. */
  ultimaLectura: Date | null;
  forecastStatus: ForecastStatus;
}

// ── Store singleton a nivel de módulo ─────────────────────────
type Listener = () => void;

let _rawNodes: TangaraNode[] = [];   // tal cual los entrega el backend
let _nodes: TangaraNode[] = [];      // los que se muestran (según el modo)
let _isLoading = true;
let _error: string | null = null;
let _fetchedAt = 0;
let _promise: Promise<void> | null = null;
const _listeners = new Set<Listener>();

const TTL_MS = 60_000; // refresca datos cada 60 s como máximo

const FACTORES_NEUTROS: IcaForecastFactors = { rainProbMax: 35, windSpeedMax: 0, uvIndexMax: 0 };

let _mode: DataMode = 'real';
let _factors: IcaForecastFactors | null = null;
let _forecastStatus: ForecastStatus = 'idle';
let _sinDatosEnVivo = false;
let _ultimaLectura: Date | null = null;

const _notify = () => _listeners.forEach(fn => fn());

/** Recalcula los nodos a mostrar. Mantiene la misma referencia mientras nada cambie (útil para useMemo). */
const _recompute = () => {
  _sinDatosEnVivo = _rawNodes.length > 0 && !_rawNodes.some(n => !n.status || n.status === 'activo');

  const tiempos = _rawNodes.map(n => new Date(n.lastUpdate).getTime()).filter(t => !isNaN(t));
  _ultimaLectura = tiempos.length ? new Date(Math.max(...tiempos)) : null;

  // Factores del clima; si Open-Meteo falló, factores neutros (la proyección
  // devuelve la última lectura sin ajustar). Mientras carga: sin proyección.
  const factors = _factors ?? (_forecastStatus === 'error' ? FACTORES_NEUTROS : null);

  if (_sinDatosEnVivo && _mode === 'pronostico' && factors) {
    _nodes = _rawNodes.map(n => projectNodeForecast(n, factors));
  } else {
    // Real (o con datos en vivo): los nodos tal cual. Inactivos => no aportan mediciones.
    _nodes = _rawNodes;
  }
};

/** Pronóstico de hoy (Open-Meteo) para la proyección. Se pide una sola vez por sesión salvo error. */
const _ensureForecast = () => {
  if (_factors || _forecastStatus === 'loading') return;
  _forecastStatus = 'loading';
  _notify();
  fetchDailyForecast().then(daily => {
    if (daily) {
      _factors = {
        rainProbMax: daily.precipitation_probability_max?.[0] ?? 45,
        windSpeedMax: daily.wind_speed_10m_max?.[0] ?? 11,
        uvIndexMax: daily.uv_index_max?.[0] ?? 7.5,
      };
      _forecastStatus = 'ok';
    } else {
      _forecastStatus = 'error';
    }
    _recompute();
    _notify();
  });
};

export const setDataMode = (mode: DataMode) => {
  _mode = mode;
  if (mode === 'pronostico') _ensureForecast();
  _recompute();
  _notify();
};

const _doFetch = () => {
  if (_promise) return _promise;                // fetch ya en vuelo
  if (Date.now() - _fetchedAt < TTL_MS) return Promise.resolve(); // caché fresco

  _isLoading = true;
  _notify();

  _promise = fetchNodes()
    .then(data => {
      _rawNodes = data;
      _recompute();
      _error = null;
    })
    .catch(() => {
      _error = 'No fue posible cargar los nodos.';
    })
    .finally(() => {
      _isLoading = false;
      _fetchedAt = Date.now();
      _promise = null;
      _notify();
    });

  return _promise;
};

// ── Hook React ────────────────────────────────────────────────
let _timer: ReturnType<typeof setInterval> | null = null;

const _startPolling = () => {
  if (!_timer) {
    _timer = setInterval(() => {
      _fetchedAt = 0; // Invalida el caché para forzar refresco
      _doFetch();
    }, TTL_MS);
  }
};

const _stopPolling = () => {
  if (_listeners.size === 0 && _timer) {
    clearInterval(_timer);
    _timer = null;
  }
};

const _useStore = () => {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener: Listener = () => rerender(n => n + 1);
    _listeners.add(listener);
    _startPolling();
    _doFetch();
    return () => {
      _listeners.delete(listener);
      _stopPolling();
    };
  }, []);
};

export const useNodes = (): UseNodesResult => {
  _useStore();
  return { nodes: _nodes, isLoading: _isLoading, error: _error };
};

/** Estado del modo Real / Pronóstico y de la disponibilidad de datos en vivo. */
export const useDataMode = (): UseDataModeResult => {
  _useStore();
  return {
    mode: _mode,
    setMode: setDataMode,
    sinDatosEnVivo: _sinDatosEnVivo,
    ultimaLectura: _ultimaLectura,
    forecastStatus: _forecastStatus,
  };
};

/** Fuerza una recarga inmediata ignorando el caché (útil para botones de refresco). */
export const refreshNodes = () => {
  _fetchedAt = 0;
  _doFetch();
};

