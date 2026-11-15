import React, { useMemo, useState } from 'react';
import {
  ChangeReceiptV12,
  NormalizedObservation,
  SearchContext,
  ValidationStatusV12,
} from '../types/observation';
import { buildChangeReceiptV12 } from '../services/receiptBuilder';

interface ChangeReceiptProps {
  observations: NormalizedObservation[];
  searchContext: SearchContext;
  comparisonMode: 'single' | 'blink' | 'side_by_side';
}

export default function ChangeReceipt({
  observations,
  searchContext,
  comparisonMode,
}: ChangeReceiptProps) {
  const [pairIndices, setPairIndices] = useState<[number, number]>([0, 1]);

  const safeIndexA = Math.min(pairIndices[0], Math.max(0, observations.length - 1));
  const safeIndexB = Math.min(pairIndices[1], Math.max(0, observations.length - 1));

  const targetObs = useMemo(() => {
    if (observations.length <= 2) return observations;
    return [observations[safeIndexA], observations[safeIndexB]];
  }, [observations, safeIndexA, safeIndexB]);

  const receipt: ChangeReceiptV12 = useMemo(() => {
    return buildChangeReceiptV12(targetObs, searchContext, comparisonMode);
  }, [targetObs, searchContext, comparisonMode]);

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receipt.summary.receiptId}_change_receipt_v1.2.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (status: ValidationStatusV12) => {
    const styles: Record<ValidationStatusV12, string> = {
      not_assessed: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
      supported: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      unsupported: 'bg-red-950/60 text-red-300 border-red-700/60',
      inconclusive: 'bg-gray-800 text-gray-400 border-gray-700',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${styles[status] || styles.not_assessed}`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (observations.length === 0) {
    return (
      <div className="bg-cardBg border border-borderCol rounded-xl p-10 text-center space-y-3 max-w-4xl">
        <p className="text-sm font-mono text-gray-300">NO OBSERVATIONS SELECTED FOR RECEIPT</p>
        <p className="text-xs text-gray-500">
          Search and prepare 1 to 4 SPHEREx observations to generate a verified v1.2 Change Receipt.
        </p>
      </div>
    );
  }

  const { summary, target, observations: obsList, comparison, validation, findingsAndLimitations } = receipt;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Multi-Observation Pair Selector when >2 observations loaded */}
      {observations.length > 2 && (
        <div className="bg-darkBg border border-borderCol rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-semibold text-accentGlow uppercase tracking-wider block">
              Multi-Observation Pair Selection (v1.2 Schema Audits 2 Epochs)
            </span>
            <p className="text-xs text-gray-400 mt-0.5">
              Select which two epochs from the loaded {observations.length}-observation sequence to evaluate:
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono text-gray-400">Epoch A:</span>
              <select
                value={safeIndexA}
                onChange={(e) => setPairIndices([Number(e.target.value), safeIndexB])}
                className="bg-cardBg border border-borderCol text-xs font-mono text-white rounded px-2.5 py-1.5"
              >
                {observations.map((obs, idx) => (
                  <option key={obs.backendSelectionKey} value={idx}>
                    #{idx + 1} ({obs.observationTime ? new Date(obs.observationTime).toISOString().slice(0, 10) : obs.sourceProductId})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-mono text-gray-500 font-bold">vs</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-mono text-gray-400">Epoch B:</span>
              <select
                value={safeIndexB}
                onChange={(e) => setPairIndices([safeIndexA, Number(e.target.value)])}
                className="bg-cardBg border border-borderCol text-xs font-mono text-white rounded px-2.5 py-1.5"
              >
                {observations.map((obs, idx) => (
                  <option key={obs.backendSelectionKey} value={idx}>
                    #{idx + 1} ({obs.observationTime ? new Date(obs.observationTime).toISOString().slice(0, 10) : obs.sourceProductId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Top Header & JSON Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-white">
              SKYTRACE Change Receipt & Provenance Ledger
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
              v1.2 FORMAL SPEC
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Auditable provenance record separating visual exploration from verified astronomical findings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadJson}
          className="px-4 py-2 rounded-lg bg-accentBlue hover:bg-blue-600 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-lg shadow-accentBlue/20"
        >
          <span>Export Change Receipt JSON (v1.2)</span>
          <span>↓</span>
        </button>
      </div>

      {/* Section 1: Summary & Technical Readiness */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-borderCol pb-2">
          <span className="text-xs font-mono font-bold text-accentGlow">
            1. RECEIPT SUMMARY & TECHNICAL READINESS
          </span>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-accentBlue/20 text-accentGlow border border-accentBlue/40">
            {summary.readinessStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <span className="text-gray-500 block text-[10px]">RECEIPT ID</span>
            <span className="text-white break-all text-[11px]">{summary.receiptId}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">SPEC VERSION</span>
            <span className="text-gray-300">{summary.specVersion}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">OBSERVATION COUNT</span>
            <span className="text-white">{summary.observationCount} of 2 max</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">VIEWING MODE</span>
            <span className="text-amber-300 uppercase">{summary.comparisonMode}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">CLASSIFICATION</span>
            <span className="text-gray-300 uppercase text-[10px]">{summary.sampleClassification.replace(/_/g, ' ')}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">GENERATED UTC</span>
            <span className="text-gray-400 text-[10px] truncate block">{summary.generatedAt}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Target & Celestial Search Provenance */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-borderCol pb-2">
          <span className="text-xs font-mono font-bold text-accentGlow">
            2. TARGET SEARCH PROVENANCE & CELESTIAL COORDINATES
          </span>
          <span className="text-[11px] font-mono text-gray-400">
            {searchContext.isOffline ? 'OFFLINE DEMO FIXTURE' : 'LIVE ARCHIVE QUERY'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-gray-500 block text-[10px]">TARGET NAME</span>
            <span className="text-white font-bold">{target.targetName}</span>
            {target.presetId && (
              <span className="text-[10px] text-gray-400 block mt-0.5">Preset: {target.presetId}</span>
            )}
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">REQUESTED COORDINATES</span>
            <span className="text-gray-200 block">{target.requestedCoordinates.raInput}, {target.requestedCoordinates.decInput}</span>
            <span className="text-gray-500 text-[10px] block">
              {target.requestedCoordinates.raDeg.toFixed(6)}°, {target.requestedCoordinates.decDeg.toFixed(6)}° ({target.requestedCoordinates.coordinateFrame})
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">SPHEREx DATA RELEASE</span>
            <span className="text-accentGlow uppercase font-semibold">
              {target.collection?.replace('_', ' ') || 'SPHEREX DR1'}
            </span>
            <span className="text-gray-500 text-[10px] block">Cone Radius: {target.searchRadiusDeg}°</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">SEARCH SESSION ID</span>
            <span className="text-gray-300 break-all text-[11px]">
              {target.searchId || (searchContext.isOffline ? 'CACHED FIXTURE' : 'UNASSIGNED')}
            </span>
            {target.totalRows !== null && (
              <span className="text-gray-400 text-[10px] block">{target.totalRows} archive records matched</span>
            )}
          </div>
        </div>

        {target.epochNote && (
          <div className="p-2.5 rounded-lg bg-darkBg border border-borderCol/70 text-xs font-mono text-gray-300">
            <span className="text-accentGlow font-bold mr-2">ASTROMETRIC EPOCH NOTE:</span>
            {target.epochNote}
          </div>
        )}

        {target.queryUrl && (
          <div className="p-2.5 rounded-lg bg-darkBg/60 border border-borderCol/60 text-[11px] font-mono text-gray-400 space-y-1">
            <span className="text-accentGlow font-semibold block text-[10px]">UPSTREAM IRSA SIA2 QUERY URL:</span>
            <p className="break-all text-gray-300 select-all">{target.queryUrl}</p>
          </div>
        )}
      </div>

      {/* Section 3: Prepared Observations */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-mono font-bold text-accentGlow border-b border-borderCol pb-2">
          3. PREPARED OBSERVATION RECORDS ({obsList.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {obsList.map((obs) => (
            <div
              key={obs.backendSelectionKey}
              className="p-4 rounded-xl bg-darkBg border border-borderCol space-y-3 text-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-borderCol/60 pb-2">
                <span className="font-bold text-white">
                  EPOCH #{obs.index}: {obs.archiveObservationId || obs.sourceProductId}
                </span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-accentBlue/20 text-accentGlow">
                  {obs.collection.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500 block text-[10px]">OBSERVATION TIME (UTC)</span>
                  <span className="text-gray-200">{obs.observationTimeUtc || 'Unavailable'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">DETECTOR / BANDPASS</span>
                  <span className="text-gray-200">{obs.detector || 'N/A'} • {obs.bandpassName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">LOCAL SPECTRAL WCS</span>
                  <span className="text-amber-300">
                    {obs.localSpectralWcs?.wavelengthCenterUm ? `${obs.localSpectralWcs.wavelengthCenterUm} µm` : 'Unassessed'}
                  </span>
                  {obs.localSpectralWcs?.bandwidthUm && (
                    <span className="text-gray-500 text-[10px] block">Δλ: {obs.localSpectralWcs.bandwidthUm} µm</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">IMAGE DIMENSIONS / FLUX UNIT</span>
                  <span className="text-gray-300">
                    {obs.spatialInspection.pixelDimensions.width}×{obs.spatialInspection.pixelDimensions.height} px • {obs.spatialInspection.physicalUnit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">QUALITY FLAGS / VARIANCE</span>
                  <span className="text-gray-300">
                    Flags: {obs.qualityInspection.nonzeroFlagFraction !== null ? `${(obs.qualityInspection.nonzeroFlagFraction * 100).toFixed(1)}% nonzero` : 'N/A'}
                  </span>
                  <span className="text-gray-500 text-[10px] block">Variance unit: {obs.qualityInspection.varianceUnit}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px]">ASSET STATUS</span>
                  <span className="text-gray-300">
                    Preview: {obs.assets.previewAvailability} | FITS: {obs.assets.fitsAvailability}
                  </span>
                </div>
              </div>

              {obs.assets.sha256 && (
                <div className="pt-2 border-t border-borderCol/50 text-[10px] text-gray-500">
                  <span className="block text-[9px]">SOURCE FITS SHA-256 CHECKSUM:</span>
                  <span className="break-all text-gray-400 select-all">{obs.assets.sha256}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Descriptive Comparison Metrics */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-borderCol pb-2">
          <span className="text-xs font-mono font-bold text-accentGlow">
            4. DESCRIPTIVE COMPARISON METRICS (DUAL-EPOCH)
          </span>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60">
            DESCRIPTIVE ONLY — NOT SCIENTIFIC VALIDATION
          </span>
        </div>

        {comparison.isComparisonApplicable ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-darkBg border border-borderCol">
                <span className="text-gray-500 block text-[10px]">TEMPORAL SEPARATION</span>
                <span className="text-white text-sm font-bold">
                  {comparison.temporalSeparationDays !== null ? `${comparison.temporalSeparationDays} days` : 'N/A'}
                </span>
                <span className="text-gray-500 text-[10px] block">Elapsed observation baseline</span>
              </div>
              <div className="p-3 rounded-lg bg-darkBg border border-borderCol">
                <span className="text-gray-500 block text-[10px]">WAVELENGTH GAP (Δλ)</span>
                <span className="text-amber-300 text-sm font-bold">
                  {comparison.wavelengthDifferenceUm !== null ? `${comparison.wavelengthDifferenceUm} µm` : 'N/A'}
                </span>
                <span className="text-gray-500 text-[10px] block">Local passband center difference</span>
              </div>
              <div className="p-3 rounded-lg bg-darkBg border border-borderCol">
                <span className="text-gray-500 block text-[10px]">NOMINAL BAND OVERLAP</span>
                <span className="text-gray-200 text-sm font-bold">
                  {comparison.bandwidthOverlapUm !== null ? `${comparison.bandwidthOverlapUm} µm` : 'N/A'}
                </span>
                <span className="text-gray-500 text-[10px] block">Filter passband intersection</span>
              </div>
              <div className="p-3 rounded-lg bg-darkBg border border-borderCol">
                <span className="text-gray-500 block text-[10px]">DETECTOR MATCH</span>
                <span className={`text-sm font-bold ${comparison.detectorMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {comparison.detectorMatch ? 'YES (Shared Array)' : 'NO (Different Arrays)'}
                </span>
                <span className="text-gray-500 text-[10px] block">Array hardware alignment</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-darkBg/60 border border-borderCol text-[11px]">
              <div>
                <span className="text-gray-500 block text-[10px]">COMMON SKY GRID REGISTRATION</span>
                <span className="text-red-400 font-semibold">FALSE (Unregistered native pixels)</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">PSF MATCHING APPLIED</span>
                <span className="text-red-400 font-semibold">FALSE (No cross-convolution)</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">RELATIVE PHOTOMETRIC CALIBRATION</span>
                <span className="text-red-400 font-semibold">FALSE (Stretch is per-image asinh)</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 italic">
              {comparison.descriptiveNote}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-darkBg border border-borderCol text-xs font-mono text-gray-400">
            Single observation inspection. Dual-epoch comparison metrics are not applicable.
          </div>
        )}
      </div>

      {/* Section 5: Scientific Validation Matrix */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderCol pb-2">
          <span className="text-xs font-mono font-bold text-accentGlow">
            5. SCIENTIFIC VALIDATION MATRIX (TEN MANDATORY CHECKS)
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            Unassessed checks are explicitly declared — never falsely marked passed.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(validation.checks).map(([key, check]) => {
            const formatName = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase());
            return (
              <div
                key={key}
                className="p-3 rounded-lg bg-darkBg border border-borderCol space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-gray-200">{formatName}</span>
                  <div>{renderStatusBadge(check.status)}</div>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{check.reason}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 6: Findings, Candidate Notice & Explicit Limitations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-borderCol pb-2">
            <h3 className="text-xs font-mono font-bold text-emerald-400">
              6A. SCIENTIFIC EVIDENCE SUMMARY & FINDINGS
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/60 text-red-300 border border-red-700/60">
              DISCOVERY CLAIM: {findingsAndLimitations.isDiscoveryClaimed ? 'YES' : 'FALSE'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-darkBg border border-borderCol text-xs font-mono text-amber-300">
            {findingsAndLimitations.candidateNotice}
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-gray-400 font-bold block">OPERATIONAL WARNINGS:</span>
            <ul className="space-y-1.5 text-[11px] text-gray-300 list-disc pl-4">
              {findingsAndLimitations.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-mono font-bold text-red-400 border-b border-red-900/40 pb-2">
            6B. SCIENTIFIC LIMITATIONS & SAFEGUARDS
          </h3>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-red-300 font-bold block">MANDATORY SAFEGUARDS:</span>
            <ul className="space-y-1.5 text-[11px] text-gray-300 list-disc pl-4">
              {findingsAndLimitations.limitations.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-red-900/40 text-[10px] font-mono text-gray-400">
            <span className="text-gray-500 block">DATA ACKNOWLEDGMENT:</span>
            {findingsAndLimitations.dataAcknowledgment}
          </div>
        </div>
      </div>
    </div>
  );
}
