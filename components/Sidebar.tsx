import React, { useState } from 'react';
import { MapSettings } from '../types';
import { translations } from '../i18n';

interface SidebarProps {
  settings: MapSettings;
  setSettings: (s: MapSettings) => void;
  onGenerate: () => void;
  onSearch: (q: string) => void;
  onUseLocation: () => void;
  isGenerating: boolean;
  progress: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  setSettings,
  onGenerate,
  onSearch,
  onUseLocation,
  isGenerating,
  progress
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const currentSizeKm = (14.336 * settings.sizeMultiplier).toFixed(2);
  const t = translations[settings.language];

  return (
    <div className="p-4 space-y-4 bg-slate-900/50 min-h-full">
      {/* App Title & Header Frame */}
      <div className="relative p-5 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-white/10 shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">MAPGEN PRO</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent drop-shadow-sm">
            {t.title}
          </h1>
          <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase tracking-widest opacity-80">{t.subtitle}</p>
          
          <div className="mt-4 flex items-center justify-between p-1 bg-black/40 rounded-xl border border-white/5 w-full backdrop-blur-sm">
            <button
              onClick={() => setSettings({ ...settings, language: 'tr' })}
              className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black transition-all ${settings.language === 'tr' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TÜRKÇE
            </button>
            <button
              onClick={() => setSettings({ ...settings, language: 'en' })}
              className={`flex-1 px-3 py-2 rounded-lg text-[9px] font-black transition-all ${settings.language === 'en' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ENGLISH
            </button>
          </div>
        </div>
      </div>

      {/* Search Section Frame */}
      <section className="p-3 bg-slate-800/20 rounded-2xl border border-white/5 space-y-3">
        <form onSubmit={handleSearchSubmit} className="space-y-2">
          <div className="relative group">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/40 border border-slate-700/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 pr-10 transition-all group-hover:border-slate-600"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={onUseLocation}
            className="w-full bg-slate-800/40 hover:bg-slate-700/40 text-slate-400 text-[10px] font-black py-2.5 rounded-xl border border-white/5 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="uppercase tracking-widest">{t.useMyLocation}</span>
          </button>
        </form>
      </section>

      {/* Settings Section Frame */}
      <section className="p-3 bg-slate-800/20 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">{t.topographySettings}</h2>
          <span className="bg-blue-500/10 text-blue-400 text-[8px] px-2 py-1 rounded border border-blue-500/20 font-black tracking-tighter">V5.2</span>
        </div>

        <div className="space-y-4">
          {/* Map Multiplier */}
          <div className="p-3 bg-black/20 rounded-xl border border-white/5">
            <label className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tight">
              <span>{t.mapSizeMultiplier}</span>
              <span className="text-blue-400 font-mono">{settings.sizeMultiplier}x ({currentSizeKm}km)</span>
            </label>
            <input
              type="range" min="1" max="128" step="1"
              value={settings.sizeMultiplier}
              onChange={(e) => setSettings({ ...settings, sizeMultiplier: Number(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="p-3 bg-black/20 rounded-xl border border-white/5">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tight">{t.outputResolution}</label>
            <select
              value={settings.resolution}
              onChange={(e) => setSettings({ ...settings, resolution: Number(e.target.value) })}
              className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
            >
              <option value={4096}>4096 (CS2 Native)</option>
              <option value={8192}>4096 ({settings.language === 'tr' ? 'Ultra Detay - SS' : 'Ultra Detail - SS'})</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col p-2.5 bg-black/20 rounded-xl border border-white/5 transition-colors hover:bg-black/30">
              <span className="text-[9px] font-black text-slate-300 mb-1 uppercase tracking-tighter">{t.satelliteExport}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.exportSatellite}
                  onChange={(e) => setSettings({ ...settings, exportSatellite: e.target.checked })}
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex flex-col p-2.5 bg-black/20 rounded-xl border border-white/5 transition-colors hover:bg-black/30">
              <span className="text-[9px] font-black text-slate-300 mb-1 uppercase tracking-tighter">{t.worldMapExport}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.exportWorldMap}
                  onChange={(e) => setSettings({ ...settings, exportWorldMap: e.target.checked })}
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Action Area Frame */}
      <div className="p-3 bg-slate-800/30 rounded-2xl border border-white/10 shadow-2xl space-y-3">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-black py-4 px-4 rounded-xl transition-all flex items-center justify-center space-x-3 shadow-[0_8px_16px_rgba(37,99,235,0.2)] active:scale-[0.97] border border-blue-400/20"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span className="text-[11px] uppercase tracking-widest">{t.fetchingData}</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-[11px] uppercase tracking-[0.2em] font-black">{t.generateButton}</span>
            </>
          )}
        </button>

        {isGenerating && (
          <div className="w-full bg-slate-950 rounded-full h-1.5 p-0.5 border border-slate-800 shadow-inner overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* Usage Instructions Frame */}
        <section className="bg-black/30 border border-white/5 rounded-xl p-3">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center">
            <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
            {t.guideTitle}
          </h3>
          <ul className="space-y-1.5 text-[8px] text-slate-500 leading-tight">
            <li className="flex items-start">
              <span className="text-blue-500/80 font-black mr-2">01</span>
              <span>{t.guideStep1}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500/80 font-black mr-2">02</span>
              <span>{t.guideStep2}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500/80 font-black mr-2">03</span>
              <span>{t.guideStep3}</span>
            </li>
          </ul>
        </section>
      </div>

      <footer className="pt-2 flex flex-col items-center space-y-1 opacity-30">
        <p className="text-[8px] text-slate-500 font-black tracking-[0.3em]">VERSION 5.2.0</p>
      </footer>
    </div>
  );
};
