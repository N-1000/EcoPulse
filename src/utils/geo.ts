// ===================================================
// TANGARA 2026 - utils/geo.ts
// Utilidades geográficas para el mapa de nodos.
//
// NOTA SOBRE GEOHASH (http://geohash.co/):
// Los sensores Tangara reportan su ubicación como Geohash para reducir
// el tamaño de los paquetes del firmware. La conversión Geohash -> lat/lng
// NO se hace en el frontend: el backend (FastAPI) entregará los nodos con
// `coordinates` ya decodificadas. Aquí solo se proyecta y se agrupa.
// ===================================================
import type { GeoPoint, NodeCluster, TangaraNode } from '../types';

/** Caja geográfica aproximada de Cali para proyectar lat/lng al lienzo SVG. */
export const CALI_BOUNDS = {
  north: 3.505,   // lat máxima
  south: 3.330,   // lat mínima
  west: -76.590,  // lng mínima
  east: -76.460,  // lng máxima
} as const;

/**
 * Proyección lineal simple de una coordenada geográfica a coordenadas
 * del lienzo SVG del mapa. Cuando se integre un mapa real (Leaflet/MapLibre),
 * esta función deja de ser necesaria: la librería hace la proyección.
 */
export const projectToCanvas = (
  point: GeoPoint,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } => {
  const { north, south, east, west } = CALI_BOUNDS;
  const x = ((point.lng - west) / (east - west)) * canvasWidth;
  const y = ((north - point.lat) / (north - south)) * canvasHeight;
  return { x, y };
};

/**
 * Agrupa los nodos por geohash. Varios sensores pueden compartir ubicación
 * mientras se calibran o prueban: es un estado normal, no un error.
 * Los nodos sin coordenadas decodificadas se excluyen del mapa.
 */
export const clusterNodesByLocation = (nodes: TangaraNode[]): NodeCluster[] => {
  const groups = new Map<string, TangaraNode[]>();
  for (const node of nodes) {
    if (!node.coordinates) continue;
    const existing = groups.get(node.geohash);
    if (existing) {
      existing.push(node);
    } else {
      groups.set(node.geohash, [node]);
    }
  }
  return Array.from(groups.entries()).map(([geohash, grouped]) => ({
    geohash,
    coordinates: grouped[0].coordinates as GeoPoint,
    nodes: grouped,
  }));
};


