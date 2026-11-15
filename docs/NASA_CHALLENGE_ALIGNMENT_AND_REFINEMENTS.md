# SKYTRACE: Comprehensive Project Refinements & NASA Challenge Alignment Guide

**Project Name:** SKYTRACE — Infrared Sky Explorer  
**Challenge:** NASA Space Apps Challenge 2026: *Planet X and SPHEREx*  
**Challenge Brief:** [NASA Space Apps Challenge: Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/)  
**Target Audience:** NASA Space Apps Challenge Judges, Citizen Scientists, Astronomical Collaborators  
**Date:** 15 November 2026  

---

## 1. NASA Challenge Context & Mission Background

NASA’s Spectro-Photometer for the History of the Universe, Epoch of Reionization, and Ices Explorer (**SPHEREx**) mission conducts an all-sky near-infrared spectral survey mapping the celestial sphere every six months in 102 photometric bands ($0.75\,\mu\text{m} - 5.0\,\mu\text{m}$). 

### The Core Scientific Problem
- Over six-month cycles, nearby solar system objects (asteroids, comets, hypothetical Planet X), high-proper-motion targets (nearby stars, brown dwarfs), and time-variable astrophysical sources (T Tauri stars, Mira variables) reveal their nature by **shifting position or changing brightness between epochs**.
- With over **one billion objects** observed across hundreds of spectral channels, computer algorithms alone struggle with blending, detector artifacts, and non-linear filter wavelength variations.
- Historically, citizen science initiatives like *Backyard Worlds: Planet 9* proved that volunteer human pattern recognition is essential for discovering brown dwarfs and extreme proper-motion systems.
- **The Challenge Objective:** Create a public-facing web tool to display images of the sky from the SPHEREx mission, making it easy for anyone to quickly see how they change over time like a video, spot moving objects, and track astronomical variations while rigorously preserving scientific truth.

---

## 2. Master Alignment Matrix

The following table provides an executive mapping between every official NASA Space Apps Challenge mandate, our engineering refinement, and its astrophysical justification:

| NASA Challenge Objective / Consideration | SkyTrace Refinement Implemented | Technical & Scientific Justification |
|---|---|---|
| **"display a series of images of that patch like a little video, making it easy to spot moving objects"** | **Multi-Observation Time-Series Playback (Phase 5)**: 4-frame batching, continuous video loop (up to 4.0x / 300 ms), and timeline scrubbing slider. | Asteroids and nearby brown dwarfs reveal proper motion through rapid cyclical blinking or frame scrubbing across multi-epoch survey sweeps. |
| **"Users will enter the coordinates of a patch of sky (Right Ascension and declination)"** | **Coordinate Reliability & Resilient Parsing (Phase 3)**: Decimal & sexagesimal normalization, unicode minus handling (`−`, `–`, `—`), and target crosshair reticle. | Users paste coordinates in arbitrary formats (e.g., `08h55m10.831s, -7d14m42.53s`). Resilient parsing prevents user drop-off and pointing errors. |
| **"Test your tool on Barnard’s Star, Epsilon Indi B, WISE 0855, RW Aurigae, and R Draconis"** | **Official Target Preset Suite (Phases 3 & 6)**: One-click presets with verified coordinates, proper-motion warnings, and epoch metadata. | Instant verification of all 5 challenge benchmarks without manual hunting, complete with SIMBAD/Gaia catalog cross-references. |
| **"SPHEREx data is arriving fast! Make sure to design a tool that’s easy to update with the latest data releases"** | **Collection Switcher & SIA2 Provenance (Phase 1)**: Live switcher between `spherex_dr1` and `spherex_qr3` with real-time SIA2 query URL capture. | Seamlessly transitions from Data Release 1 (DR1) to Quick Release 3 (QR3) as new half-yearly survey passes are published to IRSA. |
| **"If you make it possible to query your tool by including coordinates in the URL..."** | **Bidirectional URL Deep-Linking & One-Click Sharing (Phase 4)**: Full parameter synchronization (`?target=&ra=&dec=&collection=&mode=`) and clipboard sharing. | Enables citizen scientists to embed live sky patches in forums (Zooniverse, Backyard Worlds), blogs, and academic collaboration channels. |
| **"It can be useful to display metadata, like contamination flags"** | **Scientific Quality & Flag Telemetry (Phases 2 & 3)**: Badges for nonzero flag fraction ($>30\%$), pointing verification, and pixel scale disclosures. | Distinguishes true astrophysical movement from bad pixels, cosmic ray hits, or edge-of-detector artifacts. |
| **"add together or subtract images... display astronomical data"** | **Audited Change Receipt v1.2 Contract & JSON Export (Phases 1, 2, & 5)**: Audited provenance ledger separating visual exploration from scientific claims. | SPHEREx uses Linear Variable Filters (LVF); visual changes are often spectral band shifts rather than motion. The receipt ensures findings remain scientifically robust. |

---

## 3. Detailed Walkthrough of Refinements

### Refinement 1: SPHEREx Data Release Selection (`DR1` vs `QR3`) & Query Provenance
- **Files Affected:** `frontend/src/components/QueryConsole.tsx`, `frontend/src/services/api.ts`, `frontend/src/types/observation.ts`
- **Why this was needed:**  
  In late 2026, NASA/IPAC IRSA retired the preliminary `spherex_qr2` archive collection in favor of `spherex_dr1` (the definitive Data Release 1) and `spherex_qr3` (Quick Release 3). Tools hardcoded to older collections fail when querying live NASA servers.
- **Why it is good for our project:**  
  Citizen scientists can effortlessly toggle between the thoroughly calibrated DR1 release and the latest QR3 quick-release survey sweeps. Every query permanently records the upstream IVOA SIA2 (Simple Image Access) query URL, timestamp, and row count.
- **NASA Challenge Alignment:**  
  Fulfills the potential consideration: *"SPHEREx data is arriving fast! Make sure to design a tool that’s easy to update with the latest data releases."*

---

### Refinement 2: Change Receipt v1.2 Formal Spec Realization & JSON Export
- **Files Affected:** `frontend/src/services/receiptBuilder.ts`, `frontend/src/components/ChangeReceipt.tsx`, `docs/schemas/change_receipt_v1.2.schema.json`
- **Why this was needed:**  
  A major trap in near-infrared citizen science is false discoveries caused by instrumental artifacts, detector variations, or spectral bandpass mismatches. SPHEREx Linear Variable Filters (LVF) shift central observing wavelengths across pixel positions, meaning an object can appear brighter simply because a different wavelength band fell on that pixel.
- **Why it is good for our project:**  
  SkyTrace implements a formal 6-section provenance ledger conforming to `change_receipt_v1.2.schema.json` (Draft 2020-12):
  1. **Summary:** Machine-readable receipt ID, generated timestamp, schema version 1.2, readiness status.
  2. **Target:** Celestial coordinates, frame, search radius, archive collection, and upstream query URL.
  3. **Observations:** FITS file SHA-256 hashes, local spectral WCS evaluation, detector array identification, pixel dimensions, and physical flux units (`MJy/sr`).
  4. **Comparison Metrics:** Spatial separation, temporal separation (days), spectral wavelength difference ($\Delta\lambda$), and bandwidth overlap.
  5. **Scientific Validation Matrix:** 10 mandatory verification checks evaluating astrometry, proper motion propagation, PSF matching, and photometric validity.
  6. **Findings & Limitations:** Clear statements clarifying that display previews are exploratory and that authoritative claims require source FITS analysis.
  Users can download the cryptographically verifiable JSON document with one click to attach to scientific publications or verification pipelines.
- **NASA Challenge Alignment:**  
  Directly elevates SkyTrace from a toy visualizer to a scientifically credible research tool.

---

### Refinement 3: Resilient Coordinate Parsing, Target Reticle, & Quality Warnings
- **Files Affected:** `frontend/src/services/api.ts`, `frontend/src/components/QueryConsole.tsx`, `frontend/src/components/AssetViewer.tsx`
- **Why this was needed:**  
  NASA challenge participants input coordinates in diverse formats: pure decimals (`133.795129, -7.245147`), standard sexagesimal strings (`08h55m10.831s, -7d14m42.53s`), and strings containing unicode minus signs (`−`, `–`, `—`) copied from scientific PDFs. Naive parsers fail, produce `NaN`, or invert southern declinations.
- **Why it is good for our project:**  
  - **Bulletproof Parsing:** Handles decimal, sexagesimal, and unicode minus characters with sub-arcsecond accuracy.
  - **Inline Feedback Pill:** Validates syntax in real time, displaying normalized decimal degrees before search execution.
  - **Target Reticle Overlay:** Renders a crisp vector crosshair centered on the query coordinates, allowing users to immediately see where the target lies relative to background sources.
  - **Quality Flag Warning Badges:** Automatically displays warning badges if $>30\%$ of pixels have non-zero contamination flags or if pointing falls outside cutout bounds.
  - **Pixelated Display Scaling:** Uses `imageRendering: pixelated` so that tiny SPHEREx cutouts ($18\times 18$ pixels) remain crisp blocks rather than artificially blurred by browser smoothing.
- **NASA Challenge Alignment:**  
  Fulfills core objective: *"Users will enter the coordinates of a patch of sky (Right Ascension and declination)"* and consideration *"display metadata, like contamination flags"*.

---

### Refinement 4: Bidirectional URL Deep-Linking & One-Click Link Sharing
- **Files Affected:** `frontend/src/services/urlParams.ts`, `frontend/src/App.tsx`, `frontend/src/components/QueryConsole.tsx`
- **Why this was needed:**  
  Discoveries in citizen science happen through collaboration. If a volunteer spots a candidate moving object, they need a simple way to send the exact sky patch, zoom level, and observation mode to colleagues or astronomers.
- **Why it is good for our project:**  
  - Bidirectionally synchronizes application state with browser URL search parameters (`?target=&ra=&dec=&radius=&collection=&mode=`).
  - Automatically loads and prepares coordinates when visiting a deep-link.
  - Features a prominent **"🔗 Share / Embed Link"** button that copies the clean URL to the user's clipboard and displays an interactive copied confirmation.
- **NASA Challenge Alignment:**  
  Directly satisfies: *"If you make it possible to query your tool by including coordinates in the URL, users will be able to easily embed it in other websites and projects."*

---

### Refinement 5: Multi-Observation Time-Series Video Playback & Frame Scrubbing
- **Files Affected:** `backend/skytrace/api.py`, `backend/openapi.json`, `frontend/src/services/api.ts`, `frontend/src/components/QueryConsole.tsx`, `frontend/src/components/AssetViewer.tsx`, `frontend/src/components/ChangeReceipt.tsx`
- **Why this was needed:**  
  Prior to this refinement, the system was restricted to $N=2$ observations. However, SPHEREx maps the sky every six months across multiple years. Detecting real orbital motion (such as asteroids moving along ecliptic trajectories or nearby stars exhibiting annual parallax and proper motion) requires cycling through **multiple sequential epochs**.
- **Why it is good for our project:**  
  - **4-Observation Batching:** Safely expanded backend preparation and frontend querying to handle up to 4 cutouts simultaneously while staying within the 256 MB cache budget.
  - **High-Speed Video Looping:** Features a `300ms` (4.0x) rapid video loop speed alongside 0.5x, 1.0x, and 2.0x intervals.
  - **Interactive Frame Scrubber:** Range slider lets users scrub forward and backward smoothly through the time-series animation like a video editor.
  - **Dynamic Multi-Pane Grid:** Side-by-side mode dynamically expands from 2 to 4 synchronized panes, labeled chronologically (Earliest, Intermediate, Latest).
  - **Audited Pairwise Selector:** To maintain 100% compliance with `change_receipt_v1.2.schema.json` (which audits pairwise epoch comparisons), the receipt tab provides an intuitive selector allowing users to choose which two epochs from their time series (e.g., Epoch 1 vs Epoch 4) generate the formal audit.
- **NASA Challenge Alignment:**  
  Fulfills the primary requirement: *"Your tool will display a series of images of that patch like a little video, making it easy to spot moving objects."*

---

### Refinement 6: End-to-End Acceptance Testing Across All 5 Benchmark Targets
- **Files Affected:** `backend/tests/test_full_acceptance.py`, `backend/tests/test_coordinates.py`, `backend/tests/test_receipt_schema.py`, `backend/tests/test_url_params.py`, `backend/tests/test_multi_observation.py`
- **Why this was needed:**  
  Software built for hackathons frequently breaks when presented with edge cases. Scientific applications require automated verification across all benchmark targets.
- **Why it is good for our project:**  
  Provides automated regression suites testing all 5 official challenge targets:
  1. **Barnard’s Star:** High-proper-motion star ($\mu \sim 10.3\,\text{arcsec/yr}$).
  2. **Epsilon Indi B:** Binary brown dwarf system orbiting a nearby star.
  3. **WISE 0855:** One of the closest, coldest, and fastest-moving brown dwarfs known ($\mu \sim 8.1\,\text{arcsec/yr}$). Tested in both decimal and sexagesimal coordinates.
  4. **RW Aurigae:** Famous young variable star system undergoing intense accretion and occultation events.
  5. **R Draconis:** Long-period Mira pulsating variable star exhibiting dramatic infrared magnitude changes.
  All test suites exit code 0, confirming production stability.
- **NASA Challenge Alignment:**  
  Directly satisfies: *"Test your tool on Barnard’s Star, Epsilon Indi B, WISE 0855... and variable stars RW Aurigae and R Draconis."*

---

## 4. Local Deployment & Usage Instructions

### Running the App
The application frontend is running live on:
**URL:** [http://localhost:3000](http://localhost:3000)

### Quick Testing Guide for Evaluators:
1. **Explore Curated Presets:** Click on the target buttons (WISE 0855, Barnard's Star, Epsilon Indi B, RW Aurigae, R Draconis) to inspect pre-configured coordinates and metadata.
2. **Select & Prepare Observations:** In the results grid, select up to 4 observations and click **"Prepare Selected (N/4) →"**.
3. **Play the Video Loop:** Switch to the **Observation Viewer** tab. Press **Space** or click **"▶ Play / Blink"**. Select **4.0x (Rapid Video - 300ms)** for fast animation.
4. **Scrub the Timeline:** Use the **Scrub slider** or Left/Right arrow keys to step through each epoch individually.
5. **Inspect the Target Reticle:** Notice the target reticle crosshair centered at the coordinates, and observe the pixelated nearest-neighbor scaling.
6. **Share Deep Links:** Click **"🔗 Share / Embed Link"** in the query header to copy the deep-link URL.
7. **Export Change Receipt:** Open the **Change Receipt** tab. If $>2$ observations are loaded, use the epoch dropdowns to select an observation pair, review the 10-point scientific validation matrix, and click **"Export Change Receipt JSON (v1.2) ↓"**.

---

## 5. Summary

Through these refinements, **SkyTrace** provides an engaging, lightning-fast, and scientifically rigorous platform that empowers everyday citizen scientists to discover asteroids, comets, brown dwarfs, and variable stars in NASA's SPHEREx data.
