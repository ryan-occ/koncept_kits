/**
 * AI research for one model generation: what the generation is called, its
 * years, exterior size, signature design details and facelift changes.
 * The answer is a draft; the user verifies it before drawings use it.
 */
import { z } from "zod";
import type { AiProvider } from "../ai";
import { getCuratedSignatureCuesForModel } from "../../shared/car-rules";
import type { VehicleDimensions, VehicleRef, VehicleSource } from "../../shared/vehicles";

export interface ResearchedProfile {
  yearFrom: number;
  yearTo: number;
  generation: string | null;
  dimensions: VehicleDimensions;
  signatureCues: string[];
  faceliftNotes: string | null;
  sources: VehicleSource[];
  webSearch: boolean;
  inputTokens: number;
  outputTokens: number;
}

export function researchPrompt(car: VehicleRef): string {
  return [
    `You are an automotive researcher. Find accurate facts about the production ${car.year} ${car.make} ${car.model}, using reliable sources (manufacturer sites, press kits, reputable automotive references).`,
    `Identify the model GENERATION that includes model year ${car.year}, and describe that generation only.`,
    `Reply with ONLY a JSON object, no prose, with these keys:`,
    `- "generation": the generation name or chassis code (e.g. "G82", "11th gen (FL)"), or null if unknown`,
    `- "yearFrom", "yearTo": first and last model years of that generation (integers; use the current year if still in production)`,
    `- "lengthMm", "widthMm", "heightMm", "wheelbaseMm": exterior dimensions in millimetres (width without mirrors), or null if not found`,
    `- "signatureCues": 3 to 5 short phrases describing permanent exterior shape details that make this exact model recognisable from the outside (grille, lights, body lines, vents, roofline). No colours, trims, wheels or interior.`,
    `- "faceliftNotes": one or two sentences on exterior changes made by a facelift within the generation, saying which years look which way, or null if there was none`,
    `- "sources": array of { "title", "url" } for the pages you used`,
    `If the car does not exist, still reply with JSON and set "generation" to null and "signatureCues" to [].`,
  ].join("\n");
}

const optionalMm = z.preprocess(
  v => (typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : v),
  z.number().finite(),
).transform(n => Math.round(n)).nullable().catch(null);

const Answer = z.object({
  generation: z.string().trim().max(80).nullable().catch(null),
  yearFrom: z.coerce.number().int().nullable().catch(null),
  yearTo: z.coerce.number().int().nullable().catch(null),
  lengthMm: optionalMm, widthMm: optionalMm, heightMm: optionalMm, wheelbaseMm: optionalMm,
  signatureCues: z.array(z.unknown()).catch([]),
  faceliftNotes: z.string().trim().max(1000).nullable().catch(null),
  sources: z.array(z.unknown()).catch([]),
}).partial();

const inRange = (n: number | null | undefined, min: number, max: number) => (n != null && n >= min && n <= max ? n : null);

/** Turns a model's JSON answer into safe profile fields; anything implausible is dropped rather than trusted. */
export function normalizeResearch(car: VehicleRef, raw: unknown, citedSources: VehicleSource[] = []): Omit<ResearchedProfile, "webSearch" | "inputTokens" | "outputTokens"> {
  const a = Answer.parse(raw && typeof raw === "object" ? raw : {});
  let yearFrom = inRange(a.yearFrom, 1900, car.year) ?? car.year;
  let yearTo = inRange(a.yearTo, car.year, 2100) ?? car.year;
  if (yearFrom > car.year) yearFrom = car.year;
  if (yearTo < car.year) yearTo = car.year;
  const cues = (a.signatureCues ?? [])
    .filter((c): c is string => typeof c === "string")
    .map(c => c.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 6);
  const sources = new Map<string, string>();
  for (const s of [...citedSources, ...(a.sources ?? [])]) {
    const src = s as { url?: unknown; title?: unknown };
    if (typeof src.url !== "string" || !/^https?:\/\//i.test(src.url)) continue;
    if (!sources.has(src.url)) sources.set(src.url, typeof src.title === "string" && src.title.trim() ? src.title.trim().slice(0, 200) : src.url);
  }
  return {
    yearFrom, yearTo,
    generation: a.generation || null,
    dimensions: {
      lengthMm: inRange(a.lengthMm, 2_000, 8_000),
      widthMm: inRange(a.widthMm, 1_200, 2_800),
      heightMm: inRange(a.heightMm, 900, 2_800),
      wheelbaseMm: inRange(a.wheelbaseMm, 1_500, 5_000),
    },
    signatureCues: cues,
    faceliftNotes: a.faceliftNotes || null,
    sources: [...sources].slice(0, 10).map(([url, title]) => ({ url, title })),
  };
}

export async function researchVehicle(ai: AiProvider, car: VehicleRef, signal?: AbortSignal): Promise<ResearchedProfile> {
  if (ai.mode === "mock") {
    // No AI spend in mock mode: a clearly incomplete draft built from what the app already knows.
    const cues = getCuratedSignatureCuesForModel(car.make, car.model);
    return {
      ...normalizeResearch(car, { signatureCues: cues ? [...cues] : [] }),
      faceliftNotes: "Mock mode: not researched. Set OPENAI_API_KEY to research this car, or fill the details in yourself.",
      webSearch: false, inputTokens: 0, outputTokens: 0,
    };
  }
  const prompt = researchPrompt(car);
  if (ai.research) {
    const result = await ai.research(prompt, signal);
    return { ...normalizeResearch(car, result.value, result.sources), webSearch: result.webSearch, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
  }
  const result = await ai.json(prompt, signal);
  return { ...normalizeResearch(car, result.value), webSearch: false, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
}
