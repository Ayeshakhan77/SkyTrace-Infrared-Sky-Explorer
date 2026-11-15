# SkyTrace — Infrared Sky Explorer
**NASA Space Apps Challenge 2026: Planet X and SPHEREx**  
*Challenge Brief:* [NASA Space Apps Challenge: Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/)

SkyTrace is an interactive, public-facing web platform designed to explore all-sky near-infrared spectral imagery from NASA's **SPHEREx** mission. It allows citizen scientists and astronomers to display series of infrared sky images over time as a video, spot moving objects (asteroids, comets, brown dwarfs, and hypothetical outer solar system bodies), monitor variable stars, and audit discoveries using a cryptographically verifiable provenance ledger.

---

## 🌟 Key Features

1. **Time-Series Video Looping & Frame Scrubbing:**
   - Prepares and animates up to 4 temporal observation epochs simultaneously.
   - Variable playback speeds (0.5x, 1.0x, 2.0x, and 4.0x rapid video loop at 300 ms).
   - Interactive frame scrubbing slider and keyboard shortcuts (`Space` to Play/Pause, `←`/`→` to step).
   - Dynamic 1–4 pane side-by-side comparative grid labeled chronologically (Earliest, Intermediate, Latest).

2. **Audited Change Receipt v1.2 (JSON Schema Draft 2020-12):**
   - Implements a formal 6-section provenance ledger separating visual exploration from scientific claims.
   - Evaluates a 10-point scientific validation matrix (astrometry, Linear Variable Filter $\Delta\lambda$ shifts, PSF matching, quality flag masks).
   - One-click exportable, cryptographically hashed JSON receipt (`.json`) for research verification.

3. **Resilient Coordinate Parsing & Target Reticle:**
   - Full support for decimal degrees and sexagesimal formats (e.g. `08h55m10.831s, -7d14m42.53s`), including unicode minus characters (`−`, `–`, `—`).
   - Real-time coordinate validation pill with normalized celestial coordinates.
   - Target crosshair reticle overlay and automatic quality contamination warning badges (`> 30% FLAGS`).
   - Pixelated nearest-neighbor rendering (`imageRendering: pixelated`) preserving crisp raw $18\times 18$ detector blocks.

4. **SPHEREx Mission Releases (DR1 vs QR3):**
   - Active collection toggle between **SPHEREx DR1** (Standard, Reprocessed Surveys 1 & 2) and **SPHEREx QR3** (Quick Release, Surveys 3 & 4).
   - Upstream IVOA SIA2 query URL logging and provenance retention.

5. **Bidirectional URL Deep-Linking & One-Click Sharing:**
   - Full state synchronization in URL query parameters (`?target=&ra=&dec=&radius=&collection=&mode=`).
   - One-click **"🔗 Share / Embed Link"** action to copy deep links directly to clipboard for Zooniverse, blogs, or forums.

---

## 🎯 Tested Benchmark Targets

SkyTrace is benchmarked and validated across all five official challenge targets:
- **WISE 0855:** Ultra-cold, high-proper-motion brown dwarf (`RA 08h55m10.831s, Dec -7d14m42.53s`).
- **Barnard's Star:** High-proper-motion star ($\mu \sim 10.3\,\text{arcsec/yr}$).
- **Epsilon Indi B:** Binary brown dwarf system orbiting a nearby star.
- **RW Aurigae:** Young variable T Tauri star undergoing accretion and occultation.
- **R Draconis:** Long-period Mira pulsating variable star.

---

## 🚀 Quickstart & Running Locally

### Option A: Standalone Viewer (Recommended for Evaluators)
The frontend comes preloaded with authentic SPHEREx DR1/QR2 cutouts and presets, allowing immediate evaluation without external backend dependencies:
```bash
cd frontend
npm ci
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Option B: Full Stack (FastAPI Backend + React Frontend)

1. **Start the FastAPI Backend:**
   ```bash
   cd backend
   python -m pip install -r requirements-lock.txt
   # Populate local cache from example fixtures
   cp -R examples/cache/. data/
   python -m uvicorn skytrace.api:app --host 127.0.0.1 --port 8765
   ```
   Interactive API docs are available at **`http://127.0.0.1:8765/docs`**.

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm ci
   npm run dev
   ```
   In the browser at **`http://localhost:3000`**, toggle to **"Live FastAPI Backend"** in the Search tab to query the local API directly.

---

## 🧪 Automated Testing & Verification

Run the comprehensive acceptance testing suite from the repository:
```bash
cd backend
python tests/test_coordinates.py
python tests/test_receipt_schema.py
python tests/test_url_params.py
python tests/test_multi_observation.py
python tests/test_full_acceptance.py
```
To verify the frontend production build:
```bash
cd frontend
npm run build
```

---

## 📚 Technical Documentation

- **[Automated Test Execution & Verification Report](docs/TEST_EXECUTION_AND_VERIFICATION_REPORT.md)** (100% Passed)
- **[Master NASA Challenge Alignment & Refinements Guide](docs/NASA_CHALLENGE_ALIGNMENT_AND_REFINEMENTS.md)**
- **[Change Receipt v1.2 Schema Specification](docs/schemas/change_receipt_v1.2.schema.json)**
- **[Example Change Receipt v1.2 JSON](docs/examples/change_receipt_example_v1.2.json)**
- **[Team Handoff & Scientific Limitations](backend/TEAM-HANDOFF.md)**
