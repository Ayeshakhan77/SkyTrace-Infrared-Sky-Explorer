import { TargetPreset } from '../types/observation';

export const CURATED_TARGETS: TargetPreset[] = [
  {
    id: 'barnards-star',
    name: "Barnard's Star",
    ra: '269.4462678797',
    dec: '+4.7682044119',
    epoch: '2026.0 (proper-motion propagated)',
    frame: 'ICRS',
    radiusDeg: 0.01,
    notes: 'SIMBAD J2000 position propagated to 2026.0 using catalog proper motion. Fixed query center only; identity and per-exposure positions still need verification.',
  },
  {
    id: 'epsilon-indi-b',
    name: 'Epsilon Indi B',
    ra: '331.0438333333',
    dec: '-56.7826944444',
    epoch: 'J2000',
    frame: 'ICRS',
    radiusDeg: 0.01,
    notes: '2MASS J22041052-5646577 catalog coordinate, associated with Epsilon Indi B in SIMBAD. Proper motion to each observation time is pending.',
  },
  {
    id: 'wise-0855',
    name: 'WISE 0855',
    ra: '133.7951291667',
    dec: '-7.2451472222',
    epoch: 'Unverified (fixed challenge position)',
    frame: 'ICRS',
    radiusDeg: 0.01,
    notes: 'Fixed official challenge coordinate; epoch and target proper motion are unverified. The offline DR1 fixture is for visual exploration only.',
  },
  {
    id: 'rw-aurigae',
    name: 'RW Aurigae',
    ra: '76.9565260346',
    dec: '+30.4014381739',
    epoch: 'J2000',
    frame: 'ICRS',
    radiusDeg: 0.01,
    notes: 'Variable T Tauri star system; check spectral and detector consistency.',
  },
  {
    id: 'r-draconis',
    name: 'R Draconis',
    ra: '248.1676108330',
    dec: '+66.7549794172',
    epoch: 'J2000',
    frame: 'ICRS',
    radiusDeg: 0.01,
    notes: 'Mira-type variable star; evaluate chronological separation across archive releases.',
  },
];

// Real DR1/v27 WISE-field cutouts prepared by the backend on 14 Nov 2026.
// The local wavelengths are 0.993667 and 0.970521 microns. This is a visual
// fixture: identity, registration, masks, PSF and photometry remain unassessed.
import record2025 from './records/50564d11d67c41de9deb9a88af808c90.json';
import record2026 from './records/9a225183ed62473e9da70d3118a077c7.json';

export const WISE_0855_FIXTURE_RECORDS: any[] = [record2025, record2026];
export const FIXTURE_PREVIEW_PATH = (cutoutId: string) => `/fixtures/${cutoutId}.png`;
