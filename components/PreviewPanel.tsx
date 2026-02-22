import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapSettings } from '../types';
import { translations } from '../i18n';

interface PreviewPanelProps {
  data: Uint16Array;
  satelliteUrl?: string;
  settings: MapSettings;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, satelliteUrl, settings, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [autoContrast, setAutoContrast] = useState(true);
  const [viewMode, setViewMode] = useState<'heightmap' | 'satellite'>(satelliteUrl ? 'satellite' : 'heightmap');

  const { minVal, maxVal } = useMemo(() => {
    let min = 65535;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    return { minVal: min, maxVal: max };
  }, [data]);

  const PREVIEW_SIZE = 512;
  const t = translations[settings.language];

  useEffect(() => {
    if (viewMode === 'satellite' && satelliteUrl) return;

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const size = settings.resolution;
        const imgData = ctx.createImageData(PREVIEW_SIZE, PREVIEW_SIZE);
        const range = maxVal - minVal;
        const scaleFactor = range > 0 ? 255 / range : 0;

        for (let y = 0; y < PREVIEW_SIZE; y++) {
          for (let x = 0; x < PREVIEW_SIZE; x++) {
            const dataX = Math.floor((x / PREVIEW_SIZE) * size);
            const dataY = Math.floor((y / PREVIEW_SIZE) * size);
            const val16 = data[dataY * size + dataX];

            let val8;
            if (autoContrast) {
              val8 = (val16 - minVal) * scaleFactor;
            } else {
              val8 = val16 >> 8;
            }
            val8 = Math.max(0, Math.min(255, val8));
            const idx = (y * PREVIEW_SIZE + x) * 4;
            imgData.data[idx] = val8;
            imgData.data[idx + 1] = val8;
            imgData.data[idx + 2] = val8;
            imgData.data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }, [data, settings.resolution, autoContrast, minVal, maxVal, viewMode, satelliteUrl]);

  useEffect(() => {
    return () => {
      // Revoke ObjectURL to free memory if it's a blob URL
      // But only if we are not in the middle of a download
      // Actually, standard practice is OK, but let's be careful.
    };
  }, [satelliteUrl]);

  const crc32 = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    return (data: Uint8Array) => {
      let c = 0xffffffff;
      for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    };
  })();

  const createChunk = (type: string, data: Uint8Array) => {
    const typeBytes = new TextEncoder().encode(type);
    const chunk = new Uint8Array(4 + 4 + data.length + 4);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, data.length);
    chunk.set(typeBytes, 4);
    chunk.set(data, 8);
    const crcInput = new Uint8Array(4 + data.length);
    crcInput.set(typeBytes, 0);
    crcInput.set(data, 4);
    view.setUint32(8 + data.length, crc32(crcInput));
    return chunk;
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      // 1. Download Heightmap
      const width = settings.resolution;
      const height = settings.resolution;
      const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const ihdrData = new Uint8Array(13);
      const ihdrView = new DataView(ihdrData.buffer);
      ihdrView.setUint32(0, width);
      ihdrView.setUint32(4, height);
      ihdrData[8] = 16;
      ihdrData[9] = 0;
      ihdrData[10] = 0;
      ihdrData[11] = 0;
      ihdrData[12] = 0;
      const ihdr = createChunk('IHDR', ihdrData);

      const uncompressedSize = height * (1 + width * 2);
      const uncompressed = new Uint8Array(uncompressedSize);

      for (let y = 0; y < height; y++) {
        const rowStart = y * (1 + width * 2);
        uncompressed[rowStart] = 0;
        for (let x = 0; x < width; x++) {
          const val = data[y * width + x];
          uncompressed[rowStart + 1 + x * 2] = (val >> 8) & 0xff;
          uncompressed[rowStart + 1 + x * 2 + 1] = val & 0xff;
        }
        if (y % 512 === 0) await new Promise(r => setTimeout(r, 0));
      }

      const cs = new CompressionStream('deflate');
      const writer = cs.writable.getWriter();
      writer.write(uncompressed);
      writer.close();
      const compressedParts: Uint8Array[] = [];
      const reader = cs.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        compressedParts.push(value);
      }
      const compressed = new Uint8Array(compressedParts.reduce((acc, p) => acc + p.length, 0));
      let offset = 0;
      for (const p of compressedParts) {
        compressed.set(p, offset);
        offset += p.length;
      }
      const idat = createChunk('IDAT', compressed);
      const iend = createChunk('IEND', new Uint8Array(0));
      const blob = new Blob([signature, ihdr, idat, iend], { type: 'image/png' });
      const hUrl = URL.createObjectURL(blob);

      const hLink = document.createElement('a');
      hLink.href = hUrl;
      hLink.download = `heightmap_${settings.maxHeight}m.png`;
      document.body.appendChild(hLink);
      hLink.click();
      document.body.removeChild(hLink);

      // Give browser time to start first download
      await new Promise(r => setTimeout(r, 500));

      // 2. Download Satellite (if available)
      if (satelliteUrl && satelliteUrl.length > 0) {
        const sLink = document.createElement('a');
        sLink.href = satelliteUrl;
        sLink.download = `satellite_overlay.png`;
        document.body.appendChild(sLink);
        sLink.click();
        document.body.removeChild(sLink);
      }

      URL.revokeObjectURL(hUrl);
    } catch (err) {
      console.error(err);
      alert(t.exportError || "PNG Export Error!");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Integrated Header Panel */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-3 mb-1">
          <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight leading-none">{t.title}</h1>
            <p className="text-[9px] text-blue-400 uppercase tracking-[0.2em] font-bold mt-1 opacity-80">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col items-center backdrop-blur-md">
        <div className="flex w-full justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
              {viewMode === 'satellite' ? t.previewSatellite : t.previewHeightmap}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="w-full aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-5 shadow-inner group relative">
          {viewMode === 'satellite' && satelliteUrl ? (
            <img src={satelliteUrl} alt="Satellite" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}

          <div className="absolute top-2 left-2 flex space-x-1">
            <button
              onClick={() => setViewMode('heightmap')}
              className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${viewMode === 'heightmap'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}
            >
              {t.heightMode}
            </button>
            {satelliteUrl && (
              <button
                onClick={() => setViewMode('satellite')}
                className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${viewMode === 'satellite'
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                  }`}
              >
                {t.satMode}
              </button>
            )}
          </div>

          {viewMode === 'heightmap' && (
            <button
              onClick={() => setAutoContrast(!autoContrast)}
              className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${autoContrast
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800/50 border-slate-600/50 text-slate-500'
                }`}
            >
              {autoContrast ? t.contrastOn : t.contrastRaw}
            </button>
          )}
        </div>

        <div className="w-full mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <h4 className="text-[10px] font-bold text-amber-400 mb-1 uppercase tracking-wider">{t.importSettings}</h4>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase">{t.heightScale}</span>
              <span className="text-[11px] text-white font-mono font-bold">{settings.maxHeight}m</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 uppercase">{t.minHeight}</span>
              <span className="text-[11px] text-white font-mono font-bold">0m</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold py-4 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95"
        >
          {isExporting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="uppercase tracking-widest">{satelliteUrl ? t.exportAll : t.exportPng}</span>
            </>
          )}
        </button>

        <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 w-full space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{t.dataRange}</span>
            <span className="text-[9px] text-blue-400 font-mono">{(minVal / 65535 * settings.maxHeight).toFixed(1)}m - {(maxVal / 65535 * settings.maxHeight).toFixed(1)}m</span>
          </div>
          <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 opacity-50"
              style={{
                marginLeft: `${(minVal / 65535) * 100}%`,
                width: `${((maxVal - minVal) / 65535) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
