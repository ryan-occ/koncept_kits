import { describe, expect, it } from "vitest";
import { defaultConfig } from "../../shared/defaults";
import type { BuildConfig } from "../../shared/types";
import { drawingPrompt, renderPrompt } from "./prompts";

function config(patch: Partial<BuildConfig> = {}, fenders = false): BuildConfig {
  const base = defaultConfig();
  return {
    ...base,
    ...patch,
    parts: {
      ...base.parts,
      "front-fender": { included: fenders, finish: "carbon" },
      "rear-fender": { included: fenders, finish: "carbon" },
    },
  };
}

describe("wheel-arch rule", () => {
  it("keeps factory arches in Vanguard Custom renders when wide-body is off, stated first and last", () => {
    const c = config({ kitStyleId: "vanguard-custom", wideBody: false });
    const blocks = renderPrompt(c, "side-profile").split("\n\n");
    expect(blocks[0]).toContain("NO fender flares");
    expect(blocks[blocks.length - 1]).toMatch(/^FINAL CHECK — WHEEL ARCHES: factory wheel arches/);
    // The ported brief in between no longer asks for flares, overfenders or a wide-body stance.
    expect(blocks[1]).not.toMatch(/wide-?body|over-?fender|fender flare|arch extension|\+60–80 mm/i);
    expect(blocks[1]).toContain("tyres flush with the factory arch lip");
    expect(blocks[1]).toContain("multi-element front splitter"); // the rest of the kit brief survives
  });

  it("leaves the wide-body brief intact for wide-body builds", () => {
    const prompt = renderPrompt(config({ kitStyleId: "vanguard-custom", wideBody: true }), "side-profile");
    expect(prompt).toMatch(/fender arch extensions \(\+100–120 mm per side\)/);
  });

  it("strips wide-body wording from every angle's Vanguard brief", () => {
    const c = config({ kitStyleId: "vanguard-custom", wideBody: false });
    for (const angle of ["front-three-quarter", "front-elevation", "rear-three-quarter"] as const) {
      const brief = renderPrompt(c, angle).split("\n\n")[1]!;
      expect(brief, angle).not.toMatch(/wide-?body|over-?fender|fender flare|arch extension/i);
    }
  });

  it("applies to standard kits and to the drawings too", () => {
    const c = config({ kitStyleId: "gt3-track", kitStyleLabel: "GT3 Track Edition", wideBody: false });
    expect(renderPrompt(c, "front-three-quarter")).toContain("NO arch extensions");
    expect(drawingPrompt(c, "side")).toContain("NO fender flares");
  });

  it("limits fender parts to factory width instead of banning them", () => {
    const c = config({ wideBody: false }, true);
    const prompt = renderPrompt(c, "side-profile");
    expect(prompt).toContain("fender parts follow the contour shown in the drawings at factory body width");
    expect(prompt).not.toContain("NO fender flares");
  });

  it("asks for clear wide-body flares on every kit when the wide-body setup is chosen", () => {
    for (const kit of [
      { kitStyleId: "vanguard-custom", kitStyleLabel: "Vanguard Custom Kit" },
      { kitStyleId: "touring-club", kitStyleLabel: "Touring Club" },
    ]) {
      const c = config({ ...kit, wideBody: true });
      const blocks = renderPrompt(c, "side-profile").split("\n\n");
      expect(blocks[0], kit.kitStyleId).toContain("WIDE-BODY SETUP");
      expect(blocks[blocks.length - 1], kit.kitStyleId).toContain("FINAL CHECK — WHEEL ARCHES: WIDE-BODY SETUP");
      expect(blocks.join(" "), kit.kitStyleId).not.toContain("NO fender flares");
      for (const view of ["side", "front", "rear", "top"] as const) {
        expect(drawingPrompt(c, view), `${kit.kitStyleId} ${view}`).toContain("WIDE-BODY SETUP");
      }
    }
  });
});
