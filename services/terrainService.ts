import { MapArea, MapSettings, TerrainResult } from '../types';

export class TerrainService {
  private static lerp(a: number, b: number, t: number) {
    return a + t * (b - a);
  }

  private static fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private static noise(x: number, y: number, seed: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private static getFBM(x: number, y: number, octaves: number, persistence: number, scale: number, seed: number): number {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      const ix = Math.floor(x * frequency);
      const iy = Math.floor(y * frequency);
      const fx = (x * frequency) - ix;
      const fy = (y * frequency) - iy;
      const a = this.noise(ix, iy, seed);
      const b = this.noise(ix + 1, iy, seed);
      const c = this.noise(ix, iy + 1, seed);
      const d = this.noise(ix + 1, iy + 1, seed);
      const ux = this.fade(fx);
      const uy = this.fade(fy);
      const res = this.lerp(this.lerp(a, b, ux), this.lerp(c, d, ux), uy);
      total += res * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }

  private static long2tile(lon: number, zoom: number) { return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom))); }
  private static lat2tile(lat: number, zoom: number) { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))); }

  private static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Tile yüklenemedi: ${url}`));
      img.src = url;
    });
  }

  private static async fetchTerrainTiles(area: MapArea): Promise<{ grid: Float32Array, width: number, height: number, minE: number, maxE: number }> {
    const ZOOM = 13;
    const tileX_min = this.long2tile(area.bounds.west, ZOOM);
    const tileX_max = this.long2tile(area.bounds.east, ZOOM);
    const tileY_min = this.lat2tile(area.bounds.north, ZOOM);
    const tileY_max = this.lat2tile(area.bounds.south, ZOOM);
    const xRange = tileX_max - tileX_min + 1;
    const yRange = tileY_max - tileY_min + 1;
    const canvas = document.createElement('canvas');
    canvas.width = xRange * 256;
    canvas.height = yRange * 256;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error("Tuval içeriği alınamadı.");

    const promises = [];
    let failedCount = 0;
    for (let x = 0; x < xRange; x++) {
      for (let y = 0; y < yRange; y++) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tileX_min + x}/${tileY_min + y}.png`;
        promises.push(this.loadImage(url)
          .then(img => ctx.drawImage(img, x * 256, y * 256))
          .catch(err => {
            console.warn(`Tile yüklenemedi: ${url}`, err);
            failedCount++;
          })
        );
      }
    }
    await Promise.all(promises);
    if (failedCount > 0) {
      console.warn(`${failedCount} adet tile yüklenemedi. Bu durum yükseklik haritasında boşluklara neden olabilir.`);
    }

    const worldSize = 256 * Math.pow(2, ZOOM);
    const project = (lat: number, lng: number) => {
      let siny = Math.min(Math.max(Math.sin(lat * Math.PI / 180), -0.9999), 0.9999);
      return { x: worldSize * (0.5 + lng / 360), y: worldSize * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) };
    };
    const topLeft = project(area.bounds.north, area.bounds.west);
    const bottomRight = project(area.bounds.south, area.bounds.east);
    const sX = Math.max(0, Math.floor(topLeft.x - tileX_min * 256));
    const sY = Math.max(0, Math.floor(topLeft.y - tileY_min * 256));
    const w = Math.ceil(bottomRight.x - topLeft.x);
    const h = Math.ceil(bottomRight.y - topLeft.y);
    const imageData = ctx.getImageData(sX, sY, Math.min(canvas.width - sX, w), Math.min(canvas.height - sY, h));
    const rawData = imageData.data;
    const elevGrid = new Float32Array(imageData.width * imageData.height);
    let minE = 100000;
    let maxE = -100000;

    for (let i = 0; i < elevGrid.length; i++) {
      const val = (rawData[i * 4] * 256 + rawData[i * 4 + 1] + rawData[i * 4 + 2] / 256) - 32768;
      elevGrid[i] = val;
      if (val < minE) minE = val;
      if (val > maxE) maxE = val;
    }
    return { grid: elevGrid, width: imageData.width, height: imageData.height, minE, maxE };
  }

  private static async fetchSatelliteTiles(area: MapArea, resolution: number, multiplier: number): Promise<string> {
    const ZOOM = multiplier > 2.5 ? 14 : 15;
    const tileX_min = this.long2tile(area.bounds.west, ZOOM);
    const tileX_max = this.long2tile(area.bounds.east, ZOOM);
    const tileY_min = this.lat2tile(area.bounds.north, ZOOM);
    const tileY_max = this.lat2tile(area.bounds.south, ZOOM);
    const xRange = tileX_max - tileX_min + 1;
    const yRange = tileY_max - tileY_min + 1;

    if (xRange * yRange > 500) {
      console.warn("Too many satellite tiles requested, reducing zoom level");
    }

    const canvas = document.createElement('canvas');
    canvas.width = xRange * 256;
    canvas.height = yRange * 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Uydu haritası tuvali oluşturulamadı.");

    const promises = [];
    for (let x = 0; x < xRange; x++) {
      for (let y = 0; y < yRange; y++) {
        const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${ZOOM}/${tileY_min + y}/${tileX_min + x}`;
        promises.push(this.loadImage(url).then(img => ctx.drawImage(img, x * 256, y * 256)).catch(() => { }));
      }
    }
    await Promise.all(promises);

    const worldSize = 256 * Math.pow(2, ZOOM);
    const project = (lat: number, lng: number) => {
      let siny = Math.min(Math.max(Math.sin(lat * Math.PI / 180), -0.9999), 0.9999);
      return { x: worldSize * (0.5 + lng / 360), y: worldSize * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)) };
    };

    const topLeft = project(area.bounds.north, area.bounds.west);
    const bottomRight = project(area.bounds.south, area.bounds.east);
    const sX = Math.max(0, Math.floor(topLeft.x - tileX_min * 256));
    const sY = Math.max(0, Math.floor(topLeft.y - tileY_min * 256));
    const w = Math.ceil(bottomRight.x - topLeft.x);
    const h = Math.ceil(bottomRight.y - topLeft.y);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = resolution;
    outputCanvas.height = resolution;
    const oCtx = outputCanvas.getContext('2d');
    if (!oCtx) throw new Error("Export tuvali oluşturulamadı.");

    oCtx.drawImage(canvas, sX, sY, w, h, 0, 0, resolution, resolution);

    return new Promise((resolve) => {
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve("");
        }
      }, 'image/png');
    });
  }

  static async generateSimulatedTerrain(
    area: MapArea,
    settings: MapSettings,
    onProgress?: (p: number) => void
  ): Promise<TerrainResult> {
    const size = settings.resolution;
    const data = new Uint16Array(size * size);
    const seed = Math.random() * 1000;
    const type = settings.terrainType;
    let realData: { grid: Float32Array, width: number, height: number, minE: number, maxE: number } | null = null;
    let satelliteUrl: string | undefined = undefined;

    if (type === 'REAL_WORLD') {
      try {
        if (onProgress) onProgress(10);
        const [terrain, satellite] = await Promise.all([
          this.fetchTerrainTiles(area),
          settings.exportSatellite ? this.fetchSatelliteTiles(area, settings.resolution, settings.sizeMultiplier) : Promise.resolve(undefined)
        ]);
        realData = terrain;
        satelliteUrl = satellite;
        if (onProgress) onProgress(40);
      } catch (e) {
        console.error(e);
      }
    }

    const effectiveMaxHeight = (realData && type === 'REAL_WORLD') ? realData.maxE : settings.maxHeight;

    // Process in chunks to keep UI responsive
    const CHUNK_SIZE = 64;
    for (let y = 0; y < size; y += CHUNK_SIZE) {
      const endY = Math.min(y + CHUNK_SIZE, size);

      for (let cy = y; cy < endY; cy++) {
        for (let x = 0; x < size; x++) {
          const nx = x / size;
          const ny = cy / size;
          let height = 0;
          if (type === 'REAL_WORLD' && realData) {
            const gx = nx * (realData.width - 1);
            const gy = ny * (realData.height - 1);
            const ix = Math.floor(gx);
            const iy = Math.floor(gy);
            const fx = gx - ix;
            const fy = gy - iy;
            const getVal = (cx: number, cy: number) => realData!.grid[Math.min(realData!.height - 1, Math.max(0, cy)) * realData!.width + Math.min(realData!.width - 1, Math.max(0, cx))];
            const top = getVal(ix, iy) * (1 - fx) + getVal(ix + 1, iy) * fx;
            const bottom = getVal(ix, iy + 1) * (1 - fx) + getVal(ix + 1, iy + 1) * fx;
            const absH = top * (1 - fy) + bottom * fy;
            height = absH / effectiveMaxHeight;
          } else {
            height = this.getFBM(nx, ny, 6, 0.5, 2.0, seed);
          }
          data[cy * size + x] = Math.floor(Math.max(0, Math.min(1, height)) * 65535);
        }
      }

      if (onProgress) {
        const progress = 40 + (y / size) * 60;
        onProgress(Math.floor(progress));
      }

      // Yield to UI thread
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (onProgress) onProgress(100);

    return {
      heightmap: data,
      satelliteUrl,
      minElevation: realData ? realData.minE : 0,
      maxElevation: realData ? realData.maxE : 1000
    };
  }
}
