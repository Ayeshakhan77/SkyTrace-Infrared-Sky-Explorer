import React, { useState } from 'react';
import { CURATED_TARGETS } from '../data/fixtures';
import { NormalizedObservation, SearchContext, TargetPreset } from '../types/observation';
import {
  DEFAULT_COLLECTION,
  MAX_RADIUS_DEG,
  SUPPORTED_COLLECTIONS,
  prepareObservations,
  searchObservations,
  validateCoordinates,
} from '../services/api';
import { ParsedUrlParams, updateUrlParams } from '../services/urlParams';

interface QueryConsoleProps {
  onObservationsPrepared: (
    prepared: NormalizedObservation[],
    searchContext: SearchContext
  ) => void;
  initialParams?: ParsedUrlParams;
}

export default function QueryConsole({ onObservationsPrepared, initialParams }: QueryConsoleProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialParams?.preset?.id || (initialParams?.target && !initialParams.ra ? initialParams.target : 'wise-0855')
  );
  const [targetName, setTargetName] = useState<string>(
    initialParams?.target || initialParams?.preset?.name || CURATED_TARGETS[2].name
  );
  const [ra, setRa] = useState<string>(
    initialParams?.ra || initialParams?.preset?.ra || CURATED_TARGETS[2].ra
  );
  const [dec, setDec] = useState<string>(
    initialParams?.dec || initialParams?.preset?.dec || CURATED_TARGETS[2].dec
  );
  const [radiusDeg, setRadiusDeg] = useState<number>(
    initialParams?.radiusDeg || initialParams?.preset?.radiusDeg || CURATED_TARGETS[2].radiusDeg
  );
  const [collection, setCollection] = useState<string>(
    initialParams?.collection || DEFAULT_COLLECTION
  );
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [searchProvenance, setSearchProvenance] = useState<{
    queryUrl?: string;
    queriedAtUtc?: string;
    totalRows?: number;
    interpretation?: string;
    activeCollection: string;
  }>({ activeCollection: initialParams?.collection || DEFAULT_COLLECTION });

  const coordValidation = React.useMemo(() => {
    if (!ra.trim() || !dec.trim()) return null;
    return validateCoordinates(ra, dec);
  }, [ra, dec]);

  // Default to Offline Fixture Mode so UI works standalone until live backend is connected
  const [useOfflineMode, setUseOfflineMode] = useState<boolean>(true);

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isPreparing, setIsPreparing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [truncated, setTruncated] = useState<boolean>(false);
  const [results, setResults] = useState<NormalizedObservation[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Search IDs belong to one mode and coordinate request. Clear them when the
  // request changes so cached fixture rows cannot be sent to the live API.
  const clearSearch = () => {
    setSearchId(null);
    setResults([]);
    setSelectedKeys([]);
    setTruncated(false);
    setErrorMsg(null);
    setSearchProvenance({ activeCollection: collection });
  };

  const changeMode = (offline: boolean) => {
    clearSearch();
    setUseOfflineMode(offline);
    if (offline) handleSelectPreset(CURATED_TARGETS[2]);
  };

  const handleSelectPreset = (preset: TargetPreset) => {
    clearSearch();
    setSelectedPresetId(preset.id);
    setTargetName(preset.name);
    setRa(preset.ra);
    setDec(preset.dec);
    setRadiusDeg(preset.radiusDeg);
    setErrorMsg(null);
    updateUrlParams({
      target: preset.name,
      ra: preset.ra,
      dec: preset.dec,
      radiusDeg: preset.radiusDeg,
    });
  };

  const handleCopyLink = () => {
    updateUrlParams({
      target: targetName,
      ra,
      dec,
      radiusDeg,
      collection,
    });
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ra.trim() || !dec.trim()) {
      setErrorMsg('Both Right Ascension (RA) and Declination (Dec) are required.');
      return;
    }

    clearSearch();
    setIsSearching(true);
    try {
      const response = await searchObservations({
        targetName: targetName.trim() || 'Custom Sky Position',
        ra: ra.trim(),
        dec: dec.trim(),
        radiusDeg,
        collection,
        useOfflineFallback: useOfflineMode,
      });

      setSearchId(response.searchId);
      setResults(response.observations);
      setTruncated(response.truncated);
      setSearchProvenance({
        queryUrl: response.queryUrl,
        queriedAtUtc: response.queriedAtUtc,
        totalRows: response.totalRows,
        interpretation: response.interpretation,
        activeCollection: response.collection || collection,
      });
      // Auto-select the first 2 observations so the user has an immediate multi-epoch sequence ready for video playback
      if (response.observations.length >= 2) {
        setSelectedKeys(response.observations.slice(0, 2).map((o) => o.backendSelectionKey));
      } else if (response.observations.length === 1) {
        setSelectedKeys([response.observations[0].backendSelectionKey]);
      } else {
        setSelectedKeys([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Archive search failed.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectObservation = (key: string) => {
    setErrorMsg(null);
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 4) {
        setErrorMsg('Maximum 4 observations can be selected per preparation request.');
        return prev;
      }
      return [...prev, key];
    });
  };

  const handlePrepare = async () => {
    const selectedObs = results.filter((obs) =>
      selectedKeys.includes(obs.backendSelectionKey)
    );
    if (selectedObs.length === 0) return;

    setIsPreparing(true);
    setErrorMsg(null);
    try {
      const prepared = await prepareObservations(selectedObs, useOfflineMode);
      onObservationsPrepared(prepared, {
        targetName: targetName.trim() || 'Custom Sky Position',
        ra: ra.trim(),
        dec: dec.trim(),
        radiusDeg,
        collection: useOfflineMode ? 'spherex_dr1' : searchProvenance.activeCollection || collection,
        searchId: searchId || undefined,
        queryUrl: searchProvenance.queryUrl,
        queriedAtUtc: searchProvenance.queriedAtUtc,
        totalRows: searchProvenance.totalRows,
        truncated,
        searchInterpretation: searchProvenance.interpretation,
        isOffline: useOfflineMode,
        presetId: selectedPresetId || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Observation preparation failed.');
    } finally {
      setIsPreparing(false);
    }
  };

  const activePreset = CURATED_TARGETS.find((t) => t.id === selectedPresetId);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header + Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Search & Target Selection</h2>
          <p className="text-sm text-gray-400">
            Query NASA/IPAC SPHEREx archive collections using curated presets or custom sky coordinates.
          </p>
        </div>

        {/* Live vs Offline Fixture Toggle */}
        <div className="flex items-center space-x-2 bg-cardBg border border-borderCol rounded-lg p-1.5">
          <button
            type="button"
            disabled={isSearching || isPreparing}
            onClick={() => changeMode(true)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${useOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Offline Fixture (WISE 0855)
          </button>
          <button
            type="button"
            disabled={isSearching || isPreparing}
            onClick={() => changeMode(false)}
            className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${!useOfflineMode
                ? 'bg-accentBlue text-white'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            Live FastAPI Backend
          </button>
        </div>
      </div>

      {/* Curated Target Presets Bar */}
      <div className="bg-cardBg border border-borderCol rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase text-gray-400">
            Curated Target Presets (5 Official Targets)
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-[11px] font-mono text-gray-500">
              Frame: ICRS | Epoch: {activePreset?.epoch || 'Custom'}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 rounded text-[11px] font-mono bg-darkBg border border-borderCol hover:border-accentBlue text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
              title="Copy shareable link with current coordinates and release"
            >
              <span>🔗</span>
              <span>{copiedLink ? 'Copied URL!' : 'Share / Embed Link'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CURATED_TARGETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={isSearching || isPreparing || (useOfflineMode && preset.id !== 'wise-0855')}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${selectedPresetId === preset.id
                  ? 'bg-accentBlue/15 border-accentBlue text-white'
                  : 'bg-darkBg border-borderCol text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {activePreset && (
          <p className="text-xs text-gray-400 bg-darkBg/60 border border-borderCol/70 rounded-lg px-3 py-2">
            <span className="font-mono text-accentGlow mr-2">NOTE:</span>
            {activePreset.notes}
          </p>
        )}
      </div>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">TARGET LABEL</label>
            <input
              disabled={isSearching || isPreparing || useOfflineMode}
              type="text"
              value={targetName}
              onChange={(e) => {
                clearSearch();
                setTargetName(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="e.g., WISE 0855"
              className="w-full px-3 py-2 bg-darkBg border border-borderCol rounded-lg text-sm text-white focus:outline-none focus:border-accentBlue"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              RIGHT ASCENSION (RA)
            </label>
            <input
              disabled={isSearching || isPreparing || useOfflineMode}
              type="text"
              value={ra}
              onChange={(e) => { clearSearch(); setRa(e.target.value); setSelectedPresetId(''); }}
              placeholder="08h 55m 10.8s"
              className="w-full px-3 py-2 bg-darkBg border border-borderCol rounded-lg text-sm font-mono text-white focus:outline-none focus:border-accentBlue"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              DECLINATION (DEC)
            </label>
            <input
              disabled={isSearching || isPreparing || useOfflineMode}
              type="text"
              value={dec}
              onChange={(e) => { clearSearch(); setDec(e.target.value); setSelectedPresetId(''); }}
              placeholder="-07° 14′ 43″"
              className="w-full px-3 py-2 bg-darkBg border border-borderCol rounded-lg text-sm font-mono text-white focus:outline-none focus:border-accentBlue"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              SEARCH RADIUS (DEG)
            </label>
            <input
              disabled={isSearching || isPreparing || useOfflineMode}
              type="number"
              step="0.0001"
              min="0.0001"
              max={MAX_RADIUS_DEG}
              value={radiusDeg}
              onChange={(e) => { clearSearch(); setRadiusDeg(parseFloat(e.target.value) || 0.01); }}
              className="w-full px-3 py-2 bg-darkBg border border-borderCol rounded-lg text-sm font-mono text-white focus:outline-none focus:border-accentBlue"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1">
              SPHEREx COLLECTION
            </label>
            <select
              disabled={isSearching || isPreparing || useOfflineMode}
              value={collection}
              onChange={(e) => {
                clearSearch();
                setCollection(e.target.value);
              }}
              className="w-full px-3 py-2 bg-darkBg border border-borderCol rounded-lg text-sm font-mono text-white focus:outline-none focus:border-accentBlue"
            >
              {SUPPORTED_COLLECTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === 'spherex_dr1' ? 'DR1 (Surveys 1–2)' : 'QR3 (Surveys 3–4)'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {coordValidation && !coordValidation.isValid && (
          <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-800/50 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span>⚠️ Coordinate syntax alert:</span>
            <span>{coordValidation.error}</span>
          </div>
        )}
        {coordValidation && coordValidation.isValid && coordValidation.raDeg !== undefined && coordValidation.decDeg !== undefined && (
          <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/25 border border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span>✓ Verified ICRS decimal coordinates:</span>
            <span>RA: {coordValidation.raDeg.toFixed(6)}° • Dec: {coordValidation.decDeg.toFixed(6)}°</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs font-mono text-gray-500">
            A preset represents a sky search position, not a confirmed object detection.
          </div>

          <button
            type="submit"
            disabled={isSearching || isPreparing}
            className="px-5 py-2.5 rounded-lg bg-accentBlue hover:bg-blue-600 disabled:opacity-50 text-sm font-semibold text-white transition-colors"
          >
            {isSearching ? 'Searching SPHEREx Archive...' : 'Search Observations'}
          </button>
        </div>
      </form>

      {/* Error / Warning Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-mono text-red-300 space-y-2">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          {errorMsg.toLowerCase().includes('cannot reach') && (
            <button
              type="button"
              onClick={() => changeMode(true)}
              className="mt-2 inline-block px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 transition-colors"
            >
              Switch to Offline Fixture Mode (Zero backend required) →
            </button>
          )}
        </div>
      )}

      {truncated && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/60 text-xs font-mono text-amber-300">
          ⚠️ Archive search results were truncated at the 500-row metadata limit. Narrow your search radius if needed.
        </div>
      )}

      {searchId && !isSearching && !errorMsg && results.length === 0 && (
        <div className="p-4 rounded-xl bg-cardBg border border-borderCol text-xs font-mono text-gray-300">
          No SPHEREx observations found at this position in the searched collection ({searchProvenance.activeCollection.toUpperCase().replace('_', ' ')}). Try a larger
          radius (max 0.05°) or another target. An empty result is not evidence that an object is absent.
        </div>
      )}

      {/* Search Results & Selection List */}
      {results.length > 0 && (
        <div className="bg-cardBg border border-borderCol rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderCol pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white">
                  Discovered SPHEREx Observations ({results.length})
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-accentBlue/20 text-accentGlow border border-accentBlue/40">
                  {searchProvenance.activeCollection.toUpperCase().replace('_', ' ')}
                </span>
                {searchProvenance.totalRows !== undefined && (
                  <span className="text-[10px] font-mono text-gray-400">
                    ({searchProvenance.totalRows} archive matches)
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-gray-400 mt-0.5">
                SEARCH ID: {searchId} • Select 1 to 4 products to prepare for time-series playback
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {selectedKeys.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedKeys([])}
                  className="px-3 py-2 text-xs font-mono text-gray-400 hover:text-white border border-borderCol rounded-lg"
                >
                  Clear Selection ({selectedKeys.length})
                </button>
              )}
              <button
                type="button"
                disabled={selectedKeys.length === 0 || isPreparing}
                onClick={handlePrepare}
                title={
                  selectedKeys.length === 1
                    ? 'Tip: Select at least 2 observations to enable video playback / blinking in the viewer'
                    : undefined
                }
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                {isPreparing
                  ? 'Preparing Assets...'
                  : `Prepare Selected (${selectedKeys.length}/4) →`}
              </button>
            </div>
          </div>

          {searchProvenance.queryUrl && (
            <div className="bg-darkBg/60 border border-borderCol/60 rounded-lg p-2.5 text-[11px] font-mono text-gray-400 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-accentGlow font-semibold">UPSTREAM IRSA SIA2 QUERY:</span>
                {searchProvenance.queriedAtUtc && (
                  <span className="text-gray-500">Queried: {searchProvenance.queriedAtUtc}</span>
                )}
              </div>
              <p className="break-all text-gray-300 select-all">{searchProvenance.queryUrl}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((obs) => {
              const isSelected = selectedKeys.includes(obs.backendSelectionKey);
              return (
                <div
                  key={obs.backendSelectionKey}
                  onClick={() => { if (!isSearching && !isPreparing) toggleSelectObservation(obs.backendSelectionKey); }}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${isSelected
                      ? 'bg-accentBlue/15 border-accentBlue'
                      : 'bg-darkBg border-borderCol hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-accentGlow">
                      {obs.archiveObservationId || obs.sourceProductId}
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded ${isSelected
                          ? 'bg-accentBlue text-white'
                          : 'bg-borderCol text-gray-400'
                        }`}
                    >
                      {isSelected ? '✓ SELECTED' : 'CLICK TO SELECT'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 mt-3">
                    <div>
                      <span className="text-gray-500 block text-[10px]">OBSERVATION DATE</span>
                      {obs.observationTime
                        ? new Date(obs.observationTime).toUTCString().replace('GMT', 'UTC')
                        : 'Unavailable'}
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">WAVELENGTH / BAND</span>
                      {obs.wavelength ? `${obs.wavelength} µm` : 'N/A'} (
                      {obs.detector || 'Detector N/A'})
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">COLLECTION</span>
                      {obs.provenance.collection || 'SPHEREx'}
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">SELECTION KEY</span>
                      {obs.backendSelectionKey.slice(0, 12)}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}