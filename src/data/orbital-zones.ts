import type { OrbitalRegion } from '../types';

/**
 * Known orbital zone names encountered in EVE Frontier.
 * Orbital zones are content areas (mining, combat, exploration, loot)
 * that exist within solar systems — separate from Lagrange points.
 *
 * Each system can have different orbital zones. This is a catalog of
 * known zone names for autocomplete / selection.
 */

export interface KnownOrbitalZone {
  name: string;
  region: OrbitalRegion;
}

/** Parse the region prefix from a zone name */
export function parseOrbitalRegion(name: string): OrbitalRegion {
  if (name.startsWith('Inner')) return 'Inner';
  if (name.startsWith('Trojan')) return 'Trojan';
  if (name.startsWith('Outer')) return 'Outer';
  if (name.startsWith('Fringe')) return 'Fringe';
  return 'Outer'; // default fallback
}

/** All known orbital zone names (will grow as more are discovered) */
export const KNOWN_ORBITAL_ZONES: KnownOrbitalZone[] = [
  // Inner zones
  { name: 'Inner Ancient Cluster', region: 'Inner' },
  { name: 'Inner Stone Cluster', region: 'Inner' },
  { name: 'Inner Ruins', region: 'Inner' },
  { name: 'Inner Derelict Quarry', region: 'Inner' },
  { name: 'Inner Derelict Bay', region: 'Inner' },

  // Trojan zones
  { name: 'Trojan Garden', region: 'Trojan' },
  { name: 'Trojan Drifting Annex', region: 'Trojan' },

  // Outer zones
  { name: 'Outer Grove', region: 'Outer' },
  { name: 'Outer Blue Drift', region: 'Outer' },
  { name: 'Outer Vestiges', region: 'Outer' },
  { name: 'Outer Shale', region: 'Outer' },
  { name: 'Outer Abandoned Foundry', region: 'Outer' },

  // Fringe zones
  { name: 'Fringe Crossing', region: 'Fringe' },
  { name: 'Fringe Latticeway', region: 'Fringe' },
  { name: 'Fringe Tallyport', region: 'Fringe' },
];

/** Region colors for UI */
export const REGION_COLORS: Record<OrbitalRegion, string> = {
  Inner: '#f59e0b',   // amber — closest to the star
  Trojan: '#22c55e',  // green — stable zones
  Outer: '#3b82f6',   // blue — deep space
  Fringe: '#a855f7',  // purple — frontier/edge
};
