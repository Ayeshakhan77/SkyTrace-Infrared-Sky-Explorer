# SKYTRACE: Phase 1 Implementation & Change Record

**Implementation Date:** 15 November 2026  
**Phase:** Phase 1 — SPHEREx Data Release Selection (DR1 / QR3) & Search Provenance Ledger  
**Status:** Completed & Conformance Verified  

---

## 1. Executive Summary

Phase 1 addresses an essential operational reality of the NASA SPHEREx mission and a primary consideration from the official NASA Space Apps Challenge brief:
> *"New SPHEREx data is arriving fast! Make sure to design a tool that’s easy to update with the latest data releases."*

In November 2026, NASA/IPAC Infrared Science Archive (IRSA) retired the preliminary quick-release survey collection (`spherex_qr2`) from active Simple Image Access (SIA2) querying, noting:
> *"DR1 and QR3 together supersede QR2."*

Tools hardcoded to early test releases fail when querying live NASA servers. Phase 1 modernized the data access layer:
1. Formally exposed the official **SPHEREx DR1** (`spherex_dr1` — Standard, Reprocessed Surveys 1 & 2 under pipeline v27) and **SPHEREx QR3** (`spherex_qr3` — Quick Release, Surveys 3 & 4) collections.
2. Embedded upstream IVOA SIA2 query URL logging, query timestamps (`queriedAtUtc`), total row counts (`totalRows`), and search interpretation strings into the unified `SearchContext`.
3. Rendered an interactive **Upstream IRSA SIA2 Query Provenance Banner** in the frontend, allowing citizen scientists to inspect the raw query URL used to retrieve the data from NASA servers.

---

## 2. Inventory of Modified Files

### 1. `frontend/src/services/api.ts`
- **Path:** `frontend/src/services/api.ts`
- **What changed:**
  - Added `DEFAULT_COLLECTION = 'spherex_dr1'`.
  - Defined `SUPPORTED_COLLECTIONS` containing `spherex_dr1` (Standard) and `spherex_qr3` (Quick Release) with human-readable labels and mission descriptions.
  - Updated `SearchResponse` interface to include `collection: string`, `totalRows?: number`, `queryUrl?: string`, `queriedAtUtc?: string`, and `interpretation?: string`.
  - Updated `searchRecordToResponse` to extract and propagate the active collection and query provenance from live or cached backend responses.
- **Why necessary:** Provides the service layer adapter for querying modern SPHEREx collections from IRSA.

### 2. `frontend/src/types/observation.ts`
- **Path:** `frontend/src/types/observation.ts`
- **What changed:**
  - Expanded `SearchContext` interface to carry:
    - `collection: string`
    - `queryUrl?: string`
    - `queriedAtUtc?: string`
    - `totalRows?: number`
    - `searchInterpretation?: string`
- **Why necessary:** Carries the full upstream provenance package from search results into the observation viewer and the Change Receipt generator.

### 3. `frontend/src/components/QueryConsole.tsx`
- **Path:** `frontend/src/components/QueryConsole.tsx`
- **What changed:**
  - Added a collection dropdown selector rendering all entries from `SUPPORTED_COLLECTIONS` (`SPHEREx DR1` and `SPHEREx QR3`).
  - Added `searchProvenance` state tracking `activeCollection`, `queryUrl`, `queriedAtUtc`, and `totalRows`.
  - Added an interactive **Upstream IRSA SIA2 Query Banner** displaying the exact URL query executed against `irsa.ipac.caltech.edu`.
  - Transferred complete provenance metadata into `onObservationsPrepared` callback.
- **Why necessary:** Gives users direct visual control over which data release to query and surfaces transparent provenance.

### 4. `frontend/src/App.tsx`
- **Path:** `frontend/src/App.tsx`
- **What changed:**
  - Initialized `searchContext` state with `collection: 'spherex_dr1'`, default SIA2 query URL, and timestamp.
  - Linked `handleObservationsPrepared` to update the global `searchContext` with the active collection and provenance.
  - Passed `searchContext` into `ChangeReceipt`.
- **Why necessary:** Ensures consistent provenance tracking across all application tabs.

### 5. `frontend/src/components/ChangeReceipt.tsx`
- **Path:** `frontend/src/components/ChangeReceipt.tsx`
- **What changed:**
  - Integrated `searchContext.collection` and `searchContext.queryUrl` directly into Section 2 (*Target & Search Parameters*) of the formal Change Receipt.
- **Why necessary:** Connects the upstream query provenance to the downloadable JSON audit receipt.

---

## 3. NASA Space Apps Challenge Alignment

| Capability | NASA Challenge Requirement / Objective | Scientific & Technical Rationale |
|---|---|---|
| **DR1 vs QR3 Collection Switcher** | Consideration: *"SPHEREx data is arriving fast! Make sure to design a tool that’s easy to update with the latest data releases."* | As the SPHEREx mission progresses, new half-yearly survey passes are released. Supporting DR1 and QR3 ensures the tool operates on current mission releases rather than obsolete prototypes. |
| **Upstream SIA2 Query Provenance** | Scientific Rigor & Open Science | Displaying the raw IVOA Simple Image Access query URL allows astronomers to independently replicate the query using Python (`astroquery`), cURL, or Topcat. |
| **Provenance-Aware Change Receipt** | Auditability & Anti-Hallucination | Links visual cutouts directly to their source archive release, preventing cross-release calibration errors. |

---

## 4. Verification & Testing

- **Collection Query Generation:** Verified that `COLLECTION=spherex_dr1` and `COLLECTION=spherex_qr3` query parameters generate correctly formatted SIA2 requests.
- **Provenance Retention:** Verified that `queryUrl` and `queriedAtUtc` survive round-trip preparation and appear in the Change Receipt export.
- **TypeScript Compilation:** All interfaces and components compile with 0 errors via `npm run build`.

---

## 5. Summary

Phase 1 established the foundational data ingestion pipeline for SKYTRACE, ensuring seamless compatibility with ongoing and future SPHEREx mission releases.
