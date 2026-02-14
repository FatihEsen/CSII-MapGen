
export type TerrainType = 'REAL_WORLD' | 'PROCEDURAL_COAST' | 'RIVER_VALLEY' | 'PLAINS' | 'RUGGED_HILLS';

export interface MapSettings {
  resolution: number;
  physicalSizeKm: number;
  minHeight: number;
  maxHeight: number;
  waterLevel: number;
  terrainType: TerrainType;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapArea {
  center: Coordinates;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}
