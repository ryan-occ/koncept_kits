import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { AiError } from "./ai";
import { Studio, StudioError } from "./studio";
import { BuildConfigSchema, DRAWING_VIEWS, PART_IDS, RENDER_ANGLES, partKey, type DrawingKey, type PartId } from "../shared/types";

const Name = z.string().trim().min(1).max(80);
const CreateBody = z.object({ name: Name, config: BuildConfigSchema }).strict();
const UpdateBody = z.object({ name: Name.optional(), config: BuildConfigSchema.optional() }).strict();
const DRAWING_KEYS = [...DRAWING_VIEWS, ...PART_IDS.map(partKey)] as [DrawingKey, ...DrawingKey[]];
const RedrawBody = z.object({ views: z.array(z.enum(DRAWING_KEYS)).min(1), notes: z.string().trim().min(1).max(1500) }).strict();
const RenderBody = z.object({ angles: z.array(z.enum(RENDER_ANGLES)).min(1) }).strict();

type Handler = (req: Request, res: Response) => Promise<unknown>;
const wrap = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
  handler(req, res).catch(next);
};

function id(req: Request): number {
  const value = Number(req.params.id);
  if (!Number.isInteger(value) || value <= 0) throw new StudioError("Invalid id.", 400, "BAD_ID");
  return value;
}

function sendImage(res: Response, image: { data: Buffer; mime: string }) {
  // URLs carry a revision or a unique render id, so the bytes never change.
  res.setHeader("Content-Type", image.mime);
  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  res.send(image.data);
}

export function apiRouter(studio: Studio) {
  const router = express.Router();
  router.use(express.json({ limit: "256kb" }));

  router.get("/healthz", (_req, res) => { res.json({ ok: true }); });
  router.get("/usage", wrap(async (_req, res) => res.json(await studio.usage())));

  router.get("/builds", wrap(async (_req, res) => res.json(await studio.listBuilds())));
  router.post("/builds", wrap(async (req, res) => {
    const body = CreateBody.parse(req.body);
    res.status(201).json(await studio.createBuild(body.name, body.config));
  }));
  router.get("/builds/:id", wrap(async (req, res) => res.json(await studio.getBuild(id(req)))));
  router.patch("/builds/:id", wrap(async (req, res) => res.json(await studio.updateBuild(id(req), UpdateBody.parse(req.body)))));
  router.delete("/builds/:id", wrap(async (req, res) => {
    await studio.deleteBuild(id(req));
    res.status(204).end();
  }));

  router.post("/builds/:id/drawings", wrap(async (req, res) => res.status(202).json(await studio.generateDrawings(id(req)))));
  router.post("/builds/:id/drawings/redraw", wrap(async (req, res) => {
    const body = RedrawBody.parse(req.body);
    res.status(202).json(await studio.redraw(id(req), body.views, body.notes));
  }));
  router.post("/builds/:id/drawings/approve", wrap(async (req, res) => res.json(await studio.approve(id(req)))));
  router.post("/builds/:id/drawings/reopen", wrap(async (req, res) => res.json(await studio.reopen(id(req)))));
  router.get("/builds/:id/drawings/:view", wrap(async (req, res) => {
    const view = req.params.view as DrawingKey;
    if (!DRAWING_KEYS.includes(view)) throw new StudioError("Unknown view.", 404, "NOT_FOUND");
    const set = await studio.store.getDrawingSet(id(req));
    const drawing = set ? await studio.store.getDrawing(set.id, view) : null;
    if (!drawing) throw new StudioError("Drawing not found.", 404, "NOT_FOUND");
    sendImage(res, drawing);
  }));

  router.get("/builds/:id/parts/:partId/sheet.svg", wrap(async (req, res) => {
    const partId = req.params.partId as PartId;
    if (!PART_IDS.includes(partId)) throw new StudioError("Unknown part.", 404, "NOT_FOUND");
    const svg = await studio.partSheet(id(req), partId);
    res.setHeader("Content-Type", "image/svg+xml");
    // The URL carries the drawing revision and dimensions, so the content for a URL never changes.
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.send(svg);
  }));

  router.post("/builds/:id/renders", wrap(async (req, res) => {
    const body = RenderBody.parse(req.body);
    res.status(202).json(await studio.render(id(req), body.angles));
  }));
  router.get("/renders/:id", wrap(async (req, res) => {
    const render = await studio.store.getRender(id(req));
    if (!render) throw new StudioError("Render not found.", 404, "NOT_FOUND");
    sendImage(res, render);
  }));

  router.get("/builds/:id/export", wrap(async (req, res) => {
    const { filename, zip } = await studio.exportBuild(id(req));
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(zip);
  }));

  router.use((_req, res) => { res.status(404).json({ error: "Not found.", code: "NOT_FOUND" }); });
  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues.map(i => `${i.path.join(".") || "body"}: ${i.message}`).join("; "), code: "INVALID" });
    } else if (error instanceof StudioError || error instanceof AiError) {
      res.status(error.status).json({ error: error.message, code: error.code });
    } else {
      console.error("[api] unexpected error", error);
      res.status(500).json({ error: "Something went wrong on the server.", code: "INTERNAL" });
    }
  });
  return router;
}
