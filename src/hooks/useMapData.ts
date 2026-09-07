// ===================================================
// ECOPULSE 2026 - hooks/useMapData.ts
// >>> HOOK ÚNICO DE DATOS PARA TODOS LOS MAPAS <<<
// Garantiza que el widget del inicio y la página de mapas
// consuman EXACTAMENTE los mismos nodos activos, ríos y vientos.
// ===================================================
import { useEffect, useMemo, useState } from 'react';
import { useNodes } from './useNodes';
import { clusterNodesByLocation } from '../utils/geo';
import {
  CALI_CENTER,
  CALI_WMS_LAYERS,
  fetchRealWind,
  generateWindStreams,
  type WindData,
  type WMSLayerConfig,
} from '../services/mapData';
import type { NodeCluster, TangaraNode } from '../types';

export interface UseMapDataResult {
  nodes: TangaraNode[];
  activeNodes: TangaraNode[];
  clusters: NodeCluster[];
  wind: WindData;
  wmsLayers: WMSLayerConfig[];
  center: [number, number];
  isLoading: boolean;
}

export const useMapData = (): UseMapDataResult => {
  const { nodes, isLoading } = useNodes();
  const [rawWind, setRawWind] = useState<{ speed: number; direction: number }>({ speed: 10, direction: 270 });

  // 1. Filtrar nodos activos estrictamente
  const activeNodes = useMemo(() => {
    return nodes.filter(n => !n.status || n.status === 'activo');
  }, [nodes]);

  // 2. Clusterización unificada por geohash / ubicación
  const clusters = useMemo(() => {
    return clusterNodesByLocation(activeNodes);
  }, [activeNodes]);

  // 3. Cargar viento real de Cali (Open-Meteo)
  useEffect(() => {
    let cancelled = false;
    fetchRealWind().then(w => {
      if (!cancelled) setRawWind(w);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 4. Generación de corrientes de viento y duración de animación
  const wind = useMemo<WindData>(() => {
    const streams = generateWindStreams(rawWind.direction, CALI_CENTER);
    const durationSec = Math.max(3, Math.min(18, 90 / Math.max(1, rawWind.speed)));
    return {
      speed: rawWind.speed,
      direction: rawWind.direction,
      streams,
      animationDuration: `${durationSec}s`,
    };
  }, [rawWind]);

  return {
    nodes,
    activeNodes,
    clusters,
    wind,
    wmsLayers: CALI_WMS_LAYERS,
    center: CALI_CENTER,
    isLoading,
  };
};
