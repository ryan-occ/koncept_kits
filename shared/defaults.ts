import {
  CAR_DB, CATEGORY_KIT_STYLES, CF_MATERIALS, PAINTS, RIM_COLORS, RIM_STYLES,
  getBodyStyleChoices, getHondaFactoryVariant, getVehicleCategory,
} from "./catalog";
import { getCompatibleSpoilerTypes, isTrackWingKitId } from "./car-rules";
import { PART_IDS, type BuildConfig, type RearAero } from "./types";

export type VehicleNameParts = Pick<BuildConfig, "make" | "model">;

export function defaultBuildName({ make, model }: VehicleNameParts): string {
  return `${make} ${model} build`;
}

const generatedBuildNames = new Set(
  Object.entries(CAR_DB).flatMap(([make, models]) =>
    Object.keys(models).map(model => defaultBuildName({ make, model })),
  ),
);

/** Rename catalog-generated defaults on vehicle edits, but preserve custom titles. */
export function syncBuildNameWithVehicle(
  name: string,
  currentVehicle: VehicleNameParts,
  nextVehicle: VehicleNameParts,
): string {
  if (currentVehicle.make === nextVehicle.make && currentVehicle.model === nextVehicle.model) return name;
  // Recognize defaults from any catalog vehicle so builds made before this
  // behavior was added can recover from an earlier make/model mismatch.
  if (!generatedBuildNames.has(name)) return name;
  return defaultBuildName(nextVehicle);
}

/** Rear aero choices for a config, using the server-side compatibility rules ported in car-rules. */
export function aeroOptions(config: Pick<BuildConfig, "bodyStyle" | "category" | "kitStyleId">): { options: RearAero[]; locked: boolean } {
  if (isTrackWingKitId(config.kitStyleId) || config.category === "hypercar") return { options: ["gt-wing"], locked: true };
  return { options: [...getCompatibleSpoilerTypes(config.bodyStyle, config.category), "none"], locked: false };
}

/** Keeps rear aero and wing mounting valid after the vehicle, body style or kit changes. */
export function normalizeAero(config: BuildConfig): BuildConfig {
  const { options } = aeroOptions(config);
  const rearAero = options.includes(config.rearAero) ? config.rearAero : options[0]!;
  return {
    ...config,
    rearAero,
    wingMounting: rearAero === "gt-wing" ? (config.wingMounting ?? "swan-neck") : undefined,
  };
}

/** Re-derives the fields that depend on the chosen vehicle, keeping the user's other choices. */
export function withVehicle(base: BuildConfig, make: string, model: string, year: number): BuildConfig {
  const category = getVehicleCategory(make, model);
  const factoryVariant = getHondaFactoryVariant(make, model, year, base.trim);
  const bodyStyle = factoryVariant?.bodyStyle ?? getBodyStyleChoices(make, model).default;
  const kits = CATEGORY_KIT_STYLES[category];
  const kit = kits.find(k => k.id === base.kitStyleId) ?? kits[0]!;
  return normalizeAero({
    ...base,
    make, model, year, trim: factoryVariant?.id, category, bodyStyle,
    kitStyleId: kit.id,
    kitStyleLabel: kit.label.replace(/^✦\s*/, ""),
  });
}

export function defaultConfig(): BuildConfig {
  const make = "BMW";
  const model = "M4";
  const years = CAR_DB[make]![model]!;
  const rim = RIM_STYLES[0]!;
  const paint = PAINTS[0]!;
  const base: BuildConfig = {
    year: years[years.length - 1]!,
    make, model,
    category: "sports-coupe",
    bodyStyle: "coupe",
    kitStyleId: "vanguard-custom",
    kitStyleLabel: "Vanguard Custom Kit",
    parts: Object.fromEntries(PART_IDS.map(id => [id, {
      included: id !== "front-fender" && id !== "rear-fender",
      finish: "carbon",
    }])) as BuildConfig["parts"],
    carbonMaterialId: CF_MATERIALS[0]!.id,
    paint: { name: paint.name, hex: paint.hex },
    rim: { styleId: rim.id, styleName: rim.name, size: rim.sizes[1] ?? rim.sizes[0]!, colorName: RIM_COLORS[0]!.name, colorHex: RIM_COLORS[0]!.hex },
    wideBody: false,
    rearAero: "duck-tail",
  };
  return withVehicle(base, make, model, base.year);
}
