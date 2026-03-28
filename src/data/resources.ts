/**
 * Real EVE Frontier game resources, sourced from the community wiki.
 * Organized by category matching the in-game industry hierarchy.
 *
 * Resource chain: Ores → Minerals → Manufactured Components → Structures/Fuel
 */

/* ── Ore Types (found in asteroid belts — what systems "have") ── */

export const ORES = [
  'Char',
  'Slag',
  'Ingot',
  'Comet',
  // Aestasium variants (rare)
  'Adaptive Core Aestasium',
  'Agile Core Aestasium',
  'Solidifying Core Aestasium',
  'Hardened Core Aestasium',
] as const;

/* ── Minerals (refined from ores at Refineries) ── */

export const MINERALS = [
  'Carbonaceous Materials',
  'Silicates',
  'Heavy Metals',
  'Precious Metals',
  'Feldspar',
  'Sulfides',
  'Water Ice',
  'Sophrogon',
  'Eupraxite',
] as const;

/* ── Manufactured Components (printed/assembled from minerals) ── */

export const COMPONENTS = [
  'Building Foam',
  'Carbon Weave',
  'Reinforced Alloys',
  'Thermal Composites',
  'Printed Circuits',
  'Echo Chamber',
  'Cell Weave',
  'Chitin',
  'Shilajit',
] as const;

/* ── Exotronics (special materials) ── */

export const EXOTRONICS = [
  // Catalytic crystals
  'Radiantium',
  'Luminalis',
  'Catalytic Dust',
  'Gravionite',
  'Eclipsite',
  // Rogue drone components
  'Fossilized Exotronics',
  'Salvaged Materials',
  'Mummified Clone',
] as const;

/* ── Fuel ── */

export const FUELS = [
  'D1 Fuel',
  'D2 Fuel',
  'EU-40 Fuel',
  'EU-90 Fuel',
  'SOF-40 Fuel',
  'SOF-80 Fuel',
  'Salt',
] as const;

/* ── Crude Matter ── */

export const CRUDE_MATTER = [
  'Old Crude Matter',
  'Young Crude Matter',
] as const;

/* ── Structures / Assemblies ── */

export const STRUCTURES = [
  'Network Node',
  'Portable Printer',
  'Printer S',
  'Printer M',
  'Printer L',
  'Portable Refinery',
  'Refinery M',
  'Refinery L',
  'Assembler',
  'Shipyard S',
  'Shipyard M',
  'Shipyard L',
  'Smart Gate',
  'Smart Turret',
  'Smart Storage Unit',
] as const;

/* ── All resources (flat list for search/autocomplete) ── */

export const ALL_RESOURCES = [
  ...ORES,
  ...MINERALS,
  ...COMPONENTS,
  ...EXOTRONICS,
  ...FUELS,
  ...CRUDE_MATTER,
] as const;

export type ResourceName = (typeof ALL_RESOURCES)[number];
export type OreName = (typeof ORES)[number];
export type MineralName = (typeof MINERALS)[number];
export type ComponentName = (typeof COMPONENTS)[number];
export type StructureName = (typeof STRUCTURES)[number];

/* ── Ore → Refinery output mapping ── */

export const ORE_YIELDS: Record<string, string[]> = {
  'Char': ['Carbonaceous Materials', 'Silicates'],
  'Slag': ['Silicates', 'Heavy Metals'],
  'Ingot': ['Carbonaceous Materials', 'Water Ice'],
  'Comet': ['Heavy Metals'],
  'Adaptive Core Aestasium': ['Carbonaceous Materials', 'Water Ice'],
  'Agile Core Aestasium': ['Carbonaceous Materials'],
  'Solidifying Core Aestasium': ['Heavy Metals'],
  'Hardened Core Aestasium': ['Heavy Metals'],
};

/* ── Resource categories for UI display ── */

export type ResourceCategory = 'ore' | 'mineral' | 'component' | 'exotronic' | 'fuel' | 'crude';

const oreSet = new Set<string>(ORES);
const mineralSet = new Set<string>(MINERALS);
const componentSet = new Set<string>(COMPONENTS);
const exotronicSet = new Set<string>(EXOTRONICS);
const fuelSet = new Set<string>(FUELS);

export function getResourceCategory(name: string): ResourceCategory {
  if (oreSet.has(name)) return 'ore';
  if (mineralSet.has(name)) return 'mineral';
  if (componentSet.has(name)) return 'component';
  if (exotronicSet.has(name)) return 'exotronic';
  if (fuelSet.has(name)) return 'fuel';
  return 'crude';
}

export const RESOURCE_CATEGORY_CONFIG: Record<ResourceCategory, { label: string; color: string }> = {
  ore: { label: 'Ore', color: '#a8854f' },
  mineral: { label: 'Mineral', color: '#22d3ee' },
  component: { label: 'Component', color: '#818cf8' },
  exotronic: { label: 'Exotronic', color: '#c084fc' },
  fuel: { label: 'Fuel', color: '#f59e0b' },
  crude: { label: 'Crude', color: '#6b7280' },
};
