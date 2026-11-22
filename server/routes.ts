import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { AiError } from "./ai";
import { Studio, StudioError } from "./studio";
import { CAR_DB, getHondaFactoryVariant } from "../shared/catalog";
import {
  BuildConfigSchema, DRAWING_VIEWS, favoriteVehicleKey, PART_IDS, RENDER_ANGLES, partKey,
  type DrawingKey, type FavoriteVehicle, type FavoriteVehicleBackup, type PartId,
} from "../shared/types";

const Name = z.string().trim().min(1).max(80);
const CreateBody = z.object({ name: Name, config: BuildConfigSchema }).strict();
const UpdateBody = z.object({ name: Name.optional(), config: BuildConfigSchema.optional() }).strict();
const DRAWING_KEYS = [...DRAWING_VIEWS, ...PART_IDS.map(partKey)] as [DrawingKey, ...DrawingKey[]];
const RedrawBody = z.object({ views: z.array(z.enum(DRAWING_KEYS)).min(1), notes: z.string().trim().min(1).max(1500) }).strict();
const RenderBody = z.object({ angles: z.array(z.enum(RENDER_ANGLES)).min(1) }).strict();
const FavoriteVehicleBody = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1900).max(2100),
  trim: z.string().trim().min(1).max(40).optional(),
  groupName: z.string().trim().min(1).max(40).optional(),
}).strict().superRefine((favorite, ctx) => {
  if (!CAR_DB[favorite.make]?.[favorite.model]?.includes(favorite.year)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["year"], message: "Choose a model year from the vehicle catalog." });
  }
  if (favorite.trim && !getHondaFactoryVariant(favorite.make, favorite.model, favorite.year, favorite.trim)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["trim"], message: "This factory variant is not available for the selected vehicle and year." });
  }
});
const FavoriteGroupBody = z.object({ name: z.string().trim().min(1).max(40) }).strict();
const FavoriteGroupName = z.string().trim().min(1).max(40);
const FavoriteBackupMetadata = z.object({
  format: z.literal("vanguard-draft-favorites"),
  version: z.literal(1),
  exportedAt: z.string().datetime(),
});

const favoriteVehicle = (input: unknown): FavoriteVehicle => FavoriteVehicleBody.parse(input);

class FavoriteBackupValidationError extends Error {
  constructor(readonly details: string[]) {
    super("The favorites file has invalid entries. Nothing was imported.");
  }
}

function validateFavoriteBackup(input: unknown): Omit<FavoriteVehicleBackup, "exportedAt"> {
  const details: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new FavoriteBackupValidationError(["backup: Expected a JSON object."]);
  }
  const rawBackup = input as Record<string, unknown>;
  const allowedKeys = new Set(["format", "version", "exportedAt", "groups", "favorites"]);
  for (const key of Object.keys(rawBackup)) {
    if (!allowedKeys.has(key)) details.push(`${key}: is not a recognized backup field.`);
  }
  const metadata = FavoriteBackupMetadata.safeParse(rawBackup);
  if (!metadata.success) {
    details.push(...metadata.error.issues.map(issue =>
      `${issue.path.length ? issue.path.join(".") : "backup"}: ${issue.message}`,
    ));
  }

  const rawGroups = rawBackup.groups;
  if (!Array.isArray(rawGroups)) details.push("groups: Expected an array of group names.");
  else if (rawGroups.length === 0) details.push("groups: Include at least one group.");
  else if (rawGroups.length > 1000) details.push("groups: Backups may contain at most 1,000 groups.");

  const rawFavorites = rawBackup.favorites;
  if (!Array.isArray(rawFavorites)) details.push("favorites: Expected an array of vehicles.");
  else if (rawFavorites.length > 10_000) details.push("favorites: Backups may contain at most 10,000 vehicles.");

  const groupsByKey = new Map<string, string>();
  if (Array.isArray(rawGroups)) {
    rawGroups.forEach((entry, index) => {
      const parsed = FavoriteGroupName.safeParse(entry);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) details.push(`groups[${index}]: ${issue.message}`);
        return;
      }
      const key = parsed.data.toLocaleLowerCase();
      if (groupsByKey.has(key)) {
        details.push(`groups[${index}]: duplicates "${groupsByKey.get(key)}" (group names must be unique).`);
      } else {
        groupsByKey.set(key, parsed.data);
      }
    });
  }

  const favorites: FavoriteVehicle[] = [];
  const vehicleIndexes = new Map<string, number>();
  if (Array.isArray(rawFavorites)) {
    rawFavorites.forEach((entry, index) => {
      const parsed = FavoriteVehicleBody.safeParse(entry);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const fieldPath = issue.path.length ? `.${issue.path.join(".")}` : "";
          details.push(`favorites[${index}]${fieldPath}: ${issue.message}`);
        }
        return;
      }

      const key = favoriteVehicleKey(parsed.data);
      const duplicateIndex = vehicleIndexes.get(key);
      if (duplicateIndex !== undefined) {
        details.push(`favorites[${index}]: duplicates the vehicle in favorites[${duplicateIndex}].`);
        return;
      }
      vehicleIndexes.set(key, index);

      const groupKey = (parsed.data.groupName ?? "Favorites").toLocaleLowerCase();
      const groupName = groupsByKey.get(groupKey);
      if (!groupName) {
        details.push(`favorites[${index}].groupName: does not match any group in this backup.`);
        return;
      }
      favorites.push({ ...parsed.data, groupName });
    });
  }

  if (details.length) throw new FavoriteBackupValidationError(details);
  return {
    format: metadata.data!.format,
    version: metadata.data!.version,
    groups: [...groupsByKey.values()],
    favorites,
  };
}

async function favoriteInExistingGroup(studio: Studio, input: unknown): Promise<FavoriteVehicle> {
  const favorite = favoriteVehicle(input);
  const groupName = favorite.groupName ?? "Favorites";
  const canonicalName = (await studio.store.listFavoriteGroups())
    .find(name => name.toLocaleLowerCase() === groupName.toLocaleLowerCase());
  if (!canonicalName) throw new StudioError("Create or choose an existing favorite group.", 400, "BAD_FAVORITE_GROUP");
  return { ...favorite, groupName: canonicalName };
}

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
  router.get("/favorite-groups", wrap(async (_req, res) => res.json(await studio.store.listFavoriteGroups())));
  router.post("/favorite-groups", wrap(async (req, res) =>
    res.status(201).json(await studio.store.createFavoriteGroup(FavoriteGroupBody.parse(req.body).name)),
  ));
  router.get("/favorites/export", wrap(async (_req, res) => {
    const backup: FavoriteVehicleBackup = {
      format: "vanguard-draft-favorites",
      version: 1,
      exportedAt: new Date().toISOString(),
      groups: await studio.store.listFavoriteGroups(),
      favorites: await studio.store.listFavoriteVehicles(),
    };
    res.json(backup);
  }));
  router.post("/favorites/import", wrap(async (req, res) => {
    const backup = validateFavoriteBackup(req.body);
    const result = await studio.store.importFavoriteBundle(backup.groups, backup.favorites);
    res.json(result);
  }));
  router.get("/favorites", wrap(async (_req, res) => res.json(await studio.store.listFavoriteVehicles())));
  router.put("/favorites", wrap(async (req, res) =>
    res.status(201).json(await studio.store.saveFavoriteVehicle(await favoriteInExistingGroup(studio, req.body))),
  ));
  router.delete("/favorites", wrap(async (req, res) => {
    await studio.store.deleteFavoriteVehicle(await favoriteInExistingGroup(studio, req.body));
    res.status(204).end();
  }));

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
    } else if (error instanceof FavoriteBackupValidationError) {
      res.status(400).json({ error: error.message, code: "INVALID_FAVORITE_BACKUP", details: error.details });
    } else if (error instanceof StudioError || error instanceof AiError) {
      res.status(error.status).json({ error: error.message, code: error.code });
    } else {
      console.error("[api] unexpected error", error);
      res.status(500).json({ error: "Something went wrong on the server.", code: "INTERNAL" });
    }
  });
  return router;
}
