/**
 * The drawing-first workflow:
 *
 *   configure ──► drawings (draft) ──redraw w/ notes──► approve ──► renders ──► export
 *                     ▲                                    │
 *                     └──────────── reopen ◄───────────────┘
 *
 * Generation runs as an in-process background job per build (single user), and
 * the client polls the build to show per-view / per-angle progress.
 */
import { AiError, type AiProvider, type Img } from "./ai";
import { env } from "./env";
import type { Store, BuildRow, DrawingSetRow, PartSpecCache } from "./store";
import type { VehicleLibrary } from "./vehicles/library";
import { configSignature } from "./domain/signature";
import {
  drawingConditioning, drawingPrompt, includedParts, partConditioning, partDrawingPrompt, renderConditioning, renderPrompt,
  RENDER_BASE_VIEW, type FinishReference,
} from "./domain/prompts";
import { estimatePartSpecs, generatePartSpecs } from "./domain/part-specs";
import { buildExportZip, slug } from "./export/package";
import { SHEET_LAYOUT_VERSION, buildPartSheetSvg, partDrawingNumber } from "./export/part-sheet";
import {
  DRAWING_VIEWS, DRAWING_VIEW_LABELS, PART_LABELS, PART_SHEET_VIEWS, RENDER_ANGLES, partKey,
  type BuildConfig, type BuildDto, type BuildSummaryDto, type DrawingKey, type DrawingView, type JobDto, type PartId,
  type RenderAngle, type UsageDto,
} from "../shared/types";

export class StudioError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
    this.name = "StudioError";
  }
}

interface Job extends JobDto {
  promise: Promise<void>;
}

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function message(error: unknown): string {
  if (error instanceof AiError || error instanceof StudioError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

export class Studio {
  private jobs = new Map<number, Job>();

  constructor(
    readonly store: Store,
    readonly ai: AiProvider,
    private readonly limits = { dailyImageLimit: env.dailyImageLimit },
    /** Verified vehicle profiles add size, design details and reference photos to the car drawings. */
    private readonly vehicles?: Pick<VehicleLibrary, "forDrawing">,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────────────

  async usage(): Promise<UsageDto> {
    return {
      aiMode: this.ai.mode,
      imagesToday: await this.store.imagesSince(startOfUtcDay()),
      dailyImageLimit: this.limits.dailyImageLimit,
      drawingQuality: env.drawingQuality,
      renderQuality: env.renderQuality,
      storage: this.store.kind,
    };
  }

  async listBuilds(): Promise<BuildSummaryDto[]> {
    const builds = await this.store.listBuilds();
    return Promise.all(builds.map(async b => {
      const set = await this.store.getDrawingSet(b.id);
      const renders = set ? await this.store.latestRenders(b.id, set.id) : [];
      const drawings = set ? await this.store.listDrawings(set.id) : [];
      const hero = renders.find(r => r.angle === "front-three-quarter") ?? renders[0];
      const side = drawings.find(d => d.view === "side");
      return {
        id: b.id,
        name: b.name,
        updatedAt: b.updatedAt.toISOString(),
        stage: renders.length ? "rendered" : set?.status === "approved" ? "approved" : set ? "drawings" : "configure",
        thumbnailUrl: hero ? `/api/renders/${hero.id}` : side ? `/api/builds/${b.id}/drawings/${side.view}?rev=${side.revision}` : null,
      } satisfies BuildSummaryDto;
    }));
  }

  async getBuild(id: number): Promise<BuildDto> {
    const build = await this.requireBuild(id);
    const set = await this.store.getDrawingSet(id);
    const signature = configSignature(build.config);
    const drawings = set ? await this.store.listDrawings(set.id) : [];
    const renders = set ? await this.store.latestRenders(id, set.id) : [];
    const job = this.jobs.get(id);
    const specs = await this.currentSpecs(build);
    return {
      id: build.id,
      name: build.name,
      config: build.config,
      configSignature: signature,
      createdAt: build.createdAt.toISOString(),
      updatedAt: build.updatedAt.toISOString(),
      drawingSet: set ? {
        id: set.id,
        status: set.status,
        configSignature: set.configSignature,
        stale: set.configSignature !== signature,
        notes: set.notes,
        approvedAt: set.approvedAt?.toISOString() ?? null,
        drawings: DRAWING_VIEWS.flatMap(view => {
          const d = drawings.find(x => x.view === view);
          return d ? [{ view, revision: d.revision, url: `/api/builds/${id}/drawings/${view}?rev=${d.revision}`, updatedAt: d.updatedAt.toISOString() }] : [];
        }),
        parts: includedParts(build.config).flatMap(partId => {
          const d = drawings.find(x => x.view === partKey(partId));
          const spec = specs.specs.find(s => s.partId === partId);
          if (!d || !spec) return [];
          // The sheet URL changes with the drawing revision and with the dimensions, so caches stay correct.
          const dimsKey = `${spec.dimensions.length}x${spec.dimensions.width}x${spec.dimensions.height}`;
          return [{
            partId,
            revision: d.revision,
            drawingUrl: `/api/builds/${id}/drawings/${partKey(partId)}?rev=${d.revision}`,
            sheetUrl: `/api/builds/${id}/parts/${partId}/sheet.svg?rev=${d.revision}&dims=${dimsKey}&src=${specs.source}&v=${SHEET_LAYOUT_VERSION}`,
            dimensions: spec.dimensions,
            estimateSource: specs.source,
          }];
        }),
      } : null,
      renders: RENDER_ANGLES.flatMap(angle => {
        const r = renders.find(x => x.angle === angle);
        return r ? [{
          angle, url: `/api/renders/${r.id}`, createdAt: r.createdAt.toISOString(),
          current: !!set?.approvedAt && r.createdAt >= set.approvedAt,
        }] : [];
      }),
      job: job ? { kind: job.kind, pending: [...job.pending], failed: [...job.failed], startedAt: job.startedAt, done: job.done } : null,
    };
  }

  // ─── Builds ───────────────────────────────────────────────────────────────

  async createBuild(name: string, config: BuildConfig) {
    return this.getBuild((await this.store.createBuild(name, config)).id);
  }

  async updateBuild(id: number, patch: { name?: string; config?: BuildConfig }) {
    this.assertIdle(id);
    if (!(await this.store.updateBuild(id, patch))) throw new StudioError("Build not found.", 404, "NOT_FOUND");
    return this.getBuild(id);
  }

  async deleteBuild(id: number) {
    this.assertIdle(id);
    if (!(await this.store.deleteBuild(id))) throw new StudioError("Build not found.", 404, "NOT_FOUND");
    this.jobs.delete(id);
  }

  // ─── Drawings ─────────────────────────────────────────────────────────────

  /**
   * Fresh drawing set for the current config: the 4 whole-car views, then one
   * close-up per included kit part. Replaces any previous set and its renders.
   */
  async generateDrawings(id: number): Promise<BuildDto> {
    const build = await this.requireBuild(id);
    this.assertIdle(id);
    const parts = includedParts(build.config);
    await this.assertBudget(DRAWING_VIEWS.length + parts.length);
    const set = await this.store.createDrawingSet(id, configSignature(build.config));
    this.startJob(id, "drawings", [...DRAWING_VIEWS, ...parts.map(partKey)], async () => {
      await this.drawViews(build, set, [...DRAWING_VIEWS], null);
      await this.drawParts(build, set, parts, null);
    });
    return this.getBuild(id);
  }

  async redraw(id: number, keys: DrawingKey[], notes: string): Promise<BuildDto> {
    const build = await this.requireBuild(id);
    this.assertIdle(id);
    const set = await this.requireSet(id);
    if (set.status === "approved") throw new StudioError("Reopen the approved drawings before redrawing.", 409, "DRAWINGS_APPROVED");
    if (set.configSignature !== configSignature(build.config)) {
      throw new StudioError("The build changed since these drawings were made. Generate new drawings instead.", 409, "DRAWINGS_STALE");
    }
    const views = DRAWING_VIEWS.filter(v => keys.includes(v));
    const parts = includedParts(build.config).filter(p => keys.includes(partKey(p)));
    if (views.length + parts.length === 0) throw new StudioError("Pick at least one drawing to redraw.", 400, "NO_VIEWS");
    await this.assertBudget(views.length + parts.length);
    await this.store.updateDrawingSet(set.id, { notes });
    this.startJob(id, "redraw", [...views, ...parts.map(partKey)], async () => {
      if (views.length) await this.drawViews(build, set, views, notes);
      if (parts.length) await this.drawParts(build, set, parts, notes);
    });
    return this.getBuild(id);
  }

  async approve(id: number): Promise<BuildDto> {
    const build = await this.requireBuild(id);
    this.assertIdle(id);
    const set = await this.requireSet(id);
    if (set.configSignature !== configSignature(build.config)) {
      throw new StudioError("The build changed since these drawings were made. Generate new drawings first.", 409, "DRAWINGS_STALE");
    }
    const drawings = await this.store.listDrawings(set.id);
    const missing = [
      ...DRAWING_VIEWS.filter(v => !drawings.some(d => d.view === v)).map(v => DRAWING_VIEW_LABELS[v].toLowerCase()),
      ...includedParts(build.config).filter(p => !drawings.some(d => d.view === partKey(p))).map(p => `${PART_LABELS[p].toLowerCase()} close-up`),
    ];
    if (missing.length) throw new StudioError(`Missing drawings: ${missing.join(", ")}. Redraw them before approving.`, 409, "DRAWINGS_INCOMPLETE");
    await this.store.updateDrawingSet(set.id, { status: "approved", approvedAt: new Date() });
    return this.getBuild(id);
  }

  async reopen(id: number): Promise<BuildDto> {
    this.assertIdle(id);
    const set = await this.requireSet(id);
    await this.store.updateDrawingSet(set.id, { status: "draft" });
    return this.getBuild(id);
  }

  private async drawViews(build: BuildRow, set: DrawingSetRow, views: DrawingView[], notes: string | null) {
    // The side elevation anchors the other views, so it is always drawn first.
    const ordered = views.includes("side") ? ["side" as const, ...views.filter(v => v !== "side")] : views;
    const loadSide = async (): Promise<Img | null> => {
      const side = await this.store.getDrawing(set.id, "side");
      return side ? { data: side.data, mime: side.mime } : null;
    };
    const { make, model, year } = build.config;
    const profile = (await this.vehicles?.forDrawing({ make, model, year })) ?? null;
    const drawOne = async (view: DrawingView) => {
      const previous = notes ? await this.store.getDrawing(set.id, view) : null;
      const result = await this.ai.image({
        kind: "drawing",
        prompt: drawingPrompt(build.config, view, notes, profile),
        quality: env.drawingQuality,
        conditioning: drawingConditioning(view, await loadSide(), previous ? { data: previous.data, mime: previous.mime } : null, profile),
        mockLabel: `${build.config.make} ${build.config.model} — ${view.toUpperCase()} VIEW`,
      });
      await this.store.recordUsage("drawing", result.inputTokens, result.outputTokens);
      console.log(`[studio] drawing ${view} (${env.drawingQuality}): ${result.inputTokens} in / ${result.outputTokens} out tokens`);
      await this.store.putDrawing(set.id, view, result);
    };
    const job = this.jobs.get(build.id)!;
    if (ordered[0] === "side") {
      await this.runItem(job, "side", () => drawOne("side"));
      if (job.failed.some(f => f.item === "side") && !(await loadSide())) {
        // Without a side anchor the other views would drift; stop and let the user retry.
        for (const view of ordered.slice(1)) this.finishItem(job, view, "Skipped because the side view failed.");
        return;
      }
    }
    await Promise.all(ordered.filter(v => v !== "side").map(view => this.runItem(job, view, () => drawOne(view))));
  }

  /** One close-up per part, each matched to the approved car view it is measured in. */
  private async drawParts(build: BuildRow, set: DrawingSetRow, parts: PartId[], notes: string | null) {
    const job = this.jobs.get(build.id)!;
    // Specs first (one cheap text call, cached): each drawing is told the spec's mounting-hole
    // count, so the drawing agrees with the number printed in its sheet's title block.
    const specs = await this.ensurePartSpecs(build);
    const queue = [...parts];
    const worker = async () => {
      for (let part = queue.shift(); part; part = queue.shift()) {
        const partId = part;
        const key = partKey(partId);
        const carView = await this.store.getDrawing(set.id, PART_SHEET_VIEWS[partId].view);
        if (!carView) {
          this.finishItem(job, key, `Skipped because the ${DRAWING_VIEW_LABELS[PART_SHEET_VIEWS[partId].view].toLowerCase()} is missing.`);
          continue;
        }
        await this.runItem(job, key, async () => {
          const previous = notes ? await this.store.getDrawing(set.id, key) : null;
          const result = await this.ai.image({
            kind: "drawing",
            prompt: partDrawingPrompt(build.config, partId, notes, specs.specs.find(s => s.partId === partId)?.mountingPoints),
            quality: env.drawingQuality,
            conditioning: partConditioning(partId, { data: carView.data, mime: carView.mime }, previous ? { data: previous.data, mime: previous.mime } : null),
            mockLabel: `${PART_LABELS[partId].toUpperCase()} — CLOSE-UP`,
          });
          await this.store.recordUsage("drawing", result.inputTokens, result.outputTokens);
          console.log(`[studio] part ${partId} (${env.drawingQuality}): ${result.inputTokens} in / ${result.outputTokens} out tokens`);
          await this.store.putDrawing(set.id, key, result);
        });
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  /** Part dimensions for the current config, cached per config signature. */
  private async ensurePartSpecs(build: BuildRow): Promise<PartSpecCache> {
    const signature = configSignature(build.config);
    const cached = await this.store.getPartSpecs(build.id);
    if (cached && cached.signature === signature) return cached;
    const generated = await generatePartSpecs(this.ai, build.config);
    if (generated.source === "ai") await this.store.recordUsage("spec", generated.inputTokens, generated.outputTokens);
    const cache: PartSpecCache = { signature, specs: generated.specs, source: generated.source };
    await this.store.putPartSpecs(build.id, cache);
    return cache;
  }

  /** Cached specs if current, otherwise rule-based estimates (never calls the AI). */
  private async currentSpecs(build: BuildRow): Promise<PartSpecCache> {
    const signature = configSignature(build.config);
    const cached = await this.store.getPartSpecs(build.id);
    return cached && cached.signature === signature ? cached : { signature, specs: estimatePartSpecs(build.config), source: "estimate" };
  }

  /** The measured production sheet (SVG) for one part's current close-up drawing. */
  async partSheet(id: number, partId: PartId): Promise<string> {
    const build = await this.requireBuild(id);
    const set = await this.requireSet(id);
    const drawing = await this.store.getDrawing(set.id, partKey(partId));
    const specs = await this.currentSpecs(build);
    const spec = specs.specs.find(s => s.partId === partId);
    if (!drawing || !spec) throw new StudioError("Part drawing not found.", 404, "NOT_FOUND");
    return buildPartSheetSvg({
      partId, spec, source: specs.source, config: build.config,
      image: { data: drawing.data, mime: drawing.mime },
      revision: drawing.revision,
      drawingNumber: partDrawingNumber(id, partId),
      date: drawing.updatedAt.toISOString().slice(0, 10),
    });
  }

  // ─── Renders ──────────────────────────────────────────────────────────────

  async render(id: number, angles: RenderAngle[]): Promise<BuildDto> {
    const build = await this.requireBuild(id);
    this.assertIdle(id);
    const set = await this.requireSet(id);
    if (set.status !== "approved") throw new StudioError("Approve the drawings before rendering.", 409, "DRAWINGS_NOT_APPROVED");
    if (set.configSignature !== configSignature(build.config)) {
      throw new StudioError("The build changed since the drawings were approved. Generate and approve new drawings first.", 409, "DRAWINGS_STALE");
    }
    const unique = RENDER_ANGLES.filter(a => angles.includes(a));
    if (unique.length === 0) throw new StudioError("Pick at least one angle to render.", 400, "NO_ANGLES");
    await this.assertBudget(unique.length);
    const drawingRows = await this.store.listDrawings(set.id, true);
    const drawings = Object.fromEntries(drawingRows.map(d => [d.view, { data: d.data, mime: d.mime }])) as Partial<Record<DrawingView, Img>>;
    // Renders the designer kept (current ones for angles not being redone) set the look;
    // they go first so the new angles match them.
    const approvedAt = set.approvedAt;
    const kept = approvedAt
      ? (await this.store.latestRenders(id, set.id, true)).filter(r => r.createdAt >= approvedAt && !unique.includes(r.angle))
      : [];
    const finished: FinishReference[] = kept.map(r => ({ angle: r.angle, data: r.data, mime: r.mime }));
    this.startJob(id, "renders", unique, async () => {
      const job = this.jobs.get(id)!;
      // Straight-on views are made from a drawing in place, so they come out most faithful;
      // they go first and the 3/4 angles then match their paint and materials.
      const phases = [unique.filter(a => RENDER_BASE_VIEW[a]), unique.filter(a => !RENDER_BASE_VIEW[a])];
      for (const phase of phases) {
        const references = [...finished];
        // Two at a time keeps provider load predictable without making the user wait for each angle.
        const queue = [...phase];
        const worker = async () => {
          for (let angle = queue.shift(); angle; angle = queue.shift()) {
            const current = angle;
            await this.runItem(job, current, async () => {
              const result = await this.ai.image({
                kind: "render",
                prompt: renderPrompt(build.config, current),
                quality: env.renderQuality,
                conditioning: renderConditioning(current, drawings, references),
                mockLabel: `${build.config.make} ${build.config.model} — ${current.toUpperCase()}`,
              });
              await this.store.recordUsage("render", result.inputTokens, result.outputTokens);
              console.log(`[studio] render ${current} (${env.renderQuality}): ${result.inputTokens} in / ${result.outputTokens} out tokens`);
              await this.store.addRender(id, set.id, current, result);
              finished.push({ angle: current, data: result.data, mime: result.mime });
            });
          }
        };
        await Promise.all([worker(), worker()]);
      }
    });
    return this.getBuild(id);
  }

  // ─── Export ───────────────────────────────────────────────────────────────

  async exportBuild(id: number): Promise<{ filename: string; zip: Buffer }> {
    const build = await this.requireBuild(id);
    this.assertIdle(id);
    const set = await this.requireSet(id);
    const signature = configSignature(build.config);
    if (set.status !== "approved" || !set.approvedAt) {
      throw new StudioError("Approve the drawings before exporting a production package.", 409, "DRAWINGS_NOT_APPROVED");
    }
    if (set.configSignature !== signature) {
      throw new StudioError("The build changed since the drawings were approved. Approve new drawings before exporting.", 409, "DRAWINGS_STALE");
    }
    const cache = await this.ensurePartSpecs(build);
    const approvedAt = set.approvedAt;
    const renders = (await this.store.latestRenders(id, set.id, true)).filter(r => r.createdAt >= approvedAt);
    const partSheets = await Promise.all(includedParts(build.config).map(async partId => {
      const drawing = await this.store.getDrawing(set.id, partKey(partId));
      return drawing ? { partId, drawing: { data: drawing.data, mime: drawing.mime }, svg: await this.partSheet(id, partId) } : null;
    }));
    const zip = await buildExportZip({
      buildId: id,
      name: build.name,
      config: build.config,
      configSignature: signature,
      approvedAt,
      drawings: (await this.store.listDrawings(set.id, true)).filter((d): d is typeof d & { view: DrawingView } => !d.view.startsWith("part:")),
      partSheets: partSheets.filter(s => s !== null),
      renders,
      specs: cache.specs,
      specSource: cache.source,
    });
    return { filename: `${slug(build.name)}-production.zip`, zip };
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  /** Resolves when the build's running job (if any) finishes. Used by tests. */
  async waitForJob(id: number) {
    await this.jobs.get(id)?.promise;
  }

  private startJob(id: number, kind: JobDto["kind"], items: string[], run: () => Promise<void>) {
    const job: Job = { kind, pending: [...items], failed: [], startedAt: new Date().toISOString(), done: false, promise: Promise.resolve() };
    this.jobs.set(id, job);
    job.promise = run()
      .catch(error => {
        for (const item of [...job.pending]) this.finishItem(job, item, message(error));
      })
      .finally(() => { job.done = true; });
  }

  private async runItem(job: Job, item: string, work: () => Promise<void>) {
    try {
      await work();
      this.finishItem(job, item, null);
    } catch (error) {
      console.error(`[studio] ${job.kind} ${item} failed:`, message(error));
      this.finishItem(job, item, message(error));
    }
  }

  private finishItem(job: Job, item: string, error: string | null) {
    job.pending = job.pending.filter(p => p !== item);
    if (error) job.failed.push({ item, error });
  }

  private assertIdle(id: number) {
    const job = this.jobs.get(id);
    if (job && !job.done) throw new StudioError("Generation is still running for this build.", 409, "JOB_RUNNING");
  }

  private async assertBudget(images: number) {
    const used = await this.store.imagesSince(startOfUtcDay());
    if (used + images > this.limits.dailyImageLimit) {
      throw new StudioError(
        `Daily image limit reached (${used}/${this.limits.dailyImageLimit}). It resets at 00:00 UTC, or raise DAILY_IMAGE_LIMIT.`,
        429, "DAILY_LIMIT",
      );
    }
  }

  private async requireBuild(id: number): Promise<BuildRow> {
    const build = await this.store.getBuild(id);
    if (!build) throw new StudioError("Build not found.", 404, "NOT_FOUND");
    return build;
  }

  private async requireSet(id: number): Promise<DrawingSetRow> {
    const set = await this.store.getDrawingSet(id);
    if (!set) throw new StudioError("Generate drawings first.", 409, "NO_DRAWINGS");
    return set;
  }
}
