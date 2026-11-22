/**
 * Vehicle library: cars the app has learned about beyond the built-in catalog.
 *
 * - Extra catalog entries (make / model / year) come from the weekly NHTSA check
 *   or from the user adding a car by hand; they extend the form's menus.
 * - A profile describes one generation of a model (year range): dimensions,
 *   signature design details, facelift notes, sources and reference photos.
 *   Profiles are researched by AI, and only feed drawings once the user has
 *   verified them.
 */
import { z } from "zod";
import { CAR_DB } from "./catalog";

export const VEHICLE_PHOTO_VIEWS = ["side", "front", "rear", "three-quarter"] as const;
export type VehiclePhotoView = (typeof VEHICLE_PHOTO_VIEWS)[number];
export const VEHICLE_PHOTO_VIEW_LABELS: Record<VehiclePhotoView, string> = {
  side: "Side", front: "Front", rear: "Rear", "three-quarter": "3/4",
};

/** Profiles older than this are flagged for a manual refresh. */
export const PROFILE_STALE_DAYS = 365;

export type VehicleCatalog = Record<string, Record<string, number[]>>;

export interface VehicleDimensions {
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;
}

export interface VehicleSource { title: string; url: string }

export interface VehiclePhotoDto { id: number; view: VehiclePhotoView; url: string }

export interface VehicleProfileDto {
  id: number;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  generation: string | null;
  dimensions: VehicleDimensions;
  signatureCues: string[];
  faceliftNotes: string | null;
  sources: VehicleSource[];
  status: "researched" | "verified";
  origin: "ai" | "manual";
  checkedAt: string | null;
  stale: boolean;
  photos: VehiclePhotoDto[];
  research: { state: "idle" | "running" | "failed"; error?: string };
}

export interface VehicleSyncDto {
  state: "idle" | "running";
  lastRunAt: string | null;
  lastAdded: number | null;
  lastError: string | null;
}

export interface VehicleCatalogDto {
  catalog: VehicleCatalog;
  /** Make → model → years that came from the library rather than the built-in list. */
  added: VehicleCatalog;
  sync: VehicleSyncDto;
}

const name = (max: number) => z.string().trim().min(1).max(max);
const year = z.number().int().min(1900).max(2100);
const mm = z.number().int().min(500).max(20_000).nullable();

export const VehicleRefSchema = z.object({ make: name(60), model: name(80), year }).strict();
export type VehicleRef = z.infer<typeof VehicleRefSchema>;

export const VehicleProfileEditSchema = z.object({
  yearFrom: year,
  yearTo: year,
  generation: z.string().trim().max(80).nullable(),
  dimensions: z.object({ lengthMm: mm, widthMm: mm, heightMm: mm, wheelbaseMm: mm }).strict(),
  signatureCues: z.array(z.string().trim().min(1).max(200)).max(8),
  faceliftNotes: z.string().trim().max(1000).nullable(),
}).strict().refine(p => p.yearFrom <= p.yearTo, { message: "Year from must not be after year to.", path: ["yearTo"] });
export type VehicleProfileEdit = z.infer<typeof VehicleProfileEditSchema>;

/** Built-in catalog plus library additions, years sorted and de-duplicated. */
export function mergeCatalog(extra: Array<{ make: string; model: string; year: number }>, base: VehicleCatalog = CAR_DB): VehicleCatalog {
  const out: VehicleCatalog = {};
  for (const [make, models] of Object.entries(base)) {
    out[make] = Object.fromEntries(Object.entries(models).map(([model, years]) => [model, [...years]]));
  }
  for (const { make, model, year: y } of extra) {
    const models = (out[make] ??= {});
    const years = (models[model] ??= []);
    if (!years.includes(y)) years.push(y);
  }
  for (const models of Object.values(out)) for (const years of Object.values(models)) years.sort((a, b) => a - b);
  return out;
}

/** Case-insensitive lookup of an existing make or model name, so new entries reuse the catalog's spelling. */
export function canonicalName(candidates: Iterable<string>, value: string): string | null {
  const wanted = value.trim().toLocaleLowerCase();
  for (const candidate of candidates) if (candidate.toLocaleLowerCase() === wanted) return candidate;
  return null;
}

export function isProfileStale(checkedAt: Date | string | null, now = new Date()): boolean {
  if (!checkedAt) return false;
  return now.getTime() - new Date(checkedAt).getTime() > PROFILE_STALE_DAYS * 24 * 60 * 60 * 1000;
}
