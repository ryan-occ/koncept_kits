import { describe, expect, it } from "vitest";
import { CAR_DB, getBodyStyleChoices, getVehicleCategory } from "./catalog";
import { getCuratedBodyStylesForModel } from "./car-rules";

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
});
