export type AssetAvailability = 'available' | 'unavailable';

export type ValidationStatus =
  | 'not_assessed'
  | 'pending'
  | 'passed'
  | 'failed'
  | 'not_applicable';

export interface ObservationProvenance {
  sourceUrl?: string;
  checksum?: string;
  collection?: string;
}

export interface NormalizedObservation {
  // Backend 24-char SHA-256 selection key (distinct from archive obs_id)
  backendSelectionKey: string;
  // Archive observation identifier (source.metadata.obs_id)
  archiveObservationId?: string;
  sourceProductId: string;
  searchId?: string;
  observationTime?: string; // ISO date string
  wavelength?: number; // Microns (µm)
  bandwidth?: number; // Microns (µm)
  detector?: string;
  // Must display as unavailable if null/missing — never parse from URL
  processingVersion?: string | null;
  previewUrl?: string;
  fitsUrl?: string;
  previewStatus: AssetAvailability;
  fitsStatus: AssetAvailability;
  provenance: ObservationProvenance;
  qualityStatus: ValidationStatus;

  // --- Fields added to match the real backend (bruhadev/skytrace-viewer-integration) ---
  // Prepared cutout ID (only present after POST /v1/searches/{id}/cutouts)
  cutoutId?: string;
  // Where `wavelength` came from: the local spectral WCS at the query position
  // (prepared cutouts) or absent. Search rows only carry the broad product range.
  wavelengthBasis?: 'spectral_wcs_at_query_position' | 'unavailable';
  // Broad product wavelength range from archive metadata, converted m -> µm
  wavelengthRangeUm?: { min: number; max: number };
  // Raw fraction of pixels with any FLAGS bit set (not a bad-pixel percentage)
  nonzeroFlagFraction?: number;
  // Whether the query position falls inside the cutout footprint
  queryPositionInCutout?: boolean;
  alignmentStatus?: ValidationStatus;
  comparisonStatus?: ValidationStatus;
  // e.g. 'per_image_asinh' — per-image stretch means brightness can't be compared
  displayMode?: string;
  brightnessComparisonValidated?: boolean;
  imageSize?: { width: number; height: number; unit?: string };
  warnings?: string[];
  limitations?: string[];
}

export interface TargetPreset {
  id: string;
  name: string;
  ra: string;
  dec: string;
  epoch: string;
  frame: string;
  radiusDeg: number;
  notes: string;
}

export interface SearchContext {
  targetName: string;
  ra: string;
  dec: string;
  radiusDeg?: number;
  collection: string;
  searchId?: string;
  queryUrl?: string;
  queriedAtUtc?: string;
  totalRows?: number;
  truncated?: boolean;
  searchInterpretation?: string;
  isOffline: boolean;
  presetId?: string;
  epochNote?: string;
  coordinateSource?: string;
}

export type ReceiptReadinessStatus =
  | 'search_complete'
  | 'metadata_complete'
  | 'fits_retrieval_available'
  | 'preview_available'
  | 'partial'
  | 'unavailable'
  | 'ready';

export type ValidationStatusV12 =
  | 'not_assessed'
  | 'supported'
  | 'unsupported'
  | 'inconclusive';

export interface ValidationCheckV12 {
  status: ValidationStatusV12;
  reason: string;
  evidenceSource: string | null;
  method: string | null;
  assessedAtUtc: string | null;
}

export interface ReceiptSummaryV12 {
  receiptId: string;
  specVersion: 'SKYTRACE-RCPT-1.2';
  generatedAt: string;
  readinessStatus: ReceiptReadinessStatus;
  comparisonMode: 'single' | 'blink' | 'side_by_side';
  observationCount: 1 | 2;
  sampleClassification: 'visual_demo_sample_only';
  title?: string;
  purpose?: string;
}

export interface ReceiptTargetV12 {
  searchId: string | null;
  collection: string | null;
  queryUrl: string | null;
  queriedAtUtc: string | null;
  totalRows: number | null;
  truncated: boolean | null;
  searchInterpretation: string | null;
  presetId: string | null;
  targetName: string;
  requestedCoordinates: {
    raInput: string;
    decInput: string;
    raDeg: number;
    decDeg: number;
    coordinateFrame: string;
    coordinateSource?: string | null;
  };
  epochNote: string | null;
  searchRadiusDeg: number;
}

export interface ReceiptObservationV12 {
  index: 1 | 2;
  backendSelectionKey: string;
  cutoutId: string | null;
  searchId: string | null;
  sourceProductId: string;
  archiveObservationId: string | null;
  collection: string;
  pipelineVersion: string | null;
  detector: string | null;
  bandpassName: string | null;
  observationTimeUtc: string | null;
  observationEndUtc: string | null;
  mjdStart: number | null;
  mjdEnd: number | null;
  broadWavelengthRangeUm: { min: number; max: number } | null;
  localSpectralWcs: {
    evaluated: boolean;
    wavelengthCenterUm: number | null;
    bandwidthUm: number | null;
    positionBasis: 'fixed_query_position' | 'unavailable';
    status: string;
    reason: string | null;
  } | null;
  spatialInspection: {
    hasCelestialWcs: boolean;
    pixelDimensions: { width: number; height: number };
    physicalUnit: string | null;
    queryPixelCoordinates?: { x: number; y: number } | null;
    queryPositionInsideCutout: boolean | null;
    alignmentStatus: ValidationStatusV12;
  };
  qualityInspection: {
    qualityStatus: ValidationStatusV12;
    flagsPresent: boolean;
    nonzeroFlagFraction: number | null;
    nonfiniteFraction: number | null;
    variancePresent: boolean;
    varianceUnit: string | null;
  };
  displayRendering: {
    mode: 'per_image_asinh';
    percentileLow: number | null;
    percentileHigh: number | null;
    valueLow: number | null;
    valueHigh: number | null;
    origin: 'lower';
    brightnessComparisonValidated: false;
  };
  assets: {
    originalFitsUrl: string | null;
    previewPngUrl: string | null;
    sha256: string | null;
    byteCount: number | null;
    fitsAvailability: 'available' | 'unavailable' | 'pending';
    previewAvailability: 'available' | 'unavailable' | 'pending' | 'load_failed';
    checksumVerification: {
      suppliedByBackend: boolean;
      browserIndependentlyVerified: false;
    } | null;
  };
  provenance: {
    sourceUrl: string;
    cutoutRetrievalUrl: string | null;
    retrievedAtUtc: string | null;
  };
}

export interface ReceiptComparisonV12 {
  isComparisonApplicable: boolean;
  temporalSeparationDays: number | null;
  wavelengthDifferenceUm: number | null;
  bandwidthOverlapUm: number | null;
  detectorMatch: boolean | null;
  pipelineGenerationMatch: boolean | null;
  commonSkyGridRegistered: false;
  psfMatched: false;
  photometricallyCalibrated: false;
  descriptiveNote: string | null;
}

export interface ReceiptValidationV12 {
  checks: {
    identityAssessment: ValidationCheckV12;
    properMotionPropagation: ValidationCheckV12;
    wavelengthCompatibility: ValidationCheckV12;
    calibrationCompatibility: ValidationCheckV12;
    wcsRegistration: ValidationCheckV12;
    psfMatching: ValidationCheckV12;
    qualityMaskInterpretation: ValidationCheckV12;
    photometricValidation: ValidationCheckV12;
    brightnessChangeAssessment: ValidationCheckV12;
    motionAssessment: ValidationCheckV12;
  };
}

export interface ReceiptFindingsAndLimitationsV12 {
  isDiscoveryClaimed: false;
  recordClassification: 'exportable_provenance_record' | 'auditable_provenance_record';
  sampleClassification: 'visual_demo_sample_only';
  candidateNotice: string;
  warnings: string[];
  limitations: string[];
  dataAcknowledgment: string;
}

export interface ChangeReceiptV12 {
  $schema?: string;
  summary: ReceiptSummaryV12;
  target: ReceiptTargetV12;
  observations: ReceiptObservationV12[];
  comparison: ReceiptComparisonV12;
  validation: ReceiptValidationV12;
  findingsAndLimitations: ReceiptFindingsAndLimitationsV12;
}

export interface ChangeReceiptData {
  receiptId: string;
  specVersion: string;
  generatedAt: string;
  readinessStatus: 'ready' | 'partial';
  targetName: string;
  requestedRa: string;
  requestedDec: string;
  comparisonMode: 'blink' | 'side_by_side' | 'single';
  observations: NormalizedObservation[];
  validationChecks: {
    identityAssessment: ValidationStatus;
    wavelengthCompatibility: ValidationStatus;
    calibrationCompatibility: ValidationStatus;
    wcsRegistration: ValidationStatus;
    psfMatching: ValidationStatus;
    photometricValidation: ValidationStatus;
    dataQualityReview: ValidationStatus;
  };
}