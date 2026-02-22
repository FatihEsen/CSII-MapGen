import React, { useState } from 'react';
import { MapSettings } from '../types';

interface SidebarProps {
  settings: MapSettings;
  setSettings: (s: MapSettings) => void;
  onGenerate: () => void;
  onSearch: (q: string) => void;
  onUseLocation: () => void;
  isGenerating: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  settings, 
  setSettings, 
  onGenerate, 
  onSearch,
  onUseLocation,
  isGenerating
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Search Section */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Location Search</h2>
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative">
            <input 
              type="text"
              placeholder="Search City, Mountain, River..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button 
            type="button"
            onClick={onUseLocation}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium py-2.5 rounded-lg border border-slate-700 transition-colors flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>USE MY CURRENT LOCATION</span>
          </button>
        </form>
      </section>

      {/* Settings Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Topography Settings</h2>
          <span className="bg-blue-500/10 text-blue-400 text-[9px] px-2 py-0.5 rounded border border-blue-500/20">CS2 ENGINE</span>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Output Resolution</label>
            <select 
              value={settings.resolution}
              onChange={(e) => setSettings({...settings, resolution: Number(e.target.value)})}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value={1024}>1024 (Testing)</option>
              <option value={2048}>2048 (High)</option>
              <option value={4096}>4096 (CS2 Native)</option>
            </select>
          </div>

          <div>
            <label className="flex justify-between text-xs font-medium text-slate-400 mb-2">
              <span>Max Elevation (Y-Scale)</span>
              <span className="text-blue-400 font-mono font-bold">{settings.maxHeight}m</span>
            </label>
            <input 
              type="range" min="100" max="8000" step="10"
              value={settings.maxHeight}
              onChange={(e) => setSettings({...settings, maxHeight: Number(e.target.value)})}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 overflow-visible"
            />
            <p className="text-[9px] text-slate-500 mt-1">Automatic adjustment enabled after generation.</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-300">Satellite Export</span>
              <span className="text-[9px] text-slate-500">Perfectly aligned PNG overlay</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={settings.exportSatellite}
                onChange={(e) => setSettings({...settings, exportSatellite: e.target.checked})}
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-blue-900/20 active:scale-[0.98]"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span className="text-sm uppercase">Fetching Data...</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-sm uppercase tracking-wide font-bold">Generate Map Data</span>
            </>
          )}
        </button>

        {/* Usage Instructions */}
        <section className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Kullanım Kılavuzu
          </h3>
          <ul className="space-y-2 text-[10px] text-slate-400">
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">1.</span>
              Harita üzerinden bölgenizi seçin.
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">2.</span>
              "Generate" butonuna basın (Yükseklik otomatik ayarlanacaktır).
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">3.</span>
              İndirilen 16-bit PNG dosyasını CS2 Map Editor'a aktarın.
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-bold mr-2">4.</span>
              Uydu görüntüsünü Image Overlay olarak kullanabilirsiniz.
            </li>
          </ul>
        </section>
      </div>

      <footer className="pt-8 flex flex-col items-center space-y-1">
        <p className="text-[9px] text-slate-600 font-medium">CS2 Heightmap Generator v5.0</p>
        <p className="text-[9px] text-slate-700 uppercase tracking-tighter">Professional 1:1 Scale Elevation Tool</p>
      </footer>
    </div>
  );
};
