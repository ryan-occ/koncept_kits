import { describe, expect, it } from "vitest";
import { defaultConfig, withVehicle } from "../../shared/defaults";
import type { BuildConfig } from "../../shared/types";
import { drawingPrompt, partDrawingPrompt, renderPrompt, vehicleName } from "./prompts";

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

describe("Honda factory variants in generation prompts", () => {
  it("uses the selected trim in the vehicle name and drawing identity cues", () => {
    const civic = withVehicle({ ...defaultConfig(), trim: "civic-type-r" }, "Honda", "Civic", 2024);
    expect(vehicleName(civic)).toBe("2024 Honda Civic Type R");
    expect(drawingPrompt(civic, "front")).toContain(
      "FACTORY VARIANT: Civic Type R high-performance hatchback with its aggressive factory fascia and large rear wing.",
    );
  });

  it("includes body variants in close-up part drawing prompts", () => {
    const accord = withVehicle({ ...defaultConfig(), trim: "accord-coupe" }, "Honda", "Accord", 2017);
    expect(partDrawingPrompt(accord, "front")).toContain("2017 Honda Accord Coupe");
    expect(partDrawingPrompt(accord, "front")).toContain("two-door Accord Coupe body");
  });

  it("names the exact factory variant in render prompts", () => {
    const civic = withVehicle({ ...defaultConfig(), trim: "civic-type-r" }, "Honda", "Civic", 2024);
    const prompt = renderPrompt(civic, "front-three-quarter");
    expect(prompt).toContain("VEHICLE: 2024 Honda Civic Type R.");
    expect(prompt).toContain("FACTORY VARIANT: Civic Type R high-performance hatchback");
  });
});

describe("curated Honda drawing cues", () => {
  it("adds the selected Civic Type R generation's factory shape details", () => {
    const prompt = drawingPrompt(config({
      make: "Honda",
      model: "Civic Type R (EP3)",
      year: 2005,
      bodyStyle: "hatchback",
    }), "side");

    expect(prompt).toContain("CURATED MODEL SHAPE CUES:");
    expect(prompt).toContain("tall-roof three-door hatchback profile");
    expect(prompt).toContain("high-mounted rear wing");
  });

  it("warns the image model not to confuse the Insight generations", () => {
    const prompt = drawingPrompt(config({
      make: "Honda",
      model: "Insight",
      year: 2003,
    }), "side");

    expect(prompt).toContain("2000–2006 two-seat tapered liftback");
    expect(prompt).toContain("2019–2022 four-door sedan");
  });
});

describe("carbon material in renders", () => {
  const withCarbon = (carbonMaterialId: string, kitStyleId?: string) => {
    const base = config(kitStyleId ? { kitStyleId } : {});
    const parts = Object.fromEntries(Object.entries(base.parts).map(([id, p]) => [id, { ...p, included: true, finish: "carbon" as const }]));
    return { ...base, carbonMaterialId, parts } as BuildConfig;
  };

  it("renders forged carbon as random marbling, never as a weave", () => {
    for (const kit of ["vanguard-custom", "gt4-street"]) {
      for (const angle of ["front-three-quarter", "side-profile", "rear-three-quarter", "front-elevation"] as const) {
        const prompt = renderPrompt(withCarbon("forged", kit), angle);
        expect(prompt).toContain("CARBON MATERIAL — FORGED CARBON");
        expect(prompt).toContain("MARBLED mosaic");
        expect(prompt).not.toMatch(/diamond-weave|rhombic|X-lattice/);
        expect(prompt).not.toMatch(/carbon(?:[- ]fib(?:er|re))? weave/i);
      }
    }
  });

  it("gives each woven material its own recognisable pattern", () => {
    expect(renderPrompt(withCarbon("3kPlain", "gt4-street"), "side-profile")).toContain("CHECKERBOARD");
    expect(renderPrompt(withCarbon("2x2Twill"), "side-profile")).toContain("DIAGONAL stepped stripes");
    expect(renderPrompt(withCarbon("kevlarHybrid"), "side-profile")).toContain("GOLDEN-YELLOW aramid");
    expect(renderPrompt(withCarbon("3kPlain", "vanguard-custom"), "side-profile")).not.toContain("diamond-weave");
  });

  it("leaves the material out when no included part is exposed carbon", () => {
    const c = withCarbon("forged");
    const painted = { ...c, parts: Object.fromEntries(Object.entries(c.parts).map(([id, p]) => [id, { ...p, finish: "body" as const }])) } as BuildConfig;
    expect(renderPrompt(painted, "side-profile")).not.toContain("CARBON MATERIAL —");
  });
});
