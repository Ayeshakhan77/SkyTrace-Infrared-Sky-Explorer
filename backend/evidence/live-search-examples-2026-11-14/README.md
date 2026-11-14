# Live target search samples — 14 November 2026

These files are real responses from the local `POST /v1/searches` endpoint and
raw IRSA SIA VOTables. They preserve upstream source metadata. Counts describe
archive product footprints, not detections of the named targets.

Queries used radius `0.01°` and limit `500`; each filename identifies its collection.
Coordinates and the Barnard's Star 2026.0 proper-motion propagation are
documented in [`TEAM-HANDOFF.md`](../../TEAM-HANDOFF.md).

| Target | DR1 rows | QR3 rows | DR1 sample state |
|---|---:|---:|---|
| Barnard's Star | 240 | 124 | Full API response, propagated 2026.0 center |
| Epsilon Indi B | 348 | 120 | Full API response |
| WISE 0855 | 258 | 0 | Full API response |
| RW Aurigae | 226 | 110 | Raw SIA2 VOTable |
| R Draconis | 422 | 126 | Raw SIA2 VOTable |

IRSA sometimes returned HTTP 502 during this session. A 502 is an archive
failure, not an empty search. IRSA's [12 November release documentation](https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-releases/)
confirms that DR1 and QR3 supersede QR2, and QR2 is no longer searchable via
SIA2. The older QR2 search/cutouts remain useful as explicitly dated fixtures.
