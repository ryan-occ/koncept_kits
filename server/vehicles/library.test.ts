import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mockImage, type AiProvider, type ImageRequest, type ResearchResult } from "../ai";
import { apiRouter } from "../routes";
import { MemoryStore } from "../store";
import { Studio } from "../studio";
import { defaultConfig, withVehicle } from "../../shared/defaults";
import { drawingConditioning, drawingPrompt } from "../domain/prompts";
import { VehicleLibrary } from "./library";
import { newEntries, type FetchLike } from "./nhtsa";
import { normalizeResearch } from "./research";
import { MemoryVehicleStore } from "./store";

const PNG = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");

function researchingAi(answer: unknown = {
  generation: "Test gen", yearFrom: 2022, yearTo: 2026,
  lengthMm: 4500, widthMm: "1,850 mm", heightMm: 1400, wheelbaseMm: 99999,
  signatureCues: ["slim LED headlights", "fastback roofline", 42],
  faceliftNotes: "2025 facelift adds a wider grille.",
  sources: [{ title: "Maker", url: "https://maker.example/car" }, { url: "javascript:alert(1)" }],
}) {
  const prompts: string[] = [];
  const images: ImageRequest[] = [];
  const ai: AiProvider = {
    mode: "live",
    async image(req) { images.push(req); return { ...mockImage("x", req.kind), inputTokens: 1, outputTokens: 1 }; },
    async json() { return { value: {}, inputTokens: 0, outputTokens: 0 }; },
    async research(prompt): Promise<ResearchResult> {
      prompts.push(prompt);
      return { value: answer, sources: [{ title: "Cited", url: "https://cited.example/a" }], webSearch: true, inputTokens: 900, outputTokens: 200 };
    },
  };
  return { ai, prompts, images };
}

function setup(ai: AiProvider = researchingAi().ai, fetcher?: FetchLike) {
  const library = new VehicleLibrary(new MemoryVehicleStore(), ai, { fetcher, pauseMs: 0 });
  const studio = new Studio(new MemoryStore(), ai, { dailyImageLimit: 100 }, library);
  const app = express().use("/api", apiRouter(studio, library));
  return { library, studio, app };
}

describe("research answers", () => {
  it("keeps plausible facts and drops the rest", () => {
    const p = normalizeResearch({ make: "Acme", model: "Zed", year: 2024 }, {
      yearFrom: 2030, yearTo: 2010, lengthMm: 4500, widthMm: "1,850 mm", heightMm: 50, wheelbaseMm: null,
      signatureCues: ["a", 3, "  b  "], sources: [{ url: "ftp://x" }, { url: "https://ok.example", title: "" }],
    });
    expect(p.yearFrom).toBe(2024);
    expect(p.yearTo).toBe(2024);
    expect(p.dimensions).toEqual({ lengthMm: 4500, widthMm: 1850, heightMm: null, wheelbaseMm: null });
    expect(p.signatureCues).toEqual(["a", "b"]);
    expect(p.sources).toEqual([{ url: "https://ok.example", title: "https://ok.example" }]);
  });
});

describe("NHTSA check", () => {
  it("adds new model years for known models only, reusing the catalog's spelling", () => {
    const catalog = { BMW: { M4: [2024, 2025], M3: [2026] } };
    expect(newEntries(catalog, "BMW", 2026, ["m4", "M4", "M3", "540i", "X9"])).toEqual([
      { make: "BMW", model: "M4", year: 2026, source: "nhtsa" },
    ]);
  });

  it("stores what it finds and extends the catalog", async () => {
    const fetcher: FetchLike = async url => ({
      ok: true, status: 200,
      json: async () => ({ Results: url.includes("/make/Honda/") && url.includes("vehicletype/car") ? [{ Model_Name: "CIVIC" }, { Model_Name: "Prelude" }] : [] }),
    });
    const { library, app } = setup(researchingAi().ai, fetcher);
    await library.syncNow();
    const res = await request(app).get("/api/vehicles/catalog");
    const added: number[] = res.body.added.Honda.Civic;
    expect(added.length).toBeGreaterThan(0);
    for (const y of added) expect(res.body.catalog.Honda.Civic).toContain(y);
    expect(res.body.catalog.Honda.Prelude).toBeUndefined();
    expect(res.body.sync.lastAdded).toBeGreaterThan(0);
    expect(res.body.sync.lastError).toBeNull();
  });
});

describe("vehicle library", () => {
  it("adds a missing car, researches it, and only uses it in drawings once verified", async () => {
    const { ai, prompts, images } = researchingAi();
    const { library, studio, app } = setup(ai);

    const added = await request(app).post("/api/vehicles/catalog").send({ make: "honda", model: "Prelude", year: 2026 });
    expect(added.status).toBe(201);
    expect(added.body.car).toEqual({ make: "Honda", model: "Prelude", year: 2026 });
    expect(added.body.profile.research.state).toBe("running");
    await library.waitForResearch(added.body.profile.id);
    expect(prompts[0]).toContain("2026 Honda Prelude");

    const found = await request(app).get("/api/vehicles/profile").query({ make: "Honda", model: "Prelude", year: 2024 });
    expect(found.body).toMatchObject({
      status: "researched", generation: "Test gen", yearFrom: 2022, yearTo: 2026,
      dimensions: { lengthMm: 4500, widthMm: 1850, heightMm: 1400, wheelbaseMm: null },
      signatureCues: ["slim LED headlights", "fastback roofline"],
      research: { state: "idle" },
    });
    expect(found.body.sources.map((s: { url: string }) => s.url)).toEqual(["https://cited.example/a", "https://maker.example/car"]);

    // The added car is now a valid favourite.
    const favorite = await request(app).put("/api/favorites").send({ make: "Honda", model: "Prelude", year: 2026 });
    expect(favorite.status).toBe(201);

    const car = { make: "Honda", model: "Prelude", year: 2026 };
    expect(await library.forDrawing(car)).toBeNull();
    const id = found.body.id;
    const photo = await request(app).post(`/api/vehicles/profiles/${id}/photos?view=front`).set("Content-Type", "image/png").send(PNG);
    expect(photo.status).toBe(201);
    expect(photo.body.photos).toHaveLength(1);
    const served = await request(app).get(photo.body.photos[0].url);
    expect(served.headers["content-type"]).toBe("image/png");

    expect((await request(app).post(`/api/vehicles/profiles/${id}/verify`)).body.status).toBe("verified");
    const profile = await library.forDrawing(car);
    expect(profile?.photos.map(p => p.view)).toEqual(["front"]);

    const config = withVehicle(defaultConfig(), "Honda", "Prelude", 2026);
    const prompt = drawingPrompt(config, "front", null, profile);
    expect(prompt).toContain("VERIFIED VEHICLE PROFILE (Test gen generation, model years 2022-2026). Factory exterior size: length 4500 mm, width 1850 mm, height 1400 mm");
    expect(prompt).toContain("VERIFIED DESIGN DETAILS: 1) slim LED headlights 2) fastback roofline");
    expect(prompt).toContain("MODEL-YEAR DETAILS: 2025 facelift adds a wider grille.");
    const conditioning = drawingConditioning("side", null, null, profile);
    expect(conditioning[0]).toMatchObject({ role: "reference", label: "photo of the real car (front)" });

    // A build of this car sends the verified facts and photo with each car drawing.
    const build = await studio.createBuild("Prelude", config);
    await studio.generateDrawings(build.id);
    await studio.waitForJob(build.id);
    const carDrawings = images.filter(i => i.mockLabel?.includes("VIEW"));
    expect(carDrawings).toHaveLength(4);
    for (const req of carDrawings) {
      expect(req.prompt).toContain("VERIFIED VEHICLE PROFILE");
      expect(req.conditioning?.some(c => c.label === "photo of the real car (front)")).toBe(true);
    }
  });

  it("returns edited profiles to draft until verified again", async () => {
    const { library, app } = setup();
    const started = await library.startResearch({ make: "Acme", model: "Zed", year: 2024 });
    await library.waitForResearch(started.id);
    await request(app).post(`/api/vehicles/profiles/${started.id}/verify`);
    const edit = {
      yearFrom: 2022, yearTo: 2026, generation: "Mk2",
      dimensions: { lengthMm: 4400, widthMm: null, heightMm: null, wheelbaseMm: null },
      signatureCues: ["round lamps"], faceliftNotes: null,
    };
    const edited = await request(app).put(`/api/vehicles/profiles/${started.id}`).send(edit);
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ status: "researched", origin: "manual", generation: "Mk2" });
    const bad = await request(app).put(`/api/vehicles/profiles/${started.id}`).send({ ...edit, yearFrom: 2030 });
    expect(bad.status).toBe(400);
    expect((await request(app).post(`/api/vehicles/profiles/${started.id}/photos?view=side`).set("Content-Type", "text/plain").send("x")).status).toBe(415);
    expect((await request(app).delete(`/api/vehicles/profiles/${started.id}`)).status).toBe(204);
    expect((await request(app).get("/api/vehicles/profile").query({ make: "Acme", model: "Zed", year: 2024 })).body).toBeNull();
  });

  it("makes a clearly marked draft without AI spend in mock mode", async () => {
    const mock: AiProvider = { mode: "mock", image: async () => { throw new Error("no"); }, json: async () => { throw new Error("no"); } };
    const { library } = setup(mock);
    const started = await library.startResearch({ make: "BMW", model: "M3", year: 2024 });
    await library.waitForResearch(started.id);
    const profile = await library.findProfile({ make: "BMW", model: "M3", year: 2024 });
    expect(profile?.signatureCues.length).toBe(3);
    expect(profile?.faceliftNotes).toContain("Mock mode");
  });

  it("reports research failures on the profile", async () => {
    const failing: AiProvider = {
      ...researchingAi().ai,
      research: async () => { throw new Error("upstream down"); },
    };
    const { library } = setup(failing);
    const started = await library.startResearch({ make: "Acme", model: "Zed", year: 2024 });
    await library.waitForResearch(started.id);
    expect((await library.findProfile({ make: "Acme", model: "Zed", year: 2024 }))?.research).toEqual({ state: "failed", error: "upstream down" });
  });
});
