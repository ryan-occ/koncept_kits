import { z } from "zod";
import type { LibraryPaintDto, PaintLibraryDto } from "../shared/types";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const LibraryPaint = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(80),
  hex,
  hex2: hex.optional(),
  shiftLabel: z.string().trim().min(1).max(40).optional(),
  finish: z.string().max(300),
  updatedAt: z.string(),
});

/** At most this many paints are accepted from Koncept Paint in one list. */
const MAX_PAINTS = 1000;

const ExportBody = z.object({ paints: z.array(z.unknown()).max(MAX_PAINTS) });

export interface PaintLibraryOptions {
  url: string | null;
  key: string | null;
  fetch?: typeof fetch;
  /** How long a good list is reused before asking Koncept Paint again. */
  cacheMs?: number;
  timeoutMs?: number;
}

/**
 * Reads the Koncept Paint app's shared paint library (GET /api/library/export with a bearer key).
 * Builds copy the chosen paint into their config, so renders never depend on Koncept Paint being up.
 */
export class PaintLibrary {
  private readonly fetchImpl: typeof fetch;
  private readonly cacheMs: number;
  private readonly timeoutMs: number;
  private readonly endpoint: URL | null;
  private readonly configError: string | null;
  private last: { paints: LibraryPaintDto[]; at: number } | null = null;
  private pending: Promise<PaintLibraryDto> | null = null;

  constructor(private readonly options: PaintLibraryOptions) {
    this.fetchImpl = options.fetch ?? fetch;
    this.cacheMs = options.cacheMs ?? 60_000;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    const { endpoint, error } = PaintLibrary.endpointFor(options.url);
    this.endpoint = endpoint;
    this.configError = error;
  }

  get configured(): boolean {
    return !!this.endpoint && !!this.options.key;
  }

  private static endpointFor(raw: string | null): { endpoint: URL | null; error: string | null } {
    if (!raw) return { endpoint: null, error: null };
    try {
      const base = new URL(raw);
      const local = base.hostname === "localhost" || base.hostname === "127.0.0.1";
      if (base.protocol !== "https:" && !(local && base.protocol === "http:")) {
        return { endpoint: null, error: "PAINT_LIBRARY_URL must start with https://." };
      }
      return { endpoint: new URL("/api/library/export", base), error: null };
    } catch {
      return { endpoint: null, error: "PAINT_LIBRARY_URL is not a valid web address." };
    }
  }

  async list(options: { refresh?: boolean } = {}): Promise<PaintLibraryDto> {
    if (this.configError) return { status: "not-configured", paints: [], message: this.configError };
    if (!this.configured) {
      return {
        status: "not-configured",
        paints: [],
        message: "Add PAINT_LIBRARY_URL and PAINT_LIBRARY_KEY in Replit Secrets to use Koncept Paint's library.",
      };
    }
    if (!options.refresh && this.last && Date.now() - this.last.at < this.cacheMs) {
      return { status: "ok", paints: this.last.paints };
    }
    // One request at a time, however many browsers ask.
    this.pending ??= this.fetchList().finally(() => { this.pending = null; });
    return this.pending;
  }

  private async fetchList(): Promise<PaintLibraryDto> {
    let res: Response;
    try {
      res = await this.fetchImpl(this.endpoint!, {
        headers: { Authorization: `Bearer ${this.options.key}`, Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
        redirect: "error",
      });
    } catch {
      return this.unavailable("Koncept Paint did not answer. It may be asleep or unpublished; try again in a minute.");
    }
    if (res.status === 401) return this.unavailable("Koncept Paint refused the key: PAINT_LIBRARY_KEY must match in both apps.");
    if (res.status === 503) return this.unavailable("Koncept Paint has no PAINT_LIBRARY_KEY set (it needs 32 or more characters).");
    if (!res.ok) return this.unavailable(`Koncept Paint answered with an error (${res.status}).`);

    const body = ExportBody.safeParse(await res.json().catch(() => null));
    if (!body.success) return this.unavailable("Koncept Paint sent a library this version can't read.");
    // Skip any single malformed paint instead of losing the whole list.
    const paints = body.data.paints.flatMap(raw => {
      const paint = LibraryPaint.safeParse(raw);
      if (!paint.success) return [];
      const { id, name, hex: main, hex2, shiftLabel, finish, updatedAt } = paint.data;
      return [{
        id, name, hex: main.toLowerCase(), updatedAt, finish: finish.trim(),
        ...(hex2 ? { hex2: hex2.toLowerCase() } : {}),
        // Kits only describes a colour shift when there is a second colour to shift to.
        ...(hex2 && shiftLabel ? { shiftLabel } : {}),
      } satisfies LibraryPaintDto];
    });
    this.last = { paints, at: Date.now() };
    return { status: "ok", paints };
  }

  private unavailable(message: string): PaintLibraryDto {
    return { status: "unavailable", paints: this.last?.paints ?? [], message };
  }
}
