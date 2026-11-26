import { describe, expect, it, vi } from "vitest";
import { PaintLibrary } from "./paint-library";
import { renderPrompt } from "./domain/prompts";
import { defaultConfig } from "../shared/defaults";
import { BuildConfigSchema } from "../shared/types";

const KEY = "kits-test-key-0123456789abcdefghijklmnop";
const teal = { id: 1, name: "Teal metallic", hex: "#3E757C", finish: "gloss clear, medium metallic flake (65%)", updatedAt: "2026-11-26T10:00:00.000Z" };
const flip = { id: 2, name: "Oil-slick petrol", hex: "#11100f", hex2: "#347787", shiftLabel: "ghost blue / ghost green", finish: "gloss clear", updatedAt: "2026-11-26T10:00:00.000Z" };

const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function library(fetchImpl: typeof fetch, url = "https://konceptpaint.example.app") {
  return new PaintLibrary({ url, key: KEY, fetch: fetchImpl, cacheMs: 60_000 });
}

describe("PaintLibrary", () => {
  it("reports not configured without a URL or key", async () => {
    expect((await new PaintLibrary({ url: null, key: KEY }).list()).status).toBe("not-configured");
    expect((await new PaintLibrary({ url: "https://x.example", key: null }).list()).status).toBe("not-configured");
    const insecure = await new PaintLibrary({ url: "http://x.example", key: KEY }).list();
    expect(insecure).toMatchObject({ status: "not-configured", message: expect.stringMatching(/https/) });
  });

  it("asks Koncept Paint's export endpoint with the bearer key and normalises paints", async () => {
    const fetchImpl = vi.fn(async (_url: URL | RequestInfo, _init?: RequestInit) => reply(200, { paints: [teal, flip] }));
    const result = await library(fetchImpl as unknown as typeof fetch).list();
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe("https://konceptpaint.example.app/api/library/export");
    expect((init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    expect(result.status).toBe("ok");
    expect(result.paints[0]).toEqual({ ...teal, hex: "#3e757c" });
    expect(result.paints[1]).toMatchObject({ hex2: "#347787", shiftLabel: "ghost blue / ghost green" });
  });

  it("caches a good list, refreshes on request, and keeps it when Koncept Paint is down", async () => {
    let up = true;
    const fetchImpl = vi.fn(async () => {
      if (!up) throw new TypeError("fetch failed");
      return reply(200, { paints: [teal] });
    });
    const lib = library(fetchImpl as unknown as typeof fetch);
    await lib.list();
    await lib.list();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    up = false;
    const down = await lib.list({ refresh: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(down).toMatchObject({ status: "unavailable", paints: [{ name: "Teal metallic" }] });
  });

  it("explains a wrong key and skips malformed paints", async () => {
    expect(await library(async () => reply(401, { error: "no" })).list())
      .toMatchObject({ status: "unavailable", message: expect.stringMatching(/PAINT_LIBRARY_KEY must match/) });
    const mixed = await library(async () => reply(200, { paints: [teal, { ...flip, hex: "blue" }, { ...flip, id: 3, hex2: undefined }] })).list();
    expect(mixed.paints.map(p => p.id)).toEqual([1, 3]);
    expect(mixed.paints[1]!.shiftLabel).toBeUndefined();
  });
});

describe("library paint in a build", () => {
  it("is accepted by the build schema and described in render prompts", () => {
    const config = BuildConfigSchema.parse({
      ...defaultConfig(),
      paint: { name: "Candy apple red", hex: "#850412", finish: "gloss clear, fine metallic flake (85%), candy #B3071B (3 coats)" },
    });
    const prompt = renderPrompt(config, "side-profile");
    expect(prompt).toContain("PAINT FINISH — Candy apple red: gloss clear, fine metallic flake (85%), candy #B3071B (3 coats).");
    expect(prompt).toContain("#850412");
  });

  it("leaves factory paints' prompts without a finish block", () => {
    expect(renderPrompt(defaultConfig(), "side-profile")).not.toContain("PAINT FINISH");
  });
});
