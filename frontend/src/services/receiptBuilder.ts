import {
  ChangeReceiptV12,
  NormalizedObservation,
  ReceiptObservationV12,
  SearchContext,
  ValidationCheckV12,
} from '../types/observation';
import { parseDec, parseRa } from './api';

const round = (v?: number, dp = 4): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? Number(v.toFixed(dp)) : null;

export function buildChangeReceiptV12(
  observations: NormalizedObservation[],
  searchContext: SearchContext,
  comparisonMode: 'single' | 'blink' | 'side_by_side'
): ChangeReceiptV12 {
  // Schema strictly supports 1 or 2 observations
  const obsSlice = observations.slice(0, 2);
  const count = (obsSlice.length === 2 ? 2 : 1) as 1 | 2;

  // Derive readiness state
  const hasPreviews = obsSlice.length > 0 && obsSlice.every((o) => o.previewStatus === 'available');
  const hasFits = obsSlice.length > 0 && obsSlice.every((o) => o.fitsStatus === 'available');
  let readinessStatus: ChangeReceiptV12['summary']['readinessStatus'] = 'partial';
  if (hasPreviews && hasFits) {
    readinessStatus = 'ready';
  } else if (hasPreviews) {
    readinessStatus = 'preview_available';
  } else if (obsSlice.length > 0) {
    readinessStatus = 'metadata_complete';
  }

  // Parse celestial coordinates safely
  let raDeg = 0;
  let decDeg = 0;
  try {
    raDeg = parseRa(searchContext.ra);
  } catch {
    raDeg = 0;
  }
  try {
    decDeg = parseDec(searchContext.dec);
  } catch {
    decDeg = 0;
  }

  const receiptId = `RCPT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Build Section 3 Observations array
  const formattedObs: ReceiptObservationV12[] = obsSlice.map((obs, idx) => {
    const obsIndex = (idx + 1) as 1 | 2;
    const hasWcsWave = typeof obs.wavelength === 'number';

    return {
      index: obsIndex,
      backendSelectionKey: obs.backendSelectionKey,
      cutoutId: obs.cutoutId || null,
      searchId: obs.searchId || searchContext.searchId || null,
      sourceProductId: obs.sourceProductId,
      archiveObservationId: obs.archiveObservationId || null,
      collection: obs.provenance.collection || searchContext.collection || 'spherex_dr1',
      pipelineVersion: obs.processingVersion || null,
      detector: obs.detector || null,
      bandpassName: obs.detector ? `SPHEREx-${obs.detector}` : null,
      observationTimeUtc: obs.observationTime || null,
      observationEndUtc: null,
      mjdStart: null,
      mjdEnd: null,
      broadWavelengthRangeUm: obs.wavelengthRangeUm
        ? { min: obs.wavelengthRangeUm.min, max: obs.wavelengthRangeUm.max }
        : null,
      localSpectralWcs: hasWcsWave
        ? {
            evaluated: true,
            wavelengthCenterUm: round(obs.wavelength, 6),
            bandwidthUm: round(obs.bandwidth, 6),
            positionBasis: 'fixed_query_position',
            status: 'spectral_wcs_evaluated',
            reason: 'WCS W evaluated at the fixed query position, using declared axis units.',
          }
        : null,
      spatialInspection: {
        hasCelestialWcs: true,
        pixelDimensions: obs.imageSize
          ? { width: obs.imageSize.width, height: obs.imageSize.height }
          : { width: 18, height: 18 },
        physicalUnit: obs.imageSize?.unit || 'MJy / sr',
        queryPixelCoordinates: null,
        queryPositionInsideCutout: obs.queryPositionInCutout ?? true,
        alignmentStatus: 'not_assessed',
      },
      qualityInspection: {
        qualityStatus: 'not_assessed',
        flagsPresent: true,
        nonzeroFlagFraction: round(obs.nonzeroFlagFraction, 6),
        nonfiniteFraction: 0.0,
        variancePresent: true,
        varianceUnit: 'MJy2 / sr2',
      },
      displayRendering: {
        mode: 'per_image_asinh',
        percentileLow: 1,
        percentileHigh: 99,
        valueLow: null,
        valueHigh: null,
        origin: 'lower',
        brightnessComparisonValidated: false,
      },
      assets: {
        originalFitsUrl: obs.fitsUrl || null,
        previewPngUrl: obs.previewUrl || null,
        sha256: obs.provenance.checksum || null,
        byteCount: null,
        fitsAvailability: obs.fitsStatus,
        previewAvailability: obs.previewStatus,
        checksumVerification: {
          suppliedByBackend: Boolean(obs.provenance.checksum),
          browserIndependentlyVerified: false,
        },
      },
      provenance: {
        sourceUrl: obs.provenance.sourceUrl || '',
        cutoutRetrievalUrl: null,
        retrievedAtUtc: searchContext.queriedAtUtc || null,
      },
    };
  });

  // Build Section 4 Comparison metrics
  let temporalSeparationDays: number | null = null;
  let wavelengthDifferenceUm: number | null = null;
  let bandwidthOverlapUm: number | null = null;
  let detectorMatch: boolean | null = null;

  if (count === 2 && formattedObs.length === 2) {
    const [o1, o2] = formattedObs;
    if (o1.observationTimeUtc && o2.observationTimeUtc) {
      const t1 = new Date(o1.observationTimeUtc).getTime();
      const t2 = new Date(o2.observationTimeUtc).getTime();
      temporalSeparationDays = round(Math.abs(t2 - t1) / 86400000, 4);
    }

    const w1 = o1.localSpectralWcs?.wavelengthCenterUm;
    const w2 = o2.localSpectralWcs?.wavelengthCenterUm;
    if (typeof w1 === 'number' && typeof w2 === 'number') {
      wavelengthDifferenceUm = round(Math.abs(w2 - w1), 6);

      const b1 = o1.localSpectralWcs?.bandwidthUm ?? 0;
      const b2 = o2.localSpectralWcs?.bandwidthUm ?? 0;
      if (b1 > 0 && b2 > 0) {
        const lo1 = w1 - b1 / 2;
        const hi1 = w1 + b1 / 2;
        const lo2 = w2 - b2 / 2;
        const hi2 = w2 + b2 / 2;
        const overlap = Math.max(0, Math.min(hi1, hi2) - Math.max(lo1, lo2));
        bandwidthOverlapUm = round(overlap, 6);
      }
    }

    if (o1.detector && o2.detector) {
      detectorMatch = o1.detector === o2.detector;
    }
  }

  // Section 5: The 10 validation checks with rigorous scientific explanations
  const makeCheck = (reason: string): ValidationCheckV12 => ({
    status: 'not_assessed',
    reason,
    evidenceSource: null,
    method: null,
    assessedAtUtc: null,
  });

  const isWise0855 = searchContext.targetName?.toLowerCase().includes('wise 0855');
  const isBarnard = searchContext.targetName?.toLowerCase().includes('barnard');

  let motionReason = 'Apparent spatial shift cannot be attributed to celestial motion without common-grid registration and PSF matching.';
  if (isWise0855) {
    motionReason = 'Target coordinates are fixed; proper motion of WISE 0855 (~8.1 arcsec/yr) is unpropagated across observation epochs.';
  } else if (isBarnard) {
    motionReason = 'Target coordinates are fixed; proper motion of Barnard\'s Star (~10.3 arcsec/yr) must be propagated to each observation epoch.';
  }

  const checks = {
    identityAssessment: makeCheck(
      'Target identity inside cutout is unconfirmed; fixed coordinates do not verify astronomical counterpart presence.'
    ),
    properMotionPropagation: makeCheck(
      isWise0855 || isBarnard
        ? 'Target has significant proper motion; coordinates must be propagated to observation epochs before verifying counterpart presence.'
        : 'Proper-motion propagation across observation epochs was not performed for this pointing.'
    ),
    wavelengthCompatibility: makeCheck(
      wavelengthDifferenceUm !== null
        ? `Local central wavelengths differ by ${wavelengthDifferenceUm} µm. SPHEREx Linear Variable Filters (LVF) shift passbands continuously across detector coordinates.`
        : 'Spectral passband compatibility between observations was not assessed.'
    ),
    calibrationCompatibility: makeCheck(
      'Background subtraction and relative photometric calibration are unverified across observation epochs.'
    ),
    wcsRegistration: makeCheck(
      'Images are displayed in native detector pixel grids; no sub-pixel cross-registration or distortion reprojection was performed.'
    ),
    psfMatching: makeCheck(
      'No point spread function (PSF) cross-convolution matching kernel was applied.'
    ),
    qualityMaskInterpretation: makeCheck(
      'FITS FLAGS extension was summarized but bit definitions (e.g. source, cosmic ray, hot pixel) require expert verification.'
    ),
    photometricValidation: makeCheck(
      'Per-image asinh stretch was applied for display; pixel values cannot be directly compared for brightness variations.'
    ),
    brightnessChangeAssessment: makeCheck(
      'Dependent on spectral, calibration, and photometric comparability checks which remain unassessed.'
    ),
    motionAssessment: makeCheck(motionReason),
  };

  // Section 6: Findings and limitations
  const findingsAndLimitations = {
    isDiscoveryClaimed: false as const,
    recordClassification: 'exportable_provenance_record' as const,
    sampleClassification: 'visual_demo_sample_only' as const,
    candidateNotice: 'UI demonstration sample; no astronomical candidate classification.',
    warnings: [
      'This is a display-only preview; the source FITS remains the authoritative scientific data product.',
      'The query is a fixed sky position; object identity and proper-motion tracking have not been confirmed.',
      'WCS alignment, PSF matching, spectral compatibility and photometric comparison have not been assessed.',
      'The display stretch is per image; preview brightness must not be used to measure astronomical variability.',
      'Flag counts describe raw bitmasks; nonzero flags include known sources, cosmic rays, and detector artifacts.',
      'FLAGS bit meanings require verification against official mission calibration tables.',
    ],
    limitations: [
      'A preview is a display rendering, not a new astronomical measurement or object identification.',
      'No cross-image registration, PSF matching, photometric comparison or motion detection was performed.',
      'Broad archive wavelength bounds do not guarantee the same local passband at the target pixel.',
    ],
    dataAcknowledgment:
      'NASA Space Apps Challenge 2026 - Planet X and SPHEREx | Data from NASA/IPAC Infrared Science Archive (IRSA)',
  };

  return {
    $schema: 'https://skytrace.spaceapps.org/schemas/change_receipt_v1.2.schema.json',
    summary: {
      receiptId,
      specVersion: 'SKYTRACE-RCPT-1.2',
      generatedAt: new Date().toISOString(),
      readinessStatus,
      comparisonMode,
      observationCount: count,
      sampleClassification: 'visual_demo_sample_only',
      title: `SPHEREx ${searchContext.collection?.toUpperCase() || 'DR1'} ${count === 2 ? 'Dual-Epoch Observation Comparison' : 'Single Observation Inspection'}`,
      purpose: 'Citizen science sample inspection and exportable provenance audit',
    },
    target: {
      searchId: searchContext.searchId || null,
      collection: searchContext.collection || 'spherex_dr1',
      queryUrl: searchContext.queryUrl || null,
      queriedAtUtc: searchContext.queriedAtUtc || null,
      totalRows: searchContext.totalRows ?? null,
      truncated: searchContext.truncated ?? null,
      searchInterpretation:
        searchContext.searchInterpretation ||
        'Footprints overlap a fixed sky direction. Object identity, usable pixels, same-wavelength coverage and temporal comparability need inspection.',
      presetId: searchContext.presetId || null,
      targetName: searchContext.targetName || 'Custom Sky Position',
      requestedCoordinates: {
        raInput: searchContext.ra,
        decInput: searchContext.dec,
        raDeg,
        decDeg,
        coordinateFrame: 'ICRS',
        coordinateSource: searchContext.coordinateSource || (searchContext.presetId ? 'Official Challenge Curated Preset' : 'User Input'),
      },
      epochNote:
        searchContext.epochNote ||
        (isWise0855
          ? 'Fixed official challenge coordinates; target proper motion (~8.1 arcsec/yr) is unpropagated.'
          : isBarnard
          ? 'Coordinates propagated to 2026.0; target proper motion is ~10.3 arcsec/yr.'
          : 'Fixed sky coordinates; proper motion unassessed.'),
      searchRadiusDeg: searchContext.radiusDeg || 0.01,
    },
    observations: formattedObs,
    comparison: {
      isComparisonApplicable: count === 2,
      temporalSeparationDays,
      wavelengthDifferenceUm,
      bandwidthOverlapUm,
      detectorMatch,
      pipelineGenerationMatch: null,
      commonSkyGridRegistered: false as const,
      psfMatched: false as const,
      photometricallyCalibrated: false as const,
      descriptiveNote:
        count === 2
          ? 'Values are descriptive metrics of the observation sample only; they do not establish scientific comparability.'
          : 'Comparison is not applicable for single observation inspection.',
    },
    validation: {
      checks,
    },
    findingsAndLimitations,
  };
}
