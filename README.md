# 🗺️ Cities Skylines II Heightmap Generator
## *Engineered Precision. Global Scale. 16-bit Depth.*

Welcome to the most precise heightmap acquisition tool designed specifically for **Cities Skylines II**. This isn't just a map downloader; it's a high-fidelity geospatial transformer that maps real-world coordinates to the native 14.336km² CS2 grid with pixel-perfect accuracy.

---

### 🚀 Key Capabilities

*   **Global Data Acquisition**: Leveraging AWS S3 Terrain Tiles (Terrarium format) to fetch raw elevation data from anywhere on Earth with meter-level precision.
*   **1:1 Scale Matching**: Hard-coded to the native **14.336km x 14.336km** CS2 world size. The blue bounding box on the map is exactly what you will see in-game.
*   **High-Fidelity 16-bit Depth**: Unlike standard 8-bit images that cause "terraced" mountains, this tool exports true 16-bit grayscale PNGs (0-65535 range), ensuring butter-smooth slopes.
*   **Starting Area Logic**: Includes a precise 2.0km x 2.0km amber guide for your starting tile, allowing you to plan your city's birth with surgical precision.
*   **Bilinear Interpolation Engine**: Advanced resampling ensures smooth transitions even when scaling Zoom Level 13 data to 4096px resolutions.

---

### 🛠️ Technical Specifications

| Feature | Specification |
| :--- | :--- |
| **Grid Resolution** | Up to 4096 x 4096 px (CS2 Native) |
| **Export Format** | 16-bit Grayscale PNG |
| **Physical Size** | Fixed 14.336 km² |
| **Elevation Range** | 0m to 4000m (User Configurable) |
| **Data Source** | AWS S3 Elevation Tiles (Terrarium) |
| **Search Engine** | OpenStreetMap Nominatim |

---

### 📖 Professional Usage Guide

#### 1. Locate Your Canvas
Use the **Global Search** bar or the **"Use My Location"** button to find your target terrain. Drag the map to center the blue rectangle over your chosen 14.3km territory.

#### 2. Calibrate Elevation
Adjust the **Max Elevation (Y-Scale)** slider. 
*   *Tip:* If the mountains in your real-world location reach 1200m, set this to 1300m or higher to prevent "peaking" or clipping.

#### 3. Generate & Normalize
Click **Generate Heightmap**. The engine will:
1. Fetch 16-bit raw elevation tiles.
2. Stitch and crop them to your viewport.
3. Normalize the values to fit the 16-bit PNG spectrum relative to your `Max Height`.

#### 4. The Export
Download the PNG. Notice the **CS2 Import Settings** box in the preview; it shows you the exact numbers you need to type into the game editor.

#### 5. CS2 Map Editor Import
1. Launch Cities Skylines II and open the **Map Editor**.
2. Go to the **Terrain Tab** -> **Import Heightmap**.
3. Select your exported file.
4. **CRITICAL:** Set the `Height Scale` in the editor to match exactly what you used here (e.g., if you set 1000m in the app, use 1000 in CS2).

---

### 🏗️ Technical Architecture

*   **Logic**: WGS84 Web Mercator projection to pixel mapping.
*   **Processing**: Typed Arrays (Uint16Array) for memory-efficient elevation handling.
*   **Rendering**: HTML5 Canvas with Auto-Contrast logic for human-readable previews of 16-bit data.
*   **Stitcher**: Dynamic tile loader for AWS S3 with asynchronous synchronization.

---
*Built for the dedicated architects who demand 1:1 realism.*
