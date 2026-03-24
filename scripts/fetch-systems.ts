/**
 * Fetch all solar systems from the EVE Frontier World API
 * and produce a normalized JSON bundle for the frontend.
 *
 * Usage:
 *   npx tsx scripts/fetch-systems.ts
 *
 * Output: src/data/systems-bundle.json
 *
 * API: GET /v2/solarsystems?limit=100&offset=N
 * Response per system:
 *   { id, name, constellationId, regionId, location: { x, y, z } }
 * Coordinates are BigInt-scale values (exceed Number.MAX_SAFE_INTEGER).
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const API_BASE = 'https://world-api-stillness.live.tech.evefrontier.com/v2';
const LIMIT = 100;

interface ApiSystem {
  id: number;
  name: string;
  constellationId: number;
  regionId: number;
  location: { x: string | number; y: string | number; z: string | number };
}

interface ApiResponse {
  metadata: { total: number };
  data: ApiSystem[];
}

interface BundledSystem {
  id: number;
  name: string;
  constellationId: number;
  regionId: number;
  x: number;
  y: number;
}

async function fetchPage(offset: number): Promise<ApiResponse> {
  const url = `${API_BASE}/solarsystems?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json() as Promise<ApiResponse>;
}

async function main() {
  console.log('Fetching system count...');
  const first = await fetchPage(0);
  const total = first.metadata.total;
  console.log(`Total systems: ${total}`);

  const allRaw: ApiSystem[] = [...first.data];
  const pages = Math.ceil(total / LIMIT);

  for (let page = 1; page < pages; page++) {
    const offset = page * LIMIT;
    if (page % 25 === 0 || page === pages - 1) {
      console.log(`  page ${page + 1}/${pages} (offset ${offset})`);
    }
    const resp = await fetchPage(offset);
    allRaw.push(...resp.data);
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`Fetched ${allRaw.length} systems. Normalizing coordinates...`);

  // Parse BigInt coordinates — use x and z for 2D projection
  const rawCoords = allRaw.map((s) => ({
    id: s.id,
    name: s.name,
    constellationId: s.constellationId,
    regionId: s.regionId,
    rawX: BigInt(String(s.location.x)),
    rawZ: BigInt(String(s.location.z)),
  }));

  // Find min/max
  let minX = rawCoords[0].rawX;
  let maxX = rawCoords[0].rawX;
  let minZ = rawCoords[0].rawZ;
  let maxZ = rawCoords[0].rawZ;

  for (const c of rawCoords) {
    if (c.rawX < minX) minX = c.rawX;
    if (c.rawX > maxX) maxX = c.rawX;
    if (c.rawZ < minZ) minZ = c.rawZ;
    if (c.rawZ > maxZ) maxZ = c.rawZ;
  }

  const rangeX = maxX - minX;
  const rangeZ = maxZ - minZ;
  const MAP_SIZE = 1000;

  // Normalize to [0, MAP_SIZE] as floats with 2 decimal precision
  const bundle: BundledSystem[] = rawCoords.map((c) => ({
    id: c.id,
    name: c.name,
    constellationId: c.constellationId,
    regionId: c.regionId,
    x: rangeX === 0n ? 500 : Number(((c.rawX - minX) * BigInt(MAP_SIZE * 100)) / rangeX) / 100,
    y: rangeZ === 0n ? 500 : Number(((c.rawZ - minZ) * BigInt(MAP_SIZE * 100)) / rangeZ) / 100,
  }));

  const outPath = resolve(__dirname, '..', 'src', 'data', 'systems-bundle.json');
  writeFileSync(outPath, JSON.stringify(bundle));
  const sizeMB = (Buffer.byteLength(JSON.stringify(bundle)) / 1024 / 1024).toFixed(2);
  console.log(`Written ${bundle.length} systems to ${outPath} (${sizeMB} MB)`);

  // Also probe single-system endpoint for drill-down data
  console.log('\nProbing single-system endpoint...');
  try {
    const singleRes = await fetch(`${API_BASE}/solarsystems/${allRaw[0].id}`);
    if (singleRes.ok) {
      const detail = await singleRes.json();
      console.log('Single system response keys:', Object.keys(detail as Record<string, unknown>));
      console.log('Full response:', JSON.stringify(detail, null, 2).slice(0, 1000));
    } else {
      console.log(`Single system endpoint returned ${singleRes.status}`);
    }
  } catch (e) {
    console.log('Single system endpoint failed:', (e as Error).message);
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
