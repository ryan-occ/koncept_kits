import { describe, expect, it } from "vitest";
import { defaultBuildName, syncBuildNameWithVehicle } from "./defaults";

describe("vehicle-based build names", () => {
  const bmw = { make: "BMW", model: "M4" };

  it("updates the default name when the make changes", () => {
    expect(syncBuildNameWithVehicle(defaultBuildName(bmw), bmw, { make: "Honda", model: "Civic" }))
      .toBe("Honda Civic build");
  });

  it("updates the default name when only the model changes", () => {
    const hondaCivic = { make: "Honda", model: "Civic" };
    expect(syncBuildNameWithVehicle(defaultBuildName(hondaCivic), hondaCivic, { make: "Honda", model: "Accord" }))
      .toBe("Honda Accord build");
  });

  it("repairs a generated name left over from an earlier vehicle selection", () => {
    expect(syncBuildNameWithVehicle(
      "BMW M4 build",
      { make: "Honda", model: "Civic" },
      { make: "Honda", model: "Accord" },
    )).toBe("Honda Accord build");
  });

  it("preserves a name that the user customized", () => {
    expect(syncBuildNameWithVehicle("Track concept", bmw, { make: "Honda", model: "Civic" }))
      .toBe("Track concept");
  });

  it("does not change the name when the vehicle is unchanged", () => {
    expect(syncBuildNameWithVehicle(defaultBuildName(bmw), bmw, bmw))
      .toBe("BMW M4 build");
  });
});
