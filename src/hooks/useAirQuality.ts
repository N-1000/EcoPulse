import { useMemo } from 'react';
import type { AirQualityMetrics } from '../types';
import { useNodes } from './useNodes';
import { calculateNodeMetrics } from '../utils/nodeMetrics';

export const useAirQuality = () => {
  const { nodes, isLoading } = useNodes();

  const metrics: AirQualityMetrics = useMemo(() => {
    return calculateNodeMetrics(nodes);
  }, [nodes]);

  return { metrics, isLoading };
};

