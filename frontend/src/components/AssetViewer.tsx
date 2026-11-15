import React, { useEffect, useMemo, useState } from 'react';
import { NormalizedObservation } from '../types/observation';

interface AssetViewerProps {
  observations: NormalizedObservation[];
  comparisonMode: 'single' | 'blink' | 'side_by_side';
  onComparisonModeChange: (mode: 'single' | 'blink' | 'side_by_side') => void;
  onOpenReceipt: () => void;
  onSwitchToSearch?: () => void;
}

export default function AssetViewer({
  observations,
  comparisonMode,
  onComparisonModeChange,
  onOpenReceipt,
  onSwitchToSearch,
}: AssetViewerProps) {
  // Always sort observations chronologically per Phase F4
  const sortedObs = useMemo(() => {
    return [...observations].sort((a, b) => {
      const tA = a.observationTime ? new Date(a.observationTime).getTime() : 0;
      const tB = b.observationTime ? new Date(b.observationTime).getTime() : 0;
      return tA - tB;
    });
  }, [observations]);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);
  const [invertColor, setInvertColor] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [showReticle, setShowReticle] = useState<boolean>(true);

  // Reset index when new observations arrive
  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
  }, [sortedObs.length]);

  // Playback & Blink timer loop
  useEffect(() => {
    if (!isPlaying || sortedObs.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedObs.length);
    }, playbackSpeedMs);
    return () => clearInterval(interval);
  }, [isPlaying, sortedObs.length, playbackSpeedMs]);

  // Keyboard accessibility: Space to Play/Pause, Left/Right arrows for Timeline
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }
      if (e.code === 'Space' && sortedObs.length > 1) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight' && sortedObs.length > 0) {
        setIsPlaying(false);
        setActiveIndex((prev) => (prev + 1) % sortedObs.length);
      } else if (e.code === 'ArrowLeft' && sortedObs.length > 0) {
        setIsPlaying(false);
        setActiveIndex((prev) => (prev - 1 + sortedObs.length) % sortedObs.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedObs.length]);

  if (sortedObs.length === 0) {
    return (
      <div className="bg-cardBg border border-borderCol rounded-xl p-10 text-center space-y-3 max-w-4xl">
        <p className="text-sm font-mono text-gray-300">NO PREPARED OBSERVATIONS LOADED</p>
        <p className="text-xs text-gray-500">
          Go to the Search & Target Selection tab, search a target, and prepare 1 to 4 observations to inspect them here.
        </p>
      </div>
    );
  }

  const currentObs = sortedObs[activeIndex] || sortedObs[0];
  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toUTCString().replace('GMT', 'UTC') : 'Date Unavailable';

  const renderObservationPane = (obs: NormalizedObservation, label?: string) => (
    <div className="bg-cardBg border border-borderCol rounded-xl overflow-hidden flex flex-col">
      {/* Pane Top Metadata Header */}
      <div className="px-4 py-3 bg-darkBg border-b border-borderCol flex flex-wrap items-center justify-between gap-2">
        <div>
          {label && (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accentBlue/20 text-accentGlow mr-2">
              {label}
            </span>
          )}
          <span className="text-xs font-mono font-bold text-white">
            {obs.archiveObservationId || obs.sourceProductId}
          </span>
        </div>
        <span className="text-xs font-mono text-amber-300">{formatDate(obs.observationTime)}</span>
      </div>

      {/* Cutout Image Canvas */}
      <div className="relative bg-black h-80 sm:h-96 flex items-center justify-center overflow-hidden">
        {obs.previewStatus === 'available' && obs.previewUrl ? (
          <img
            src={obs.previewUrl}
            alt={obs.sourceProductId}
            style={{
              transform: `scale(${zoom})`,
              filter: invertColor ? 'invert(1) hue-rotate(180deg)' : 'none',
              // SPHEREx cutouts are tiny (e.g. 18×18 px at ~6″/px). Upscale to fill the
              // frame with nearest-neighbour so each real pixel stays a crisp block and
              // the browser doesn't smooth in detail that isn't in the data.
              imageRendering: 'pixelated',
            }}
            className="h-full w-full object-contain transition-transform duration-150 select-none"
          />
        ) : (
          <div className="text-center p-6 space-y-2">
            <p className="text-xs font-mono text-amber-400">PREVIEW IMAGE UNAVAILABLE</p>
            <p className="text-[11px] text-gray-500 max-w-xs">
              Visual PNG cutout is missing, but scientific FITS status is tracked separately below.
            </p>
          </div>
        )}

        {/* Target Reticle Crosshair */}
        {showReticle && obs.previewStatus === 'available' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-16 h-16 text-accentGlow/60" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2,2" />
              <line x1="20" y1="2" x2="20" y2="15" stroke="currentColor" strokeWidth="1" />
              <line x1="20" y1="25" x2="20" y2="38" stroke="currentColor" strokeWidth="1" />
              <line x1="2" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="1" />
              <line x1="25" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1" />
              <circle cx="20" cy="20" r="1.2" fill="currentColor" />
            </svg>
          </div>
        )}

        {/* Quality Warning Badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1 pointer-events-none">
          {obs.nonzeroFlagFraction !== undefined && obs.nonzeroFlagFraction > 0.3 && (
            <span className="bg-amber-950/80 border border-amber-600/80 text-amber-200 px-2 py-0.5 rounded text-[10px] font-mono">
              ⚠️ {(obs.nonzeroFlagFraction * 100).toFixed(0)}% FLAGS
            </span>
          )}
          {obs.queryPositionInCutout === false && (
            <span className="bg-red-950/80 border border-red-600/80 text-red-200 px-2 py-0.5 rounded text-[10px] font-mono">
              ⚠️ Pointing Outside Cutout
            </span>
          )}
        </div>

        {/* Corner Overlay Badge */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm border border-gray-800 px-2.5 py-1 rounded text-[11px] font-mono text-gray-300">
          {obs.wavelength ? `${obs.wavelength} µm` : 'λ N/A'} • {obs.detector || 'Detector N/A'}
        </div>
      </div>

      {/* Pane Bottom Specs & Asset Status */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono border-t border-borderCol bg-darkBg/40">
        <div>
          <span className="text-gray-500 block text-[10px]">WAVELENGTH / BW</span>
          <span className="text-gray-200">
            {obs.wavelength ? `${obs.wavelength} µm` : 'N/A'} /{' '}
            {obs.bandwidth ? `${obs.bandwidth} µm` : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">PROCESSING VERSION</span>
          <span className="text-gray-400">
            {obs.processingVersion ? obs.processingVersion : 'Unavailable'}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">PREVIEW STATUS</span>
          <span
            className={
              obs.previewStatus === 'available' ? 'text-green-400' : 'text-amber-400'
            }
          >
            {obs.previewStatus.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="text-gray-500 block text-[10px]">FITS PRODUCT</span>
          {obs.fitsStatus === 'available' && obs.fitsUrl ? (
            <a
              href={obs.fitsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-accentGlow underline hover:text-white"
            >
              AVAILABLE (FITS)
            </a>
          ) : (
            <span className="text-amber-400">UNAVAILABLE</span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Top Mode & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Observation Viewer</h2>
          <p className="text-xs font-mono text-gray-400">
            Keyboard: [Space] Play/Pause • [←/→] Step Timeline
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-cardBg border border-borderCol rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onComparisonModeChange('single');
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded ${
                comparisonMode === 'single'
                  ? 'bg-accentBlue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Timeline / Single
            </button>

            <button
              type="button"
              disabled={sortedObs.length < 2}
              onClick={() => {
                onComparisonModeChange('blink');
                setIsPlaying(true);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded disabled:opacity-40 ${
                comparisonMode === 'blink'
                  ? 'bg-accentBlue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Blink Compare
            </button>

            <button
              type="button"
              disabled={sortedObs.length < 2}
              onClick={() => {
                setIsPlaying(false);
                onComparisonModeChange('side_by_side');
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded disabled:opacity-40 ${
                comparisonMode === 'side_by_side'
                  ? 'bg-accentBlue text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenReceipt}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
          >
            Inspect Change Receipt →
          </button>
        </div>
      </div>

      {/* Scientific Safeguard Banner (Required by Phase F4) */}
      <div className="p-3.5 rounded-xl bg-amber-950/35 border border-amber-700/50 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong>Visual Exploration Only:</strong>{' '}
          {comparisonMode === 'blink'
            ? 'Blinking alternates frames for visual inspection and is NOT proof of astronomical change or proper motion.'
            : 'Infrared false-color previews use per-image display scaling; brightness and spectral comparability remain unassessed.'}
        </span>
      </div>

      {/* Single Frame Informative Banner with Quick Action */}
      {sortedObs.length < 2 && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/60 text-xs font-mono text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-base">ℹ️</span>
            <span>
              <strong>Single Frame Loaded:</strong> Video playback and blinking require at least 2 observations taken at different dates.
            </span>
          </div>
          {onSwitchToSearch && (
            <button
              type="button"
              onClick={onSwitchToSearch}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-colors flex items-center space-x-1"
            >
              <span>Select 2–4 Epochs in Search</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}

      {/* Viewer Display Area */}
      {comparisonMode === 'side_by_side' && sortedObs.length >= 2 ? (
        <div
          className={`grid gap-4 ${
            sortedObs.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : sortedObs.length === 3
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}
        >
          {sortedObs.map((obs, idx) =>
            renderObservationPane(
              obs,
              `EPOCH ${idx + 1} (${idx === 0 ? 'EARLIEST' : idx === sortedObs.length - 1 ? 'LATEST' : 'INTERMEDIATE'})`
            )
          )}
        </div>
      ) : (
        renderObservationPane(
          currentObs,
          comparisonMode === 'blink'
            ? `BLINKING FRAME ${activeIndex + 1} OF ${sortedObs.length}`
            : `OBSERVATION ${activeIndex + 1} OF ${sortedObs.length}`
        )
      )}

      {/* Chronological Timeline & Image Controls */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Playback & Step Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={sortedObs.length < 2}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex((prev) => (prev - 1 + sortedObs.length) % sortedObs.length);
            }}
            className="px-3 py-1.5 rounded bg-darkBg border border-borderCol text-xs font-mono text-gray-300 hover:text-white disabled:opacity-40"
          >
            ◀ Prev
          </button>

          <button
            type="button"
            disabled={sortedObs.length < 2}
            onClick={() => setIsPlaying((prev) => !prev)}
            title={
              sortedObs.length < 2
                ? 'Time-series video playback requires at least 2 observations (epochs) to animate.'
                : 'Play / Pause Time-Series Video [Space]'
            }
            className={`px-4 py-1.5 rounded text-xs font-mono font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
              isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-accentBlue hover:bg-blue-600'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play / Blink'}
          </button>

          <button
            type="button"
            disabled={sortedObs.length < 2}
            onClick={() => {
              setIsPlaying(false);
              setActiveIndex((prev) => (prev + 1) % sortedObs.length);
            }}
            className="px-3 py-1.5 rounded bg-darkBg border border-borderCol text-xs font-mono text-gray-300 hover:text-white disabled:opacity-40"
          >
            Next ▶
          </button>

          {sortedObs.length >= 2 && (
            <select
              value={playbackSpeedMs}
              onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
              className="px-2 py-1.5 rounded bg-darkBg border border-borderCol text-xs font-mono text-gray-300"
              title="Playback / Blink Interval"
            >
              <option value={2000}>0.5x (Slow - 2s)</option>
              <option value={1200}>1.0x (Normal - 1.2s)</option>
              <option value={600}>2.0x (Fast - 600ms)</option>
              <option value={300}>4.0x (Rapid Video - 300ms)</option>
            </select>
          )}
        </div>

        {/* Frame Scrubber Range Slider */}
        {sortedObs.length > 1 && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-darkBg/60 border border-borderCol/60 rounded-lg">
            <span className="text-[11px] font-mono text-gray-400">Scrub:</span>
            <input
              type="range"
              min={0}
              max={sortedObs.length - 1}
              value={activeIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveIndex(Number(e.target.value));
              }}
              className="w-24 sm:w-32 h-1.5 bg-darkBg rounded-lg appearance-none cursor-pointer accent-accentBlue"
            />
            <span className="text-[11px] font-mono text-accentGlow font-bold">
              {activeIndex + 1}/{sortedObs.length}
            </span>
          </div>
        )}

        {/* Chronological Timeline Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {sortedObs.map((obs, idx) => (
            <button
              key={obs.backendSelectionKey}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setActiveIndex(idx);
              }}
              className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
                activeIndex === idx && comparisonMode !== 'side_by_side'
                  ? 'bg-accentBlue/20 border-accentBlue text-white'
                  : 'bg-darkBg border-borderCol text-gray-400 hover:text-gray-200'
              }`}
            >
              {obs.observationTime
                ? new Date(obs.observationTime).toISOString().slice(0, 10)
                : `Obs #${idx + 1}`}
            </button>
          ))}
        </div>

        {/* Zoom & Invert Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            className="px-2.5 py-1.5 rounded bg-darkBg border border-borderCol text-xs font-mono text-gray-300 hover:text-white"
          >
            -
          </button>
          <span className="text-xs font-mono text-gray-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
            className="px-2.5 py-1.5 rounded bg-darkBg border border-borderCol text-xs font-mono text-gray-300 hover:text-white"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setInvertColor((prev) => !prev)}
            className={`px-3 py-1.5 rounded border text-xs font-mono ${
              invertColor
                ? 'bg-accentBlue text-white border-accentBlue'
                : 'bg-darkBg border-borderCol text-gray-300 hover:text-white'
            }`}
          >
            Invert
          </button>
          <button
            type="button"
            onClick={() => setShowReticle((prev) => !prev)}
            className={`px-3 py-1.5 rounded border text-xs font-mono transition-colors ${
              showReticle
                ? 'bg-accentBlue/20 text-accentGlow border-accentBlue/40'
                : 'bg-darkBg border-borderCol text-gray-400 hover:text-white'
            }`}
            title="Toggle Target Center Reticle Crosshair"
          >
            Reticle {showReticle ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}