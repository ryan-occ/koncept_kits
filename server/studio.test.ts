import express from "express";
import JSZip from "jszip";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { mockImage, type AiProvider, type ImageRequest } from "./ai";
import { apiRouter } from "./routes";
import { MemoryStore } from "./store";
import { Studio } from "./studio";
import { defaultConfig, withVehicle } from "../shared/defaults";
import { estimatePartSpecs } from "./domain/part-specs";
import { PART_LABELS } from "../shared/types";
import type { BuildDto } from "../shared/types";

/** Mock provider that records every image request so tests can check conditioning. */
function recordingAi(fail?: (req: ImageRequest) => boolean) {
  const calls: ImageRequest[] = [];
  const ai: AiProvider = {
    mode: "mock",
    async image(req) {
      calls.push(req);
      if (fail?.(req)) throw new Error("boom");
      // Real PNG signature so the PDF embed path is exercised.
      const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
      return req.kind === "drawing" ? { data: png, mime: "image/png", inputTokens: 1, outputTokens: 1 } : { ...mockImage("x", "render"), inputTokens: 1, outputTokens: 1 };
    },
    async json() { return { value: {}, inputTokens: 0, outputTokens: 0 }; },
  };
  return { ai, calls };
}

function setup(options: { limit?: number; fail?: (req: ImageRequest) => boolean } = {}) {
  const { ai, calls } = recordingAi(options.fail);
  const studio = new Studio(new MemoryStore(), ai, { dailyImageLimit: options.limit ?? 100 });
  const app = express().use("/api", apiRouter(studio));
  return { studio, app, calls };
}

async function createBuild(app: express.Express): Promise<BuildDto> {
  const res = await request(app).post("/api/builds").send({ name: "Test build", config: defaultConfig() });
  expect(res.status).toBe(201);
  return res.body;
}

async function drawAndWait(app: express.Express, studio: Studio, id: number) {
  expect((await request(app).post(`/api/builds/${id}/drawings`)).status).toBe(202);
  await studio.waitForJob(id);
}

describe("drawing-first workflow", () => {
  it("saves, reloads, and removes favorite catalog vehicles", async () => {
    const { app } = setup();
    const favorite = { make: "Honda", model: "Civic", year: 2024 };
    const variantFavorite = { ...favorite, trim: "civic-type-r" };

    expect((await request(app).get("/api/favorites")).body).toEqual([]);
    const saved = await request(app).put("/api/favorites").send(favorite);
    expect(saved.status).toBe(201);
    expect(saved.body).toEqual(favorite);
    expect((await request(app).put("/api/favorites").send(favorite)).status).toBe(201);
    expect((await request(app).put("/api/favorites").send(variantFavorite)).status).toBe(201);
    expect((await request(app).get("/api/favorites")).body).toEqual([favorite, variantFavorite]);

    expect((await request(app).put("/api/favorites").send({ ...favorite, year: 1800 })).status).toBe(400);
    expect((await request(app).delete("/api/favorites").send(favorite)).status).toBe(204);
    expect((await request(app).get("/api/favorites")).body).toEqual([variantFavorite]);
    expect((await request(app).delete("/api/favorites").send(variantFavorite)).status).toBe(204);
    expect((await request(app).get("/api/favorites")).body).toEqual([]);
  });

  it("stores a vehicle name and config together in the build and list", async () => {
    const { app } = setup();
    const build = await createBuild(app);
    const config = withVehicle(build.config, "Honda", "Civic", 2026);

    const updated = await request(app)
      .patch(`/api/builds/${build.id}`)
      .send({ name: "Honda Civic build", config });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe("Honda Civic build");
    expect(updated.body.config).toMatchObject({ make: "Honda", model: "Civic", year: 2026 });

    const detail = await request(app).get(`/api/builds/${build.id}`);
    expect(detail.body.name).toBe("Honda Civic build");
    const list = await request(app).get("/api/builds");
    expect(list.body.find((entry: { id: number }) => entry.id === build.id).name).toBe("Honda Civic build");
  });

  it("draws the side view first and anchors the other views to it", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);

    // 4 whole-car views, then one close-up per included part (default kit: 5 parts).
    expect(calls.map(c => c.kind)).toEqual(Array(9).fill("drawing"));
    expect(calls[0]!.prompt).toContain("SIDE ELEVATION");
    expect(calls[0]!.conditioning).toEqual([]);
    for (const call of calls.slice(1, 4)) {
      expect(call.conditioning?.map(c => [c.role, c.label])).toEqual([["reference", "approved side elevation"]]);
      expect(call.quality).toBe("low");
    }
    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.drawingSet?.drawings).toHaveLength(4);
    expect(body.drawingSet?.status).toBe("draft");
  });

  it("draws each included part close-up from the car view it is measured in, without any text", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);

    const partCalls = calls.slice(4);
    expect(partCalls.map(c => c.mockLabel)).toEqual(expect.arrayContaining([
      "FRONT BUMPER & SPLITTER — CLOSE-UP", "VENTED HOOD — CLOSE-UP", "SIDE SKIRTS — CLOSE-UP",
    ]));
    for (const call of partCalls) {
      expect(call.quality).toBe("low");
      expect(call.prompt).toContain("ABSOLUTELY NO TEXT");
      expect(call.conditioning?.map(c => c.role)).toEqual(["reference"]);
    }
    const hood = partCalls.find(c => c.mockLabel?.startsWith("VENTED HOOD"))!;
    expect(hood.conditioning?.[0]?.label).toBe("approved top plan of the whole car");

    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.drawingSet?.parts.map(p => p.partId)).toEqual(["front", "sides", "rear", "wing", "hood"]);
    const front = body.drawingSet!.parts[0]!;
    expect(front.estimateSource).toBe("estimate");

    const sheet = await request(app).get(front.sheetUrl);
    expect(sheet.status).toBe(200);
    expect(sheet.headers["content-type"]).toContain("image/svg+xml");
    const svg = String(sheet.body);
    expect(svg).toContain(`${front.dimensions.length.toLocaleString("en-GB")} mm`);
    expect(svg).toContain(`${front.dimensions.height.toLocaleString("en-GB")} mm`);
    expect(svg).toContain("NOT TO SCALE");
    expect(svg).toContain("data:image/png;base64,");
  });

  it("asks each part drawing for exactly the mounting-hole count printed on its sheet", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);

    const specs = estimatePartSpecs(build.config);
    for (const spec of specs) {
      const call = calls.find(c => c.mockLabel === `${PART_LABELS[spec.partId].toUpperCase()} — CLOSE-UP`)!;
      expect(call.prompt, spec.partId).toContain(`show exactly ${spec.mountingPoints} mounting holes in total`);
      const svg = await studio.partSheet(build.id, spec.partId);
      expect(svg, spec.partId).toContain(`>${spec.mountingPoints}</text>`);
      expect(svg, spec.partId).toContain("MOUNTING POINTS (SPEC)");
      expect(svg, spec.partId).toContain("Hole positions and count in the drawing are indicative only");
    }

    // Redraws keep the same count.
    calls.length = 0;
    await request(app).post(`/api/builds/${build.id}/drawings/redraw`).send({ views: ["part:sides"], notes: "Slimmer end fin" });
    await studio.waitForJob(build.id);
    const sides = specs.find(s => s.partId === "sides")!;
    expect(calls[0]!.prompt).toContain(`show exactly ${sides.mountingPoints} mounting holes in total`);
  });

  it("redraws a single part close-up with notes, using its current drawing as the base", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    calls.length = 0;

    const res = await request(app).post(`/api/builds/${build.id}/drawings/redraw`).send({ views: ["part:hood"], notes: "Four vents" });
    expect(res.status).toBe(202);
    await studio.waitForJob(build.id);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.prompt).toContain("Four vents");
    expect(calls[0]!.conditioning?.map(c => c.role)).toEqual(["base", "reference"]);
    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.drawingSet?.parts.find(p => p.partId === "hood")?.revision).toBe(2);
  });

  it("blocks approval until every part close-up is drawn", async () => {
    const { app, studio } = setup({ fail: req => req.mockLabel?.startsWith("VENTED HOOD") ?? false });
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    const res = await request(app).post(`/api/builds/${build.id}/drawings/approve`);
    expect(res.status).toBe(409);
    expect(res.body.error).toContain("vented hood close-up");
  });

  it("refuses renders and export until the drawings are approved", async () => {
    const { app, studio } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);

    const render = await request(app).post(`/api/builds/${build.id}/renders`).send({ angles: ["side-profile"] });
    expect(render.status).toBe(409);
    expect(render.body.code).toBe("DRAWINGS_NOT_APPROVED");
    expect((await request(app).get(`/api/builds/${build.id}/export`)).status).toBe(409);
  });

  it("renders from the approved drawings, editing the matching view in place", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    expect((await request(app).post(`/api/builds/${build.id}/drawings/approve`)).status).toBe(200);

    calls.length = 0;
    const res = await request(app).post(`/api/builds/${build.id}/renders`).send({ angles: ["side-profile", "rear-three-quarter"] });
    expect(res.status).toBe(202);
    await studio.waitForJob(build.id);

    const side = calls.find(c => c.mockLabel?.includes("SIDE-PROFILE"))!;
    expect(side.quality).toBe("high");
    expect(side.conditioning?.[0]).toMatchObject({ role: "base", label: "approved side elevation drawing" });
    expect(side.prompt).toContain("GEOMETRY SOURCE OF TRUTH");
    const rear = calls.find(c => c.mockLabel?.includes("REAR-THREE-QUARTER"))!;
    expect(rear.conditioning?.every(c => c.role === "reference")).toBe(true);
    expect(rear.conditioning?.map(c => c.label)).toEqual([
      "approved side elevation drawing", "approved rear elevation drawing", "approved top plan drawing",
    ]);

    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.renders.map(r => [r.angle, r.current])).toEqual([["side-profile", true], ["rear-three-quarter", true]]);
  });

  it("marks drawings stale when the build changes and blocks approval and renders", async () => {
    const { app, studio } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    await request(app).post(`/api/builds/${build.id}/drawings/approve`);

    const changed = { ...build.config, paint: { name: "Imola Red", hex: "#c01018" } };
    const patched = await request(app).patch(`/api/builds/${build.id}`).send({ config: changed });
    expect(patched.body.drawingSet.stale).toBe(true);

    const render = await request(app).post(`/api/builds/${build.id}/renders`).send({ angles: ["side-profile"] });
    expect(render.body.code).toBe("DRAWINGS_STALE");
    await request(app).post(`/api/builds/${build.id}/drawings/reopen`);
    expect((await request(app).post(`/api/builds/${build.id}/drawings/approve`)).body.code).toBe("DRAWINGS_STALE");
  });

  it("redraws only the selected views, using the current drawing as the base and the notes in the prompt", async () => {
    const { app, studio, calls } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    calls.length = 0;

    const res = await request(app).post(`/api/builds/${build.id}/drawings/redraw`).send({ views: ["front"], notes: "Deeper splitter" });
    expect(res.status).toBe(202);
    await studio.waitForJob(build.id);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.prompt).toContain("REVISIONS REQUESTED BY THE DESIGNER (apply exactly, change nothing else): Deeper splitter");
    expect(calls[0]!.conditioning?.map(c => c.role)).toEqual(["base", "reference"]);
    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.drawingSet?.drawings.find(d => d.view === "front")?.revision).toBe(2);
    expect(body.drawingSet?.drawings.find(d => d.view === "side")?.revision).toBe(1);
  });

  it("skips the other views when the side anchor fails, so approval stays blocked", async () => {
    const { app, studio } = setup({ fail: req => req.prompt.includes("SIDE ELEVATION") });
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);

    const body = (await request(app).get(`/api/builds/${build.id}`)).body as BuildDto;
    expect(body.drawingSet?.drawings).toHaveLength(0);
    expect(body.job?.failed.map(f => f.item).sort()).toEqual([
      "front", "part:front", "part:hood", "part:rear", "part:sides", "part:wing", "rear", "side", "top",
    ]);
    expect((await request(app).post(`/api/builds/${build.id}/drawings/approve`)).body.code).toBe("DRAWINGS_INCOMPLETE");
  });

  it("enforces the daily image limit before spending anything", async () => {
    const { app, calls } = setup({ limit: 3 });
    const build = await createBuild(app);
    const res = await request(app).post(`/api/builds/${build.id}/drawings`);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe("DAILY_LIMIT");
    expect(calls).toHaveLength(0);
  });

  it("exports a production ZIP with drawings, renders, specs and part sheets", async () => {
    const { app, studio } = setup();
    const build = await createBuild(app);
    await drawAndWait(app, studio, build.id);
    await request(app).post(`/api/builds/${build.id}/drawings/approve`);
    await request(app).post(`/api/builds/${build.id}/renders`).send({ angles: ["front-three-quarter"] });
    await studio.waitForJob(build.id);

    const res = await request(app).get(`/api/builds/${build.id}/export`).buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = [];
      r.on("data", (c: Buffer) => chunks.push(c));
      r.on("end", () => cb(null, Buffer.concat(chunks)));
    });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("test-build-production.zip");
    const zip = await JSZip.loadAsync(res.body as Buffer);
    const names = Object.keys(zip.files);
    for (const expected of [
      "README.txt", "BUILD_CONFIG.json", "PART_SPECS.json", "BILL_OF_MATERIALS.csv", "SPEC_SHEET.pdf",
      "drawings/side-r1.png", "drawings/top-r1.png", "renders/front-three-quarter.svg",
      "parts/KIT_PART_SHEETS.pdf", "parts/front-sheet.svg", "parts/front-drawing.png", "parts/hood-sheet.svg",
    ]) expect(names).toContain(expected);
    const specs = JSON.parse(await zip.file("PART_SPECS.json")!.async("string"));
    expect(specs.source).toBe("estimate");
    expect(specs.parts.map((p: { partId: string }) => p.partId)).toEqual(["front", "sides", "rear", "wing", "hood"]);
  });

  it("rejects invalid configs", async () => {
    const { app } = setup();
    const res = await request(app).post("/api/builds").send({ name: "x", config: { ...defaultConfig(), year: 1 } });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID");
  });
});
