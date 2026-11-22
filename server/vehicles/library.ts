/**
 * The vehicle library service: merged catalog, generation profiles with
 * background research, reference photos, and the weekly NHTSA check.
 */
import type { AiProvider, Img } from "../ai";
import { StudioError } from "../studio";
import {
  canonicalName, isProfileStale, mergeCatalog,
  type VehicleCatalogDto, type VehiclePhotoView, type VehicleProfileDto, type VehicleProfileEdit, type VehicleRef,
} from "../../shared/vehicles";
import { CAR_DB } from "../../shared/catalog";
import { findNewModels, type FetchLike } from "./nhtsa";
import { researchVehicle } from "./research";
import type { ProfileRow, VehicleStore } from "./store";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** What a verified profile contributes to a drawing. */
export interface DrawingProfile {
  generation: string | null;
  yearFrom: number;
  yearTo: number;
  dimensions: ProfileRow["dimensions"];
  signatureCues: string[];
  faceliftNotes: string | null;
  photos: Array<Img & { view: VehiclePhotoView }>;
}

export interface LibraryOptions {
  fetcher?: FetchLike;
  /** Pause between NHTSA requests. */
  pauseMs?: number;
  onUsage?: (inputTokens: number, outputTokens: number) => Promise<void>;
}

export class VehicleLibrary {
  private research = new Map<number, { state: "running" | "failed"; error?: string; promise: Promise<void> }>();
  private syncPromise: Promise<void> | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(readonly store: VehicleStore, private readonly ai: AiProvider, private readonly options: LibraryOptions = {}) {}

  // ─── Catalog ──────────────────────────────────────────────────────────────

  async catalog(): Promise<VehicleCatalogDto> {
    const entries = await this.store.listCatalogEntries();
    const sync = await this.store.getSyncState();
    return {
      catalog: mergeCatalog(entries),
      added: mergeCatalog(entries, {}),
      sync: {
        state: this.syncPromise ? "running" : "idle",
        lastRunAt: sync.lastRunAt ? new Date(sync.lastRunAt).toISOString() : null,
        lastAdded: sync.lastAdded,
        lastError: sync.lastError,
      },
    };
  }

  async isKnown(make: string, model: string, year: number): Promise<boolean> {
    if (CAR_DB[make]?.[model]?.includes(year)) return true;
    return (await this.store.listCatalogEntries()).some(e => e.make === make && e.model === model && e.year === year);
  }

  /** Adds a car the built-in list lacks, reusing existing spellings, and starts researching it. */
  async addCar(car: VehicleRef): Promise<{ car: VehicleRef; profile: VehicleProfileDto }> {
    const merged = mergeCatalog(await this.store.listCatalogEntries());
    const make = canonicalName(Object.keys(merged), car.make) ?? car.make.trim();
    const model = canonicalName(Object.keys(merged[make] ?? {}), car.model) ?? car.model.trim();
    const saved = { make, model, year: car.year };
    if (!merged[make]?.[model]?.includes(car.year)) await this.store.addCatalogEntries([{ ...saved, source: "manual" }]);
    const existing = await this.store.findProfile(make, model, car.year);
    return { car: saved, profile: existing ? await this.dto(existing) : await this.startResearch(saved) };
  }

  // ─── Profiles ─────────────────────────────────────────────────────────────

  async listProfiles(): Promise<VehicleProfileDto[]> {
    return Promise.all((await this.store.listProfiles()).map(p => this.dto(p)));
  }

  async findProfile(car: VehicleRef): Promise<VehicleProfileDto | null> {
    const row = await this.store.findProfile(car.make, car.model, car.year);
    return row ? this.dto(row) : null;
  }

  /** Researches the generation covering this car: refreshes the existing profile, or creates one. */
  async startResearch(car: VehicleRef): Promise<VehicleProfileDto> {
    let row = await this.store.findProfile(car.make, car.model, car.year);
    if (row && this.research.get(row.id)?.state === "running") return this.dto(row);
    row ??= await this.store.createProfile({
      make: car.make, model: car.model, yearFrom: car.year, yearTo: car.year, generation: null,
      dimensions: { lengthMm: null, widthMm: null, heightMm: null, wheelbaseMm: null },
      signatureCues: [], faceliftNotes: null, sources: [], status: "researched", origin: "ai", checkedAt: null,
    });
    const id = row.id;
    const entry = { state: "running" as "running" | "failed", error: undefined as string | undefined, promise: Promise.resolve() };
    this.research.set(id, entry);
    entry.promise = (async () => {
      try {
        const found = await researchVehicle(this.ai, car);
        await this.options.onUsage?.(found.inputTokens, found.outputTokens);
        console.log(`[vehicles] researched ${car.year} ${car.make} ${car.model}${found.webSearch ? " (web)" : ""}: ${found.inputTokens} in / ${found.outputTokens} out tokens`);
        // A new answer is a draft again until the user re-verifies it.
        await this.store.updateProfile(id, {
          yearFrom: found.yearFrom, yearTo: found.yearTo, generation: found.generation, dimensions: found.dimensions,
          signatureCues: found.signatureCues, faceliftNotes: found.faceliftNotes, sources: found.sources,
          status: "researched", origin: "ai", checkedAt: new Date(),
        });
        this.research.delete(id);
      } catch (error) {
        entry.state = "failed";
        entry.error = error instanceof Error ? error.message : String(error);
        console.error(`[vehicles] research failed for ${car.year} ${car.make} ${car.model}:`, entry.error);
      }
    })();
    return this.dto(row);
  }

  async refresh(id: number): Promise<VehicleProfileDto> {
    const row = await this.requireProfile(id);
    return this.startResearch({ make: row.make, model: row.model, year: row.yearTo });
  }

  async edit(id: number, edit: VehicleProfileEdit): Promise<VehicleProfileDto> {
    this.assertNotResearching(id);
    const row = await this.requireProfile(id);
    // Any manual change is a new draft; the user verifies it explicitly.
    const updated = await this.store.updateProfile(row.id, { ...edit, status: "researched", origin: "manual" });
    return this.dto(updated!);
  }

  async verify(id: number): Promise<VehicleProfileDto> {
    this.assertNotResearching(id);
    const row = await this.requireProfile(id);
    const updated = await this.store.updateProfile(row.id, { status: "verified", checkedAt: row.checkedAt ?? new Date() });
    return this.dto(updated!);
  }

  async deleteProfile(id: number): Promise<void> {
    this.assertNotResearching(id);
    if (!(await this.store.deleteProfile(id))) throw new StudioError("Vehicle profile not found.", 404, "NOT_FOUND");
    this.research.delete(id);
  }

  async addPhoto(id: number, view: VehiclePhotoView, image: Img): Promise<VehicleProfileDto> {
    const row = await this.requireProfile(id);
    const existing = await this.store.listPhotos(id);
    if (existing.length >= 8) throw new StudioError("A profile can hold up to 8 photos. Remove one first.", 409, "TOO_MANY_PHOTOS");
    await this.store.addPhoto(row.id, view, image);
    return this.dto(row);
  }

  async deletePhoto(photoId: number): Promise<void> {
    if (!(await this.store.deletePhoto(photoId))) throw new StudioError("Photo not found.", 404, "NOT_FOUND");
  }

  /** Verified profile for the build's car, with up to one photo per view. Unverified drafts are never used. */
  async forDrawing(car: VehicleRef): Promise<DrawingProfile | null> {
    const row = await this.store.findProfile(car.make, car.model, car.year);
    if (!row || row.status !== "verified") return null;
    const photos = await this.store.listPhotos(row.id, true);
    const byView = new Map<VehiclePhotoView, Img & { view: VehiclePhotoView }>();
    for (const p of photos) if (!byView.has(p.view)) byView.set(p.view, { data: p.data, mime: p.mime, view: p.view });
    return {
      generation: row.generation, yearFrom: row.yearFrom, yearTo: row.yearTo, dimensions: row.dimensions,
      signatureCues: row.signatureCues, faceliftNotes: row.faceliftNotes, photos: [...byView.values()],
    };
  }

  /** Resolves when research for the profile (if any) finishes. Used by tests. */
  async waitForResearch(id: number) {
    await this.research.get(id)?.promise;
  }

  // ─── NHTSA ────────────────────────────────────────────────────────────────

  syncNow(): Promise<void> {
    this.syncPromise ??= (async () => {
      try {
        const merged = mergeCatalog(await this.store.listCatalogEntries());
        const { entries, errors } = await findNewModels(merged, { fetcher: this.options.fetcher, pauseMs: this.options.pauseMs ?? 250 });
        const added = await this.store.addCatalogEntries(entries);
        await this.store.putSyncState({
          lastRunAt: new Date(), lastAdded: added,
          lastError: errors.length ? `${errors.length} request(s) failed, e.g. ${errors[0]}` : null,
        });
        console.log(`[vehicles] NHTSA check added ${added} model year(s)${errors.length ? `, ${errors.length} request(s) failed` : ""}`);
      } catch (error) {
        const prev = await this.store.getSyncState();
        await this.store.putSyncState({ ...prev, lastRunAt: new Date(), lastError: error instanceof Error ? error.message : String(error) });
      } finally {
        this.syncPromise = null;
      }
    })();
    return this.syncPromise;
  }

  /** Checks once an hour whether a week has passed since the last NHTSA check. */
  startSchedule() {
    const tick = async () => {
      const { lastRunAt } = await this.store.getSyncState();
      if (!lastRunAt || Date.now() - new Date(lastRunAt).getTime() > WEEK_MS) void this.syncNow();
    };
    setTimeout(() => void tick().catch(() => {}), 60_000).unref();
    this.timer = setInterval(() => void tick().catch(() => {}), 60 * 60 * 1000);
    this.timer.unref();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async dto(row: ProfileRow): Promise<VehicleProfileDto> {
    const photos = await this.store.listPhotos(row.id);
    const research = this.research.get(row.id);
    return {
      id: row.id, make: row.make, model: row.model, yearFrom: row.yearFrom, yearTo: row.yearTo,
      generation: row.generation, dimensions: row.dimensions, signatureCues: row.signatureCues,
      faceliftNotes: row.faceliftNotes, sources: row.sources, status: row.status, origin: row.origin,
      checkedAt: row.checkedAt ? new Date(row.checkedAt).toISOString() : null,
      stale: isProfileStale(row.checkedAt),
      photos: photos.map(p => ({ id: p.id, view: p.view, url: `/api/vehicles/photos/${p.id}` })),
      research: research ? { state: research.state, ...(research.error ? { error: research.error } : {}) } : { state: "idle" },
    };
  }

  private async requireProfile(id: number): Promise<ProfileRow> {
    const row = await this.store.getProfile(id);
    if (!row) throw new StudioError("Vehicle profile not found.", 404, "NOT_FOUND");
    return row;
  }

  private assertNotResearching(id: number) {
    if (this.research.get(id)?.state === "running") {
      throw new StudioError("This car is still being researched. Try again when it finishes.", 409, "RESEARCH_RUNNING");
    }
  }
}
