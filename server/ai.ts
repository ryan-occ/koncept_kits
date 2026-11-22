/**
 * The only module that talks to OpenAI. Everything else asks for "an image from
 * this prompt (+ conditioning images)" or "JSON from this prompt".
 *
 * In mock mode (AI_MODE=mock, or no OPENAI_API_KEY) it returns labelled SVG
 * placeholders so the whole flow can be exercised without spending tokens.
 */
import OpenAI, { toFile } from "openai";
import { env, type ImageQuality } from "./env";

export interface Img {
  data: Buffer;
  mime: string;
}

export interface ConditioningImage extends Img {
  /** "base": the frame the model edits in place. "reference": identity/geometry anchor only. */
  role: "base" | "reference";
  label: string;
  directive: string;
}

export interface ImageRequest {
  prompt: string;
  quality: ImageQuality;
  conditioning?: ConditioningImage[];
  /** Shown on mock placeholders. */
  /** What is being made; used for placeholders in mock mode. */
  kind: "drawing" | "render";
  mockLabel?: string;
  signal?: AbortSignal;
}

export interface ImageResult extends Img {
  inputTokens: number;
  outputTokens: number;
}

export class AiError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
    this.name = "AiError";
  }
}

export interface AiProvider {
  readonly mode: "live" | "mock";
  image(request: ImageRequest): Promise<ImageResult>;
  json(prompt: string, signal?: AbortSignal): Promise<{ value: unknown; inputTokens: number; outputTokens: number }>;
}

let cachedClient: OpenAI | null = null;
function client(): OpenAI {
  if (!env.openaiKey) throw new AiError("OPENAI_API_KEY is not set.", 503, "AI_NOT_CONFIGURED");
  cachedClient ??= new OpenAI({ apiKey: env.openaiKey, maxRetries: 1, timeout: 180_000 });
  return cachedClient;
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  const source = error as { status?: number; message?: string };
  const message = error instanceof Error ? error.message : String(error);
  if (/insufficient_quota|billing|spend.?cap/i.test(message)) {
    return new AiError("OpenAI account has no remaining credit.", 402, "AI_QUOTA");
  }
  if (source.status === 429) return new AiError("OpenAI is rate limiting requests. Try again shortly.", 429, "AI_RATE_LIMIT");
  if (/safety|content.?policy|moderation/i.test(message)) {
    return new AiError("The image request was blocked by the content filter.", 422, "AI_BLOCKED");
  }
  return new AiError(`Image provider error: ${message.slice(0, 200)}`, 502, "AI_UPSTREAM");
}

/** Conditioning images are labelled in the prompt in the order they are sent. */
export function composePrompt(prompt: string, conditioning: ConditioningImage[] = []): string {
  if (conditioning.length === 0) return prompt;
  const lines = conditioning.map((image, index) =>
    `INPUT IMAGE ${index + 1} — ${image.role === "base" ? "BASE" : "REFERENCE"} (${image.label}): ${image.directive}`);
  return `${lines.join("\n")}\n\n${prompt}`;
}

/** Bases go first: they are the frame the edit starts from. */
export function orderConditioning(conditioning: ConditioningImage[] = []): ConditioningImage[] {
  return [...conditioning.filter(c => c.role === "base"), ...conditioning.filter(c => c.role === "reference")];
}

const live: AiProvider = {
  mode: "live",
  async image({ prompt, quality, conditioning, signal }) {
    const ordered = orderConditioning(conditioning);
    const fullPrompt = composePrompt(prompt, ordered);
    try {
      const api = client();
      const response = ordered.length
        ? await api.images.edit({
            model: env.imageModel,
            image: await Promise.all(ordered.map((image, index) =>
              toFile(image.data, `input-${index}.${image.mime.split("/")[1] ?? "png"}`, { type: image.mime }))),
            prompt: fullPrompt,
            size: "1536x1024",
            quality,
          }, { signal })
        : await api.images.generate({
            model: env.imageModel,
            prompt: fullPrompt,
            size: "1536x1024",
            quality,
          }, { signal });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new AiError("The image provider returned no image.", 502, "AI_EMPTY");
      const usage = response.usage as { input_tokens?: number; output_tokens?: number } | undefined;
      return {
        data: Buffer.from(b64, "base64"),
        mime: "image/png",
        inputTokens: usage?.input_tokens ?? 0,
        outputTokens: usage?.output_tokens ?? 0,
      };
    } catch (error) {
      throw toAiError(error);
    }
  },
  async json(prompt, signal) {
    try {
      const response = await client().chat.completions.create({
        model: env.textModel,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      }, { signal });
      const text = response.choices[0]?.message.content ?? "";
      return {
        value: JSON.parse(text),
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      };
    } catch (error) {
      throw toAiError(error);
    }
  },
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[ch]!));
}

export function mockImage(label: string, kind: "drawing" | "render"): Img {
  const drawing = kind === "drawing";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">` +
    `<rect width="1536" height="1024" fill="${drawing ? "#ffffff" : "#1e293b"}"/>` +
    `<g fill="none" stroke="${drawing ? "#0f172a" : "#ef4444"}" stroke-width="${drawing ? 3 : 6}">` +
    `<path d="M240 640 L330 520 Q420 420 620 400 L980 400 Q1120 410 1220 520 L1300 640 Z"/>` +
    `<circle cx="470" cy="660" r="95"/><circle cx="1090" cy="660" r="95"/>` +
    `<line x1="180" y1="760" x2="1360" y2="760" stroke-dasharray="${drawing ? "14 10" : "0"}"/></g>` +
    `<text x="768" y="190" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="700" fill="${drawing ? "#0f172a" : "#f8fafc"}">${escapeXml(label)}</text>` +
    `<text x="768" y="250" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="${drawing ? "#475569" : "#94a3b8"}">MOCK ${drawing ? "DRAWING" : "RENDER"} · set OPENAI_API_KEY for real images</text>` +
    `</svg>`;
  return { data: Buffer.from(svg), mime: "image/svg+xml" };
}

const mock: AiProvider = {
  mode: "mock",
  async image({ mockLabel, kind }) {
    return { ...mockImage(mockLabel ?? "Image", kind), inputTokens: 0, outputTokens: 0 };
  },
  async json() {
    return { value: {}, inputTokens: 0, outputTokens: 0 };
  },
};

export function createAiProvider(): AiProvider {
  return env.aiMode === "live" ? live : mock;
}
