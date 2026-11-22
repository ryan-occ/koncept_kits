/** /api/vehicles — the vehicle library. Errors fall through to the API's shared error handler. */
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { StudioError } from "../studio";
import { VEHICLE_PHOTO_VIEWS, VehicleProfileEditSchema, VehicleRefSchema } from "../../shared/vehicles";
import type { VehicleLibrary } from "./library";

const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PhotoQuery = z.object({ view: z.enum(VEHICLE_PHOTO_VIEWS) });
const ProfileQuery = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(2100),
});

const wrap = (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => { handler(req, res).catch(next); };

function id(req: Request, param = "id"): number {
  const value = Number(req.params[param]);
  if (!Number.isInteger(value) || value < 1) throw new StudioError("Invalid id.", 400, "INVALID_ID");
  return value;
}

export function vehiclesRouter(library: VehicleLibrary) {
  const router = express.Router();

  router.get("/catalog", wrap(async (_req, res) => res.json(await library.catalog())));
  router.post("/catalog", wrap(async (req, res) => res.status(201).json(await library.addCar(VehicleRefSchema.parse(req.body)))));
  router.post("/sync", wrap(async (_req, res) => {
    void library.syncNow();
    res.status(202).json(await library.catalog());
  }));

  router.get("/profiles", wrap(async (_req, res) => res.json(await library.listProfiles())));
  router.get("/profile", wrap(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await library.findProfile(ProfileQuery.parse(req.query)));
  }));
  router.post("/research", wrap(async (req, res) => res.status(202).json(await library.startResearch(VehicleRefSchema.parse(req.body)))));
  router.post("/profiles/:id/refresh", wrap(async (req, res) => res.status(202).json(await library.refresh(id(req)))));
  router.put("/profiles/:id", wrap(async (req, res) => res.json(await library.edit(id(req), VehicleProfileEditSchema.parse(req.body)))));
  router.post("/profiles/:id/verify", wrap(async (req, res) => res.json(await library.verify(id(req)))));
  router.delete("/profiles/:id", wrap(async (req, res) => {
    await library.deleteProfile(id(req));
    res.status(204).end();
  }));

  router.post("/profiles/:id/photos", express.raw({ type: PHOTO_TYPES, limit: "10mb" }), wrap(async (req, res) => {
    const { view } = PhotoQuery.parse(req.query);
    const mime = req.headers["content-type"]?.split(";")[0]?.trim() ?? "";
    if (!PHOTO_TYPES.includes(mime) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new StudioError("Upload a PNG, JPEG or WebP photo.", 415, "BAD_PHOTO");
    }
    res.status(201).json(await library.addPhoto(id(req), view, { data: req.body, mime }));
  }));
  router.get("/photos/:id", wrap(async (req, res) => {
    const photo = await library.store.getPhoto(id(req));
    if (!photo) throw new StudioError("Photo not found.", 404, "NOT_FOUND");
    res.setHeader("Content-Type", photo.mime);
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.send(photo.data);
  }));
  router.delete("/photos/:id", wrap(async (req, res) => {
    await library.deletePhoto(id(req));
    res.status(204).end();
  }));

  return router;
}
