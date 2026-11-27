/**
 * Prompt assembly for the two-stage pipeline:
 *   1. Drawings — cheap, low-quality orthographic line art that must still read
 *      as the real production car.
 *   2. Renders  — high-quality photographs made by editing / re-posing the
 *      approved drawings, so geometry follows what the user signed off.
 *
 * Vehicle, kit, paint and aero wording comes from the ported car-rules module
 * instead of a chain of LLM "agent" briefs.
 */
import type { ConditioningImage, Img } from "../ai";
import type { DrawingProfile } from "../vehicles/library";
import type { VehiclePhotoView } from "../../shared/vehicles";
import {
  buildAeroMountingRules,
  buildStandardPrompt,
  buildVanguardConceptPrompt,
  getCuratedSignatureCuesForModel,
  getRearAeroSpec,
  VANGUARD_DIAMOND_WEAVE_DEF,
  type AngleKey,
  type BodyStyle,
  type KitPartFinishes,
} from "../../shared/car-rules";
import {
  DRAWING_VIEW_LABELS,
  PART_IDS,
  PART_LABELS,
  PART_SHEET_VIEWS,
  type BuildConfig,
  type DrawingView,
  type PartId,
  type RenderAngle,
  RENDER_ANGLE_LABELS,
} from "../../shared/types";

import { CF_MATERIALS, getHondaFactoryVariant, type CfMaterial } from "../../shared/catalog";

export function vehicleName(config: BuildConfig): string {
  const variant = getHondaFactoryVariant(config.make, config.model, config.year, config.trim);
  return `${config.year} ${config.make} ${config.model}${variant ? ` ${variant.label}` : ""}`;
}

function factoryVariantCue(config: BuildConfig): string | null {
  const variant = getHondaFactoryVariant(config.make, config.model, config.year, config.trim);
  return variant ? `FACTORY VARIANT: ${variant.promptCue}.` : null;
}

export function includedParts(config: BuildConfig) {
  return PART_IDS.filter(id => config.parts[id].included);
}

function kitFinishes(config: BuildConfig): KitPartFinishes {
  return Object.fromEntries(PART_IDS.map(id => [id, config.parts[id].finish]));
}

function kitDescription(config: BuildConfig): string {
  const parts = includedParts(config);
  if (parts.length === 0) return "stock factory bodywork with no aftermarket body kit";
  const list = parts.map(id => PART_LABELS[id].toLowerCase()).join(", ");
  return `the "${config.kitStyleLabel}" body kit (${list})${config.wideBody ? " with wide-body arch extensions" : ""}`;
}

/**
 * Wheel-arch rule. The ported Vanguard Custom prompt always describes a wide-body
 * stance with arch extensions, so without this a render adds flares the approved
 * drawings don't have. Wide-body builds get an explicit instruction instead.
 */
export function archSentence(config: BuildConfig): string {
  if (config.wideBody) {
    return "WHEEL ARCHES: WIDE-BODY SETUP — flared wheel-arch extensions on all four corners widening the body by roughly 60–100 mm per side, with a matching wider track so the tyres sit flush with the flare edges. Show the flares clearly in every view.";
  }
  const fenders = config.parts["front-fender"].included || config.parts["rear-fender"].included;
  if (fenders) {
    return "WHEEL ARCHES: the fender parts follow the contour shown in the drawings at factory body width — no added wide-body flare width, no riveted over-fenders.";
  }
  return "WHEEL ARCHES: factory wheel arches and factory body width exactly as in the drawings — NO wide-body conversion, NO fender flares, NO arch extensions, NO riveted over-fenders. This overrides any wide-body or arch-extension wording in the brief.";
}

/**
 * Phrases in the ported briefs (Vanguard concept prompt and creative lanes) that
 * assume a wide-body conversion. Removed when the build is not wide-body, so the
 * brief no longer contradicts the approved drawings. Factory features in model
 * signature cues (e.g. an RS model's blistered arches) are deliberately untouched.
 */
const WIDE_BODY_REWRITES: Array<[RegExp, string]> = [
  [/aggressive wide-body fender flares (?:painted in matching body color|with exposed carbon weave) \(\+60–80 mm per side\),\s*/g, ""],
  [/wide-body fender flares over the wheel arches,\s*/g, ""],
  [/,\s*wide-body stance/g, ""],
  [/overfenders show bolt-head shadow detail;\s*/g, ""],
  [/tyres stretched flush with the overfender lip/g, "tyres flush with the factory arch lip"],
  [/All arch extensions, bumper extensions,/g, "All bumper extensions,"],
  [/All arch extensions and aero surfaces/g, "All aero surfaces"],
  [/diffuser, fender flares, vented hood/g, "diffuser, vented hood"],
  [/with pumped fender flares, /g, "with "],
  [/\b(?:pumped|widened) (arches|rear hips)/g, "$1"],
  [/widebody shoulder/g, "body shoulder"],
];

export function stripWideBody(text: string): string {
  return WIDE_BODY_REWRITES.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text);
}

function rearAeroSentence(config: BuildConfig): string {
  if (!config.parts.wing.included || config.rearAero === "none") return "No rear wing or spoiler.";
  const spec = getRearAeroSpec(config.rearAero, config.wingMounting);
  return `Rear aero: ${spec.name} — ${spec.description} Mounted on ${spec.mountingSurface} using ${spec.mountingHardware}.`;
}

const VIEW_DIRECTIVES: Record<DrawingView, string> = {
  side: "true orthographic SIDE ELEVATION from the driver side, camera perpendicular to the doors, no perspective, whole car with both wheels fully visible",
  front: "true orthographic FRONT ELEVATION, camera dead-centre at headlight height, perfectly symmetrical, no perspective",
  rear: "true orthographic REAR ELEVATION, camera dead-centre at tail-light height, perfectly symmetrical, no perspective",
  top: "true orthographic TOP PLAN view looking straight down at the roof, nose pointing left, no perspective",
};

/** Line-art drawing of one view. Kept short on purpose: it is a low-quality, low-cost call. */
export function drawingPrompt(config: BuildConfig, view: DrawingView, notes?: string | null, profile?: DrawingProfile | null): string {
  const signatureCues = getCuratedSignatureCuesForModel(config.make, config.model);
  const lines = [
    `Clean black-and-white automotive technical line drawing (design blueprint style) of a ${vehicleName(config)} ${config.bodyStyle}.`,
    `View: ${VIEW_DIRECTIVES[view]}.`,
    `IDENTITY IS MANDATORY: it must be instantly recognisable as the real production ${config.make} ${config.model} — exact factory silhouette, roofline and greenhouse, wheelbase and overhangs, headlight, grille, tail-light and window shapes. Do not invent a generic car.`,
    factoryVariantCue(config),
    signatureCues
      ? `CURATED MODEL SHAPE CUES: ${signatureCues.map((cue, index) => `${index + 1}) ${cue}`).join(" ")} Follow these factory details for the selected model and year.`
      : null,
    ...profileLines(profile),
    `Fitted with ${kitDescription(config)}. Draw every kit part with clear, accurate outlines in its real mounting position.`,
    rearAeroSentence(config),
    archSentence(config),
    `Wheels: ${config.rim.size} ${config.rim.styleName} design, spoke pattern drawn in line work.`,
    buildAeroMountingRules(config.bodyStyle as BodyStyle),
    `DRAWING STYLE: pure white background; thin, precise, uniform black ink lines; visible edges solid, hidden edges dashed; no shading, no gradients, no colour, no paint, no reflections, no photo texture, no background scenery.`,
    `Only text allowed: a small label "${DRAWING_VIEW_LABELS[view].toUpperCase()}" in the lower-left corner. No logos, no watermarks, no dimensions.`,
  ].filter((line): line is string => !!line);
  if (notes?.trim()) {
    lines.push(`REVISIONS REQUESTED BY THE DESIGNER (apply exactly, change nothing else): ${notes.trim()}`);
  }
  return lines.join("\n");
}

/** Facts from the user-verified vehicle profile; empty when there is none. */
function profileLines(profile: DrawingProfile | null | undefined): string[] {
  if (!profile) return [];
  const d = profile.dimensions;
  const size = [
    d.lengthMm && `length ${d.lengthMm} mm`, d.widthMm && `width ${d.widthMm} mm`,
    d.heightMm && `height ${d.heightMm} mm`, d.wheelbaseMm && `wheelbase ${d.wheelbaseMm} mm`,
  ].filter(Boolean);
  const gen = profile.generation ? `${profile.generation} generation, ` : "";
  return [
    `VERIFIED VEHICLE PROFILE (${gen}model years ${profile.yearFrom}-${profile.yearTo}).` +
      (size.length ? ` Factory exterior size: ${size.join(", ")}; keep these proportions.` : ""),
    profile.signatureCues.length
      ? `VERIFIED DESIGN DETAILS: ${profile.signatureCues.map((cue, i) => `${i + 1}) ${cue}`).join(" ")}`
      : null,
    profile.faceliftNotes ? `MODEL-YEAR DETAILS: ${profile.faceliftNotes} Draw the version that matches the selected model year.` : null,
  ].filter((line): line is string => !!line);
}

/** Which reference photo best shows a drawing view. */
const PHOTO_PREFERENCE: Record<DrawingView, VehiclePhotoView[]> = {
  side: ["side", "three-quarter", "front", "rear"],
  front: ["front", "three-quarter", "side", "rear"],
  rear: ["rear", "three-quarter", "side", "front"],
  top: ["three-quarter", "side", "front", "rear"],
};

/** The side drawing is drawn first and anchors the other three views. */
export function drawingConditioning(
  view: DrawingView,
  sideDrawing: Img | null,
  previous: Img | null,
  profile?: DrawingProfile | null,
): ConditioningImage[] {
  const out: ConditioningImage[] = [];
  // One real photo of the stock car, when the user added any to a verified profile: the strongest identity anchor.
  const photo = PHOTO_PREFERENCE[view].map(v => profile?.photos.find(p => p.view === v)).find(Boolean);
  if (photo) {
    out.push({
      data: photo.data, mime: photo.mime, role: "reference", label: `photo of the real car (${photo.view})`,
      directive: "This is a photograph of the real production car. Match its factory body shape, proportions, lights, grille and window shapes. Ignore its colour, wheels, background, reflections and any aftermarket parts, and keep the line-drawing style.",
    });
  }
  if (previous) {
    out.push({
      ...previous, role: "base", label: `current ${DRAWING_VIEW_LABELS[view].toLowerCase()} drawing`,
      directive: "This is the current drawing. Keep its view, framing and line style and apply only the requested revisions.",
    });
  }
  if (view !== "side" && sideDrawing) {
    out.push({
      ...sideDrawing, role: "reference", label: "approved side elevation",
      directive: "This is the same car and kit seen from the side. Match its body shape, proportions, wheels and every kit part exactly; do not copy its viewing angle.",
    });
  }
  return out;
}

// ─── Close-up part drawings ─────────────────────────────────────────────────

const PART_SHAPE_HINTS: Record<PartId, string> = {
  front: "the complete front bumper fascia with splitter blade, intakes and canards, removed from the car",
  sides: "one side skirt / rocker extension, removed from the car",
  rear: "the complete rear bumper with diffuser and exhaust cut-outs, removed from the car",
  wing: "the rear spoiler / wing assembly (including any stanchions), removed from the car",
  hood: "the vented hood panel, removed from the car",
  "front-fender": "one front fender panel / arch extension, removed from the car",
  "rear-fender": "one rear fender / quarter arch extension, removed from the car",
};

/**
 * Close-up line drawing of one kit part. Deliberately text-free: the app draws
 * dimension lines and values on top, because image models garble numbers.
 */
export function partDrawingPrompt(config: BuildConfig, partId: PartId, notes?: string | null, mountingPoints?: number): string {
  const sheet = PART_SHEET_VIEWS[partId];
  const lines = [
    `Clean black-and-white technical line drawing of a single aftermarket body-kit part: ${PART_SHAPE_HINTS[partId]}, for a ${vehicleName(config)} with ${kitDescription(config)}.`,
    factoryVariantCue(config),
    `View: ${VIEW_DIRECTIVES[sheet.view]} — of the PART ONLY, isolated, not attached to the car.`,
    `The part must match the shape, proportions and details of this part in the attached approved car drawing exactly.`,
    partId === "wing" ? rearAeroSentence(config) : null,
    partId === "front-fender" || partId === "rear-fender" ? archSentence(config) : null,
    // Matches the mounting-point count printed in the sheet's title block.
    mountingPoints !== undefined && mountingPoints > 0
      ? `MOUNTING POINTS: show exactly ${mountingPoints} mounting holes in total (small circles on the mounting flanges or tabs, spread where this part would bolt or clip to the car) — no more, no fewer.`
      : null,
    `FRAMING: the part is centred and fills about 80% of the frame width with clear white margins on every side; nothing else in the frame — no car body, no wheels, no ground line, no background.`,
    `DRAWING STYLE: pure white background; thin, precise, uniform black ink lines; visible edges solid, hidden edges dashed, mounting holes as small circles; no shading, no colour, no texture.`,
    `ABSOLUTELY NO TEXT: no labels, no numbers, no dimension lines, no arrows, no title block, no logos.`,
  ].filter((line): line is string => !!line);
  if (notes?.trim()) lines.push(`REVISIONS REQUESTED BY THE DESIGNER (apply exactly, change nothing else): ${notes.trim()}`);
  return lines.join("\n");
}

export function partConditioning(partId: PartId, carView: Img | null, previous: Img | null): ConditioningImage[] {
  const sheet = PART_SHEET_VIEWS[partId];
  const out: ConditioningImage[] = [];
  if (previous) {
    out.push({
      ...previous, role: "base", label: `current ${PART_LABELS[partId].toLowerCase()} drawing`,
      directive: "This is the current part drawing. Keep its view, framing and line style and apply only the requested revisions.",
    });
  }
  if (carView) {
    out.push({
      ...carView, role: "reference", label: `approved ${DRAWING_VIEW_LABELS[sheet.view].toLowerCase()} of the whole car`,
      directive: `Find the ${PART_LABELS[partId].toLowerCase()} in this drawing and draw only that part, matching its exact shape and details.`,
    });
  }
  return out;
}

// ─── Renders ────────────────────────────────────────────────────────────────

/** Which drawing becomes the edit base for each render angle (others are references). */
export const RENDER_BASE_VIEW: Record<RenderAngle, DrawingView | null> = {
  "front-elevation": "front",
  "side-profile": "side",
  "front-three-quarter": null,
  "rear-three-quarter": null,
};

const RENDER_REFERENCE_VIEWS: Record<RenderAngle, DrawingView[]> = {
  "front-elevation": ["side"],
  "side-profile": ["front", "rear"],
  "front-three-quarter": ["side", "front", "top"],
  "rear-three-quarter": ["side", "rear", "top"],
};

const LEGACY_ANGLE: Record<RenderAngle, AngleKey | null> = {
  "front-elevation": "front-elevation",
  "side-profile": "side-profile",
  "rear-three-quarter": "rear-three-quarter",
  // null = the ported builders' default "dramatic three-quarter front perspective".
  "front-three-quarter": null,
};

export function renderPrompt(config: BuildConfig, angle: RenderAngle): string {
  const finishes = kitFinishes(config);
  const legacyAngle = LEGACY_ANGLE[angle];
  const rimDesc = `${config.rim.size} ${config.rim.styleName} wheels`;
  const brief = config.kitStyleId === "vanguard-custom"
    ? buildVanguardConceptPrompt(
        String(config.year), config.make, config.model, config.paint.name, config.paint.hex, rimDesc,
        legacyAngle, config.wideBody, config.bodyStyle as BodyStyle, config.paint.hex2, config.paint.shiftLabel,
        config.rim.colorName, config.rim.colorHex, config.kitStyleId, config.category, false, finishes,
        config.parts.wing.included ? config.rearAero : "none", undefined, undefined, config.wingMounting,
      )
    : buildStandardPrompt(
        String(config.year), config.make, config.model, config.paint.name, config.paint.hex, rimDesc,
        kitDescription(config), legacyAngle, config.bodyStyle as BodyStyle, config.paint.hex2, config.paint.shiftLabel,
        config.rim.colorName, config.rim.colorHex, false, finishes, undefined, config.category, config.kitStyleId,
      );
  const cf = carbonMaterial(config);
  const base = applyCarbonMaterial(config.wideBody ? brief : stripWideBody(brief), cf);
  const carbon = carbonMaterialBlock(config, cf);
  const arches = archSentence(config);
  // The ported brief only knows make and model, so name the exact car (trim included) here.
  const variant = factoryVariantCue(config);
  return [
    `GEOMETRY SOURCE OF TRUTH: the attached technical line drawings were approved by the designer. ` +
      `The car's body shape, proportions, wheel design and every body-kit part's shape, size and position must match those drawings exactly. ` +
      `Do not add, remove or restyle any part that is not in the drawings. ${rearAeroSentence(config)}` +
      (arches ? ` ${arches}` : "") +
      `\nVEHICLE: ${vehicleName(config)}.${variant ? ` ${variant}` : ""}`,
    base,
    ...(carbon ? [carbon] : []),
    ...(config.paint.finish ? [paintFinishBlock(config)] : []),
    // Repeated last: the ported brief above can describe a wide-body stance, and the final instruction should win.
    ...(arches ? [`FINAL CHECK — ${arches}`] : []),
  ].join("\n\n");
}

/** Custom paints from the Koncept Paint library carry a finish the paint name alone doesn't say. */
export function paintFinishBlock(config: BuildConfig): string {
  return `PAINT FINISH — ${config.paint.name}: ${config.paint.finish}. ` +
    `Reproduce this finish on every painted surface: the clear-coat sheen, any metallic flake, pearl or effect pigment, and candy depth.`;
}

export function carbonMaterial(config: BuildConfig): CfMaterial {
  return CF_MATERIALS.find(m => m.id === config.carbonMaterialId) ?? CF_MATERIALS[0]!;
}

/**
 * The ported brief describes every carbon part as one fixed "Vanguard diamond-weave",
 * whatever material was chosen. Swap in the chosen material, and for forged carbon,
 * which has no weave, drop the weave wording too.
 */
export function applyCarbonMaterial(text: string, cf: CfMaterial): string {
  let out = text
    .split(VANGUARD_DIAMOND_WEAVE_DEF).join(`${cf.name} (${cf.render})`)
    .replace(/\(see Vanguard diamond-weave spec\)/g, "(see the CARBON MATERIAL spec)")
    .replace(/diamond-weave pattern/g, `${cf.name.toLowerCase()} pattern`);
  if (cf.pattern === "random") {
    out = out
      .replace(/exact weave geometry on the carbon/g, "the random forged flake pattern on the carbon")
      .replace(/(?:visible )?weave pattern under gloss/g, "random forged marbling under gloss")
      .replace(/the weave pattern/g, "the forged marbling")
      .replace(/carbon(?:[- ]fib(?:er|re))? weave(?: pattern| texture)?/gi, "forged carbon marbling");
  }
  return out;
}

/** Stated on its own so the material is unmistakable; empty when no included part is exposed carbon. */
export function carbonMaterialBlock(config: BuildConfig, cf = carbonMaterial(config)): string | null {
  const parts = includedParts(config).filter(id => config.parts[id].finish === "carbon");
  if (parts.length === 0) return null;
  const list = parts.map(id => PART_LABELS[id].toLowerCase()).join(", ");
  return `CARBON MATERIAL — ${cf.name.toUpperCase()}: every exposed-carbon part (${list}) is ${cf.render}. ` +
    `Use this one material on all of them, and do not substitute any other carbon pattern.`;
}

/** A finished render of another angle of the same build, used to keep paint and materials consistent. */
export interface FinishReference extends Img { angle: RenderAngle }

/** At most this many finished renders go with each render, to keep input cost down. */
export const MAX_FINISH_REFERENCES = 2;

/**
 * Line drawings carry no colour or finish, so on their own every angle guesses which
 * parts are carbon. Renders already made for this build (the ones the designer kept
 * first) are sent along so the new angle matches them.
 */
export function renderConditioning(
  angle: RenderAngle,
  drawings: Partial<Record<DrawingView, Img>>,
  finishReferences: FinishReference[] = [],
): ConditioningImage[] {
  const out: ConditioningImage[] = [];
  const baseView = RENDER_BASE_VIEW[angle];
  if (baseView && drawings[baseView]) {
    out.push({
      ...drawings[baseView]!, role: "base", label: `approved ${DRAWING_VIEW_LABELS[baseView].toLowerCase()} drawing`,
      directive: "Turn this line drawing into a photograph from exactly this viewpoint. Keep the silhouette, proportions, framing and every kit outline; add paint, materials, lighting and a studio setting.",
    });
  }
  for (const view of RENDER_REFERENCE_VIEWS[angle]) {
    const drawing = drawings[view];
    if (!drawing) continue;
    out.push({
      ...drawing, role: "reference", label: `approved ${DRAWING_VIEW_LABELS[view].toLowerCase()} drawing`,
      directive: "Geometry reference for the same car and kit. Match its shapes exactly; do not copy its viewing angle or line-art style.",
    });
  }
  for (const ref of finishReferences.filter(r => r.angle !== angle).slice(0, MAX_FINISH_REFERENCES)) {
    out.push({
      data: ref.data, mime: ref.mime, role: "reference",
      label: `approved ${RENDER_ANGLE_LABELS[ref.angle].toLowerCase()} render of this same build`,
      directive: "FINISH REFERENCE — this is the same car already photographed from another angle. Match it exactly: " +
        "the paint colour and finish, which kit parts are exposed carbon and which are painted body colour, the carbon pattern, " +
        "the wheel and trim finishes, and the setting and lighting mood. Take shapes from the approved drawings, " +
        "not from this photo, and do not copy its viewing angle.",
    });
  }
  return out;
}
