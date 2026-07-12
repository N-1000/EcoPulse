// ===================================================
// TANGARA 2026 - hooks/useNodes.ts
// Hook de acceso a los nodos de la red Tangara.
// Los componentes consumen este hook, nunca el mock directamente,
// para que el cambio a datos reales sea transparente.
// ===================================================
import { useEffect, useState } from 'react';
import type { TangaraNode } from '../types';
import { fetchNodes } from '../services/api';

interface UseNodesResult {
  nodes: TangaraNode[];
  isLoading: boolean;
  error: string | null;
}

export const useNodes = (): UseNodesResult => {
  const [nodes, setNodes] = useState<TangaraNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNodes()
      .then(data => {
        if (!cancelled) setNodes(data);
      })
      .catch(() => {
        if (!cancelled) setError('No fue posible cargar los nodos.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { nodes, isLoading, error };
};
