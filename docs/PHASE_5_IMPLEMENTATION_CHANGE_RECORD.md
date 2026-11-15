# SKYTRACE: Phase 5 Implementation & Change Record

**Implementation Date:** 15 November 2026  
**Phase:** Phase 5 — Multi-Observation Playback & Pairwise Verification  
**Status:** Completed & Conformance Verified  

---

## 1. Executive Summary

Phase 5 addresses the primary objective of the official NASA Space Apps Challenge 2026 ("Planet X and SPHEREx"):
> *"Your challenge is to create a public-facing web tool to display images of the sky from SPHEREx mission, making it easy for anyone to quickly see how they change over time. Users will enter the coordinates of a patch of sky (Right Ascension and declination). Your tool will display a series of images of that patch like a little video, making it easy to spot moving objects."*

Before Phase 5, the system was constrained by a backend preparation limit of $N=2$ observations (`max_length=2` in Pydantic and `maxItems: 2` in OpenAPI), with client UI restricted to selecting at most 2 cutouts and side-by-side mode only showing 2 panes. Furthermore, while multi-frame video looping ($\ge 3$ frames) is necessary for smooth time-series animation, the formal `change_receipt_v1.2.schema.json` specification strictly audits pairwise transitions (`minItems: 1, maxItems: 2`).

Phase 5 harmonizes this architecture:
1. Backend preparation was expanded safely from 2 to 4 observations within existing storage and memory budgets.
2. The frontend client (`api.ts`, `QueryConsole.tsx`, `AssetViewer.tsx`) now permits selecting, preparing, and rendering up to 4 cutouts simultaneously.
3. The viewer provides continuous video-rate looping (up to 4.0x / 300 ms), single-frame timeline stepping, an interactive range slider for scrubbing frame-by-frame, and a dynamic 1–4 pane side-by-side comparative grid.
4. The Change Receipt generator introduces an auditable Pairwise Selector when $>2$ observations are loaded, empowering citizen scientists to select any arbitrary epoch pair (e.g., Epoch 1 vs Epoch 4) to generate a schema-compliant v1.2 audit receipt without violating schema constraints.

---

## 2. Inventory of Modified & Newly Created Files

### A. Modified Existing Files

1. **`backend/skytrace/api.py`**
   - **Path:** `backend/skytrace/api.py` (Line 115)
   - **What changed:** Updated `PrepareRequest` Pydantic model field from `observation_ids: list[str] = Field(min_length=1, max_length=2)` to `max_length=4`.
   - **Why necessary:** Enables the backend archive preparation endpoint to accept batches of up to 4 cutouts per search session, providing sufficient multi-epoch data for time-series video playback.
   - **Challenge requirement / objective:** Primary NASA Challenge Objective ("display a series of images of that patch like a little video").

2. **`backend/openapi.json`**
   - **Path:** `backend/openapi.json` (Line 742)
   - **What changed:** Updated `components.schemas.PrepareRequest.properties.observation_ids.maxItems` from `2` to `4`.
   - **Why necessary:** Aligns the formal OpenAPI contract documentation with the backend Pydantic API model.

3. **`frontend/src/services/api.ts`**
   - **Path:** `frontend/src/services/api.ts` (Lines 398–407)
   - **What changed:** Updated `prepareObservations` input validation guard from `selected.length > 2` to `selected.length > 4` and updated error message to `"Select between 1 and 4 observations to prepare."`.
   - **Why necessary:** Allows the frontend client service to batch up to 4 observations in preparation requests.

4. **`frontend/src/components/QueryConsole.tsx`**
   - **Path:** `frontend/src/components/QueryConsole.tsx` (Lines 160–163, 454, 476)
   - **What changed:**
     - Updated selection toggle guard from `prev.length >= 2` to `prev.length >= 4`, displaying error `"Maximum 4 observations can be selected per preparation request."`.
     - Updated results header description: `"SEARCH ID: {searchId} • Select 1 to 4 products to prepare for time-series playback"`.
     - Updated preparation action button label: `"Prepare Selected (${selectedKeys.length}/4) →"`.
   - **Why necessary:** Exposes the multi-observation selection workflow to citizen scientists with immediate visual feedback on selection count.

5. **`frontend/src/components/AssetViewer.tsx`**
   - **Path:** `frontend/src/components/AssetViewer.tsx` (Lines 76–80, 289–304, 355–385)
   - **What changed:**
     - Updated empty-state text to indicate 1 to 4 observations.
     - Upgraded side-by-side mode from hardcoded 2 panes to a responsive grid rendering all loaded observations (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4` or `lg:grid-cols-3`), labeled with epoch number and chronological phase (Earliest, Intermediate, Latest).
     - Added a 4.0x rapid video loop playback speed option (`300ms`).
     - Added an interactive timeline scrubbing slider (`<input type="range" min={0} max={sortedObs.length - 1} ... />`) allowing citizen scientists to smoothly scrub through frames like a video timeline.
   - **Why necessary:** Direct fulfillment of the NASA video playback requirement, enabling multi-epoch motion detection.

6. **`frontend/src/components/ChangeReceipt.tsx`**
   - **Path:** `frontend/src/components/ChangeReceipt.tsx` (Lines 1–35, 60–125)
   - **What changed:**
     - Added pair selector state (`pairIndices: [number, number]`).
     - When $>2$ observations are prepared, renders a dedicated Pair Selection bar allowing users to choose which two epochs (e.g. Epoch 1 vs Epoch 4) are formally audited by the v1.2 Change Receipt.
     - Derives the 2-observation target slice and passes it to `buildChangeReceiptV12`.
   - **Why necessary:** Preserves 100% mathematical and schema conformance with `docs/schemas/change_receipt_v1.2.schema.json` (`minItems: 1, maxItems: 2`) while still allowing users to inspect any arbitrary epoch pair from their 4-frame time series.

---

### B. Newly Created Files

1. **`backend/tests/test_multi_observation.py`**
   - **Path:** `backend/tests/test_multi_observation.py`
   - **What it does:** Independent automated test suite verifying:
     - `PrepareRequest` bounds (accepts 1–4 items; rejects 0 and 5).
     - `openapi.json` contract synchronicity (`maxItems: 4`).
     - Storage and quota safety (4 cutouts within `MAX_STORAGE_BYTES` of 256 MB and `MAX_CUTOUTS` of 32).
     - Chronological multi-frame sequence sorting.
     - Pairwise selection mechanism for v1.2 schema compliance.
   - **Why necessary:** Prevents regressions in multi-observation bounds, storage limits, and schema contracts.

2. **`docs/PHASE_5_IMPLEMENTATION_CHANGE_RECORD.md`**
   - **Path:** `docs/PHASE_5_IMPLEMENTATION_CHANGE_RECORD.md`
   - **What it does:** This formal engineering record.

---

## 3. NASA Space Apps Challenge Alignment

| Capability | NASA Challenge Requirement / Objective | Scientific & Technical Rationale |
|---|---|---|
| **4-Observation Batching** | Primary: "display images of the sky... making it easy for anyone to quickly see how they change over time." | Allows tracking objects across up to 4 half-yearly SPHEREx survey passes (spanning 2 years of mission data). |
| **Video Playback & Scrubbing** | Primary: "display a series of images of that patch like a little video, making it easy to spot moving objects." | Fast 300 ms looping and frame scrubbing reveal subtle proper motion shifts of asteroids, comets, and brown dwarfs against stationary background stars. |
| **Multi-Pane Responsive Grid** | Optional: "display astronomical data... add together or compare images taken at different times." | Allows simultaneous inspection of all 4 epochs side-by-side with individual pixelated scaling and reticle overlays. |
| **Audited Pair Selection** | Scientific integrity & auditability. | Retains strict mathematical and formal schema compliance with `change_receipt_v1.2.schema.json` without sacrificing multi-frame playback capability. |

---

## 4. Test Execution & Verification

### Test Suite Execution Summary

1. **Multi-Observation Automated Verification Suite:**
   - **Command:** `python backend/tests/test_multi_observation.py`
   - **Result:** `All multi-observation preparation and playback tests passed!` (Exit code 0).
   - **Verifications:**
     - `test_prepare_request_limits`: Passed (1–4 valid, 0 and 5 rejected).
     - `test_openapi_schema_matches`: Passed (`maxItems: 4`, `minItems: 1`).
     - `test_storage_reservation_budget`: Passed (4 cutouts $\le$ 32 cutouts max, within 256 MB quota).
     - `test_multi_frame_chronological_ordering`: Passed.
     - `test_pairwise_selection_from_multiframe`: Passed.

2. **All Phase Automated Test Suites (Regressions):**
   - **Command:** `python tests/test_coordinates.py; python tests/test_receipt_schema.py; python tests/test_url_params.py; python tests/test_multi_observation.py`
   - **Result:**
     - `All coordinate tests passed!`
     - `All Change Receipt v1.2 schema conformance tests passed!`
     - `All URL deep-linking tests passed!`
     - `All multi-observation preparation and playback tests passed!`
     - **Exit code 0**.

3. **Frontend TypeScript & Vite Production Build:**
   - **Command:** `npm run build` in `frontend/`
   - **Result:**
     ```
     > tsc && vite build
     vite v5.4.21 building for production...
     ✓ 40 modules transformed.
     dist/index.html                   0.41 kB │ gzip:  0.27 kB
     dist/assets/index-9yrCLAV8.css   18.88 kB │ gzip:  4.18 kB
     dist/assets/index-DpcusTfP.js   220.44 kB │ gzip: 66.75 kB
     ✓ built in 4.87s
     ```
     - **TypeScript diagnostics:** 0 errors.
     - **Exit code 0**.

---

## 5. Confirmation of Unrelated Functionality

- Coordinate parsing (`parseRa`, `parseDec`, sexagesimal validation) was unmodified and remains 100% intact.
- URL deep-linking and state synchronization (`urlParams.ts`) remain active and compatible.
- DR1 / QR3 collection selection remains intact.
- Change Receipt v1.2 JSON schema structure was not altered; pairwise output matches the official schema definition with 0 modifications to `docs/schemas/change_receipt_v1.2.schema.json`.
