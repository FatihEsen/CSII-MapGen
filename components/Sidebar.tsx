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
    <div className="p-6 space-y-6 bg-slate-900/50 min-h-full">
      {/* App Title & Header Frame */}
      <div className="relative p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-inner group overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold tracking-tighter leading-tight bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <div className="mt-3 flex items-center justify-between p-1 bg-slate-900/80 rounded-lg border border-slate-700/50 w-full">
            <button
              onClick={() => setSettings({ ...settings, language: 'tr' })}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${settings.language === 'tr' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
              TÜRKÇE
            </button>
            <button
              onClick={() => setSettings({ ...settings, language: 'en' })}
              className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${settings.language === 'en' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ENGLISH
            </button>
          </div>
        </div>
      </div>

      {/* Search Section Frame */}
      <section className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80 px-1">{settings.language === 'tr' ? 'KONUM ARAMA' : 'LOCATION SEARCH'}</h2>
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="relative group">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-10 transition-all group-hover:border-slate-600"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={onUseLocation}
            className="w-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-xs font-bold py-3 rounded-xl border border-slate-700/50 transition-all flex items-center justify-center space-x-2 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="uppercase tracking-wider">{t.useMyLocation}</span>
          </button>
        </form>
      </section>

      {/* Settings Section Frame */}
      <section className="p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400/80">{t.topographySettings}</h2>
          <span className="bg-blue-500/10 text-blue-400 text-[8px] px-2 py-1 rounded border border-blue-500/20 font-black uppercase tracking-tighter">{t.engine}</span>
        </div>

        <div className="space-y-6">
          {/* Map Multiplier */}
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
            <label className="flex justify-between text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-tight">
              <span>{t.mapSizeMultiplier}</span>
              <span className="text-blue-400 font-mono">{settings.sizeMultiplier}x ({currentSizeKm}km)</span>
            </label>
            <input
              type="range" min="1" max="4" step="0.5"
              value={settings.sizeMultiplier}
              onChange={(e) => setSettings({ ...settings, sizeMultiplier: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[8px] text-slate-600 mt-2 uppercase font-black px-1">
              <span>1x</span>
              <span>2x</span>
              <span>3x</span>
              <span>4x</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
            <label className="block text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-tight">{t.outputResolution}</label>
            <select
              value={settings.resolution}
              onChange={(e) => setSettings({ ...settings, resolution: Number(e.target.value) })}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            >
              <option value={1024}>1024 ({settings.language === 'tr' ? 'Test' : 'Testing'})</option>
              <option value={2048}>2048 ({settings.language === 'tr' ? 'Yüksek' : 'High'})</option>
              <option value={4096}>4096 (CS2 Native)</option>
              <option value={8192}>4096 ({settings.language === 'tr' ? 'Ultra Detay - SS' : 'Ultra Detail - SS'})</option>
            </select>
          </div>

          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
            <label className="flex justify-between text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-tight">
              <span>{t.maxElevation}</span>
              <span className="text-blue-400 font-mono">{settings.maxHeight}m</span>
            </label>
            <input
              type="range" min="100" max="8000" step="10"
              value={settings.maxHeight}
              onChange={(e) => setSettings({ ...settings, maxHeight: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[9px] text-slate-500 mt-2 italic px-1">{t.autoAdjustHint}</p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{t.satelliteExport}</span>
              <span className="text-[9px] text-slate-500">{t.satelliteHint}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.exportSatellite}
                onChange={(e) => setSettings({ ...settings, exportSatellite: e.target.checked })}
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-700/30">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-tight">{t.worldMapExport}</span>
              <span className="text-[9px] text-slate-500">{t.worldMapHint}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.exportWorldMap}
                onChange={(e) => setSettings({ ...settings, exportWorldMap: e.target.checked })}
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Action Area Frame */}
      <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 shadow-2xl space-y-4">
        <div className="space-y-2">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-black py-5 px-4 rounded-xl transition-all flex items-center justify-center space-x-3 shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-[0.98] border border-blue-400/20"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span className="text-sm uppercase tracking-widest">{t.fetchingData}</span>
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-sm uppercase tracking-[0.15em] font-black">{t.generateButton}</span>
              </>
            )}
          </button>

          {isGenerating && (
            <div className="w-full bg-slate-950 rounded-full h-2 mt-3 p-0.5 border border-slate-800 shadow-inner overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Usage Instructions Frame */}
        <section className="bg-slate-950/40 border border-slate-700/30 rounded-xl p-4 shadow-inner">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>
            {t.guideTitle}
          </h3>
          <ul className="space-y-3 text-[10px] text-slate-400 leading-relaxed">
            <li className="flex items-start">
              <span className="text-blue-500 font-black mr-2 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">1</span>
              <span>{t.guideStep1}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-black mr-2 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">2</span>
              <span>{t.guideStep2}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-black mr-2 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">3</span>
              <span>{t.guideStep3}</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 font-black mr-2 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">4</span>
              <span>{t.guideStep4}</span>
            </li>
          </ul>
        </section>
      </div>

      <footer className="pt-4 flex flex-col items-center space-y-1 opacity-50">
        <p className="text-[9px] text-slate-500 font-bold tracking-widest">CS2 HEIGHTMAP GEN V5.1</p>
        <p className="text-[8px] text-slate-600 uppercase tracking-tighter">{t.professionalTool}</p>
      </footer>
    </div>
  );
};
