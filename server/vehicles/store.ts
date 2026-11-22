/**
 * Storage for the vehicle library: extra catalog entries, generation profiles,
 * reference photos (bytea) and the NHTSA sync state.
 */
import pg from "pg";
import type { VehicleDimensions, VehiclePhotoView, VehicleSource } from "../../shared/vehicles";

export interface CatalogEntry { make: string; model: string; year: number; source: "nhtsa" | "manual" }

export interface ProfileRow {
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
  checkedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProfileFields = Omit<ProfileRow, "id" | "createdAt" | "updatedAt">;

export interface PhotoRow { id: number; profileId: number; view: VehiclePhotoView; data: Buffer; mime: string; createdAt: Date }

export interface SyncState { lastRunAt: Date | null; lastAdded: number | null; lastError: string | null }

export interface VehicleStore {
  init(): Promise<void>;
  listCatalogEntries(): Promise<CatalogEntry[]>;
  /** Inserts entries that are not stored yet; returns how many were new. */
  addCatalogEntries(entries: CatalogEntry[]): Promise<number>;
  listProfiles(): Promise<ProfileRow[]>;
  getProfile(id: number): Promise<ProfileRow | null>;
  /** The profile whose year range covers the year (latest-updated wins). */
  findProfile(make: string, model: string, year: number): Promise<ProfileRow | null>;
  createProfile(fields: ProfileFields): Promise<ProfileRow>;
  updateProfile(id: number, patch: Partial<ProfileFields>): Promise<ProfileRow | null>;
  deleteProfile(id: number): Promise<boolean>;
  listPhotos(profileId: number, withData?: boolean): Promise<PhotoRow[]>;
  getPhoto(id: number): Promise<PhotoRow | null>;
  addPhoto(profileId: number, view: VehiclePhotoView, image: { data: Buffer; mime: string }): Promise<PhotoRow>;
  deletePhoto(id: number): Promise<boolean>;
  getSyncState(): Promise<SyncState>;
  putSyncState(state: SyncState): Promise<void>;
}

const sameCar = (a: { make: string; model: string }, make: string, model: string) =>
  a.make.toLocaleLowerCase() === make.toLocaleLowerCase() && a.model.toLocaleLowerCase() === model.toLocaleLowerCase();

const byNewest = (a: ProfileRow, b: ProfileRow) => b.updatedAt.getTime() - a.updatedAt.getTime();

export class MemoryVehicleStore implements VehicleStore {
  private seq = 1;
  private entries: CatalogEntry[] = [];
  private profiles = new Map<number, ProfileRow>();
  private photos: PhotoRow[] = [];
  private sync: SyncState = { lastRunAt: null, lastAdded: null, lastError: null };

  async init() {}
  async listCatalogEntries() { return [...this.entries]; }
  async addCatalogEntries(entries: CatalogEntry[]) {
    let added = 0;
    for (const entry of entries) {
      if (this.entries.some(e => sameCar(e, entry.make, entry.model) && e.year === entry.year)) continue;
      this.entries.push(entry);
      added++;
    }
    return added;
  }
  async listProfiles() { return [...this.profiles.values()].sort(byNewest); }
  async getProfile(id: number) { return this.profiles.get(id) ?? null; }
  async findProfile(make: string, model: string, year: number) {
    return [...this.profiles.values()]
      .filter(p => sameCar(p, make, model) && p.yearFrom <= year && year <= p.yearTo)
      .sort(byNewest)[0] ?? null;
  }
  async createProfile(fields: ProfileFields) {
    const now = new Date();
    const row: ProfileRow = { ...fields, id: this.seq++, createdAt: now, updatedAt: now };
    this.profiles.set(row.id, row);
    return row;
  }
  async updateProfile(id: number, patch: Partial<ProfileFields>) {
    const row = this.profiles.get(id);
    if (!row) return null;
    // Strictly later than the previous update, so "latest wins" is stable in fast tests.
    const updatedAt = new Date(Math.max(Date.now(), row.updatedAt.getTime() + 1));
    const next = { ...row, ...patch, updatedAt };
    this.profiles.set(id, next);
    return next;
  }
  async deleteProfile(id: number) {
    this.photos = this.photos.filter(p => p.profileId !== id);
    return this.profiles.delete(id);
  }
  async listPhotos(profileId: number) { return this.photos.filter(p => p.profileId === profileId); }
  async getPhoto(id: number) { return this.photos.find(p => p.id === id) ?? null; }
  async addPhoto(profileId: number, view: VehiclePhotoView, image: { data: Buffer; mime: string }) {
    const row: PhotoRow = { id: this.seq++, profileId, view, ...image, createdAt: new Date() };
    this.photos.push(row);
    return row;
  }
  async deletePhoto(id: number) {
    const before = this.photos.length;
    this.photos = this.photos.filter(p => p.id !== id);
    return this.photos.length < before;
  }
  async getSyncState() { return { ...this.sync }; }
  async putSyncState(state: SyncState) { this.sync = { ...state }; }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS vehicle_catalog_entries (
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('nhtsa', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (make, model, year)
);
CREATE UNIQUE INDEX IF NOT EXISTS vehicle_catalog_entries_ci_idx ON vehicle_catalog_entries (lower(make), lower(model), year);
CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id SERIAL PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_from INTEGER NOT NULL,
  year_to INTEGER NOT NULL,
  generation TEXT,
  dimensions JSONB NOT NULL,
  signature_cues JSONB NOT NULL DEFAULT '[]',
  facelift_notes TEXT,
  sources JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('researched', 'verified')),
  origin TEXT NOT NULL CHECK (origin IN ('ai', 'manual')),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vehicle_profiles_car_idx ON vehicle_profiles (lower(make), lower(model), year_from, year_to);
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES vehicle_profiles(id) ON DELETE CASCADE,
  view TEXT NOT NULL,
  data BYTEA NOT NULL,
  mime TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS vehicle_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_run_at TIMESTAMPTZ,
  last_added INTEGER,
  last_error TEXT
);
`;

type Row = Record<string, any>;
const profile = (r: Row): ProfileRow => ({
  id: r.id, make: r.make, model: r.model, yearFrom: r.year_from, yearTo: r.year_to, generation: r.generation,
  dimensions: r.dimensions, signatureCues: r.signature_cues, faceliftNotes: r.facelift_notes, sources: r.sources,
  status: r.status, origin: r.origin, checkedAt: r.checked_at, createdAt: r.created_at, updatedAt: r.updated_at,
});
const photo = (r: Row): PhotoRow => ({
  id: r.id, profileId: r.profile_id, view: r.view, data: r.data ?? Buffer.alloc(0), mime: r.mime, createdAt: r.created_at,
});
const COLUMNS: Record<keyof ProfileFields, string> = {
  make: "make", model: "model", yearFrom: "year_from", yearTo: "year_to", generation: "generation",
  dimensions: "dimensions", signatureCues: "signature_cues", faceliftNotes: "facelift_notes", sources: "sources",
  status: "status", origin: "origin", checkedAt: "checked_at",
};
const JSON_FIELDS = new Set<keyof ProfileFields>(["dimensions", "signatureCues", "sources"]);
const dbValue = (key: keyof ProfileFields, value: unknown) => (JSON_FIELDS.has(key) ? JSON.stringify(value) : value);

export class PostgresVehicleStore implements VehicleStore {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 3 });
    this.pool.on("error", error => console.error("[vehicles db] idle client error", error));
  }

  private async q(sql: string, params: unknown[] = []): Promise<Row[]> {
    return (await this.pool.query(sql, params)).rows;
  }

  async init() { await this.pool.query(SCHEMA); }

  async listCatalogEntries() {
    return (await this.q("SELECT make, model, year, source FROM vehicle_catalog_entries ORDER BY make, model, year"))
      .map(r => ({ make: r.make, model: r.model, year: r.year, source: r.source }));
  }
  async addCatalogEntries(entries: CatalogEntry[]) {
    let added = 0;
    for (const e of entries) {
      const rows = await this.q(
        `INSERT INTO vehicle_catalog_entries (make, model, year, source) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING RETURNING make`,
        [e.make, e.model, e.year, e.source],
      );
      added += rows.length;
    }
    return added;
  }
  async listProfiles() { return (await this.q("SELECT * FROM vehicle_profiles ORDER BY updated_at DESC")).map(profile); }
  async getProfile(id: number) {
    const [row] = await this.q("SELECT * FROM vehicle_profiles WHERE id = $1", [id]);
    return row ? profile(row) : null;
  }
  async findProfile(make: string, model: string, year: number) {
    const [row] = await this.q(
      `SELECT * FROM vehicle_profiles WHERE lower(make) = lower($1) AND lower(model) = lower($2)
       AND year_from <= $3 AND year_to >= $3 ORDER BY updated_at DESC LIMIT 1`,
      [make, model, year],
    );
    return row ? profile(row) : null;
  }
  async createProfile(fields: ProfileFields) {
    const keys = Object.keys(COLUMNS) as Array<keyof ProfileFields>;
    const [row] = await this.q(
      `INSERT INTO vehicle_profiles (${keys.map(k => COLUMNS[k]).join(", ")})
       VALUES (${keys.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      keys.map(k => dbValue(k, fields[k])),
    );
    return profile(row);
  }
  async updateProfile(id: number, patch: Partial<ProfileFields>) {
    const keys = (Object.keys(patch) as Array<keyof ProfileFields>).filter(k => k in COLUMNS);
    if (!keys.length) return this.getProfile(id);
    const [row] = await this.q(
      `UPDATE vehicle_profiles SET ${keys.map((k, i) => `${COLUMNS[k]} = $${i + 2}`).join(", ")}, updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, ...keys.map(k => dbValue(k, patch[k]))],
    );
    return row ? profile(row) : null;
  }
  async deleteProfile(id: number) {
    return (await this.pool.query("DELETE FROM vehicle_profiles WHERE id = $1", [id])).rowCount === 1;
  }
  async listPhotos(profileId: number, withData = false) {
    const cols = withData ? "*" : "id, profile_id, view, mime, created_at";
    return (await this.q(`SELECT ${cols} FROM vehicle_photos WHERE profile_id = $1 ORDER BY id`, [profileId])).map(photo);
  }
  async getPhoto(id: number) {
    const [row] = await this.q("SELECT * FROM vehicle_photos WHERE id = $1", [id]);
    return row ? photo(row) : null;
  }
  async addPhoto(profileId: number, view: VehiclePhotoView, image: { data: Buffer; mime: string }) {
    const [row] = await this.q(
      "INSERT INTO vehicle_photos (profile_id, view, data, mime) VALUES ($1, $2, $3, $4) RETURNING *",
      [profileId, view, image.data, image.mime],
    );
    return photo(row);
  }
  async deletePhoto(id: number) {
    return (await this.pool.query("DELETE FROM vehicle_photos WHERE id = $1", [id])).rowCount === 1;
  }
  async getSyncState() {
    const [row] = await this.q("SELECT last_run_at, last_added, last_error FROM vehicle_sync_state WHERE id = 1");
    return { lastRunAt: row?.last_run_at ?? null, lastAdded: row?.last_added ?? null, lastError: row?.last_error ?? null };
  }
  async putSyncState(state: SyncState) {
    await this.q(
      `INSERT INTO vehicle_sync_state (id, last_run_at, last_added, last_error) VALUES (1, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET last_run_at = EXCLUDED.last_run_at, last_added = EXCLUDED.last_added, last_error = EXCLUDED.last_error`,
      [state.lastRunAt, state.lastAdded, state.lastError],
    );
  }
}

export function createVehicleStore(databaseUrl: string | null): VehicleStore {
  return databaseUrl ? new PostgresVehicleStore(databaseUrl) : new MemoryVehicleStore();
}
