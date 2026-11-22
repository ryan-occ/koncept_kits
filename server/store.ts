/**
 * Persistence for a single-user studio: builds, one current drawing set per
 * build (with per-view revisions), renders, cached part specs and image usage.
 * Images live in Postgres as bytea — no object-storage sidecar needed.
 */
import pg from "pg";
import type { BuildConfig, DrawingKey, RenderAngle } from "../shared/types";
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
