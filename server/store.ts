/**
 * Persistence for a single-user studio: builds, one current drawing set per
 * build (with per-view revisions), renders, cached part specs and image usage.
 * Images live in Postgres as bytea — no object-storage sidecar needed.
 */
import pg from "pg";
import {
  favoriteVehicleKey, type BuildConfig, type DrawingKey, type FavoriteVehicle, type FavoriteVehicleImportResult, type RenderAngle,
} from "../shared/types";
import type { PartSpec } from "./domain/part-specs";

export interface BuildRow {
  id: number;
  name: string;
  config: BuildConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface DrawingSetRow {
  id: number;
  buildId: number;
  configSignature: string;
  status: "draft" | "approved";
  notes: string | null;
  approvedAt: Date | null;
  createdAt: Date;
}

export interface DrawingRow {
  setId: number;
  view: DrawingKey;
  revision: number;
  data: Buffer;
  mime: string;
  updatedAt: Date;
}

export interface RenderRow {
  id: number;
  buildId: number;
  setId: number;
  angle: RenderAngle;
  data: Buffer;
  mime: string;
  createdAt: Date;
}

export interface PartSpecCache {
  signature: string;
  specs: PartSpec[];
  source: "ai" | "estimate";
}

export interface Store {
  readonly kind: "postgres" | "memory";
  init(): Promise<void>;
  listBuilds(): Promise<BuildRow[]>;
  getBuild(id: number): Promise<BuildRow | null>;
  createBuild(name: string, config: BuildConfig): Promise<BuildRow>;
  updateBuild(id: number, patch: { name?: string; config?: BuildConfig }): Promise<BuildRow | null>;
  deleteBuild(id: number): Promise<boolean>;
  listFavoriteGroups(): Promise<string[]>;
  createFavoriteGroup(name: string): Promise<string>;
  listFavoriteVehicles(): Promise<FavoriteVehicle[]>;
  saveFavoriteVehicle(favorite: FavoriteVehicle): Promise<FavoriteVehicle>;
  deleteFavoriteVehicle(favorite: FavoriteVehicle): Promise<boolean>;
  importFavoriteBundle(groups: string[], favorites: FavoriteVehicle[]): Promise<FavoriteVehicleImportResult>;

  /** Replaces any existing set (and its renders) for the build. */
  createDrawingSet(buildId: number, configSignature: string): Promise<DrawingSetRow>;
  getDrawingSet(buildId: number): Promise<DrawingSetRow | null>;
  updateDrawingSet(setId: number, patch: Partial<Pick<DrawingSetRow, "status" | "notes" | "approvedAt">>): Promise<void>;
  putDrawing(setId: number, view: DrawingKey, image: { data: Buffer; mime: string }): Promise<DrawingRow>;
  listDrawings(setId: number, withData?: boolean): Promise<DrawingRow[]>;
  getDrawing(setId: number, view: DrawingKey): Promise<DrawingRow | null>;

  addRender(buildId: number, setId: number, angle: RenderAngle, image: { data: Buffer; mime: string }): Promise<RenderRow>;
  /** Latest render per angle for the build's current set. */
  latestRenders(buildId: number, setId: number, withData?: boolean): Promise<RenderRow[]>;
  getRender(id: number): Promise<RenderRow | null>;

  getPartSpecs(buildId: number): Promise<PartSpecCache | null>;
  putPartSpecs(buildId: number, cache: PartSpecCache): Promise<void>;

  recordUsage(kind: "drawing" | "render" | "spec", inputTokens: number, outputTokens: number): Promise<void>;
  imagesSince(since: Date): Promise<number>;
}

// ─── In-memory (local dev without DATABASE_URL, and tests) ──────────────────

export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private seq = 1;
  private builds = new Map<number, BuildRow>();
  private sets = new Map<number, DrawingSetRow>();
  private drawings: DrawingRow[] = [];
  private renders: RenderRow[] = [];
  private specs = new Map<number, PartSpecCache>();
  private favoriteVehicles = new Map<string, FavoriteVehicle>();
  private favoriteGroups = new Map<string, string>([["favorites", "Favorites"]]);
  private usage: Array<{ kind: string; at: Date }> = [];

  async init() {}

  async listBuilds() {
    return [...this.builds.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  async getBuild(id: number) { return this.builds.get(id) ?? null; }
  async createBuild(name: string, config: BuildConfig) {
    const now = new Date();
    const row = { id: this.seq++, name, config, createdAt: now, updatedAt: now };
    this.builds.set(row.id, row);
    return row;
  }
  async updateBuild(id: number, patch: { name?: string; config?: BuildConfig }) {
    const row = this.builds.get(id);
    if (!row) return null;
    const next = { ...row, ...patch, updatedAt: new Date() };
    this.builds.set(id, next);
    return next;
  }
  async deleteBuild(id: number) {
    const existed = this.builds.delete(id);
    for (const set of [...this.sets.values()].filter(s => s.buildId === id)) this.dropSet(set.id);
    this.specs.delete(id);
    return existed;
  }
  async listFavoriteVehicles() {
    return [...this.favoriteVehicles.values()].sort((a, b) =>
      `${a.groupName ?? "Favorites"} ${a.make} ${a.model} ${a.year} ${a.trim ?? ""}`.localeCompare(`${b.groupName ?? "Favorites"} ${b.make} ${b.model} ${b.year} ${b.trim ?? ""}`),
    );
  }
  async listFavoriteGroups() {
    return [...this.favoriteGroups.values()].sort((a, b) => a.localeCompare(b));
  }
  async createFavoriteGroup(name: string) {
    const normalizedName = name.trim();
    const key = normalizedName.toLocaleLowerCase();
    const existing = this.favoriteGroups.get(key);
    if (existing) return existing;
    this.favoriteGroups.set(key, normalizedName);
    return normalizedName;
  }
  async saveFavoriteVehicle(favorite: FavoriteVehicle) {
    const saved = { ...favorite, groupName: favorite.groupName ?? "Favorites" };
    this.favoriteVehicles.set(favoriteVehicleKey(saved), saved);
    return saved;
  }
  async deleteFavoriteVehicle(favorite: FavoriteVehicle) {
    const key = favoriteVehicleKey(favorite);
    const existing = this.favoriteVehicles.get(key);
    if (!existing || (existing.groupName ?? "Favorites") !== (favorite.groupName ?? "Favorites")) return false;
    return this.favoriteVehicles.delete(key);
  }
  async importFavoriteBundle(groups: string[], favorites: FavoriteVehicle[]) {
    for (const name of groups) await this.createFavoriteGroup(name);
    for (const favorite of favorites) await this.saveFavoriteVehicle(favorite);
    return { importedCount: favorites.length, groups: await this.listFavoriteGroups(), favorites: await this.listFavoriteVehicles() };
  }
  private dropSet(setId: number) {
    this.sets.delete(setId);
    this.drawings = this.drawings.filter(d => d.setId !== setId);
    this.renders = this.renders.filter(r => r.setId !== setId);
  }
  async createDrawingSet(buildId: number, configSignature: string) {
    for (const set of [...this.sets.values()].filter(s => s.buildId === buildId)) this.dropSet(set.id);
    const row: DrawingSetRow = {
      id: this.seq++, buildId, configSignature, status: "draft", notes: null, approvedAt: null, createdAt: new Date(),
    };
    this.sets.set(row.id, row);
    return row;
  }
  async getDrawingSet(buildId: number) {
    return [...this.sets.values()].find(s => s.buildId === buildId) ?? null;
  }
  async updateDrawingSet(setId: number, patch: Partial<Pick<DrawingSetRow, "status" | "notes" | "approvedAt">>) {
    const row = this.sets.get(setId);
    if (row) this.sets.set(setId, { ...row, ...patch });
  }
  async putDrawing(setId: number, view: DrawingKey, image: { data: Buffer; mime: string }) {
    const existing = this.drawings.find(d => d.setId === setId && d.view === view);
    const row: DrawingRow = { setId, view, revision: (existing?.revision ?? 0) + 1, ...image, updatedAt: new Date() };
    this.drawings = [...this.drawings.filter(d => d !== existing), row];
    return row;
  }
  async listDrawings(setId: number) { return this.drawings.filter(d => d.setId === setId); }
  async getDrawing(setId: number, view: DrawingKey) {
    return this.drawings.find(d => d.setId === setId && d.view === view) ?? null;
  }
  async addRender(buildId: number, setId: number, angle: RenderAngle, image: { data: Buffer; mime: string }) {
    const row: RenderRow = { id: this.seq++, buildId, setId, angle, ...image, createdAt: new Date() };
    this.renders.push(row);
    return row;
  }
  async latestRenders(buildId: number, setId: number) {
    const latest = new Map<RenderAngle, RenderRow>();
    for (const row of this.renders) {
      if (row.buildId === buildId && row.setId === setId) latest.set(row.angle, row);
    }
    return [...latest.values()];
  }
  async getRender(id: number) { return this.renders.find(r => r.id === id) ?? null; }
  async getPartSpecs(buildId: number) { return this.specs.get(buildId) ?? null; }
  async putPartSpecs(buildId: number, cache: PartSpecCache) { this.specs.set(buildId, cache); }
  async recordUsage(kind: "drawing" | "render" | "spec") { this.usage.push({ kind, at: new Date() }); }
  async imagesSince(since: Date) {
    return this.usage.filter(u => u.kind !== "spec" && u.at >= since).length;
  }
}

// ─── Postgres (Replit) ──────────────────────────────────────────────────────

const SCHEMA = `
CREATE TABLE IF NOT EXISTS builds (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  part_specs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS drawing_sets (
  id SERIAL PRIMARY KEY,
  build_id INTEGER NOT NULL UNIQUE REFERENCES builds(id) ON DELETE CASCADE,
  config_signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS drawings (
  set_id INTEGER NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  view TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  data BYTEA NOT NULL,
  mime TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (set_id, view)
);
CREATE TABLE IF NOT EXISTS renders (
  id SERIAL PRIMARY KEY,
  build_id INTEGER NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  set_id INTEGER NOT NULL REFERENCES drawing_sets(id) ON DELETE CASCADE,
  angle TEXT NOT NULL,
  data BYTEA NOT NULL,
  mime TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS renders_build_set_idx ON renders (build_id, set_id, angle, created_at DESC);
CREATE TABLE IF NOT EXISTS ai_usage (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS favorite_groups (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS favorite_groups_name_ci_idx ON favorite_groups (lower(name));
INSERT INTO favorite_groups (name) VALUES ('Favorites') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS favorite_vehicles (
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL DEFAULT 'Favorites',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (make, model, year, trim)
);
ALTER TABLE favorite_vehicles ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Favorites';
`;

type Row = Record<string, any>;
const build = (r: Row): BuildRow => ({ id: r.id, name: r.name, config: r.config, createdAt: r.created_at, updatedAt: r.updated_at });
const set = (r: Row): DrawingSetRow => ({
  id: r.id, buildId: r.build_id, configSignature: r.config_signature, status: r.status,
  notes: r.notes, approvedAt: r.approved_at, createdAt: r.created_at,
});
const drawing = (r: Row): DrawingRow => ({
  setId: r.set_id, view: r.view, revision: r.revision, data: r.data ?? Buffer.alloc(0), mime: r.mime, updatedAt: r.updated_at,
});
const render = (r: Row): RenderRow => ({
  id: r.id, buildId: r.build_id, setId: r.set_id, angle: r.angle, data: r.data ?? Buffer.alloc(0), mime: r.mime, createdAt: r.created_at,
});
const favoriteVehicle = (r: Row): FavoriteVehicle => ({
  make: r.make,
  model: r.model,
  year: r.year,
  ...(r.trim ? { trim: r.trim } : {}),
  groupName: r.group_name ?? "Favorites",
});
export class PostgresStore implements Store {
  readonly kind = "postgres" as const;
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 5 });
    this.pool.on("error", error => console.error("[db] idle client error", error));
  }

  private async q(sql: string, params: unknown[] = []): Promise<Row[]> {
    return (await this.pool.query(sql, params)).rows;
  }

  async init() { await this.pool.query(SCHEMA); }

  async listBuilds() { return (await this.q("SELECT id, name, config, created_at, updated_at FROM builds ORDER BY updated_at DESC")).map(build); }
  async getBuild(id: number) {
    const [row] = await this.q("SELECT id, name, config, created_at, updated_at FROM builds WHERE id = $1", [id]);
    return row ? build(row) : null;
  }
  async createBuild(name: string, config: BuildConfig) {
    const [row] = await this.q("INSERT INTO builds (name, config) VALUES ($1, $2) RETURNING *", [name, config]);
    return build(row);
  }
  async updateBuild(id: number, patch: { name?: string; config?: BuildConfig }) {
    const [row] = await this.q(
      `UPDATE builds SET name = COALESCE($2, name), config = COALESCE($3, config), updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, patch.name ?? null, patch.config ?? null],
    );
    return row ? build(row) : null;
  }
  async deleteBuild(id: number) {
    return (await this.pool.query("DELETE FROM builds WHERE id = $1", [id])).rowCount === 1;
  }
  async listFavoriteGroups() {
    return (await this.q("SELECT name FROM favorite_groups ORDER BY name")).map(row => row.name as string);
  }
  async createFavoriteGroup(name: string) {
    await this.q("INSERT INTO favorite_groups (name) VALUES ($1) ON CONFLICT DO NOTHING", [name.trim()]);
    const [row] = await this.q("SELECT name FROM favorite_groups WHERE lower(name) = lower($1)", [name.trim()]);
    if (!row) throw new Error("Unable to save favorite group.");
    return row.name as string;
  }
  async listFavoriteVehicles() {
    return (await this.q("SELECT make, model, year, trim, group_name FROM favorite_vehicles ORDER BY group_name, make, model, year, trim"))
      .map(favoriteVehicle);
  }
  async saveFavoriteVehicle(favorite: FavoriteVehicle) {
    const [row] = await this.q(
      `INSERT INTO favorite_vehicles (make, model, year, trim, group_name) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (make, model, year, trim) DO UPDATE SET group_name = EXCLUDED.group_name
       RETURNING make, model, year, trim, group_name`,
      [favorite.make, favorite.model, favorite.year, favorite.trim ?? "", favorite.groupName ?? "Favorites"],
    );
    return favoriteVehicle(row);
  }
  async deleteFavoriteVehicle(favorite: FavoriteVehicle) {
    const rows = await this.q(
      "DELETE FROM favorite_vehicles WHERE make = $1 AND model = $2 AND year = $3 AND trim = $4 AND group_name = $5 RETURNING make",
      [favorite.make, favorite.model, favorite.year, favorite.trim ?? "", favorite.groupName ?? "Favorites"],
    );
    return rows.length > 0;
  }
  async importFavoriteBundle(groups: string[], favorites: FavoriteVehicle[]): Promise<FavoriteVehicleImportResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const canonicalGroups = new Map<string, string>();
      for (const name of groups) {
        await client.query("INSERT INTO favorite_groups (name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
        const { rows } = await client.query("SELECT name FROM favorite_groups WHERE lower(name) = lower($1)", [name]);
        if (!rows[0]) throw new Error("Unable to save favorite group.");
        canonicalGroups.set(name.toLocaleLowerCase(), rows[0].name as string);
      }
      for (const favorite of favorites) {
        const groupName = canonicalGroups.get((favorite.groupName ?? "Favorites").toLocaleLowerCase());
        if (!groupName) throw new Error("Unable to resolve imported favorite group.");
        await client.query(
          `INSERT INTO favorite_vehicles (make, model, year, trim, group_name) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (make, model, year, trim) DO UPDATE SET group_name = EXCLUDED.group_name`,
          [favorite.make, favorite.model, favorite.year, favorite.trim ?? "", groupName],
        );
      }
      const [groupRows, favoriteRows] = await Promise.all([
        client.query("SELECT name FROM favorite_groups ORDER BY name"),
        client.query("SELECT make, model, year, trim, group_name FROM favorite_vehicles ORDER BY group_name, make, model, year, trim"),
      ]);
      await client.query("COMMIT");
      return {
        importedCount: favorites.length,
        groups: groupRows.rows.map(row => row.name as string),
        favorites: favoriteRows.rows.map(favoriteVehicle),
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  async createDrawingSet(buildId: number, configSignature: string) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM drawing_sets WHERE build_id = $1", [buildId]);
      const { rows } = await client.query(
        "INSERT INTO drawing_sets (build_id, config_signature) VALUES ($1, $2) RETURNING *", [buildId, configSignature]);
      await client.query("COMMIT");
      return set(rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async getDrawingSet(buildId: number) {
    const [row] = await this.q("SELECT * FROM drawing_sets WHERE build_id = $1", [buildId]);
    return row ? set(row) : null;
  }
  async updateDrawingSet(setId: number, patch: Partial<Pick<DrawingSetRow, "status" | "notes" | "approvedAt">>) {
    await this.q(
      `UPDATE drawing_sets SET
         status = CASE WHEN $2::boolean THEN $3 ELSE status END,
         notes = CASE WHEN $4::boolean THEN $5 ELSE notes END,
         approved_at = CASE WHEN $6::boolean THEN $7::timestamptz ELSE approved_at END
       WHERE id = $1`,
      [setId, "status" in patch, patch.status ?? null, "notes" in patch, patch.notes ?? null, "approvedAt" in patch, patch.approvedAt ?? null],
    );
  }
  async putDrawing(setId: number, view: DrawingKey, image: { data: Buffer; mime: string }) {
    const [row] = await this.q(
      `INSERT INTO drawings (set_id, view, data, mime) VALUES ($1, $2, $3, $4)
       ON CONFLICT (set_id, view) DO UPDATE SET data = EXCLUDED.data, mime = EXCLUDED.mime,
         revision = drawings.revision + 1, updated_at = now()
       RETURNING *`,
      [setId, view, image.data, image.mime],
    );
    return drawing(row);
  }
  async listDrawings(setId: number, withData = false) {
    const cols = withData ? "*" : "set_id, view, revision, mime, updated_at";
    return (await this.q(`SELECT ${cols} FROM drawings WHERE set_id = $1`, [setId])).map(drawing);
  }
  async getDrawing(setId: number, view: DrawingKey) {
    const [row] = await this.q("SELECT * FROM drawings WHERE set_id = $1 AND view = $2", [setId, view]);
    return row ? drawing(row) : null;
  }
  async addRender(buildId: number, setId: number, angle: RenderAngle, image: { data: Buffer; mime: string }) {
    const [row] = await this.q(
      "INSERT INTO renders (build_id, set_id, angle, data, mime) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [buildId, setId, angle, image.data, image.mime],
    );
    return render(row);
  }
  async latestRenders(buildId: number, setId: number, withData = false) {
    const cols = withData ? "*" : "id, build_id, set_id, angle, mime, created_at";
    return (await this.q(
      `SELECT DISTINCT ON (angle) ${cols} FROM renders WHERE build_id = $1 AND set_id = $2
       ORDER BY angle, created_at DESC, id DESC`, [buildId, setId])).map(render);
  }
  async getRender(id: number) {
    const [row] = await this.q("SELECT * FROM renders WHERE id = $1", [id]);
    return row ? render(row) : null;
  }
  async getPartSpecs(buildId: number) {
    const [row] = await this.q("SELECT part_specs FROM builds WHERE id = $1", [buildId]);
    return (row?.part_specs as PartSpecCache | null) ?? null;
  }
  async putPartSpecs(buildId: number, cache: PartSpecCache) {
    await this.q("UPDATE builds SET part_specs = $2 WHERE id = $1", [buildId, cache]);
  }
  async recordUsage(kind: "drawing" | "render" | "spec", inputTokens: number, outputTokens: number) {
    await this.q("INSERT INTO ai_usage (kind, input_tokens, output_tokens) VALUES ($1, $2, $3)", [kind, inputTokens, outputTokens]);
  }
  async imagesSince(since: Date) {
    const [row] = await this.q("SELECT count(*)::int AS n FROM ai_usage WHERE kind <> 'spec' AND created_at >= $1", [since]);
    return row?.n ?? 0;
  }
}

export function createStore(databaseUrl: string | null): Store {
  return databaseUrl ? new PostgresStore(databaseUrl) : new MemoryStore();
}
