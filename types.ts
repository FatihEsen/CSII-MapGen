export type TerrainType = 'REAL_WORLD' | 'PROCEDURAL_COAST' | 'RIVER_VALLEY' | 'PLAINS' | 'RUGGED_HILLS';

export type Language = 'tr' | 'en';

export interface MapSettings {
  resolution: number;
  physicalSizeKm: number;
  sizeMultiplier: number;
  minHeight: number;
  maxHeight: number;
  waterLevel: number;
  terrainType: TerrainType;
  exportSatellite: boolean;
  language: Language;
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

export interface TerrainResult {
  heightmap: Uint16Array;
  satelliteUrl?: string;
  minElevation: number;
  maxElevation: number;
}
