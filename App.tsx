
import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Rectangle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapSettings, MapArea, Coordinates } from './types';
import { Sidebar } from './components/Sidebar';
import { PreviewPanel } from './components/PreviewPanel';
import { TerrainService } from './services/terrainService';

const CS2_MAP_SIZE_KM = 14.336; 
const CS2_START_SIZE_KM = 2.0; 

const DEFAULT_SETTINGS: MapSettings = {
  resolution: 4096,
  physicalSizeKm: CS2_MAP_SIZE_KM,
  minHeight: 0,
  maxHeight: 1000,
  waterLevel: 0, 
  terrainType: 'REAL_WORLD',
};

const INITIAL_CENTER: Coordinates = { lat: 40.7128, lng: -74.0060 }; // New York default

const getBoundsFromCenter = (center: L.LatLng, sizeKm: number) => {
  const halfSize = (sizeKm * 1000) / 2;
  const latOffset = halfSize / 111320;
  const lngOffset = halfSize / (111320 * Math.cos(center.lat * (Math.PI / 180)));

  return L.latLngBounds(
    [center.lat - latOffset, center.lng - lngOffset],
    [center.lat + latOffset, center.lng + lngOffset]
  );
};

const MapController = ({ onAreaChange }: { onAreaChange: (area: MapArea, fullBounds: L.LatLngBounds, startBounds: L.LatLngBounds) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);

  const updateArea = useCallback(() => {
    const center = map.getCenter();
    const exportBounds = getBoundsFromCenter(center, CS2_MAP_SIZE_KM);
    const startAreaBounds = getBoundsFromCenter(center, CS2_START_SIZE_KM);
    
    onAreaChange({
      center: { lat: center.lat, lng: center.lng },
      bounds: {
        north: exportBounds.getNorth(),
        south: exportBounds.getSouth(),
        east: exportBounds.getEast(),
        west: exportBounds.getWest(),
      }
    }, exportBounds, startAreaBounds);
  }, [map, onAreaChange]);

  useMapEvents({
    move: updateArea,
    moveend: updateArea,
    zoomend: updateArea,
  });

  useEffect(() => {
    updateArea();
  }, [updateArea]);

  return null;
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<MapSettings>(DEFAULT_SETTINGS);
  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);
  const [selectionBounds, setSelectionBounds] = useState<L.LatLngBounds | null>(null);
  const [startAreaBounds, setStartAreaBounds] = useState<L.LatLngBounds | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [heightmapData, setHeightmapData] = useState<Uint16Array | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  const handleAreaChange = useCallback((area: MapArea, fullBounds: L.LatLngBounds, startBounds: L.LatLngBounds) => {
    setSelectedArea(area);
    setSelectionBounds(fullBounds);
    setStartAreaBounds(startBounds);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query || !mapInstance) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        mapInstance.flyTo([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const useMyLocation = () => {
    if (!mapInstance) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapInstance.flyTo([pos.coords.latitude, pos.coords.longitude], 13);
    }, (err) => alert("Could not get location."));
  };

  const handleGenerateHeightmap = async () => {
    if (!selectedArea) return;
    setIsGenerating(true);
    try {
      const terrain = await TerrainService.generateSimulatedTerrain(selectedArea, settings);
      setHeightmapData(terrain);
    } catch (err) {
      console.error(err);
      alert("Error: " + err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectionOptions = { 
    color: "#3b82f6", 
    weight: 2, 
    fillOpacity: 0.05, 
    dashArray: '10, 10',
    interactive: false 
  };

  const startAreaOptions = {
    color: "#fbbf24", 
    weight: 1,
    fillOpacity: 0.1,
    dashArray: '5, 5',
    interactive: false
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-950 overflow-hidden">
      <aside className="w-full lg:w-96 h-1/2 lg:h-full flex-shrink-0 border-r border-slate-800 bg-slate-900 shadow-xl z-20 overflow-y-auto">
        <Sidebar 
          settings={settings} 
          setSettings={setSettings} 
          onGenerate={handleGenerateHeightmap}
          onSearch={handleSearch}
          onUseLocation={useMyLocation}
          isGenerating={isGenerating}
        />
      </aside>

      <main className="flex-1 relative h-1/2 lg:h-full min-h-0 bg-slate-800">
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={[INITIAL_CENTER.lat, INITIAL_CENTER.lng]} 
            zoom={12} 
            className="w-full h-full"
            ref={setMapInstance}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController onAreaChange={handleAreaChange} />
            {selectionBounds && (
              <Rectangle bounds={selectionBounds} pathOptions={selectionOptions} />
            )}
            {startAreaBounds && (
              <Rectangle bounds={startAreaBounds} pathOptions={startAreaOptions} />
            )}
          </MapContainer>
        </div>

        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-lg shadow-2xl pointer-events-auto">
            <h1 className="text-xl font-bold text-blue-400 tracking-tight">Cities Skylines II Heightmap Generator</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-medium">1:1 High-Precision Cartography</p>
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[90vw]">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-4 py-2 rounded-full shadow-lg flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-dashed border-blue-400 bg-blue-400/10"></div>
              <span className="text-[10px] text-slate-300 font-bold whitespace-nowrap uppercase">World Map: {CS2_MAP_SIZE_KM}km</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border border-dashed border-amber-400 bg-amber-400/20"></div>
              <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap uppercase">Start Area: {CS2_START_SIZE_KM}km</span>
            </div>
            <div className="w-px h-3 bg-slate-700"></div>
            <div className="text-[10px] text-slate-400 font-mono">
              {selectedArea?.center.lat.toFixed(4)}, {selectedArea?.center.lng.toFixed(4)}
            </div>
          </div>
        </div>

        {heightmapData && (
          <div className="absolute top-4 right-4 w-80 z-30 pointer-events-auto">
            <PreviewPanel 
              data={heightmapData} 
              settings={settings} 
              onClose={() => setHeightmapData(null)} 
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
