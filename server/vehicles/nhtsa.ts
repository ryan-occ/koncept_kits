/**
 * Weekly check of NHTSA's free vehicle database (vPIC) for new model years of
 * the models the app already knows. New entries extend the form menus.
 *
 * Model names NHTSA lists that the catalog lacks are not added automatically:
 * many are engine variants (e.g. BMW 530i, 540i, M340i) that would flood the
 * menus with near-duplicates. New cars are added by hand, with research.
 * US-market coverage only.
 */
import { canonicalName, type VehicleCatalog } from "../../shared/vehicles";
import type { CatalogEntry } from "./store";

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";
const VEHICLE_TYPES = ["car", "mpv", "truck"] as const;

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export async function fetchModelNames(make: string, year: number, fetcher: FetchLike = fetch): Promise<string[]> {
  const names = new Set<string>();
  for (const type of VEHICLE_TYPES) {
    const url = `${BASE}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${type}?format=json`;
    const res = await fetcher(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`NHTSA returned ${res.status} for ${make} ${year}.`);
    const body = await res.json() as { Results?: Array<{ Model_Name?: unknown }> };
    for (const r of body.Results ?? []) {
      if (typeof r.Model_Name === "string" && r.Model_Name.trim()) names.add(r.Model_Name.trim());
    }
  }
  return [...names];
}

/**
 * New model years NHTSA lists for models the catalog already has. Names match
 * case-insensitively and keep the catalog's spelling (NHTSA often uses capitals).
 */
export function newEntries(catalog: VehicleCatalog, make: string, year: number, nhtsaModels: string[]): CatalogEntry[] {
  const models = catalog[make] ?? {};
  const out: CatalogEntry[] = [];
  for (const raw of nhtsaModels) {
    const model = canonicalName(Object.keys(models), raw);
    if (!model || models[model]!.includes(year)) continue;
    if (out.some(e => e.model === model)) continue;
    out.push({ make, model, year, source: "nhtsa" });
  }
  return out;
}

/** Current and next model year: new model years are listed months before January. */
export function yearsToCheck(now = new Date()): number[] {
  const y = now.getUTCFullYear();
  return [y, y + 1];
}

export async function findNewModels(
  catalog: VehicleCatalog,
  options: { fetcher?: FetchLike; years?: number[]; pauseMs?: number } = {},
): Promise<{ entries: CatalogEntry[]; errors: string[] }> {
  const entries: CatalogEntry[] = [];
  const errors: string[] = [];
  for (const make of Object.keys(catalog)) {
    for (const year of options.years ?? yearsToCheck()) {
      try {
        entries.push(...newEntries(catalog, make, year, await fetchModelNames(make, year, options.fetcher)));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
      // Be gentle with a free public service.
      if (options.pauseMs) await new Promise(resolve => setTimeout(resolve, options.pauseMs));
    }
  }
  return { entries, errors };
}
