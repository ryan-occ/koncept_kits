/**
 * Per-part production specs for the export package. One text-model call
 * (cheap compared to images) estimates dimensions for the included parts; if
 * it fails or returns junk, deterministic category estimates are used and the
 * package is clearly marked as estimated.
 */
import { z } from "zod";
import type { AiProvider } from "../ai";
import { CF_MATERIALS } from "../../shared/catalog";
import { PART_LABELS, type BuildConfig, type PartId } from "../../shared/types";
import { includedParts, vehicleName } from "./prompts";

export interface PartSpec {
  partId: PartId;
  name: string;
  dimensions: { length: number; width: number; height: number };
  thickness: number;
  weight: number;
  mountingPoints: number;
  surfaceFinish: string;
  material: { grade: string; layerCount: number; resinSystem: string };
  notes: string;
}

const mm = z.number().finite().positive().max(6000);
const AiSpec = z.object({
  partId: z.string(),
  length: mm, width: mm, height: mm,
  thickness: z.number().finite().positive().max(50),
  weightKg: z.number().finite().positive().max(200),
  mountingPoints: z.number().int().min(0).max(80),
  notes: z.string().max(400).default(""),
});
const AiResponse = z.object({ parts: z.array(AiSpec).max(20) });

/** Typical envelope (mm) and mass (kg) by part for a mid-size car; scaled by category. */
const BASE: Record<PartId, { l: number; w: number; h: number; kg: number; pts: number }> = {
  front: { l: 1850, w: 420, h: 380, kg: 4.2, pts: 14 },
  sides: { l: 1900, w: 140, h: 220, kg: 2.6, pts: 10 },
  rear: { l: 1820, w: 380, h: 360, kg: 3.8, pts: 12 },
  wing: { l: 1500, w: 300, h: 260, kg: 2.4, pts: 6 },
  hood: { l: 1450, w: 1350, h: 120, kg: 7.5, pts: 8 },
  "front-fender": { l: 1050, w: 160, h: 620, kg: 2.1, pts: 9 },
  "rear-fender": { l: 1150, w: 180, h: 600, kg: 2.3, pts: 9 },
};

const CATEGORY_SCALE: Record<BuildConfig["category"], number> = {
  "sports-coupe": 1, hypercar: 1.02, suv: 1.12, muscle: 1.05, sedan: 1, "grand-tourer": 1.04,
  wagon: 1.02, classic: 0.95, pickup: 1.15, hatchback: 0.92, crossover: 1.06, minivan: 1.1,
};

function material(config: BuildConfig, partId: PartId) {
  const cf = CF_MATERIALS.find(m => m.id === config.carbonMaterialId) ?? CF_MATERIALS[0]!;
  const painted = config.parts[partId].finish === "body";
  return {
    surfaceFinish: painted ? `Painted body colour — ${config.paint.name}` : `Exposed ${cf.name}, clear gloss`,
    material: { grade: cf.name, layerCount: partId === "hood" ? 4 : 3, resinSystem: "Epoxy, autoclave cure" },
  };
}

export function estimatePartSpecs(config: BuildConfig): PartSpec[] {
  const scale = CATEGORY_SCALE[config.category] * (config.wideBody ? 1.04 : 1);
  return includedParts(config).map(partId => {
    const base = BASE[partId];
    const widen = config.wideBody && (partId === "front-fender" || partId === "rear-fender") ? 1.35 : 1;
    return {
      partId,
      name: PART_LABELS[partId],
      dimensions: {
        length: Math.round(base.l * scale),
        width: Math.round(base.w * scale * widen),
        height: Math.round(base.h * scale),
      },
      thickness: partId === "hood" ? 3 : 2.5,
      weight: Math.round(base.kg * scale * widen * 10) / 10,
      mountingPoints: base.pts,
      ...material(config, partId),
      notes: "Rule-based estimate — verify against the vehicle before fabrication.",
    };
  });
}

export function partSpecPrompt(config: BuildConfig): string {
  const parts = includedParts(config).map(id => `- ${id}: ${PART_LABELS[id]}`).join("\n");
  return [
    `You are an automotive composites engineer. Estimate production dimensions for aftermarket body-kit parts on a ${vehicleName(config)} (${config.bodyStyle}, ${config.category})${config.wideBody ? " with a wide-body conversion" : ""}, kit style "${config.kitStyleLabel}".`,
    `Parts:\n${parts}`,
    `Use the real vehicle's published dimensions where you know them (overall width, wheelbase, track). Give each part's bounding envelope in millimetres (length = across/along the car as fitted, width = depth, height), laminate thickness in mm, finished weight in kg, number of mounting points, and one short note.`,
    `Reply with JSON only: {"parts":[{"partId":"front","length":0,"width":0,"height":0,"thickness":0,"weightKg":0,"mountingPoints":0,"notes":""}]}`,
  ].join("\n\n");
}

export async function generatePartSpecs(
  ai: AiProvider,
  config: BuildConfig,
): Promise<{ specs: PartSpec[]; source: "ai" | "estimate"; inputTokens: number; outputTokens: number }> {
  const estimates = estimatePartSpecs(config);
  if (ai.mode === "mock" || estimates.length === 0) return { specs: estimates, source: "estimate", inputTokens: 0, outputTokens: 0 };
  try {
    const result = await ai.json(partSpecPrompt(config));
    const parsed = AiResponse.parse(result.value);
    const byId = new Map(parsed.parts.map(p => [p.partId, p]));
    // Every included part must come back; otherwise fall back wholesale so the package is consistent.
    if (!estimates.every(e => byId.has(e.partId))) throw new Error("incomplete part list");
    const specs = estimates.map(estimate => {
      const ai = byId.get(estimate.partId)!;
      return {
        ...estimate,
        dimensions: { length: Math.round(ai.length), width: Math.round(ai.width), height: Math.round(ai.height) },
        thickness: ai.thickness,
        weight: Math.round(ai.weightKg * 10) / 10,
        mountingPoints: ai.mountingPoints,
        notes: `AI estimate — verify before fabrication. ${ai.notes}`.trim(),
      };
    });
    return { specs, source: "ai", inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  } catch (error) {
    console.warn("[part-specs] falling back to rule-based estimates:", error instanceof Error ? error.message : error);
    return { specs: estimates, source: "estimate", inputTokens: 0, outputTokens: 0 };
  }
}
