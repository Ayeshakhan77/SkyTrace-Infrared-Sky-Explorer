# API integration notes for the viewer

These examples are excerpts from the backend's saved request/response fixtures,
not newly generated live results. Full payloads remain in
[`examples/observations.json`](examples/observations.json),
the cached search under `examples/cache/searches/`, and
[`openapi.json`](openapi.json).

## Search

`POST /v1/searches`

```json
{
  "ra_deg": 133.7951291667,
  "dec_deg": -7.2451472222,
  "radius_deg": 0.01,
  "collection": "spherex_dr1",
  "limit": 500
}
```

The saved 3 November QR2 response used this fixed WISE 0855 position and
returned 256 rows. On 14 November QR2 was no longer searchable through SIA2;
use DR1 and QR3 for new searches. An archive-row excerpt from the historical
QR2 response:

```json
{
  "observation_id": "7f169ac45d22df30c60dd4ef",
  "source_product_id": "ivo://irsa.ipac/spherex_qr2?2025W19_1B_0241_1/D1",
  "source_url": "https://irsa.ipac.caltech.edu/ibe/data/spherex/qr2/level2/2025W19_1B/l2b-v20-2025-242/1/level2_2025W19_1B_0241_1D1_spx_l2b-v20-2025-242.fits",
  "collection": "spherex_qr2",
  "mjd_start": 60801.514177,
  "mjd_end": 60801.515509,
  "wavelength_min_m": 7.455e-7,
  "wavelength_max_m": 1.1167e-6,
  "bandpass_name": "SPHEREx-D1"
}
```

The response wrapper also contains `schema_version`, `search_id`, the exact
`query`, `query_url`, `queried_at_utc`, `truncated`, `total_rows`, and an
`interpretation` string. Archive metadata may include additional fields under
`metadata`; clients should ignore unknown fields and preserve the source IDs and
URL. Wavelength minimum/maximum are broad product bounds in **meters**, not a
measurement at the target pixel.

## Prepare one or two products

`POST /v1/searches/{search_id}/cutouts`

```json
{
  "observation_ids": ["7f169ac45d22df30c60dd4ef"],
  "size_deg": 0.03
}
```

The endpoint returns an array of `PreparedObservation` objects. It accepts one
or two IDs from the saved search; IDs outside that search are rejected. Prepared
record excerpt from the 6 May 2025 observation:

```json
{
  "schema_version": "0.1",
  "cutout_id": "e3a440b1023a5200908226705840183d",
  "search_id": "ae25b7204ad740579de50a6da78d0755",
  "query_position": {"ra_deg": 133.7951291667, "dec_deg": -7.2451472222},
  "size_deg": 0.03,
  "retrieval": {
    "byte_count": 5060160,
    "sha256": "822f99bfc107a86453f522ae52352a5c61bc85c0a03ea9c9041c913db1d3bf51",
    "retrieved_at_utc": "2026-11-03T12:04:40+00:00"
  },
  "inspection": {
    "image": {"width": 18, "height": 18, "unit": "MJy / sr", "image_extension": "IMAGE"},
    "observation_time": {
      "date_obs": "2025-05-06T12:20:24.888",
      "date_end": "2025-05-06T12:22:20.006",
      "time_system": "UTC",
      "status": "header_value"
    },
    "spatial": {
      "has_celestial_wcs": true,
      "query_position_within_cutout": true,
      "alignment_status": "not_assessed"
    },
    "wavelength": {
      "target_center_um": 0.9936670117685139,
      "target_bandwidth_um": 0.026386620568176006,
      "status": "spectral_wcs_evaluated",
      "position_basis": "fixed_query_position"
    },
    "quality": {
      "status": "not_assessed",
      "flags_present": true,
      "nonzero_flag_fraction": 0.33641975308641975,
      "variance": {"present": true, "unit": "MJy2 / sr2"}
    },
    "display": {
      "mode": "per_image_asinh",
      "percentile_low": 1,
      "percentile_high": 99,
      "brightness_comparison_validated": false
    },
    "warnings": ["Display-only preview; WCS alignment, spectral compatibility and scientific quality are not assessed."]
  },
  "assets": {
    "original_fits_url": "/v1/cutouts/e3a440b1023a5200908226705840183d/source.fits",
    "preview_png_url": "/v1/cutouts/e3a440b1023a5200908226705840183d/preview.png",
    "sha256": "822f99bfc107a86453f522ae52352a5c61bc85c0a03ea9c9041c913db1d3bf51",
    "byte_count": 5060160
  },
  "comparison_status": "not_assessed",
  "limitations": ["No cross-image registration, PSF matching, photometric comparison or motion detection was performed."]
}
```

The real response carries more detail than this excerpt, including complete
source metadata, individual FITS extension summaries, raw flag counts,
variance statistics, retrieval URL, percentile display bounds, and warnings.
The UI reads the response record directly and keeps those statuses visible.

## What the backend can report today

| Available from current response | Still awaiting scientific or team validation |
|---|---|
| Exact query coordinates and query parameters | Per-exposure proper-motion propagation for Barnard's Star and WISE 0855 |
| Archive product IDs, collection, source URL, observation MJD and broad wavelength coverage | Target proper-motion propagation to each exposure epoch |
| Cutout dimensions, brightness unit, header observation times, WCS and whether the fixed query point falls in the cutout | Whether WISE 0855 is actually in any cutout |
| Local spectral WCS wavelength/bandwidth at the query coordinate, when evaluable | A science-approved matched observation pair, common-grid registration, PSF/calibration compatibility and interpretation of quality masks |
| Raw FLAGS/VARIANCE summaries, image extension list, preview and original FITS with SHA-256 | Motion, transient identity or brightness-change claims |
| Retrieval and cache errors with distinct status/error codes | Shared-repository merge, public deployment, and scientific validation |

## Five-target live search check — 14 November 2026

`GET /v1/targets` now supplies Barnard's Star, Epsilon Indi B, WISE 0855,
RW Aurigae, and R Draconis. Each record includes its coordinate source and a
plain-language epoch note. Barnard's Star uses SIMBAD J2000 astrometry
propagated to 2026.0; the other SIMBAD/2MASS coordinates are J2000, and WISE
0855 retains the official challenge's fixed coordinate. This is adequate for
finding archive footprints, but a science viewer must propagate each target to
the observation time before claiming that it appears in a cutout.

| Preset | RA (deg) | Dec (deg) | Coordinate reference |
|---|---:|---:|---|
| Barnard's Star | 269.4462678797 | +4.7682044119 | [SIMBAD](https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=Barnard%27s+star), J2000 propagated to 2026.0 |
| Epsilon Indi B | 331.0438333333 | −56.7826944444 | [SIMBAD 2MASS counterpart](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=2MASS+J22041052-5646577), J2000 |
| WISE 0855 | 133.7951291667 | −7.2451472222 | [Official challenge](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/), fixed coordinate |
| RW Aurigae | 76.9565260346 | +30.4014381739 | [SIMBAD](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=RW+Aur), J2000 |
| R Draconis | 248.1676108330 | +66.7549794172 | [SIMBAD](https://simbad.cds.unistra.fr/simbad/sim-id?Ident=R+Dra), J2000 |

Search settings: radius 0.01°, limit 500. These are footprint counts, not
detections. IRSA's official release documentation says DR1 contains
reprocessed Surveys 1–2, QR3 contains Surveys 3–4, together they supersede QR2,
and QR2 is no longer searchable by SIA2 (direct download is expected to remain
available through February 2027). Use DR1 and QR3 for new queries. The archive
intermittently returned HTTP 502, which the API preserves as an error rather
than converting to zero rows.

Sources: [IRSA data releases](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-releases/)
and [IRSA SIA2 data access](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/).

| Target / query center | DR1 rows, 14 Nov | QR3 rows, 14 Nov | QR2 rows, 14 Nov |
|---|---:|---:|---:|
| Barnard's Star, propagated to 2026.0 | 240 | 124 | — |
| Barnard's Star, J2000 (comparison) | — | 123 | 0 |
| Barnard's Star, propagated to 2025.0 (comparison) | — | 124 | 0 |
| Epsilon Indi B, J2000 | 348 | 120 | 0 |
| WISE 0855, official fixed challenge coordinate | 258 | 0 | 0 |
| RW Aurigae, J2000 | 226 | 110 | 0 |
| R Draconis, J2000 | 422 | 126 | 0 |

The five DR1 SIA2 queries returned rows for all five targets by 16:54 UTC;
Barnard's 2026.0 API query returned 240 rows. Earlier QR3 queries returned
123–126 rows for the four other fields and zero for WISE 0855. Successful full
responses, raw VOTables, and error examples are saved in
[`backend/evidence/live-search-examples-2026-11-14/`](evidence/live-search-examples-2026-11-14/).
The WISE QR2 query is empty because QR2 is no longer searchable via SIA2, not
because the target field lacks data. Its 258 DR1 products include the same
2025/2026 D1 epochs used for the earlier QR2 example, now both reprocessed
under v27.

The DR1 API payloads contain 240 Barnard, 348 Epsilon Indi B and 258 WISE
0855 records. Direct SIA2 queries additionally returned 226 RW Aurigae and
422 R Draconis records; their raw VOTables are included. The full
JSON responses preserve exact query URLs, search
IDs, product IDs, source URLs, times, broad wavelength bounds, and upstream
metadata. They are examples of the endpoint's actual payload, not curated
science detections.

## WISE 0855 DR1 pair candidate for the demo

I attempted 18 D1 cutouts from the successful 258-row DR1 search: all four
May-2025 products plus 14 late-April/May-2026 products. Sixteen downloaded and
were inspected; two returned HTTP 503. Among the inspected pairs separated by
at least 300 days, the closest local wavelength match was:

| Field | First image | Second image |
|---|---|---|
| Product | `2025W19_1B_0241_1/D1` | `2026W19_1A_0201_1/D1` |
| UTC observation date | 6 May 2025 | 4 May 2026 |
| Local spectral WCS wavelength | 0.993667394 µm | 0.970521398 µm |
| Local spectral WCS bandwidth | 0.026386641 µm | 0.025179660 µm |
| Release / pipeline | DR1 / v27 | DR1 / v27 |
| Crop / unit | 18 × 18 / MJy sr⁻¹ | 18 × 18 / MJy sr⁻¹ |
| Query position inside crop | Yes | Yes |
| Any nonzero FLAGS bit | 0.45988 of pixels | 0.44136 of pixels |

The wavelength gap is **0.023145995 µm**, about **85% smaller** than the
roughly 0.157 µm gap in Brage's demonstration. The epochs are 363.056 days
apart. Both now use the same pipeline generation, rather than the older QR2
v20/v24 mixture. However, their nominal spectral intervals overlap only by
about 0.00264 µm; these are still different local passbands.

This is a **visual-demo candidate from a bounded D1 sample**, not a global
ranking of all DR1 rows and not scientific approval. Target identity and
proper-motion propagation, astrometric registration, PSF/calibration matching,
flag definitions/masking, and photometric comparison remain unassessed.
A shared detector and pipeline do not settle these checks. Astropy also
reported inconsistent SIP header declarations; the apparent position inside
the crop therefore needs review. DR1 FLAGS have no MP_* bit definitions
recognized by the current parser, so bit meanings stay unknown.

The [pair assessment](examples/dr1-demo/pair-assessment.json) preserves product
URLs, checksums, retrieval times, measured dimensions, wavelength values,
quality summaries, failures and the ranked sampled candidates. IRSA's
[product documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-products/)
says WCS-WAVE is intended for visualization; scientific spectral analysis
requires the dedicated CWAVE/CBAND calibration data. All comparison badges
must remain `not_assessed` until the scientific checks are completed.


## Verified HTTP prepare and cached demo

The local HTTP server re-opened the successful 258-row DR1 search from 16:51
UTC, then downloaded and prepared the selected two products through
`POST /v1/searches/{search_id}/cutouts`. Both PNG routes returned PNG files and
both FITS routes returned data with matching SHA-256 checksums. The full
[prepare response](examples/dr1-demo/final-http-prepared-observations.json) and
[validation record](examples/dr1-demo/final-http-prepare-validation.json) are
included. A later fresh HTTP search returned 502; that response is also kept.
This proves cached-search-to-live-prepare and asset serving, with the earlier
successful live search documented separately.

The new DR1 search and prepared cutouts are bundled in `examples/cache/`.
Copying the example cache as described in the backend README makes these same
IDs available without another IRSA download. The frontend's Offline Fixture
mode now uses the prepared DR1 pair, with FITS explicitly unavailable until a
backend is connected. Historical QR2 files are retained for provenance.
