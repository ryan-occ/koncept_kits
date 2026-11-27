import { describe, expect, it } from "vitest";
import { getCuratedBodyStylesForModel, getCuratedSignatureCuesForModel } from "./car-rules";
import { CAR_DB, getBodyStyleChoices, getHondaFactoryVariants, getVehicleCategory } from "./catalog";
import { defaultConfig, withVehicle } from "./defaults";
import { BuildConfigSchema } from "./types";

describe("Honda vehicle catalog", () => {
  it("offers model years from 2000 onward for Honda's main lineup", () => {
    for (const model of ["Civic", "Accord", "CR-V", "Odyssey"]) {
      expect(CAR_DB.Honda?.[model]).toContain(2000);
      expect(CAR_DB.Honda?.[model]).toContain(2026);
    }

    expect(CAR_DB.Honda?.["Civic Type R (EP3)"]).toEqual([2002, 2003, 2004, 2005]);
    expect(CAR_DB.Honda?.["CR-Z"]).toContain(2011);
    expect(CAR_DB.Honda?.["Element"]).toContain(2011);
    expect(CAR_DB.Honda?.["Passport"]).toContain(2019);
    expect(CAR_DB.Honda?.["Prelude (6th Gen)"]).toEqual([2026]);
  });

  it("assigns suitable categories and body styles to added Honda models", () => {
    expect(getVehicleCategory("Honda", "Passport")).toBe("suv");
    expect(getVehicleCategory("Honda", "Crosstour")).toBe("wagon");

    for (const [model, style] of [
      ["Civic Type R (EP3)", "hatchback"],
      ["Civic Type R (FD2)", "sedan"],
      ["Civic Type R (FK2)", "hatchback"],
      ["NSX (NA2)", "coupe"],
      ["Prelude (6th Gen)", "coupe"],
    ] as const) {
      expect(getBodyStyleChoices("Honda", model).default).toBe(style);
      expect(getCuratedBodyStylesForModel("Honda", model)).toEqual([style]);
    }
  });

  it("keeps Honda body-style options aligned and supplies curated shape cues", () => {
    for (const model of Object.keys(CAR_DB.Honda ?? {})) {
      const clientStyles = getBodyStyleChoices("Honda", model).options.toSorted();
      const serverStyles = getCuratedBodyStylesForModel("Honda", model)?.toSorted();
      expect(serverStyles, `${model} should have matching server body styles`).toEqual(clientStyles);
      expect(getCuratedSignatureCuesForModel("Honda", model), `${model} should have three shape cues`).toHaveLength(3);
    }
  });

  it("offers year-appropriate variants without adding duplicate model names", () => {
    expect(getHondaFactoryVariants("Honda", "Civic", 2024).map(variant => variant.label)).toEqual(["Si", "Type R"]);
    expect(getHondaFactoryVariants("Honda", "Civic", 2022).map(variant => variant.label)).toEqual(["Si"]);
    expect(getHondaFactoryVariants("Honda", "Accord", 2017).map(variant => variant.label)).toEqual(["Sport", "Coupe"]);
    expect(getHondaFactoryVariants("Honda", "Accord", 2018).map(variant => variant.label)).toEqual(["Sport"]);
    expect(getHondaFactoryVariants("Toyota", "Civic", 2024)).toEqual([]);
  });

  it("applies the variant body style and validates saved selections", () => {
    const civic = withVehicle({ ...defaultConfig(), trim: "civic-type-r" }, "Honda", "Civic", 2024);
    expect(civic.model).toBe("Civic");
    expect(civic.trim).toBe("civic-type-r");
    expect(civic.bodyStyle).toBe("hatchback");
    expect(BuildConfigSchema.parse(civic).trim).toBe("civic-type-r");
    expect(BuildConfigSchema.safeParse({ ...civic, year: 2022 }).success).toBe(false);
    expect(BuildConfigSchema.safeParse({ ...civic, make: "Toyota" }).success).toBe(false);

    const unavailableYear = withVehicle(civic, "Honda", "Civic", 2022);
    expect(unavailableYear.trim).toBeUndefined();
    expect(unavailableYear.bodyStyle).toBe("sedan");
  });
});

describe("Jetour", () => {
  it("is a selectable CDM make in the Chery group with SUV and pickup body styles", async () => {
    const { CAR_DB, CDM_MAKE_GROUP_NAME, VEHICLE_MODEL_ALIASES, getBodyStyleChoices, getVehicleMarket } = await import("./catalog");
    expect(CAR_DB.Jetour!.T2).toContain(2026);
    expect(getVehicleMarket("Jetour")).toBe("CDM");
    expect(CDM_MAKE_GROUP_NAME.Jetour).toBe("Chery Group");
    expect(getBodyStyleChoices("Jetour", "G700").default).toBe("suv");
    expect(getBodyStyleChoices("Jetour", "F700").default).toBe("truck");
    expect(VEHICLE_MODEL_ALIASES.Jetour!.T2).toContain("Traveller");
  });
});
