import { CURATED_TARGETS } from '../data/fixtures';
import { TargetPreset } from '../types/observation';

export interface ParsedUrlParams {
  target?: string;
  ra?: string;
  dec?: string;
  radiusDeg?: number;
  collection?: string;
  tab?: 'search' | 'viewer' | 'receipt';
  preset?: TargetPreset;
}

/**
 * Parses query parameters from a URL search string.
 * Supports:
 *   ?ra=133.7951&dec=-7.2451
 *   ?target=wise-0855
 *   ?target=Barnard's+Star&collection=spherex_dr1&radius=0.01&tab=search
 */
export function parseUrlParams(searchString: string = typeof window !== 'undefined' ? window.location.search : ''): ParsedUrlParams {
  if (!searchString) return {};
  const params = new URLSearchParams(searchString);

  let target = params.get('target') || params.get('name') || undefined;
  let ra = params.get('ra') || undefined;
  let dec = params.get('dec') || undefined;
  const radiusParam = params.get('radius') || params.get('radiusDeg') || params.get('r');
  const radiusDeg = radiusParam ? parseFloat(radiusParam) : undefined;
  const collection = params.get('collection') || params.get('release') || undefined;
  const tabParam = params.get('tab') || undefined;
  const tab = tabParam === 'search' || tabParam === 'viewer' || tabParam === 'receipt' ? tabParam : undefined;

  let preset: TargetPreset | undefined;

  if (target) {
    const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    preset = CURATED_TARGETS.find((p) => {
      const cleanId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanId === cleanTarget || cleanName === cleanTarget;
    });

    if (preset) {
      if (!ra) ra = preset.ra;
      if (!dec) dec = preset.dec;
    }
  } else if (ra && dec) {
    // If coordinates match a known preset exactly, associate it
    preset = CURATED_TARGETS.find((p) => p.ra.trim() === ra?.trim() && p.dec.trim() === dec?.trim());
    if (preset && !target) {
      target = preset.name;
    }
  }

  return { target, ra, dec, radiusDeg, collection, tab, preset };
}

/**
 * Updates URL search parameters in the browser history without a full page reload.
 */
export function updateUrlParams(updates: {
  target?: string;
  ra?: string;
  dec?: string;
  radiusDeg?: number;
  collection?: string;
  tab?: string;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;

    if (updates.target !== undefined) {
      if (updates.target) p.set('target', updates.target);
      else p.delete('target');
    }

    if (updates.ra !== undefined) {
      if (updates.ra) p.set('ra', updates.ra);
      else p.delete('ra');
    }

    if (updates.dec !== undefined) {
      if (updates.dec) p.set('dec', updates.dec);
      else p.delete('dec');
    }

    if (updates.radiusDeg !== undefined) {
      p.set('radius', updates.radiusDeg.toString());
    }

    if (updates.collection !== undefined) {
      if (updates.collection) p.set('collection', updates.collection);
      else p.delete('collection');
    }

    if (updates.tab !== undefined) {
      if (updates.tab) p.set('tab', updates.tab);
      else p.delete('tab');
    }

    const newQuery = p.toString();
    const newPath = newQuery ? `${url.pathname}?${newQuery}` : url.pathname;
    window.history.replaceState({}, '', newPath);
  } catch {
    // Graceful fallback if history API is restricted
  }
}
