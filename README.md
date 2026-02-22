# 🗺️ Cities Skylines II Heightmap Generator v5.1
## *Engineered Precision. Global Scale. 16-bit Depth.*

Welcome to the most precise heightmap acquisition tool designed specifically for **Cities Skylines II**. This isn't just a map downloader; it's a high-fidelity geospatial transformer that maps real-world coordinates to the native CS2 grid with pixel-perfect accuracy.

---

### 🚀 Key Capabilities

*   **⚡ Parallel Data Acquisition**: Leveraging AWS S3 Terrain Tiles (Terrarium format) with parallel fetching logic to grab elevation data from anywhere on Earth up to 50% faster.
*   **📐 Map Size Multiplier**: No longer restricted to the base grid. Use the **multiplier (1x - 4x)** to capture vast regions (up to ~57km²) for massive modded projects.
*   **🛰️ Satellite Overlay Export**: Capture perfectly aligned satellite imagery alongside your heightmap to use as an "Image Overlay" in the CS2 editor for precise city planning.
*   **⛰️ Automatic Height Calibration**: The tool automatically analyzes the fetched terrain and suggests the optimal **Max Elevation (Y-Scale)**, eliminating manual guesswork.
*   **High-Fidelity 16-bit Depth**: Exports true 16-bit grayscale PNGs (0-65535 range), ensuring butter-smooth slopes and no "staircase" artifacts.
*   **🌍 Multi-language Support**: Full support for both **Turkish (TR)** and **English (EN)** interfaces.

---

### 🛠️ Technical Specifications

| Feature | Specification |
| :--- | :--- |
| **Grid Resolution** | Up to 4096 x 4096 px (CS2 Native) |
| **Export Format** | 16-bit Grayscale PNG + Satellite PNG |
| **Physical Size** | 14.336 km² up to 57.344 km² (Multiplier Support) |
| **Elevation Range** | Automatic detection or 100m to 8000m manual override |
| **Data Source** | AWS S3 Elevation Tiles & ArcGIS World Imagery |
| **Search Engine** | OpenStreetMap Nominatim |

---

![Ana Ekran](screenshots/CSIImg.png)

### 📖 Professional Usage Guide

#### 1. Locate Your Canvas
Use the **Global Search** bar or the **"Use My Location"** button. Drag the map to center the blue rectangle. 
*   *New:* Use the **Multiplier** slider to increase the export area for extra-large maps.

#### 2. Satellite Option
Enable **Satellite Export** if you want a reference image for roads, rivers, and shoreline placement.

#### 3. Generate & Analyze
Click **Generate Map Data**. The engine will:
1. Fetch 16-bit raw elevation and satellite tiles in parallel.
2. **Auto-adjust** the Max Height setting based on the real-world peaks found.
3. Normalize the values to fit the 16-bit spectrum.

#### 4. The Export
Download the package. The **Preview Panel** will show both the Heightmap and Satellite view for verification.

#### 5. CS2 Map Editor Import
1. Launch Cities Skylines II and open the **Map Editor**.
2. Go to the **Terrain Tab** -> **Import Heightmap**.
3. **CRITICAL:** Set the `Height Scale` in the editor to match the **Max Height** shown in the export summary here.
4. If you exported the satellite image, use an Image Overlay mod to import it as a 1:1 ground guide.

---

### 🏗️ Technical Architecture

*   **Logic**: WGS84 Web Mercator projection to pixel mapping.
*   **Memory Management**: Smart **ObjectURL** handling and auto-revocation to keep the browser light even with 4K satellite data.
*   **Rendering**: HTML5 Canvas with Auto-Contrast logic and 16-bit RAW preview modes.
*   **Stitcher**: Parallel tile loader for AWS S3 and ArcGIS with dynamic zoom level optimization based on multiplier scale.

---
*Built for the dedicated architects who demand 1:1 realism.*
