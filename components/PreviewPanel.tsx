
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapSettings } from '../types';

interface PreviewPanelProps {
  data: Uint16Array;
  settings: MapSettings;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, settings, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [autoContrast, setAutoContrast] = useState(true);

  const { minVal, maxVal } = useMemo(() => {
    let min = 65535;
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] < min) min = data[i];
      if (data[i] > max) max = data[i];
    }
    return { minVal: min, maxVal: max };
  }, [data]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const size = settings.resolution;
        const imgData = ctx.createImageData(size, size);
        const range = maxVal - minVal;
        const scaleFactor = range > 0 ? 255 / range : 0;

        for (let i = 0; i < data.length; i++) {
          const val16 = data[i];
          let val8;
          if (autoContrast) {
             val8 = (val16 - minVal) * scaleFactor;
          } else {
             val8 = val16 >> 8;
          }
          val8 = Math.max(0, Math.min(255, val8));
          const idx = i * 4;
          imgData.data[idx] = val8;
          imgData.data[idx + 1] = val8;
          imgData.data[idx + 2] = val8;
          imgData.data[idx + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
      }
    }
  }, [data, settings.resolution, autoContrast, minVal, maxVal]);

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

  const handleDownload16Bit = async () => {
    setIsExporting(true);
    try {
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
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `heightmap_${settings.maxHeight}m.png`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PNG Export Error!");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500 backdrop-blur-md">
      <div className="flex w-full justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping"></span>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
          </div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Heightmap Preview</span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-500 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="w-full aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden mb-5 shadow-inner group relative">
        <canvas 
          ref={canvasRef} 
          width={settings.resolution} 
          height={settings.resolution} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <button 
          onClick={() => setAutoContrast(!autoContrast)}
          className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${
            autoContrast 
            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
            : 'bg-slate-800/50 border-slate-600/50 text-slate-500'
          }`}
        >
          {autoContrast ? 'AUTO CONTRAST: ON' : 'RAW VIEW'}
        </button>
      </div>

      <div className="w-full mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <h4 className="text-[10px] font-bold text-amber-400 mb-1 uppercase">CS2 Import Settings</h4>
        <p className="text-[9px] text-slate-300">Set these values in the Map Editor:</p>
        <ul className="text-[9px] text-slate-400 list-disc list-inside mt-1">
          <li>Height Scale: <span className="text-white font-mono">{settings.maxHeight}m</span></li>
          <li>Min Height: <span className="text-white font-mono">0m</span></li>
        </ul>
      </div>

      <button 
        onClick={handleDownload16Bit}
        disabled={isExporting}
        className="w-full bg-white hover:bg-slate-100 disabled:bg-slate-800 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center space-x-2 active:scale-95"
      >
        {isExporting ? (
          <div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="uppercase tracking-widest">EXPORT 16-BIT PNG</span>
          </>
        )}
      </button>
      
      <div className="mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30 w-full space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Data Range</span>
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
  );
};
