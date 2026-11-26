export type ImageQuality = "low" | "medium" | "high" | "auto";

function quality(name: string, fallback: ImageQuality): ImageQuality {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "low" || raw === "medium" || raw === "high" || raw === "auto" ? raw : fallback;
}

function positiveInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const env = {
  port: positiveInt("PORT", 5000),
  production: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL?.trim() || null,
  openaiKey: process.env.OPENAI_API_KEY?.trim() || null,
  passcode: process.env.PASSCODE?.trim() || null,
  sessionSecret: process.env.SESSION_SECRET?.trim() || null,
  /** "mock" forces placeholder images (no OpenAI spend); default is live when a key exists. */
  aiMode: (process.env.AI_MODE === "mock" || !process.env.OPENAI_API_KEY?.trim() ? "mock" : "live") as "mock" | "live",
  // Same models the Vanguard-Concept app already uses on this OpenAI account.
  imageModel: process.env.IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst",
  textModel: process.env.TEXT_MODEL?.trim() || "gpt-6-luna",
  drawingQuality: quality("DRAWING_QUALITY", "high"),
  renderQuality: quality("RENDER_QUALITY", "high"),
  dailyImageLimit: positiveInt("DAILY_IMAGE_LIMIT", 60),
  /** Koncept Paint's published address and shared key, for its paint library. */
  paintLibraryUrl: process.env.PAINT_LIBRARY_URL?.trim() || null,
  paintLibraryKey: process.env.PAINT_LIBRARY_KEY?.trim() || null,
};
