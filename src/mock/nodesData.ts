// ===================================================
// TANGARA 2026 - mock/nodesData.ts
// Lista vacía — los nodos reales vienen de GET /api/nodes (ClickHouse).
// El backend decodifica geohash y calcula ICA antes de responder.
// ===================================================
import type { TangaraNode } from '../types';

export const tangaraNodes: TangaraNode[] = [];
