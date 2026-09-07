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

interface UseNodesResult {
  nodes: TangaraNode[];
  isLoading: boolean;
  error: string | null;
}

// ── Store singleton a nivel de módulo ─────────────────────────
type Listener = () => void;

let _nodes: TangaraNode[] = [];
let _isLoading = true;
let _error: string | null = null;
let _fetchedAt = 0;
let _promise: Promise<void> | null = null;
const _listeners = new Set<Listener>();

const TTL_MS = 60_000; // refresca datos cada 60 s como máximo

const _notify = () => _listeners.forEach(fn => fn());

const _doFetch = () => {
  if (_promise) return _promise;                // fetch ya en vuelo
  if (Date.now() - _fetchedAt < TTL_MS) return Promise.resolve(); // caché fresco

  _isLoading = true;
  _notify();

  _promise = fetchNodes()
    .then(data => {
      _nodes = data;
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

export const useNodes = (): UseNodesResult => {
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

  return { nodes: _nodes, isLoading: _isLoading, error: _error };
};

/** Fuerza una recarga inmediata ignorando el caché (útil para botones de refresco). */
export const refreshNodes = () => {
  _fetchedAt = 0;
  _doFetch();
};

