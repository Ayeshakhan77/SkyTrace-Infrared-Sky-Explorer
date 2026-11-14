# SkyTrace-Infrared-Sky-Explorer
Planet X and SPHEREx — NASA Space Apps Challenge 2026

The React viewer in `frontend/` connects to the Python API in `backend/`.

1. Follow [backend setup](backend/README.md#run-locally) and start it on `127.0.0.1:8765`.
2. From `frontend/`, run `npm ci`, then `npm run dev` and open `http://localhost:3000`.
3. Choose **Live FastAPI Backend**, search a preset, select one or two observations, and choose **Prepare Selected**.

Live searches use SPHEREx DR1. QR3 is also supported by the API; QR2 is retained
for historical fixtures because it is no longer searchable via IRSA SIA2.
The [team handoff](backend/TEAM-HANDOFF.md) provides five-target query evidence,
API fields and scientific limitations. [OpenAPI](backend/openapi.json) and
[observation schema](backend/observation.schema.json) include DR1.

The API binds to localhost and currently allows browser requests from
`localhost:3000` and `127.0.0.1:3000`. Deployment needs a separate review of
hosting, persistent cache, allowed origins and access controls.

The viewer supports visual exploration. Target identity, proper motion at
each exposure, common-grid alignment, PSF and photometric calibration still
need scientific validation before any change claim.
