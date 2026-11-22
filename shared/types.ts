import { z } from "zod";

/** Kit part IDs share the finish contract of the ported car-rules module. */
export const PART_IDS = ["front", "sides", "rear", "wing", "hood", "front-fender", "rear-fender"] as const;
export type PartId = (typeof PART_IDS)[number];

export const PART_LABELS: Record<PartId, string> = {
  front: "Front bumper & splitter",
  sides: "Side skirts",
  rear: "Rear bumper & diffuser",
  wing: "Rear wing / spoiler",
  hood: "Vented hood",
  "front-fender": "Front fenders",
  "rear-fender": "Rear fenders",
};

/** Orthographic line-art views produced in the drawing step. */
export const DRAWING_VIEWS = ["side", "front", "rear", "top"] as const;
export type DrawingView = (typeof DRAWING_VIEWS)[number];
export const DRAWING_VIEW_LABELS: Record<DrawingView, string> = {
  side: "Side elevation",
  front: "Front elevation",
  rear: "Rear elevation",
  top: "Top plan",
};

/**
 * Close-up part sheets: the orthographic view that best shows each part's size,
 * and which spec dimension runs along the sheet's horizontal and vertical axes.
 */
export const PART_SHEET_VIEWS: Record<PartId, {
  view: DrawingView;
  label: string;
  horizontal: "length" | "width" | "height";
  vertical: "length" | "width" | "height";
}> = {
  front: { view: "front", label: "Front elevation", horizontal: "length", vertical: "height" },
  sides: { view: "side", label: "Side elevation", horizontal: "length", vertical: "height" },
  rear: { view: "rear", label: "Rear elevation", horizontal: "length", vertical: "height" },
  wing: { view: "rear", label: "Rear elevation", horizontal: "length", vertical: "height" },
  hood: { view: "top", label: "Top plan", horizontal: "length", vertical: "width" },
  "front-fender": { view: "side", label: "Side elevation", horizontal: "length", vertical: "height" },
  "rear-fender": { view: "side", label: "Side elevation", horizontal: "length", vertical: "height" },
};

/** Storage key for a part's close-up drawing (car views use their DrawingView name). */
export type DrawingKey = DrawingView | `part:${PartId}`;
export const partKey = (id: PartId): DrawingKey => `part:${id}`;

/** Photoreal angles produced from the approved drawings. */
export const RENDER_ANGLES = ["front-three-quarter", "side-profile", "rear-three-quarter", "front-elevation"] as const;
export type RenderAngle = (typeof RENDER_ANGLES)[number];
export const RENDER_ANGLE_LABELS: Record<RenderAngle, string> = {
  "front-three-quarter": "Front 3/4 hero",
  "side-profile": "Side profile",
  "rear-three-quarter": "Rear 3/4",
  "front-elevation": "Front elevation",
};

const VEHICLE_CATEGORIES = [
  "sports-coupe", "hypercar", "suv", "muscle", "sedan", "grand-tourer",
  "wagon", "classic", "pickup", "hatchback", "crossover", "minivan",
] as const;
const BODY_STYLES = ["sedan", "hatchback", "coupe", "convertible", "wagon", "suv", "truck"] as const;
const REAR_AERO = ["gt-wing", "duck-tail", "boot-lip", "roofline-lip", "deck-lid-lip", "bed-rail-spoiler", "none"] as const;
const WING_MOUNTINGS = ["swan-neck", "pedestal", "trunk-mount"] as const;

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PartConfigSchema = z.object({
  included: z.boolean(),
  finish: z.enum(["carbon", "body"]),
}).strict();

export const BuildConfigSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(80),
  category: z.enum(VEHICLE_CATEGORIES),
  bodyStyle: z.enum(BODY_STYLES),
  kitStyleId: z.string().min(1).max(60),
  kitStyleLabel: z.string().min(1).max(80),
  parts: z.object(Object.fromEntries(PART_IDS.map(id => [id, PartConfigSchema])) as Record<PartId, typeof PartConfigSchema>).strict(),
  carbonMaterialId: z.string().min(1).max(40),
  paint: z.object({
    name: z.string().min(1).max(80),
    hex,
    hex2: hex.optional(),
    shiftLabel: z.string().max(40).optional(),
  }).strict(),
  rim: z.object({
    styleId: z.string().min(1).max(40),
    styleName: z.string().min(1).max(60),
    size: z.string().min(1).max(10),
    colorName: z.string().min(1).max(40),
    colorHex: hex,
  }).strict(),
  wideBody: z.boolean(),
  rearAero: z.enum(REAR_AERO),
  wingMounting: z.enum(WING_MOUNTINGS).optional(),
}).strict();

export type BuildConfig = z.infer<typeof BuildConfigSchema>;
export type RearAero = BuildConfig["rearAero"];

export interface DrawingDto {
  view: DrawingView;
  revision: number;
  url: string;
  updatedAt: string;
}

export interface PartSheetDto {
  partId: PartId;
  revision: number;
  /** The AI close-up line drawing on its own. */
  drawingUrl: string;
  /** The measured production sheet (SVG): drawing + dimension lines + title block. */
  sheetUrl: string;
  dimensions: { length: number; width: number; height: number };
  estimateSource: "ai" | "estimate";
}

export interface DrawingSetDto {
  id: number;
  status: "draft" | "approved";
  configSignature: string;
  /** True when the build config changed after these drawings were made. */
  stale: boolean;
  notes: string | null;
  approvedAt: string | null;
  drawings: DrawingDto[];
  /** Close-up measured sheets, one per included kit part. */
  parts: PartSheetDto[];
}

export interface RenderDto {
  angle: RenderAngle;
  url: string;
  createdAt: string;
  /** False when the render predates the latest drawing approval (made from older drawings). */
  current: boolean;
}

export interface JobDto {
  kind: "drawings" | "redraw" | "renders";
  /** Views or angles still being generated. */
  pending: string[];
  failed: Array<{ item: string; error: string }>;
  startedAt: string;
  done: boolean;
}

export interface BuildSummaryDto {
  id: number;
  name: string;
  updatedAt: string;
  stage: "configure" | "drawings" | "approved" | "rendered";
  thumbnailUrl: string | null;
}

export interface BuildDto {
  id: number;
  name: string;
  config: BuildConfig;
  configSignature: string;
  createdAt: string;
  updatedAt: string;
  drawingSet: DrawingSetDto | null;
  renders: RenderDto[];
  job: JobDto | null;
}

export interface UsageDto {
  aiMode: "live" | "mock";
  imagesToday: number;
  dailyImageLimit: number;
  drawingQuality: string;
  renderQuality: string;
  storage: "postgres" | "memory";
}

export interface ApiError {
  error: string;
  code: string;
}
