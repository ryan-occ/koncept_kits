// Ported from Vanguard-Concept api-server/src/lib/carimage-helpers.ts (rules + prompt builders only).
// The old provider/image-call plumbing (line 2927 onward) was intentionally left behind.

export type AngleKey = "close-up-detail" | "front-elevation" | "side-profile" | "rear-three-quarter";
export type BodyStyle = "sedan" | "coupe" | "hatchback" | "wagon" | "suv" | "truck" | "convertible" | "unknown";

// ─── Per-part kit finish (carbon vs body color) ──────────────────────────────
//
// The original five-part contract remains the default for legacy render
// signatures. Fender-aware builds opt into the two additional part IDs by
// sending either fender key in the explicit finish map.

export type KitFinish = "carbon" | "body";
export type KitPartFinishes = Record<string, KitFinish>;

export const LEGACY_KIT_PART_IDS: readonly string[] = ["front", "sides", "rear", "wing", "hood"];
export const KIT_PART_IDS: readonly string[] = [
  ...LEGACY_KIT_PART_IDS, "front-fender", "rear-fender",
];

const KIT_PART_PROMPT_LABEL: Record<string, string> = {
  front: "front bumper, splitter, and canards",
  sides: "side skirts and sill extensions",
  rear: "rear bumper and diffuser",
  wing: "rear wing or spoiler",
  hood: "vented hood inserts",
  "front-fender": "front fenders and front wheel-arch extensions",
  "rear-fender": "rear fenders and rear wheel-arch extensions",
};

function activeKitPartIds(finishes?: KitPartFinishes | null): readonly string[] {
  return finishes && (
    Object.prototype.hasOwnProperty.call(finishes, "front-fender") ||
    Object.prototype.hasOwnProperty.call(finishes, "rear-fender")
  ) ? KIT_PART_IDS : LEGACY_KIT_PART_IDS;
}

export interface KitFinishSummary {
  allBody: boolean;
  allCarbon: boolean;
  mixed: boolean;
  bodyLabels: string[];
  carbonLabels: string[];
  bodyIds: string[];
  carbonIds: string[];
}

/** Materialise the effective finish for every known kit part, falling back to
 *  the legacy global `paintKitBodyColor` boolean for any part not overridden. */
export function resolveKitPartFinishes(
  globalPaintBodyColor: boolean,
  overrides?: KitPartFinishes | null
): KitPartFinishes {
  const def: KitFinish = globalPaintBodyColor ? "body" : "carbon";
  const out: KitPartFinishes = {};
  for (const id of activeKitPartIds(overrides)) {
    const o = overrides?.[id];
    out[id] = o === "body" || o === "carbon" ? o : def;
  }
  return out;
}

export function summarizeKitFinishes(effective: KitPartFinishes): KitFinishSummary {
  const partIds = activeKitPartIds(effective);
  const bodyIds: string[] = [];
  const carbonIds: string[] = [];
  for (const id of partIds) {
    if (effective[id] === "body") bodyIds.push(id);
    else carbonIds.push(id);
  }
  return {
    allBody: bodyIds.length === partIds.length,
    allCarbon: carbonIds.length === partIds.length,
    mixed: bodyIds.length > 0 && carbonIds.length > 0,
    bodyLabels: bodyIds.map(id => KIT_PART_PROMPT_LABEL[id]).filter(Boolean),
    carbonLabels: carbonIds.map(id => KIT_PART_PROMPT_LABEL[id]).filter(Boolean),
    bodyIds,
    carbonIds,
  };
}

/** Stable, render-signature-safe serialisation of an effective finish map. */
export function buildKitFinishesSignature(effective: KitPartFinishes): string {
  return activeKitPartIds(effective).map(id => `${id}:${effective[id]}`).join(",");
}

// ─── Body-fit rear aero policy ───────────────────────────────────────────────

export type RearAeroType = "gt-wing" | "duck-tail" | "boot-lip" | "roofline-lip" | "deck-lid-lip" | "bed-rail-spoiler" | "none";

export type RearWingMounting = "swan-neck" | "pedestal" | "trunk-mount";

export interface SpoilerOption {
  type: RearAeroType;
  label: string;
  description: string;
}

const SPOILER_LABELS: Record<RearAeroType, string> = {
  "gt-wing": "GT Wing",
  "duck-tail": "Duck-Tail",
  "boot-lip": "Boot Lip",
  "roofline-lip": "Roofline Lip",
  "deck-lid-lip": "Deck Lid Lip",
  "bed-rail-spoiler": "Bed-Rail Spoiler",
  "none": "None",
};

const SPOILER_DESCRIPTIONS: Record<RearAeroType, string> = {
  "gt-wing": "Elevated race-grade wing with swan-neck stanchions for maximum downforce",
  "duck-tail": "Classic integrated duck-tail moulded into the deck lid for subtle rear downforce",
  "boot-lip": "Flush surface-bonded lip spoiler on the boot lid trailing edge, minimal profile",
  "roofline-lip": "Slim roofline lip bonded along the top rear edge of the roof or hatch",
  "deck-lid-lip": "Low-profile deck lid lip preserving the convertible roofline silhouette",
  "bed-rail-spoiler": "Bed-rail or tailgate lip reducing bed-turbulence drag on the truck body",
  "none": "Clean tail — no spoiler or wing",
};

/** Compatible spoiler types per body style. First entry is the body-type default. */
const BODY_STYLE_COMPATIBLE_SPOILERS: Record<string, ReadonlyArray<RearAeroType>> = {
  sedan:       ["boot-lip", "duck-tail", "gt-wing"],
  coupe:       ["duck-tail", "boot-lip", "gt-wing"],
  hatchback:   ["roofline-lip", "duck-tail", "gt-wing"],
  wagon:       ["roofline-lip", "boot-lip"],
  suv:         ["roofline-lip", "gt-wing"],
  convertible: ["deck-lid-lip", "boot-lip"],
  truck:       ["bed-rail-spoiler"],
};

/** Compatible spoiler types per vehicle category. First entry is the default. */
const CATEGORY_COMPATIBLE_SPOILERS: Record<string, ReadonlyArray<RearAeroType>> = {
  "sports-coupe": ["duck-tail", "boot-lip", "gt-wing"],
  "hypercar":     ["gt-wing"],
  "suv":          ["roofline-lip", "gt-wing"],
  "muscle":       ["duck-tail", "boot-lip", "gt-wing"],
  "sedan":        ["boot-lip", "duck-tail", "gt-wing"],
  "grand-tourer": ["boot-lip", "duck-tail"],
  "wagon":        ["roofline-lip", "boot-lip"],
  "classic":      ["duck-tail", "boot-lip", "gt-wing"],
  "pickup":       ["bed-rail-spoiler"],
  "hatchback":    ["roofline-lip", "duck-tail", "gt-wing"],
  "crossover":    ["roofline-lip", "gt-wing"],
  "minivan":      ["roofline-lip"],
};

/** Returns the list of RearAeroType values compatible with the given body style / category. */
export function getCompatibleSpoilerTypes(bodyStyle: string, vehicleCategory: string): ReadonlyArray<RearAeroType> {
  return BODY_STYLE_COMPATIBLE_SPOILERS[bodyStyle] ?? CATEGORY_COMPATIBLE_SPOILERS[vehicleCategory] ?? ["boot-lip", "duck-tail", "gt-wing"];
}

/** Returns the default (first) spoiler type for a body style / category without kit overrides. */
export function getDefaultSpoilerType(bodyStyle: string, vehicleCategory: string): RearAeroType {
  return getCompatibleSpoilerTypes(bodyStyle, vehicleCategory)[0] ?? "boot-lip";
}

/** Builds full SpoilerOption metadata for an array of types. */
export function buildSpoilerOptions(types: ReadonlyArray<RearAeroType>): SpoilerOption[] {
  return types.map(t => ({ type: t, label: SPOILER_LABELS[t], description: SPOILER_DESCRIPTIONS[t] }));
}

/** Returns true if the kit style ID forces a GT wing (track/race/drag kits). */
export function isTrackWingKitId(kitStyleId: string): boolean {
  return TRACK_WING_KIT_IDS.has(kitStyleId);
}

/**
 * Kit IDs whose theme clearly calls for a tall GT/race wing.
 * Used when the specific kit ID is known (render pipeline).
 */
const TRACK_WING_KIT_IDS = new Set([
  "gt3-track",
  "gt4-street",
  "time-attack",
  "lemans-proto",
  "trofeo-comp",
  "circuit-king",
  "drag-racer",
  "rs-avant-race",
  "squadra-corse",
  "aero-pure",
  "endurance-gt",
  "shooting-brake-gt",
]);

/**
 * Kit name patterns whose theme clearly calls for a tall GT/race wing.
 * Used when only the human-readable kit name is available (spec pipeline).
 */
const TRACK_WING_KIT_NAME_PATTERNS = [
  /gt3\s*track/i,
  /gt4\s*street/i,
  /time\s*attack/i,
  /le\s*mans\s*proto/i,
  /trofeo\s*comp/i,
  /circuit\s*king/i,
  /drag\s*racer/i,
  /rs\s*avant\s*race/i,
  /squadra\s*corse/i,
  /aerodynamica\s*pure/i,
  /endurance\s*gt/i,
  /shooting\s*brake\s*gt/i,
];

/** Returns true if the kit name matches a track/race/drag wing kit. */
export function isTrackWingKitName(kitName: string): boolean {
  return TRACK_WING_KIT_NAME_PATTERNS.some(p => p.test(kitName));
}

/**
 * Derive the appropriate rear aero type when both body style and kit name are available.
 * Preferred over getRearAeroTypeByCategory when make/model are known (spec sheet pipeline).
 */
export function getRearAeroTypeFromKitName(
  bodyStyle: BodyStyle,
  kitName: string,
  vehicleCategory: string,
  wideBody?: boolean,
  rearSpoilerEnabled?: boolean
): RearAeroType {
  if (rearSpoilerEnabled === false) return "none";
  if (isTrackWingKitName(kitName)) return "gt-wing";
  if (vehicleCategory === "hypercar") return "gt-wing";

  switch (bodyStyle) {
    case "sedan": return "boot-lip";
    case "coupe": return "duck-tail";
    case "wagon": return "roofline-lip";
    case "hatchback": return "roofline-lip";
    case "suv": return "roofline-lip";
    case "convertible": return "deck-lid-lip";
    case "truck": return "bed-rail-spoiler";
    default: return "boot-lip";
  }
}

/**
 * Derive the appropriate rear aero type from vehicle category and kit name alone.
 * Used as fallback when body style cannot be inferred (category-only spec sheet pipeline).
 */
export function getRearAeroTypeByCategory(
  vehicleCategory: string,
  kitName: string,
  wideBody?: boolean,
  rearSpoilerEnabled?: boolean
): RearAeroType {
  if (rearSpoilerEnabled === false) return "none";
  if (isTrackWingKitName(kitName)) return "gt-wing";
  if (vehicleCategory === "hypercar") return "gt-wing";
  switch (vehicleCategory) {
    case "sports-coupe": return "duck-tail";
    case "sedan": return "boot-lip";
    case "grand-tourer": return "boot-lip";
    case "wagon": return "roofline-lip";
    case "suv": return "roofline-lip";
    case "muscle": return "duck-tail";
    case "hatchback": return "roofline-lip";
    case "crossover": return "roofline-lip";
    case "minivan": return "roofline-lip";
    case "pickup": return "bed-rail-spoiler";
    default: return "boot-lip";
  }
}

/**
 * Given the inferred body style, the selected kit ID, the vehicle category, and
 * optionally whether this is a wide-body build, returns the appropriate rear aero type.
 *
 * Policy:
 *  - Track / race / drag kits always receive a full GT wing.
 *  - Hypercars (category = "hypercar") always receive a full GT wing.
 *  - All other kits default to the lowest-profile option that still reads as performance.
 */
export function getRearAeroType(
  bodyStyle: BodyStyle,
  kitStyleId: string,
  vehicleCategory: string,
  wideBody?: boolean,
  rearSpoilerEnabled?: boolean
): RearAeroType {
  if (rearSpoilerEnabled === false) return "none";
  if (TRACK_WING_KIT_IDS.has(kitStyleId)) return "gt-wing";
  if (vehicleCategory === "hypercar") return "gt-wing";

  switch (bodyStyle) {
    case "sedan":
      return "boot-lip";
    case "coupe":
      return "duck-tail";
    case "wagon":
      return "roofline-lip";
    case "hatchback":
      return "roofline-lip";
    case "suv":
      return "roofline-lip";
    case "convertible":
      return "deck-lid-lip";
    case "truck":
      return "bed-rail-spoiler";
    default:
      return getRearAeroTypeByCategory(vehicleCategory, kitStyleId, wideBody);
  }
}

export interface RearAeroSpec {
  name: string;
  mountingSurface: string;
  mountingHardware: string;
  description: string;
}

/** Returns mounting and naming details for the chosen rear aero type.
 *  Pass `mountingStyle` to override the default swan-neck for GT wings. */
export function getRearAeroSpec(rearAeroType: RearAeroType, mountingStyle?: RearWingMounting): RearAeroSpec {
  switch (rearAeroType) {
    case "gt-wing": {
      const mounting = mountingStyle ?? "swan-neck";
      if (mounting === "pedestal") {
        return {
          name: "GT Rear Wing (Pedestal)",
          mountingSurface:
            "boot floor / trunk floor reinforcement plate ONLY (never the hood, roof, or any front body panel)",
          mountingHardware:
            "CNC-machined aluminium pedestal uprights bolted to the trunk floor reinforcement plate with backing plates (typ. 4 × M10)",
          description:
            "Elevated adjustable GT wing on straight vertical pedestal uprights rising from the boot floor — bold upright stance and maximum wing height clearance",
        };
      }
      if (mounting === "trunk-mount") {
        return {
          name: "GT Rear Wing (Trunk-Mount)",
          mountingSurface:
            "trunk lid skin ONLY — low-profile bracket mount (never the hood, roof, or any front body panel)",
          mountingHardware:
            "Carbon fibre trunk-mount bracket plates bolted directly to the trunk lid skin with large backing plates (typ. 6 × M8)",
          description:
            "Elevated adjustable GT wing on flat trunk-mount bracket bases sitting directly on the trunk lid surface — reduced wing height and minimal visual profile",
        };
      }
      return {
        name: "GT Rear Wing (Swan-Neck)",
        mountingSurface:
          "trunk lid or rear deck reinforcement plate ONLY (never the hood, roof, or any front body panel)",
        mountingHardware:
          "CNC-machined aluminium swan-neck stanchions bolted through the trunk lid with backing plates (typ. 4 × M8)",
        description:
          "Elevated adjustable GT wing with curved swan-neck stanchions arching up from the trunk lid and CNC-machined aluminium end plates generating high-speed downforce",
      };
    }
    case "duck-tail":
      return {
        name: "Duck-Tail Spoiler",
        mountingSurface:
          "rear deck lid trailing edge — integrated moulding flush with the boot lid skin",
        mountingHardware:
          "OEM deck-lid clip locations plus structural epoxy adhesive bond along the trailing edge flange; no stanchions",
        description:
          "Classic duck-tail spoiler moulded into the deck lid trailing edge for subtle rear downforce without elevated stanchions",
      };
    case "boot-lip":
      return {
        name: "Boot Lip Spoiler",
        mountingSurface: "boot lid trailing edge — flush surface-bonded lip",
        mountingHardware:
          "3M structural VHB tape plus M5 bolts (typ. 4) through boot lid skin with backing plates",
        description:
          "Flush boot-lid lip spoiler bonded to the trailing edge of the boot lid, reducing rear lift with minimal visual profile",
      };
    case "roofline-lip":
      return {
        name: "Roofline Spoiler",
        mountingSurface:
          "roof trailing edge or top of tailgate/hatch above the glass — bonded flush with the roofline",
        mountingHardware:
          "3M structural VHB tape and M5 countersunk bolts (typ. 4–6) through the roof panel with backing plates",
        description:
          "Slim roofline lip spoiler bonded flush along the top rear edge of the roof or hatch, optimised for the estate/hatchback roofline geometry",
      };
    case "deck-lid-lip":
      return {
        name: "Deck Lid Lip Spoiler",
        mountingSurface: "rear deck lid or convertible rear bodywork trailing edge",
        mountingHardware:
          "3M structural VHB tape and M5 bolts (typ. 4) through deck lid skin with backing plate",
        description:
          "Low-profile deck-lid lip spoiler preserving the convertible roofline silhouette while reducing rear lift",
      };
    case "bed-rail-spoiler":
      return {
        name: "Bed-Rail / Tailgate Spoiler",
        mountingSurface:
          "pickup bed wall (inside front bed rail) or tailgate upper edge — never over the cab glass or cab roof",
        mountingHardware:
          "M6 bolts through bed wall top cap or tailgate skin with backing plates and structural VHB tape; no stanchions extending beyond the cab",
        description:
          "Low-profile spoiler lip mounted to the pickup bed wall or tailgate trailing edge, reducing bed-turbulence drag without any element crossing the cab or cab glass",
      };
    case "none":
      return {
        name: "Clean Tail Treatment",
        mountingSurface: "N/A",
        mountingHardware: "N/A",
        description: "No rear spoiler or wing — clean uninterrupted tail treatment",
      };
  }
}

export interface AngleConfig {
  label: string;
  cameraDirective: string;
  kitFocus: string;
}

// ─── Body style inference ────────────────────────────────────────────────────

const KNOWN_MODEL_BODY_STYLES: Record<string, BodyStyle> = {
  // Sedans
  "BMW:M3": "sedan",
  "BMW:M5": "sedan",
  "Mercedes-Benz:AMG C63": "sedan",
  "Mercedes-Benz:AMG E63": "sedan",
  "Mercedes-Benz:S-Class": "sedan",
  "Porsche:Panamera": "sedan",
  "Porsche:Taycan Turbo": "sedan",
  "Rolls-Royce:Ghost": "sedan",
  "Rolls-Royce:Spectre": "sedan",
  "Audi:RS7": "sedan",
  "Dodge:Charger Scat Pack": "sedan",
  "Tesla:Model S Plaid": "sedan",
  // Coupes
  "BMW:M2": "coupe",
  "BMW:M4": "coupe",
  "BMW:M8": "coupe",
  "BMW:8 Series": "coupe",
  "Mercedes-Benz:AMG GT": "coupe",
  "Mercedes-Benz:SL 63 AMG": "convertible",
  "Porsche:911 Carrera S": "coupe",
  "Porsche:911 GT3": "coupe",
  "Porsche:911 Turbo S": "coupe",
  "Bentley:Continental GT": "coupe",
  "Ferrari:296 GTB": "coupe",
  "Ferrari:Roma": "coupe",
  "Ferrari:F8 Tributo": "coupe",
  "Ferrari:SF90 Stradale": "coupe",
  "Lamborghini:Huracán EVO": "coupe",
  "Lamborghini:Huracán Tecnica": "coupe",
  "Lamborghini:Revuelto": "coupe",
  "McLaren:720S": "coupe",
  "McLaren:765LT": "coupe",
  "McLaren:Artura": "coupe",
  "Audi:R8": "coupe",
  "Audi:RS5": "coupe",
  "Audi:e-tron GT RS": "sedan",
  "Aston Martin:Vantage": "coupe",
  "Aston Martin:DB12": "coupe",
  "Ford:GT": "coupe",
  "Ford:Mustang GT500": "coupe",
  "Ford:Mustang Dark Horse": "coupe",
  "Chevrolet:Corvette Z06": "coupe",
  "Chevrolet:Corvette E-Ray": "coupe",
  "Chevrolet:Camaro ZL1": "coupe",
  "Nissan:GT-R Nismo": "coupe",
  "Nissan:Z": "coupe",
  "Toyota:GR Supra": "coupe",
  "Toyota:GR86": "coupe",
  "Dodge:Challenger SRT Demon": "coupe",
  // Classic cars — all 2-door coupes/hardtops (E-Type and Cobra treated as coupe for kit pipeline)
  "Ford:Model B (Deuce Coupe)": "coupe",
  "Chevrolet:Bel Air": "coupe",
  "Jaguar:E-Type": "coupe",
  "Shelby:Cobra 289": "coupe",
  "Chevrolet:Corvette Sting Ray": "coupe",
  "Ford:Mustang (1st Gen)": "coupe",
  "Pontiac:GTO": "coupe",
  "Ford:GT40": "coupe",
  "Shelby:GT500": "coupe",
  "Chevrolet:Camaro SS": "coupe",
  "Dodge:Charger R/T": "coupe",
  "Pontiac:Firebird Trans Am": "coupe",
  "Plymouth:'Cuda": "coupe",
  "Chevrolet:Chevelle SS": "coupe",
  "Dodge:Challenger R/T": "coupe",
  "Plymouth:HEMI 'Cuda": "coupe",
  "Datsun:240Z": "coupe",
  "Porsche:911 Carrera RS 2.7": "coupe",
  "Lamborghini:Countach LP400": "coupe",
  "BMW:2002 Turbo": "coupe",
  "Ferrari:288 GTO": "coupe",
  "Porsche:959": "coupe",
  "Buick:GNX": "coupe",
  "Nissan:Skyline GT-R R32": "coupe",
  "Acura:NSX (NA1)": "coupe",
  "Bugatti:EB110": "coupe",
  "Mazda:RX-7 FD": "coupe",
  "McLaren:F1": "coupe",
  "Toyota:Supra MK4 (A80)": "coupe",
  "Nissan:Skyline GT-R R34": "coupe",
  // Hatchbacks
  "Toyota:GR Yaris": "hatchback",
  "Audi:RS3": "hatchback",
  // Wagons
  "Audi:RS6 Avant": "wagon",
  // SUVs / Crossovers
  "BMW:X5 M": "suv",
  "BMW:X6 M": "suv",
  "Mercedes-Benz:G-Class": "suv",
  "Lamborghini:Urus S": "suv",
  "Ferrari:Purosangue": "suv",
  "Rolls-Royce:Cullinan": "suv",
  "Bentley:Bentayga": "suv",
  "Aston Martin:DBX707": "suv",
  "Toyota:Land Cruiser 300": "suv",
  "Nissan:Patrol": "suv",
  "Tesla:Cybertruck": "truck",
  // Honda
  "Honda:Civic Type R (FL5)": "hatchback",
  "Honda:Civic Type R (FK8)": "hatchback",
  "Honda:Civic Type R (EP3)": "hatchback",
  "Honda:Civic Type R (FD2)": "sedan",
  "Honda:Civic Type R (FK2)": "hatchback",
  "Honda:Civic Type R (EK9)": "hatchback",
  "Honda:S2000": "convertible",
  "Honda:NSX (NA2)": "coupe",
  "Honda:CR-Z": "coupe",
  "Honda:Insight": "sedan",
  "Honda:Element": "suv",
  "Honda:Crosstour": "wagon",
  "Honda:Passport": "suv",
  "Honda:Integra Type R (DC2)": "coupe",
  "Honda:Prelude (5th Gen)": "coupe",
  "Honda:Prelude (6th Gen)": "coupe",
  // Volkswagen
  "Volkswagen:Golf R (Mk8)": "hatchback",
  "Volkswagen:Golf GTI (Mk8)": "hatchback",
  "Volkswagen:Golf R32 (Mk5)": "hatchback",
  "Volkswagen:Golf MK1 GTI": "hatchback",
  "Volkswagen:Scirocco R": "coupe",
  "Volkswagen:Arteon R": "sedan",
  // Subaru
  "Subaru:WRX STI (VA)": "sedan",
  "Subaru:WRX (VB)": "sedan",
  "Subaru:Impreza WRX STI (GD)": "sedan",
  "Subaru:22B STI": "sedan",
  "Subaru:BRZ": "coupe",
  "Subaru:SVX": "coupe",
  // Peugeot
  "Peugeot:208 GTI": "hatchback",
  "Peugeot:308 GTI": "hatchback",
  "Peugeot:205 GTI": "hatchback",
  "Peugeot:RCZ R": "coupe",
  // Mitsubishi
  "Mitsubishi:Lancer Evolution X": "sedan",
  "Mitsubishi:Lancer Evolution IX": "sedan",
  "Mitsubishi:Lancer Evolution VI TME": "sedan",
  "Mitsubishi:3000GT": "coupe",
  "Mitsubishi:Eclipse GSX": "coupe",
  "Mitsubishi:Pajero Evolution": "suv",
  "Mitsubishi:Pajero SWB Gen 1": "suv",
  "Mitsubishi:Pajero SWB Gen 2": "suv",
  "Mitsubishi:Pajero SWB Gen 3": "suv",
  "Mitsubishi:Pajero SWB Gen 4": "suv",
  // MINI
  "MINI:Cooper Coupé": "coupe",
  // BYD
  "BYD:Seal": "sedan",
  "BYD:Han": "sedan",
  "BYD:Yangwang U9": "coupe",
  "BYD:Atto 3": "suv",
  "BYD:Tang": "suv",
  "BYD:Dolphin": "hatchback",
  // ── High-volume daily / EV / Korean / JDM coverage (Task #369) ──────────
  // BMW dailies
  "BMW:3 Series": "sedan",
  "BMW:5 Series": "sedan",
  "BMW:X3": "suv",
  "BMW:X5": "suv",
  "BMW:1 Series": "hatchback",
  // Mercedes dailies
  "Mercedes-Benz:C-Class": "sedan",
  "Mercedes-Benz:E-Class": "sedan",
  "Mercedes-Benz:GLC": "suv",
  "Mercedes-Benz:GLE": "suv",
  "Mercedes-Benz:A-Class": "hatchback",
  // Audi dailies
  "Audi:A4": "sedan",
  "Audi:A6": "sedan",
  "Audi:Q5": "suv",
  "Audi:Q7": "suv",
  // Tesla mass-market EVs
  "Tesla:Model 3": "sedan",
  "Tesla:Model Y": "suv",
  // Ford trucks / Bronco
  "Ford:F-150": "truck",
  "Ford:Ranger": "truck",
  "Ford:Bronco": "suv",
  "Ford:Maverick": "truck",
  // Chevrolet trucks / SUVs
  "Chevrolet:Silverado": "truck",
  "Chevrolet:Tahoe": "suv",
  // Dodge modern lineup
  "Dodge:Charger": "sedan",
  "Dodge:Challenger": "coupe",
  "Dodge:Viper": "coupe",
  "Dodge:Durango": "suv",
  "Dodge:Hornet": "suv",
  // Toyota dailies / trucks
  "Toyota:Camry": "sedan",
  "Toyota:Corolla": "sedan",
  "Toyota:RAV4": "suv",
  "Toyota:Highlander": "suv",
  "Toyota:4Runner": "suv",
  "Toyota:Hilux": "truck",
  "Toyota:Tacoma": "truck",
  "Toyota:Tundra": "truck",
  "Toyota:Prius": "hatchback",
  // Honda dailies
  "Honda:Civic": "sedan",
  "Honda:Accord": "sedan",
  "Honda:CR-V": "suv",
  "Honda:Fit": "hatchback",
  "Honda:HR-V": "suv",
  "Honda:Odyssey": "suv",
  "Honda:Pilot": "suv",
  "Honda:Ridgeline": "truck",
  // Mazda
  "Mazda:MX-5 Miata": "convertible",
  "Mazda:CX-5": "suv",
  "Mazda:Mazda 3": "hatchback",
  // Subaru / Mitsubishi modern
  "Mitsubishi:Outlander": "suv",
  // Volkswagen modern
  "Volkswagen:Tiguan": "suv",
  "Volkswagen:Passat": "sedan",
  // Korean — Hyundai
  "Hyundai:Tucson": "suv",
  "Hyundai:Santa Fe": "suv",
  "Hyundai:Palisade": "suv",
  "Hyundai:Elantra": "sedan",
  "Hyundai:Sonata": "sedan",
  "Hyundai:Kona": "suv",
  "Hyundai:i30": "hatchback",
  // Korean — Kia
  "Kia:Sportage": "suv",
  "Kia:Sorento": "suv",
  "Kia:Telluride": "suv",
  "Kia:K5": "sedan",
  "Kia:Picanto": "hatchback",
  // Land Rover / Jeep / Suzuki off-roaders
  "Land Rover:Defender": "suv",
  "Land Rover:Range Rover Sport": "suv",
  "Land Rover:Discovery": "suv",
  "Jeep:Wrangler": "suv",
  "Jeep:Grand Cherokee": "suv",
  "Jeep:Gladiator": "truck",
  "Suzuki:Jimny": "suv",
  "Suzuki:Swift": "hatchback",
  // Volvo
  "Volvo:XC60": "suv",
  "Volvo:XC90": "suv",
  "Volvo:V60": "wagon",
  // MINI modern
  "MINI:Cooper": "hatchback",
  "MINI:Countryman": "suv",
  // Ram
  "Ram:1500": "truck",
};

const MODEL_KEYWORD_BODY_STYLES: Array<[RegExp, BodyStyle]> = [
  [/\b(avant|touring|estate|wagon|kombi|sport\s*wagon|break)\b/i, "wagon"],
  [/\b(cabriolet|convertible|roadster|spider|spyder|targa|droptop|drop[-\s]?head)\b/i, "convertible"],
  [/\b(pickup|truck|ranger|tacoma|hilux|f[-\s]?150|1500|silverado|ram\s*1500|ridgeline)\b/i, "truck"],
  [/\b(suv|crossover|x5|x6|x7|cayenne|macan|urus|cullinan|bentayga|purosangue|dbx|gle|glc|g[-\s]?class|patrol|land\s*cruiser|prado|4runner|explorer|escalade|navigator)\b/i, "suv"],
  [/\b(hatchback|hatch|hot\s*hatch|gti|gti|rs3|yaris|fiesta|focus\s*st|polo|golf|megane|civic\s*type\s*r|type[-\s]?r)\b/i, "hatchback"],
  [/\b(coupe|coupé|gt3|gt4|gt500|gt350|z06|challenger|vantage|continental\s*gt|r8|720s|765lt|296|f8|sf90|revuelto|huracan)\b/i, "coupe"],
  [/\b(sedan|saloon|berlina|limousine|s[-\s]?class|e[-\s]?class|m3|m5|a4|a6|rs7|panamera|ghost|spectre)\b/i, "sedan"],
];

const VALID_BODY_STYLES: ReadonlySet<BodyStyle> = new Set([
  "sedan", "coupe", "hatchback", "wagon", "suv", "truck", "convertible", "unknown",
]);

export function validateBodyStyle(s: unknown): BodyStyle | undefined {
  if (typeof s !== "string") return undefined;
  const lower = s.toLowerCase();
  return VALID_BODY_STYLES.has(lower as BodyStyle) ? (lower as BodyStyle) : undefined;
}

// Multi-style curated models — mirrors vanguard MODEL_BODY_STYLE_OPTIONS.
// Models not listed here that are in KNOWN_MODEL_BODY_STYLES are single-style
// (only their curated style is valid). Models in neither (AI-found) accept any
// canonical style.
const MODEL_VALID_BODY_STYLES: Record<string, ReadonlyArray<BodyStyle>> = {
  "Honda:Civic": ["sedan", "hatchback"],
  "Dodge:Charger": ["sedan", "coupe"],
  "Honda:Civic Type R (EP3)": ["hatchback"],
  "Honda:Civic Type R (FD2)": ["sedan"],
  "Honda:Civic Type R (FK2)": ["hatchback"],
  "BMW:8 Series": ["coupe", "convertible"],
  "BMW:M8": ["coupe", "convertible"],
  "Ford:Mustang Dark Horse": ["coupe", "convertible"],
  "Mercedes-Benz:SL 63 AMG": ["convertible"],
  "Honda:S2000": ["convertible"],
  "Mazda:MX-5 Miata": ["convertible"],
};

// Curated, hand-verified signature design cues keyed identically to
// KNOWN_MODEL_BODY_STYLES. Each entry holds exactly 3 immutable cues — the
// render critic's vehicle-accuracy check uses signatureDesignCues.slice(0, 3)
// as ground truth, so substituting these eliminates the risk of a hallucinated
// cue from the vehicle-expert call passing the accuracy gate.
//
// Cues describe permanent shape/feature facts that are visible from a 3/4
// hero angle and are unlikely to be confused across siblings. Avoid colour,
// trim level, year-specific facelifts, or wheel/aero details (those belong to
// the AI brief and the build/aero briefs).
const KNOWN_MODEL_SIGNATURE_CUES: Record<string, readonly [string, string, string]> = {
  // ── Modern BMW ──────────────────────────────────────────────────────────
  "BMW:M3": [
    "tall vertical twin-kidney grille dominating the front fascia",
    "quad round tailpipes exiting a body-coloured rear bumper",
    "pronounced front fender power-bulges with M-vent gills behind the front wheels",
  ],
  "BMW:M5": [
    "wide twin-kidney grille flanked by adaptive LED headlights with hexagonal DRL signature",
    "quad oval tailpipes split to the outer corners of the rear diffuser",
    "long four-door sedan silhouette with subtle Hofmeister kink at the C-pillar",
  ],
  "BMW:M2": [
    "short stubby coupe proportions with very short rear overhang",
    "wide squared-off twin-kidney grille and angular quad-element headlights",
    "boxy flared fenders over all four wheels with quad round tailpipes",
  ],
  "BMW:M4": [
    "oversized vertical twin-kidney grille extending almost to the lower bumper",
    "frameless coupe doors with prominent rear haunches and quad round exhausts",
    "carbon-fibre roof panel with central spine recess",
  ],
  "BMW:M8": [
    "wide low coupe stance with frameless doors and long bonnet",
    "twin-kidney grille flanked by slim laser-style headlights",
    "quad oval tailpipes and a body-coloured rear lip spoiler integrated into the bootlid",
  ],
  "BMW:8 Series": [
    "long sloping fastback roofline tapering into a short rear deck",
    "frameless coupe doors with a strong shoulder line running the full body",
    "slim wide kidney grille and squinting LED headlights",
  ],
  "BMW:X5 M": [
    "tall SUV silhouette with a horizontally split twin-kidney grille",
    "raked D-pillar with floating-roof glasshouse treatment",
    "quad round tailpipes integrated into the rear diffuser",
  ],
  "BMW:X6 M": [
    "coupe-SUV fastback roofline that drops sharply over the rear wheels",
    "twin-kidney grille with squinting adaptive LED headlights",
    "quad round exhaust outlets with a body-coloured rear diffuser",
  ],
  "BMW:2002 Turbo": [
    "boxy two-door coupe with upright greenhouse and slim chrome bumpers",
    "round dual headlights flanking a small kidney grille",
    "front spoiler with mirror-reversed 'turbo' graphic and bolted-on flared arches",
  ],
  // ── Mercedes-Benz / AMG ─────────────────────────────────────────────────
  "Mercedes-Benz:AMG C63": [
    "AMG Panamericana vertical-slat grille with the central three-pointed star",
    "long bonnet with twin power-domes either side of the central crease",
    "quad round tailpipes split into the corners of the rear diffuser",
  ],
  "Mercedes-Benz:AMG E63": [
    "AMG Panamericana vertical-slat grille on a four-door sedan body",
    "wide arched rear haunches with quad round tailpipes flanking a black diffuser",
    "long bonnet with twin power-bulges and AMG fender badges behind the front wheels",
  ],
  "Mercedes-Benz:S-Class": [
    "long luxury sedan silhouette with a tall upright greenhouse and chrome window surrounds",
    "wide horizontal-bar grille with the central three-pointed star",
    "wraparound full-width rear tail-lamp graphic with three-element star pattern",
  ],
  "Mercedes-Benz:AMG GT": [
    "very long bonnet stretching far ahead of a cab-rearward greenhouse",
    "AMG Panamericana vertical-slat grille with a low wide front fascia",
    "short tapered rear deck with quad round exhausts and a low ducktail spoiler",
  ],
  "Mercedes-Benz:SL 63 AMG": [
    "soft-top roadster proportions with a long bonnet and short rear deck",
    "AMG Panamericana vertical-slat grille set into a low front fascia",
    "twin power-bulges on the bonnet flanking a central spine",
  ],
  "Mercedes-Benz:G-Class": [
    "fully boxy upright SUV silhouette with vertical glass and flat slab sides",
    "round headlights flanking an upright square grille with the central star",
    "exposed door hinges, side-exit twin exhausts, and tailgate-mounted spare wheel",
  ],
  // ── Porsche ─────────────────────────────────────────────────────────────
  "Porsche:911 Carrera S": [
    "rounded 911 silhouette with a teardrop roofline tapering to the rear ducktail",
    "round LED headlights set into the front fenders above a low wide front fascia",
    "full-width horizontal LED tail-lamp bar across the rear",
  ],
  "Porsche:911 GT3": [
    "fixed swan-neck rear wing mounted high above the engine deck",
    "round 911 headlights with deep front-bumper aero ducts and a centre splitter",
    "rear engine cover vents with a track-focused diffuser and twin centre tailpipes",
  ],
  "Porsche:911 Turbo S": [
    "wide rear hips with intake ducts ahead of the rear wheels",
    "round 911 headlights and full-width rear LED light bar",
    "active rear wing that extends from a flush position in the engine cover",
  ],
  "Porsche:Panamera": [
    "long four-door fastback silhouette with a tapered Porsche-coupe roofline",
    "round Porsche headlights set into pronounced front fenders",
    "full-width horizontal LED tail-lamp graphic spanning the rear",
  ],
  "Porsche:Taycan Turbo": [
    "low wide four-door fastback EV silhouette with a heavily sculpted bonnet",
    "four-point matrix LED headlights set into deep front fender ducts",
    "full-width 'PORSCHE' light-bar across the rear with a flush body-coloured fascia",
  ],
  "Porsche:911 Carrera RS 2.7": [
    "classic narrow-body 911 silhouette with round headlights and a sloping rear deck",
    "ducktail rear engine-lid spoiler with rubber lip",
    "side 'Carrera' script graphic running along the lower door panels",
  ],
  "Porsche:959": [
    "wide-body 911-derived silhouette with smoothly faired-in front and rear bumpers",
    "round pop-up-style fixed headlights flush with the bonnet line",
    "integrated rear wing fairing flowing into the rear quarter panels",
  ],
  // ── Ferrari ─────────────────────────────────────────────────────────────
  "Ferrari:296 GTB": [
    "mid-engine berlinetta silhouette with a sail-panel buttress flanking the rear glass",
    "round-element LED tail lamps set high on the rear fascia",
    "aero-tunnel cutouts in the rear bumper feeding a deep diffuser",
  ],
  "Ferrari:Roma": [
    "front-engine GT proportions with a long bonnet and fastback roofline",
    "body-coloured grille with a fine mesh pattern and slim quad headlights",
    "twin round tail lamps each side over a clean body-coloured rear fascia",
  ],
  "Ferrari:F8 Tributo": [
    "S-duct front bonnet vent channelling air over the windscreen",
    "rear quarter glass divided by a body-coloured Lexan louvre panel",
    "twin round tail lamps each side over a deep central diffuser with twin exhausts",
  ],
  "Ferrari:SF90 Stradale": [
    "extreme cab-forward mid-engine silhouette with a very low nose and tall rear deck",
    "wraparound L-shaped LED headlights tucked into the front fenders",
    "twin stacked exhausts mounted high in the centre of the rear fascia",
  ],
  "Ferrari:Purosangue": [
    "tall four-door SUV-coupe silhouette with rear-hinged 'welcome' rear doors",
    "twin-stack headlight arrangement with upper DRL slits over lower main lamps",
    "side-vent fender exhaust gills behind the front wheels",
  ],
  "Ferrari:288 GTO": [
    "boxy 308-derived mid-engine coupe silhouette with squared-off arches",
    "four round headlights in a slim rectangular front bumper",
    "rear-quarter NACA cooling ducts ahead of the rear wheels",
  ],
  // ── Lamborghini ─────────────────────────────────────────────────────────
  "Lamborghini:Huracán EVO": [
    "low wedge mid-engine silhouette with a hexagonal exhaust outlet centred high in the rear",
    "Y-shaped LED daytime running lights in the front fascia",
    "angular hexagonal side intakes feeding the mid-mounted V10",
  ],
  "Lamborghini:Huracán Tecnica": [
    "fixed lightweight rear ducktail spoiler integrated into the engine cover",
    "front fascia with sharp Y-shaped DRLs and a wide low splitter",
    "hexagonal twin-exit central exhaust set high in the rear fascia",
  ],
  "Lamborghini:Revuelto": [
    "extreme wedge silhouette with a Y-shaped DRL and headlight signature",
    "exposed V12 visible through the rear engine glass under a Y-themed cover",
    "hexagonal triple-exit exhausts set high above the rear diffuser",
  ],
  "Lamborghini:Urus S": [
    "coupe-SUV silhouette with a strongly raked D-pillar and floating roof",
    "Y-shaped LED daytime running lights in a hexagonal front grille",
    "octagonal wheel-arch surrounds with prominent fender flares",
  ],
  "Lamborghini:Countach LP400": [
    "extreme wedge with scissor doors and very low pointed nose",
    "NACA-style ducts cut into the rear quarter panels",
    "trapezoidal rear engine cover slats and a flat upright tail",
  ],
  // ── McLaren ─────────────────────────────────────────────────────────────
  "McLaren:720S": [
    "dihedral doors with double-skin 'eye-socket' headlight intakes carved into the front fenders",
    "teardrop greenhouse with very thin A-pillars and full glass canopy",
    "active rear wing rising from the engine cover",
  ],
  "McLaren:765LT": [
    "extended carbon front splitter and longtail rear bodywork",
    "double-skin headlight intakes with a low wide front fascia",
    "quad-tip top-exit titanium exhausts mounted high in the rear",
  ],
  "McLaren:Artura": [
    "compact mid-engine silhouette with dihedral doors and a teardrop canopy",
    "slim horizontal LED headlights with hooked daytime-running graphic",
    "high-mounted twin-exit central exhaust set into the rear fascia",
  ],
  "McLaren:F1": [
    "central driving position with a three-seat layout visible through the glasshouse",
    "dihedral doors and a teardrop canopy with very thin A-pillars",
    "rear engine bay louvres with a small fixed centre rear wing",
  ],
  // ── Audi ────────────────────────────────────────────────────────────────
  "Audi:RS7": [
    "long four-door fastback silhouette with a wide low single-frame hexagonal grille",
    "flared blistered fenders over all four wheels with quad oval tailpipes",
    "full-width rear LED light bar spanning the tailgate",
  ],
  "Audi:RS6 Avant": [
    "estate/wagon roofline with a long flat roof and integrated roof spoiler",
    "wide low single-frame hexagonal grille with vertical slats",
    "blistered RS fender flares over all four wheels with quad oval exhausts",
  ],
  "Audi:R8": [
    "mid-engine coupe with a contrasting side blade panel running ahead of the rear wheel",
    "wide single-frame hexagonal grille flanked by angular LED headlights",
    "twin oval exhausts flanking a body-coloured rear diffuser",
  ],
  "Audi:RS5": [
    "low coupe silhouette with a wide single-frame hexagonal grille",
    "blistered RS-style fender flares over all four wheels",
    "twin oval RS exhaust outlets at the corners of the rear diffuser",
  ],
  "Audi:RS3": [
    "compact 5-door hatchback with a wide single-frame hexagonal grille",
    "blistered RS front fender flares over the front wheels",
    "twin oval RS exhausts on either side of a body-coloured rear diffuser",
  ],
  "Audi:e-tron GT RS": [
    "low four-door fastback EV silhouette with a closed body-coloured grille panel",
    "matrix LED headlights with a four-segment daytime running signature",
    "blistered rear haunches with a full-width rear light bar",
  ],
  // ── Tesla ───────────────────────────────────────────────────────────────
  "Tesla:Model S Plaid": [
    "smooth four-door fastback silhouette with a closed body-coloured nose",
    "flush door handles and a glass roof spanning front to rear seats",
    "full-width body-coloured rear fascia with no visible exhaust",
  ],
  "Tesla:Cybertruck": [
    "fully angular faceted stainless-steel body with flat slab panels",
    "single horizontal LED light bar spanning the front and the rear",
    "exoskeleton truck silhouette with an integrated bed sail panel",
  ],
  // ── Bentley / Rolls-Royce / Aston Martin ────────────────────────────────
  "Bentley:Continental GT": [
    "long bonnet GT coupe silhouette with a strong rear haunch crease",
    "round quad LED headlights with a wide upright matrix mesh grille",
    "elliptical twin oval exhausts at the corners of a chrome rear diffuser",
  ],
  "Bentley:Bentayga": [
    "tall upright SUV silhouette with a wide chrome matrix grille",
    "round quad LED headlights flanking the grille",
    "B-shaped LED tail lamps with chrome surrounds",
  ],
  "Rolls-Royce:Ghost": [
    "long four-door sedan silhouette with a tall upright Pantheon grille and Spirit of Ecstasy",
    "rear-hinged 'coach' rear doors with a long flat shoulder line",
    "rectangular vertical LED tail lamps over a chrome lower bumper bar",
  ],
  "Rolls-Royce:Spectre": [
    "long two-door coupe silhouette with rear-hinged 'coach' doors",
    "tall upright Pantheon grille with the Spirit of Ecstasy ornament",
    "fastback roofline tapering into a long rear deck",
  ],
  "Rolls-Royce:Cullinan": [
    "tall fully boxy SUV silhouette with vertical glass and a high beltline",
    "upright Pantheon grille with the Spirit of Ecstasy ornament",
    "rear-hinged 'coach' rear doors with chrome window surrounds",
  ],
  "Aston Martin:Vantage": [
    "wide low coupe stance with a single oversized hunting-mouth front grille",
    "winged Aston Martin badge centred on the bonnet leading edge",
    "duck-tail rear bootlid spoiler with horizontal LED tail lamps",
  ],
  "Aston Martin:DB12": [
    "long-bonnet GT coupe silhouette with a wide hunting-mouth front grille",
    "winged Aston Martin badge on the bonnet and frameless coupe doors",
    "horizontal LED tail-lamp graphic across a tapered rear deck",
  ],
  "Aston Martin:DBX707": [
    "tall SUV silhouette with a wide low hunting-mouth front grille",
    "winged Aston badge on the bonnet leading edge",
    "quad round tailpipes split to the outer corners of a body-coloured diffuser",
  ],
  // ── Ford / Chevrolet / Dodge / Pontiac / Plymouth / Buick ───────────────
  "Ford:GT": [
    "extreme cab-forward mid-engine silhouette with flying buttresses to the rear fenders",
    "twin teardrop body fairings either side of the central greenhouse",
    "round dual LED tail lamps set inside circular cutouts in the rear fascia",
  ],
  "Ford:Mustang GT500": [
    "long pony-car bonnet with a central scoop and twin cooling vents",
    "tri-bar vertical LED tail lamps grouped in three columns each side",
    "wide front grille with the offset Cobra badge and lower splitter",
  ],
  "Ford:Mustang Dark Horse": [
    "long pony-car bonnet with twin tri-stripe vents",
    "tri-bar vertical LED tail-lamp signature each side",
    "trapezoidal lower front fascia with a wide black grille and offset pony badge",
  ],
  "Ford:Mustang (1st Gen)": [
    "long-hood short-deck pony-car silhouette with a chrome side scallop",
    "round dual headlights flanking a horizontal-bar grille with the centred pony emblem",
    "tri-bar tail-lamp signature with three vertical lenses each side",
  ],
  "Ford:GT40": [
    "extremely low Le Mans coupe silhouette barely above wheel height",
    "wide opening clamshell front and rear bodywork with central body crease",
    "round headlights faired into the front bodywork under clear covers",
  ],
  "Ford:Model B (Deuce Coupe)": [
    "tall narrow upright pre-war coupe with separate fenders and running boards",
    "vertical chrome 'waterfall' radiator shell with the central Ford emblem",
    "exposed beam axle and visible exhaust headers (hot-rod build context)",
  ],
  "Chevrolet:Corvette Z06": [
    "mid-engine wedge silhouette with a wide low nose and large rear quarter intakes",
    "quad square LED tail lamps grouped in pairs each side",
    "central quad exhausts exiting the body-coloured rear diffuser",
  ],
  "Chevrolet:Corvette E-Ray": [
    "mid-engine Corvette wedge silhouette with widened arches",
    "quad square LED tail lamps grouped in pairs each side",
    "central twin-pair exhausts exiting through a body-coloured rear diffuser",
  ],
  "Chevrolet:Camaro ZL1": [
    "long muscle-coupe bonnet with a central carbon air extractor",
    "wide low trapezoidal front grille with offset Chevy bowtie badge",
    "quad round exhaust outlets in a black rear diffuser",
  ],
  "Chevrolet:Bel Air": [
    "long flat tri-five sedan/coupe silhouette with prominent rear tailfins",
    "wide chrome eggcrate grille with chrome bumper bullets",
    "side chrome spear with two-tone paint break along the body sides",
  ],
  "Chevrolet:Corvette Sting Ray": [
    "long pointed bonnet with a central crease and twin power-bulges",
    "split-window or pointed-tail fastback rear (era-appropriate) with round dual tail lamps",
    "hidden pop-up round headlights faired into the front fenders",
  ],
  "Chevrolet:Camaro SS": [
    "long muscle-coupe bonnet with twin rectangular hood scoops or a central cowl",
    "wide horizontal-bar split front grille with round headlights inset",
    "round dual tail lamps each side with twin centre exhausts",
  ],
  "Chevrolet:Chevelle SS": [
    "long flat muscle-coupe bonnet with twin power-bulges and SS badging",
    "split front grille with quad round headlights",
    "round dual tail lamps recessed into a chrome rear bumper",
  ],
  "Dodge:Charger Scat Pack": [
    "four-door muscle sedan silhouette with a long flat bonnet and a centred 'scallop' grille",
    "full-width LED 'racetrack' rear tail-lamp signature",
    "wide blistered rear haunches over the rear wheels",
  ],
  "Dodge:Challenger SRT Demon": [
    "long flat muscle-coupe bonnet with a wide central 'Air-Grabber' hood scoop",
    "split horizontal-bar front grille with quad round headlights",
    "full-width 'racetrack' LED rear tail-lamp signature",
  ],
  "Dodge:Charger R/T": [
    "1968-1970 generation muscle coupe with hidden round headlights behind a horizontal-slat grille",
    "wide flat bonnet with twin wing-shaped indents",
    "full-width recessed rear tail-lamp panel",
  ],
  "Dodge:Challenger R/T": [
    "long flat muscle-coupe bonnet with a wide split horizontal-bar front grille",
    "round quad headlights flanking a central body-coloured fascia panel",
    "full-width recessed rear tail-lamp panel with twin centre exhausts",
  ],
  "Pontiac:GTO": [
    "long muscle-coupe bonnet with twin scoops or a single central scoop",
    "split vertical front grille with stacked quad headlights",
    "round dual tail lamps each side recessed into a chrome rear bumper",
  ],
  "Pontiac:Firebird Trans Am": [
    "long muscle-coupe bonnet with a large central 'screaming chicken' bird graphic decal",
    "shaker hood scoop poking through the bonnet",
    "split front grille with quad rectangular headlights",
  ],
  "Plymouth:'Cuda": [
    "1970-71 E-body muscle coupe silhouette with a flat bonnet and shaker scoop",
    "quad round headlights flanking a wide horizontal-bar split front grille",
    "side 'hockey-stick' billboard rear-fender stripe (era graphic)",
  ],
  "Plymouth:HEMI 'Cuda": [
    "long flat muscle-coupe bonnet with a centred 'shaker' Hemi scoop",
    "quad round headlights in a wide horizontal-slat front grille",
    "side 'hockey-stick' rear quarter graphic and chrome rear bumper",
  ],
  "Shelby:Cobra 289": [
    "small open two-seat roadster silhouette with cycle-style fenders",
    "egg-shaped front grille opening with the central Cobra emblem",
    "side-exit twin exhaust pipes running below the door sills",
  ],
  "Shelby:GT500": [
    "1967-68 era pony-car coupe with a long flat bonnet and twin hood scoops",
    "high-mounted round driving lights inboard of the headlights in the grille",
    "rectangular sequential rear tail lamps each side",
  ],
  "Buick:GNX": [
    "boxy G-body coupe silhouette painted entirely in matte black",
    "split horizontal-bar front grille with twin square headlights each side",
    "fender-vent gills on the front quarter panel ahead of the doors",
  ],
  // ── Japanese performance ────────────────────────────────────────────────
  "Nissan:GT-R Nismo": [
    "wide squared-off coupe silhouette with a central 'V-motion' front grille",
    "quad round tail lamps grouped in pairs each side",
    "fixed carbon swan-neck rear wing with end plates",
  ],
  "Nissan:Z": [
    "long-bonnet coupe silhouette with a wide rectangular front grille",
    "teardrop-shaped LED headlights echoing the original 240Z lamps",
    "horizontal LED tail lamps echoing the 300ZX with a body-coloured rear fascia",
  ],
  "Nissan:Skyline GT-R R32": [
    "boxy late-80s coupe silhouette with squared-off arches",
    "round quad tail lamps grouped in pairs each side",
    "circular GT-R badge on the rear quarter panel and slim rectangular headlights",
  ],
  "Nissan:Skyline GT-R R34": [
    "boxy 90s coupe silhouette with a wide low rectangular front grille",
    "round quad tail lamps grouped in pairs each side",
    "fixed rear-deck wing on tall risers with adjustable end plates",
  ],
  "Datsun:240Z": [
    "long sloping fastback coupe silhouette with a long bonnet and short rear deck",
    "round headlights set into bullet-shaped recessed bezels in the front fenders",
    "vented C-pillar 'gill' panel behind the rear quarter glass",
  ],
  "Toyota:GR Supra": [
    "long-bonnet coupe silhouette with double-bubble roof contour",
    "wide low rectangular grille with hexagonal mesh and prominent intake mouths flanking it",
    "ducktail rear bootlid integrated into the rear quarter panels",
  ],
  "Toyota:GR86": [
    "compact coupe silhouette with a low long bonnet and short rear deck",
    "wide low trapezoidal front grille with angular LED headlights",
    "ducktail rear bootlid spoiler integrated into the body",
  ],
  "Toyota:GR Yaris": [
    "compact 3-door hatchback silhouette with a steeply raked rear screen",
    "wide low trapezoidal front grille with angular LED headlights",
    "blistered front and rear fender arches over wider tracks",
  ],
  "Toyota:Supra MK4 (A80)": [
    "long-bonnet coupe silhouette with a double-bubble roof and a long rear glass",
    "round quad tail lamps grouped in pairs each side",
    "large fixed rear-deck wing on tall risers (turbo trim)",
  ],
  "Mazda:RX-7 FD": [
    "low rounded coupe silhouette with pop-up headlights and very thin pillars",
    "round dual tail lamps each side set into a tapered rear deck",
    "smoothly curved fender arches over all four wheels",
  ],
  "Acura:NSX (NA1)": [
    "low mid-engine wedge silhouette with a wide low nose",
    "pop-up rectangular headlights flush with the bonnet line",
    "full-width recessed rear tail-lamp bar across the rear",
  ],
  "Honda:Civic Type R (FL5)": [
    "5-door hatchback silhouette with a tall central triangular exhaust grouping",
    "blistered front fender flares with a low wide front splitter",
    "large fixed rear roof-mounted wing on tall risers",
  ],
  "Honda:Civic Type R (FK8)": [
    "boxy hatchback silhouette with aggressive faux-vent rear-quarter sculpting",
    "triple central exhaust outlets in the rear bumper",
    "tall fixed rear wing on prominent risers extending well above the tailgate",
  ],
  "Honda:Civic Type R (EP3)": [
    "tall-roof three-door hatchback profile with a short bonnet and upright rear hatch",
    "large triangular headlamps set high at the corners of a compact front fascia",
    "high-mounted rear wing above a nearly vertical tailgate",
  ],
  "Honda:Civic Type R (FD2)": [
    "four-door compact sedan body with a separate, squared-off boot and short rear overhang",
    "wide angular headlamps and a low, broad front bumper opening",
    "distinctive high rear-deck wing above the sedan boot lid",
  ],
  "Honda:Civic Type R (FK2)": [
    "five-door hatchback profile with a sharply sloped windscreen and rising shoulder line",
    "pronounced rear-quarter arch shoulders flowing into a tall hatch-mounted wing",
    "three central exhaust outlets grouped in the rear diffuser area",
  ],
  "Honda:Civic Type R (EK9)": [
    "compact 90s 3-door hatchback silhouette with a short rear overhang",
    "round dual headlights inboard of the front fenders",
    "small lip rear-deck spoiler integrated into the tailgate",
  ],
  "Honda:S2000": [
    "low compact roadster silhouette with a long bonnet and short rear deck",
    "soft-top convertible roof or removable hardtop with very low cowl line",
    "round dual tail lamps inset into a tapered body-coloured rear fascia",
  ],
  "Honda:Integra Type R (DC2)": [
    "compact 90s 3-door coupe silhouette with a wedge profile",
    "quad round headlights flanking a slim horizontal-bar grille",
    "small lip rear-deck spoiler and red Type R badge on the grille",
  ],
  "Honda:Prelude (5th Gen)": [
    "low, wide two-door coupe with a long bonnet, narrow greenhouse and short boot",
    "fixed oval headlights integrated into a smooth, sloping nose",
    "rounded rear quarters ending in a full-width horizontal tail-lamp panel",
  ],
  "Honda:Prelude (6th Gen)": [
    "low two-door hybrid coupe profile with a long sloping roof flowing into a short liftback-style rear",
    "wide, low nose with slim horizontal LED headlamps and a narrow central grille opening",
    "broad rear haunches and a clean full-width horizontal rear-light treatment",
  ],
  "Honda:NSX (NA2)": [
    "low mid-engine two-seat coupe wedge with a flat bonnet and cabin set forward of the rear axle",
    "fixed xenon headlamps integrated into the nose rather than pop-up headlamp doors",
    "large side air intakes behind both doors and four round tail lamps",
  ],
  "Honda:CR-Z": [
    "compact two-seat three-door hybrid liftback with a sharply tapered nose and short rear deck",
    "deeply sloped windscreen continuing into a fastback roof and steep rear hatch",
    "split rear glass and a high, broad hatch spoiler defining the short tail",
  ],
  "Honda:Crosstour": [
    "high-riding five-door fastback with an Accord-like long bonnet and a roof that slopes into the rear hatch",
    "thick rear pillars and a deeply raked tailgate glass above a short, raised rear deck",
    "vertical wraparound tail lamps integrated into the high rear corners",
  ],
  "Honda:Element": [
    "boxy compact SUV with a nearly flat roof, upright windscreen and tall squared-off cabin",
    "large rectangular side windows and contrasting squared wheel-arch cladding",
    "vertical rear hatch with tall corner tail lamps and a low, wide bumper",
  ],
  "Honda:Insight": [
    "follow the selected year: 2000–2006 two-seat tapered liftback, 2010–2014 five-door hatchback, or 2019–2022 four-door sedan",
    "low-drag aerodynamic roofline and smoothly tapered rear body, matched to the chosen generation",
    "distinctive hybrid-era compact proportions; do not substitute a generic Civic silhouette",
  ],
  "Honda:Fit": [
    "short-nose tall-roof five-door subcompact hatchback with a compact, upright cabin",
    "large side windows and a high roofline that continues nearly level to the rear hatch",
    "short rear overhang with a tall vertical hatch and narrow corner tail lamps",
  ],
  "Honda:HR-V": [
    "compact crossover with a rising beltline, short rear overhang and sloping roof into a rear hatch",
    "rear door handles concealed high near the C-pillars, creating a clean two-door-like side profile",
    "raised ride height with compact hatchback proportions rather than a boxy full-size SUV body",
  ],
  "Honda:Odyssey": [
    "long, low minivan profile with a broad cabin, sliding-door tracks and a gently tapered nose",
    "large rectangular side-glass area with a long roofline extending over the third row",
    "wide rear tailgate framed by tall vertical tail lamps at the outer corners",
  ],
  "Honda:Passport": [
    "two-row midsize SUV with a short rear overhang, broad shoulders and a tall upright cabin",
    "wide squared wheel arches and a high beltline over large side windows",
    "vertical rear hatch with tall corner tail lamps and a broad bumper",
  ],
  "Honda:Pilot": [
    "three-row midsize SUV with a long cabin, upright tailgate and substantial rear quarter glass",
    "tall squared wheel arches and a broad front fascia above a high ride height",
    "large rear hatch bordered by vertical tail lamps, with a longer wheelbase than the Passport",
  ],
  "Honda:Ridgeline": [
    "four-door crew-cab pickup with a short integrated bed and SUV-like unibody proportions",
    "cab and bed form a continuous side profile, with a clearly separate open cargo bed behind the rear doors",
    "wide tailgate across a compact pickup bed, not a full-size long-bed truck",
  ],
  "Mitsubishi:Lancer Evolution X": [
    "compact 4-door sedan silhouette with a tall fixed rear wing on twin risers",
    "wide trapezoidal front grille with a central jet-fighter intake",
    "twin centred exhaust outlets and an aluminium bonnet with twin vents",
  ],
  "Mitsubishi:Lancer Evolution IX": [
    "compact 4-door sedan silhouette with a tall fixed rear wing on risers",
    "wide horizontal-bar split front grille with circular fog lights inset",
    "vented aluminium bonnet with twin extractor vents",
  ],
  "Mitsubishi:Lancer Evolution VI TME": [
    "compact 4-door sedan silhouette with blistered fender flares",
    "tall fixed rear wing on risers with end plates",
    "round fog lights inset into a body-coloured front bumper alongside a wide grille",
  ],
  "Mitsubishi:3000GT": [
    "low pop-up-headlight 90s coupe silhouette with a long bonnet",
    "wraparound horizontal LED-style tail-lamp bar across the rear",
    "active or fixed rear wing integrated into the trunk lid",
  ],
  "Mitsubishi:Eclipse GSX": [
    "low compact 90s sport-coupe silhouette with rounded bodywork",
    "round dual headlights inset into smoothly curved front fenders",
    "round dual tail lamps each side over a body-coloured rear fascia",
  ],
  "Mitsubishi:Pajero Evolution": [
    "boxy short-wheelbase SUV silhouette with very wide blistered fender flares",
    "round dual headlights flanking a wide horizontal-slat grille",
    "tailgate-mounted spare wheel under a moulded cover",
  ],
  "Mitsubishi:Pajero SWB Gen 1": [
    "boxy 80s short-wheelbase SUV silhouette with vertical glass and slab sides",
    "round or rectangular dual headlights with a horizontal-slat grille",
    "tailgate-mounted spare wheel and side-hinged rear door",
  ],
  "Mitsubishi:Pajero SWB Gen 2": [
    "rounded 90s short-wheelbase SUV silhouette with curved fender arches",
    "rectangular composite headlights flanking a slim horizontal-bar grille",
    "tailgate-mounted spare wheel under a moulded cover",
  ],
  "Mitsubishi:Pajero SWB Gen 3": [
    "rounded 2000s short-wheelbase SUV silhouette with body-coloured arches",
    "wraparound composite headlights and a horizontal-bar chrome grille",
    "tailgate-mounted spare wheel under a body-coloured cover",
  ],
  "Mitsubishi:Pajero SWB Gen 4": [
    "tall boxy 4th-gen short-wheelbase SUV silhouette with a flat upright tailgate",
    "wraparound composite headlights flanking a wide chrome-bar grille",
    "tailgate-mounted spare wheel under a body-coloured cover",
  ],
  "Subaru:WRX STI (VA)": [
    "compact 4-door sedan silhouette with a tall fixed rear wing on twin risers",
    "wide hexagonal front grille with a central scoop in the bonnet",
    "blistered front fender flares with side fender-vent gills",
  ],
  "Subaru:WRX (VB)": [
    "compact 4-door sedan silhouette with a wide hexagonal front grille",
    "matte-black plastic wheel-arch cladding over all four arches",
    "central bonnet scoop and twin centre-exit exhausts",
  ],
  "Subaru:Impreza WRX STI (GD)": [
    "compact 4-door 'bugeye/blobeye/hawkeye' sedan silhouette with a tall rear wing on risers",
    "central bonnet scoop with side fender gill vents",
    "round dual headlights (era-appropriate) flanking a slim grille",
  ],
  "Subaru:22B STI": [
    "two-door coupe-style Impreza silhouette with very widely flared fender arches",
    "central bonnet scoop and slim oval headlights",
    "tall fixed rear wing on risers with end plates",
  ],
  "Subaru:BRZ": [
    "compact 2-door coupe silhouette with a long low bonnet and short rear deck",
    "wide low hexagonal front grille with hawk-wing LED headlights",
    "ducktail rear bootlid spoiler integrated into the body",
  ],
  "Subaru:SVX": [
    "low 90s GT coupe silhouette with a strongly wedged profile",
    "split 'window-within-window' side glass treatment",
    "wraparound front headlights with a slim horizontal grille bar",
  ],
  // ── Volkswagen / MINI ──────────────────────────────────────────────────
  "Volkswagen:Golf R (Mk8)": [
    "compact 5-door hatchback silhouette with a steeply raked rear screen",
    "wide low honeycomb front grille connected to slim LED headlights by a chrome bar",
    "quad round exhaust tips at the corners of the rear diffuser",
  ],
  "Volkswagen:Golf GTI (Mk8)": [
    "compact 5-door hatchback silhouette with a red grille-frame stripe",
    "wide low honeycomb front grille with red accent bar between the headlights",
    "twin centred exhaust outlets and red GTI badging",
  ],
  "Volkswagen:Golf R32 (Mk5)": [
    "Mk5 5-door hatchback silhouette with blistered front fender flares",
    "deep blue 'R' grille badge and slim chrome grille frame",
    "twin centre-exit exhaust outlets in a body-coloured rear bumper",
  ],
  "Volkswagen:Golf MK1 GTI": [
    "compact boxy 80s 3-door hatchback with upright glass and steel bumpers",
    "round dual headlights flanking a slim red-stripe grille frame",
    "side 'GTI' badge with red-stripe wheel-arch trim and steel pepperpot wheels",
  ],
  "Volkswagen:Scirocco R": [
    "low wide 3-door coupe-hatch silhouette with a steeply raked roofline",
    "wide low rectangular grille flanked by slim trapezoidal headlights",
    "twin oval exhausts at the corners of a body-coloured rear diffuser",
  ],
  "Volkswagen:Arteon R": [
    "long four-door fastback silhouette with a frameless coupe-style door treatment",
    "wide low chrome-slat front grille connected to LED headlights",
    "full-width LED tail-lamp graphic across the bootlid",
  ],
  "MINI:Cooper Coupé": [
    "compact two-door MINI silhouette with a contrasting roof colour and a 'helmet' or low coupé roofline",
    "round dual headlights with chrome bezels flanking a hexagonal grille",
    "small rear lip spoiler and twin centre-exit exhausts",
  ],
  // ── Peugeot ─────────────────────────────────────────────────────────────
  "Peugeot:208 GTI": [
    "compact 5-door hatchback silhouette with a chequered side trim accent",
    "wide low chrome-mesh trapezoidal front grille flanked by slim LED headlights",
    "twin chrome exhaust tips at the rear with red GTI-trim accents",
  ],
  "Peugeot:308 GTI": [
    "compact 5-door hatchback silhouette with a wide low chrome-mesh grille",
    "slim claw-shaped LED daytime running lights",
    "twin centred exhaust outlets in a body-coloured rear diffuser",
  ],
  "Peugeot:205 GTI": [
    "compact boxy 80s 3-door hatchback with upright glass",
    "round dual headlights flanking a slim horizontal-slat black grille",
    "side red GTI-stripe wheel-arch trim and pepperpot alloy wheels",
  ],
  "Peugeot:RCZ R": [
    "low 2-door coupe silhouette with twin double-bubble roof crowns and a glass rear hatch",
    "matte aluminium 'flying buttress' roof-arch surrounds over the rear glass",
    "wide low chrome-mesh trapezoidal front grille",
  ],
  // ── Bugatti / Mazda RX-7 / Toyota Land Cruiser / Nissan Patrol ─────────
  "Bugatti:EB110": [
    "low mid-engine wedge silhouette with scissor doors",
    "horseshoe-shaped Bugatti front grille set into a low rounded nose",
    "deep NACA-style rear-quarter intakes feeding the mid-mounted V12",
  ],
  "Toyota:Land Cruiser 300": [
    "boxy SUV silhouette with a high beltline and slab-sided body",
    "wide chrome-bar horizontal grille connected to slim LED headlights",
    "raised roof rails and squared-off plastic wheel-arch surrounds",
  ],
  "Nissan:Patrol": [
    "tall boxy SUV silhouette with vertical glass and a high beltline",
    "wide chrome 'V-motion' front grille with stacked quad LED headlights",
    "boxy squared-off rear with vertical wraparound LED tail lamps",
  ],
  // ── BYD ─────────────────────────────────────────────────────────────────
  "BYD:Seal": [
    "low four-door fastback EV silhouette with a closed body-coloured nose",
    "slim wraparound LED headlights with a hooked daytime-running graphic",
    "full-width rear LED light bar with a body-coloured rear diffuser",
  ],
  "BYD:Han": [
    "long four-door sedan EV silhouette with a closed body-coloured grille panel",
    "slim wraparound LED headlights flanking a 'dragon-face' chrome accent",
    "full-width LED rear tail-lamp bar across the bootlid",
  ],
  "BYD:Yangwang U9": [
    "extreme low mid-engine supercar wedge silhouette with scissor doors",
    "Y-shaped LED daytime running lights flanking a wide low front fascia",
    "fixed high-mounted carbon rear wing with end plates",
  ],
  "BYD:Atto 3": [
    "compact crossover SUV silhouette with a steeply raked D-pillar",
    "closed body-coloured nose panel with slim wraparound LED headlights",
    "full-width rear LED light bar across a body-coloured tailgate",
  ],
  "BYD:Tang": [
    "tall three-row SUV silhouette with a high beltline and floating roof treatment",
    "wide chrome 'dragon-face' front grille with chrome strakes",
    "full-width LED rear tail-lamp bar across the tailgate",
  ],
  "BYD:Dolphin": [
    "compact 5-door hatchback EV silhouette with a tall greenhouse",
    "closed body-coloured nose panel with smiling daytime running lights",
    "two-tone roof colour breaking at the beltline",
  ],
  // ── Jaguar ──────────────────────────────────────────────────────────────
  "Jaguar:E-Type": [
    "extremely long bonnet coupe silhouette with very short rear deck",
    "oval front intake mouth with chrome surround and a single chrome bonnet bulge",
    "covered round headlights faired into the front fenders under glass covers",
  ],
  // ── Task #369: high-volume daily / EV / Korean / JDM coverage ───────────
  // BMW dailies
  "BMW:3 Series": [
    "compact four-door sedan silhouette with a strong shoulder crease running door to door",
    "twin-kidney grille flanked by adaptive LED headlights with hooked DRL signature",
    "subtle Hofmeister kink at the C-pillar with a short rear overhang",
  ],
  "BMW:5 Series": [
    "long executive four-door sedan silhouette with a horizontal beltline",
    "wide twin-kidney grille flanked by L-shaped LED headlights",
    "Hofmeister kink at the C-pillar with twin trapezoidal exhaust outlets",
  ],
  "BMW:X3": [
    "mid-size SUV silhouette with a tall greenhouse and squared-off arches",
    "twin-kidney grille flanked by adaptive LED headlights",
    "matte-black wheel-arch cladding with body-coloured lower bumpers",
  ],
  "BMW:X5": [
    "large SUV silhouette with a tall upright greenhouse and a long bonnet",
    "wide twin-kidney grille flanked by adaptive LED headlights",
    "L-shaped LED tail lamps with chrome lower trim across the tailgate",
  ],
  "BMW:1 Series": [
    "compact 5-door hatchback silhouette with a steeply raked rear screen",
    "wide twin-kidney grille flanked by slim LED headlights",
    "short front overhang with a sharply tapered C-pillar",
  ],
  // Mercedes dailies
  "Mercedes-Benz:C-Class": [
    "compact executive four-door sedan silhouette with a long bonnet",
    "wide central three-pointed star in a chrome-bordered grille",
    "wraparound LED tail lamps with a horizontal three-element light signature",
  ],
  "Mercedes-Benz:E-Class": [
    "long executive four-door sedan silhouette with a horizontal beltline",
    "wide chrome-slat grille with the central three-pointed star",
    "wraparound horizontal LED tail-lamp graphic across the bootlid",
  ],
  "Mercedes-Benz:GLC": [
    "mid-size SUV silhouette with a tall greenhouse and chrome roof rails",
    "wide chrome-slat grille with the central three-pointed star",
    "wraparound horizontal LED tail lamps with chrome lower trim",
  ],
  "Mercedes-Benz:GLE": [
    "large SUV silhouette with a long bonnet and tall upright greenhouse",
    "wide chrome-slat grille with the central three-pointed star",
    "horizontal LED tail-lamp graphic with chrome trim across the tailgate",
  ],
  "Mercedes-Benz:A-Class": [
    "compact 5-door hatchback silhouette with a sharply raked windscreen",
    "wide low diamond-pattern grille with the central three-pointed star",
    "slim wraparound LED headlights with hooked DRL signature",
  ],
  // Audi dailies
  "Audi:A4": [
    "compact executive four-door sedan silhouette with a long flat bonnet",
    "wide single-frame hexagonal grille flanked by slim LED headlights",
    "horizontal shoulder crease running door to door",
  ],
  "Audi:A6": [
    "long executive four-door sedan silhouette with a horizontal beltline",
    "wide single-frame hexagonal grille flanked by matrix LED headlights",
    "horizontal LED tail-lamp graphic across the bootlid",
  ],
  "Audi:Q5": [
    "mid-size SUV silhouette with a tall upright greenhouse and roof rails",
    "wide single-frame hexagonal grille flanked by slim LED headlights",
    "wraparound horizontal LED tail lamps with chrome lower trim",
  ],
  "Audi:Q7": [
    "large three-row SUV silhouette with a long bonnet and tall greenhouse",
    "wide single-frame hexagonal grille flanked by matrix LED headlights",
    "horizontal LED tail-lamp graphic with chrome lower trim across the tailgate",
  ],
  // Tesla mass-market EVs
  "Tesla:Model 3": [
    "compact four-door sedan EV silhouette with a closed body-coloured nose panel",
    "flush door handles and a glass roof spanning front to rear seats",
    "smooth body-coloured rear fascia with no visible exhaust outlet",
  ],
  "Tesla:Model Y": [
    "compact crossover SUV EV silhouette with a sharply tapered fastback roofline",
    "closed body-coloured nose panel with no grille opening",
    "flush door handles and a panoramic glass roof spanning front to rear",
  ],
  // Ford trucks / Bronco
  "Ford:F-150": [
    "full-size pickup silhouette with a long flat bonnet and large square wheel arches",
    "wide horizontal-bar chrome grille with the central blue Ford oval badge",
    "step-down truck bed with vertical-tailgate styling and 'F-150' embossed lettering on the tailgate",
  ],
  "Ford:Ranger": [
    "mid-size pickup silhouette with a flat bonnet and squared-off cab",
    "wide trapezoidal grille with the central blue Ford oval badge and C-clamp LED daytime running lights",
    "step-down truck bed with body-coloured tailgate and 'RANGER' lettering",
  ],
  "Ford:Bronco": [
    "boxy SUV silhouette with vertical glass and exposed bolt-on fender flares",
    "wide horizontal-slat grille with 'FORD' lettering centred between round LED headlights",
    "removable roof and door panels with body-coloured A and B pillars",
  ],
  "Ford:Maverick": [
    "compact unibody pickup silhouette with a short truck bed",
    "wide trapezoidal grille with the central blue Ford oval badge",
    "step-down body-coloured truck bed with horizontal tail lamps",
  ],
  // Chevrolet trucks / SUVs
  "Chevrolet:Silverado": [
    "full-size pickup silhouette with a tall flat bonnet and large square wheel arches",
    "wide horizontal-slat chrome grille with the central gold Chevy bowtie badge",
    "step-down truck bed with vertical tailgate and 'SILVERADO' lettering",
  ],
  "Chevrolet:Tahoe": [
    "large boxy three-row SUV silhouette with a tall upright greenhouse",
    "wide horizontal-slat grille with the central gold Chevy bowtie badge",
    "vertical wraparound LED tail lamps each side of a body-coloured tailgate",
  ],
  // Toyota dailies / trucks
  "Toyota:Camry": [
    "mid-size four-door sedan silhouette with a long bonnet and tall greenhouse",
    "wide low trapezoidal lower grille with slim wraparound LED headlights",
    "wraparound LED tail lamps with a horizontal chrome trim strip across the bootlid",
  ],
  "Toyota:Corolla": [
    "compact four-door sedan silhouette with a steeply raked windscreen",
    "wide low trapezoidal mesh grille with hooked LED daytime running lights",
    "short rear deck with horizontal LED tail lamps",
  ],
  "Toyota:RAV4": [
    "compact crossover SUV silhouette with squared-off plastic wheel-arch cladding",
    "wide trapezoidal lower grille with the central Toyota emblem and slim LED headlights",
    "raised plastic body cladding along the lower door sills and bumpers",
  ],
  "Toyota:Highlander": [
    "mid-size three-row SUV silhouette with a long roofline and roof rails",
    "wide horizontal-bar grille flanked by slim wraparound LED headlights",
    "wraparound horizontal LED tail lamps with chrome trim across the tailgate",
  ],
  "Toyota:4Runner": [
    "boxy body-on-frame mid-size SUV silhouette with a tall upright greenhouse and squared-off wheel arches",
    "long flat bonnet with a high cowl and a near-vertical tailgate",
    "fixed roof rails and a power-down rear glass section in the tailgate",
  ],
  "Toyota:Hilux": [
    "mid-size pickup silhouette with a flat bonnet and squared-off cab",
    "wide trapezoidal mesh grille with chrome trim and slim wraparound LED headlights",
    "step-down truck bed with body-coloured tailgate and 'HILUX' lettering",
  ],
  "Toyota:Tacoma": [
    "mid-size pickup silhouette with a tall blistered bonnet scoop and squared-off cab",
    "wide hexagonal grille with 'TOYOTA' lettering centred between the headlights",
    "step-down truck bed with stamped 'TACOMA' lettering on the tailgate",
  ],
  "Toyota:Tundra": [
    "full-size pickup silhouette with a tall flat bonnet and large square wheel arches",
    "wide hexagonal mesh grille with 'TOYOTA' lettering centred between the headlights",
    "step-down truck bed with stamped 'TUNDRA' lettering across the tailgate",
  ],
  "Toyota:Prius": [
    "compact 5-door hatchback silhouette with an extremely sloped fastback roofline",
    "wide low triangular front fascia with hooked LED daytime running lights",
    "full-width horizontal LED tail-lamp bar across the rear hatch",
  ],
  // Honda dailies
  "Honda:Civic": [
    "compact four-door sedan silhouette with a long flat bonnet and a coupe-like fastback roofline",
    "wide horizontal chrome bar connecting the slim LED headlights through a low grille",
    "horizontal wraparound LED tail lamps over a body-coloured rear fascia",
  ],
  "Honda:Accord": [
    "mid-size four-door sedan silhouette with a long bonnet and tall greenhouse",
    "wide horizontal chrome bar connecting the slim LED headlights through a low grille",
    "wraparound horizontal LED tail lamps with a body-coloured rear fascia",
  ],
  "Honda:CR-V": [
    "compact crossover SUV silhouette with a tall upright greenhouse and roof rails",
    "wide chrome bar connecting the slim LED headlights through a low grille",
    "vertical wraparound LED tail lamps each side of the rear hatch",
  ],
  // Mazda
  "Mazda:MX-5 Miata": [
    "compact two-seat roadster silhouette with a long bonnet and very short rear deck",
    "soft-top convertible roof with a low cowl line and very thin A-pillars",
    "round LED daytime running lights inset into wraparound headlights at the front fenders",
  ],
  "Mazda:CX-5": [
    "compact crossover SUV silhouette with a long bonnet and tall greenhouse",
    "wide low pentagonal grille with the central Mazda emblem flanked by slim LED headlights",
    "wraparound LED tail lamps with chrome trim across a body-coloured tailgate",
  ],
  "Mazda:Mazda 3": [
    "compact 5-door hatchback silhouette with a steeply raked rear screen and a thick C-pillar",
    "wide low pentagonal grille with the central Mazda emblem flanked by slim LED headlights",
    "circular wraparound LED tail lamps each side of a body-coloured rear hatch",
  ],
  // Mitsubishi modern
  "Mitsubishi:Outlander": [
    "mid-size three-row SUV silhouette with a tall upright greenhouse and roof rails",
    "wide chrome 'dynamic-shield' front grille with stacked headlight clusters split into two tiers",
    "vertical wraparound LED tail lamps each side of a body-coloured tailgate",
  ],
  // Volkswagen modern
  "Volkswagen:Tiguan": [
    "compact crossover SUV silhouette with a tall greenhouse and a horizontal shoulder crease",
    "wide chrome-slat grille connected to slim wraparound LED headlights",
    "wraparound LED tail lamps with a body-coloured tailgate",
  ],
  "Volkswagen:Passat": [
    "long mid-size four-door sedan silhouette with a horizontal beltline",
    "wide chrome-slat grille connected to slim wraparound LED headlights",
    "wraparound horizontal LED tail lamps over a body-coloured rear fascia",
  ],
  // Hyundai
  "Hyundai:Tucson": [
    "compact crossover SUV silhouette with a tall greenhouse and a strong shoulder crease",
    "wide trapezoidal front grille with the central Hyundai emblem flanked by slim wraparound headlights",
    "wraparound rear tail lamps each side of a body-coloured tailgate with a roof spoiler",
  ],
  "Hyundai:Santa Fe": [
    "mid-size three-row SUV silhouette with a tall upright greenhouse and roof rails",
    "wide cascading front grille with the central Hyundai emblem flanked by stacked headlight clusters",
    "wraparound rear tail lamps each side of a body-coloured tailgate",
  ],
  "Hyundai:Palisade": [
    "large three-row SUV silhouette with a tall upright greenhouse and chrome roof rails",
    "wide cascading chrome grille flanked by stacked vertical headlight clusters",
    "vertical wraparound LED tail lamps connected by a thin chrome strip across the tailgate",
  ],
  "Hyundai:Elantra": [
    "compact four-door sedan silhouette with sharply creased parametric body sculpting",
    "wide low diamond-pattern grille with H-shaped daytime running lights",
    "full-width horizontal LED tail-lamp bar across the bootlid",
  ],
  "Hyundai:Sonata": [
    "mid-size four-door sedan silhouette with a coupe-like sloping roofline",
    "wide low cascading grille with chrome trim that extends into the LED daytime running lights",
    "full-width horizontal LED tail-lamp bar across the bootlid",
  ],
  "Hyundai:Kona": [
    "compact crossover SUV silhouette with a tall greenhouse and squared-off arches",
    "split front fascia with a slim full-width LED daytime running light bar above the main headlights",
    "full-width horizontal LED tail-lamp bar across the rear hatch",
  ],
  "Hyundai:i30": [
    "compact 5-door hatchback silhouette with a steeply raked rear screen",
    "wide cascading chrome-bordered grille flanked by slim LED headlights",
    "wraparound horizontal LED tail lamps with a body-coloured rear hatch",
  ],
  // Kia
  "Kia:Sportage": [
    "compact crossover SUV silhouette with a tall greenhouse and a strong shoulder crease",
    "wide 'tiger-nose' front grille flanked by boomerang-shaped LED daytime running lights",
    "boomerang-shaped LED tail lamps connected by a thin LED strip across the tailgate",
  ],
  "Kia:Sorento": [
    "mid-size three-row SUV silhouette with a tall upright greenhouse and roof rails",
    "wide 'tiger-nose' front grille flanked by vertical stacked LED headlight clusters",
    "vertical wraparound LED tail lamps each side of the tailgate",
  ],
  "Kia:Telluride": [
    "boxy large three-row SUV silhouette with a tall upright greenhouse and chrome roof rails",
    "wide upright 'tiger-nose' grille flanked by vertical stacked LED headlight clusters",
    "vertical LED tail lamps with horizontal chrome 'TELLURIDE' lettering across the tailgate",
  ],
  "Kia:K5": [
    "mid-size four-door sedan silhouette with a coupe-like sloping fastback roofline",
    "wide 'tiger-nose' front grille that flows into hook-shaped LED daytime running lights",
    "full-width horizontal LED tail-lamp bar with a 'KIA' wordmark centred on the bootlid",
  ],
  "Kia:Picanto": [
    "compact 5-door city hatchback silhouette with a tall upright greenhouse",
    "narrow 'tiger-nose' front grille flanked by round/oval LED daytime running lights",
    "vertical wraparound rear tail lamps each side of a short rear hatch",
  ],
  // Land Rover / Jeep / Suzuki off-roaders
  "Land Rover:Defender": [
    "boxy upright SUV silhouette with vertical glass and a flat slab-sided body",
    "round LED headlights flanking a wide rectangular grille with 'DEFENDER' lettering",
    "side-hinged tailgate with the spare wheel mounted on a body-coloured cover",
  ],
  "Land Rover:Range Rover Sport": [
    "tall upright SUV silhouette with a floating roof treatment and a clamshell bonnet",
    "wide horizontal-slat grille flanked by slim wraparound LED headlights",
    "horizontal wraparound LED tail lamps over a clean body-coloured tailgate",
  ],
  "Land Rover:Discovery": [
    "tall upright SUV silhouette with an asymmetric stepped roofline above the rear quarter",
    "wide horizontal-slat grille flanked by slim wraparound LED headlights",
    "offset rear number-plate recess as a Discovery family signature",
  ],
  "Jeep:Wrangler": [
    "boxy upright SUV silhouette with vertical glass and exposed bolt-on fender flares",
    "iconic seven-vertical-slot grille flanked by round LED headlights",
    "removable roof and door panels with a tailgate-mounted spare wheel",
  ],
  "Jeep:Grand Cherokee": [
    "mid-size SUV silhouette with a long bonnet and tall upright greenhouse",
    "iconic seven-vertical-slot front grille flanked by slim LED headlights",
    "horizontal wraparound LED tail lamps over a body-coloured tailgate",
  ],
  "Jeep:Gladiator": [
    "boxy mid-size pickup silhouette with vertical glass and exposed bolt-on fender flares",
    "iconic seven-vertical-slot front grille flanked by round LED headlights",
    "removable roof/door panels and a step-down truck bed with 'GLADIATOR' lettering",
  ],
  "Suzuki:Jimny": [
    "very compact boxy 4x4 silhouette with vertical glass and squared-off arches",
    "round dual headlights flanking a narrow vertical-slat grille",
    "side-hinged rear tailgate with the spare wheel mounted on a body-coloured cover",
  ],
  "Suzuki:Swift": [
    "compact 5-door hatchback silhouette with a floating-roof black A and B pillar treatment",
    "wide hexagonal mesh grille with chrome trim flanked by hooked LED headlights",
    "blacked-out C-pillar with a hidden rear-door handle and short rear overhang",
  ],
  // Volvo
  "Volvo:XC60": [
    "mid-size SUV silhouette with a tall upright greenhouse and a horizontal shoulder crease",
    "wide vertical-bar grille with the diagonal Volvo emblem flanked by 'Thor's Hammer' T-shaped LED daytime running lights",
    "vertical wraparound LED tail lamps each side of the tailgate",
  ],
  "Volvo:XC90": [
    "large three-row SUV silhouette with a tall upright greenhouse and a long bonnet",
    "wide vertical-bar grille flanked by 'Thor's Hammer' T-shaped LED daytime running lights",
    "vertical wraparound LED tail lamps each side of the tailgate",
  ],
  "Volvo:V60": [
    "mid-size estate/wagon silhouette with a long flat roofline and integrated roof spoiler",
    "wide vertical-bar grille flanked by 'Thor's Hammer' T-shaped LED daytime running lights",
    "vertical wraparound LED tail lamps each side of the tailgate",
  ],
  // MINI modern
  "MINI:Cooper": [
    "compact two-door MINI hatchback silhouette with a contrasting roof colour",
    "round dual LED headlights with chrome bezels flanking a hexagonal mesh grille",
    "wraparound vertical Union Jack LED tail-lamp graphic each side of the rear hatch",
  ],
  "MINI:Countryman": [
    "compact crossover SUV silhouette with a tall upright greenhouse and a contrasting roof colour",
    "round dual LED headlights with chrome bezels flanking a hexagonal mesh grille",
    "wraparound vertical Union Jack LED tail-lamp graphic each side of the tailgate",
  ],
  // Ram
  "Ram:1500": [
    "full-size pickup silhouette with a tall flat bonnet and large square wheel arches",
    "wide upright front grille with the central 'RAM' lettering badge and a tall vertical fascia",
    "step-down truck bed with stamped 'RAM 1500' lettering on the tailgate",
  ],
};

/**
 * Returns the curated 3-cue ground truth for a known model, or null when the
 * model is AI-found / not curated. The render critic uses these in place of
 * the AI-generated signature cues so a hallucinated cue cannot pass the
 * vehicle-accuracy check.
 */
export function getCuratedSignatureCuesForModel(make: string, model: string): readonly [string, string, string] | null {
  return KNOWN_MODEL_SIGNATURE_CUES[`${make}:${model}`] ?? null;
}

// Strict allowlist only for explicitly curated models (multi-style table or
// the curated KNOWN_MODEL_BODY_STYLES table). Keyword-pattern matches do NOT
// count as curated — those are heuristics over AI-found vehicles and the user's
// chosen style must win.
export function getCuratedBodyStylesForModel(make: string, model: string): ReadonlyArray<BodyStyle> | null {
  const key = `${make}:${model}`;
  const multi = MODEL_VALID_BODY_STYLES[key];
  if (multi) return multi;
  const curated = KNOWN_MODEL_BODY_STYLES[key];
  if (curated) return [curated];
  return null;
}

export function resolveBodyStyle(input: unknown, make: string, model: string): BodyStyle {
  const v = validateBodyStyle(input);
  const curated = getCuratedBodyStylesForModel(make, model);
  if (curated) {
    // Curated catalog: strict allowlist — invalid input falls back to default.
    if (v && v !== "unknown" && curated.includes(v)) return v;
    return curated[0];
  }
  // AI-found / keyword-only: user choice always wins; inference is fallback.
  if (v && v !== "unknown") return v;
  return inferBodyStyle(make, model);
}

export function inferBodyStyle(make: string, model: string): BodyStyle {
  const key = `${make}:${model}`;
  if (KNOWN_MODEL_BODY_STYLES[key]) return KNOWN_MODEL_BODY_STYLES[key];

  const combined = `${model}`;
  for (const [pattern, style] of MODEL_KEYWORD_BODY_STYLES) {
    if (pattern.test(combined)) return style;
  }
  return "unknown";
}

// ─── Body-style-aware aero mounting rules ───────────────────────────────────

export function buildAeroMountingRules(bodyStyle: BodyStyle): string {
  const universalRules = [
    "PHYSICALLY PLAUSIBLE AERO MOUNTING RULES — these override any default placement:",
    "• ALL aero hardware must mount to solid body panels. No component may pierce, bridge across, float through, or overlap any glass surface (rear window, rear hatch glass, quarter glass, sunroof, windshield).",
    "• Wing and spoiler stanchions must terminate visibly on a structural panel — never mid-air and never through glass.",
    "• Front splitters and canards attach to the front bumper fascia only.",
    "• Side skirts attach to the rocker panel only.",
    "• Rear diffuser attaches to the underside of the rear bumper only.",
    "• No aero element floats in space or passes through another body panel.",
  ];

  let wingRule: string;

  switch (bodyStyle) {
    case "sedan":
    case "coupe":
      wingRule =
        "• WING/SPOILER MOUNTING for this sedan/coupe: stanchions bolt to the trunk lid or rear deck panel. " +
        "The wing must sit above and behind the trunk lid with both stanchion bases clearly resting on the trunk skin. " +
        "The wing must NEVER pierce or bridge over the rear windshield or any glass surface.";
      break;

    case "hatchback":
    case "wagon":
      wingRule =
        "• WING/SPOILER MOUNTING for this hatchback/wagon (no separate trunk lid): the ONLY structurally valid options are — " +
        "(a) a roof-edge lip spoiler attached at the very top of the tailgate/hatch above the glass, flush with the roof rail, " +
        "(b) a tailgate-mounted unit bolted to the solid lower tailgate panel below the rear glass, " +
        "or (c) a chassis-mounted swan-neck wing whose stanchions extend rearward from behind the rear bumper/chassis without touching the glass. " +
        "The wing MUST NEVER pierce, cross, straddle, or appear behind the hatch glass. " +
        "If any stanchion would cross the glass line, remove the wing entirely and use a roof-edge lip spoiler instead.";
      break;

    case "suv":
      wingRule =
        "• WING/SPOILER MOUNTING for this SUV/crossover: the ONLY valid options are — " +
        "(a) a roof-edge lip spoiler at the very top of the tailgate/hatch above the glass, " +
        "(b) a tailgate-mounted spoiler on the lower solid panel of the tailgate below the glass, " +
        "or (c) a chassis-mounted rear wing behind the rear bumper. " +
        "Stanchions MUST NOT cross the tailgate glass or rear window. " +
        "If the kit includes an upright GT wing, place it chassis-mounted behind the bumper — never across the glass.";
      break;

    case "truck":
      wingRule =
        "• WING/SPOILER MOUNTING for this truck/pickup: wings or spoilers are only added if explicitly part of the kit. " +
        "If present, they mount to the bed rails, bed wall, or tailgate only. " +
        "No wing may bridge the cab glass or extend over the cab roof.";
      break;

    case "convertible":
      wingRule =
        "• WING/SPOILER MOUNTING for this convertible: stanchions bolt to the rear deck lid or rear bodywork panel. " +
        "No wing may attach to or bridge the soft-top frame or any glass surface. " +
        "Keep wings low and deck-mounted to preserve the convertible roofline silhouette.";
      break;

    default:
      wingRule =
        "• WING/SPOILER MOUNTING: stanchions must bolt to a solid body panel (trunk lid, rear deck, or tailgate lower panel). " +
        "The wing MUST NEVER pierce, cross, or bridge over any glass surface — rear window, hatch glass, or quarter glass. " +
        "If no solid panel is available for a clean mount, use a chassis-mounted unit behind the rear bumper or a roof-edge lip spoiler above the glass.";
  }

  return [...universalRules, wingRule].join("\n");
}

// ─── Per-angle, body-style-aware kit focus ───────────────────────────────────

export function getKitFocus(angle: AngleKey, bodyStyle: BodyStyle): string {
  switch (angle) {
    case "close-up-detail":
      return (
        "carbon fiber weave texture and surface detail, panel fitment gaps and alignment, " +
        "aero component edges and mounting hardware bolted to solid panels, body kit surface finish quality. " +
        "If a wing mount is visible, show the stanchion base clearly bolted to a solid metal panel — not floating or touching glass."
      );

    case "front-elevation":
      return (
        "front bumper redesign, front splitter attached to the bumper fascia, canards on the front bumper corners, " +
        "front air intakes and vents, hood vents and heat-extraction slots. " +
        "NO rear wing or spoiler may appear in this front view. The hood is clear of any wing or spoiler. " +
        "Splitters and canards are flush with the bumper — not floating."
      );

    case "side-profile": {
      let sideWingNote: string;
      switch (bodyStyle) {
        case "sedan":
        case "coupe":
          sideWingNote =
            "If a rear wing is visible in profile, its stanchion base sits on the trunk lid surface — " +
            "the stanchion does NOT cross or touch the rear windshield.";
          break;
        case "hatchback":
        case "wagon":
          sideWingNote =
            "If a spoiler/wing is visible in profile: it is either a roof-edge lip at the top of the hatch (above the glass), " +
            "a tailgate-mounted unit on the lower hatch panel (below the glass), " +
            "or a chassis-mounted swan-neck sitting entirely behind the rear bumper. " +
            "No stanchion crosses the hatch glass.";
          break;
        case "suv":
          sideWingNote =
            "If a spoiler is visible: it attaches to the top of the tailgate (above the glass) or the lower tailgate panel (below the glass). " +
            "No element crosses the rear glass area.";
          break;
        case "truck":
          sideWingNote =
            "Any bed spoiler mounts to the bed wall or tailgate — not to the cab or over the cab glass.";
          break;
        default:
          sideWingNote =
            "If a rear wing is visible, its stanchion base is clearly resting on a solid body panel — not crossing any glass.";
      }
      return (
        "side skirts attached to the rocker panel, door edge moldings, side aero fins, " +
        "wide-body fender flares over the wheel arches, side vents. " +
        "NO wing or spoiler may appear near the hood. " + sideWingNote
      );
    }

    case "rear-three-quarter": {
      let rearWingNote: string;
      switch (bodyStyle) {
        case "sedan":
        case "coupe":
          rearWingNote =
            "Rear wing or spoiler: stanchions are visibly bolted to the trunk lid surface. " +
            "Both stanchion bases rest on solid metal — the wing does NOT pierce or touch the rear windshield.";
          break;
        case "hatchback":
        case "wagon":
          rearWingNote =
            "Wing/spoiler: choose one of — " +
            "(a) roof-edge lip spoiler flush with the roof at the very top of the hatch above the glass, " +
            "(b) tailgate-mounted unit on the lower solid panel below the glass, " +
            "or (c) chassis-mounted swan-neck behind the bumper. " +
            "Absolutely NO stanchion may pierce or cross the hatch glass or rear window.";
          break;
        case "suv":
          rearWingNote =
            "Any spoiler attaches to the top of the tailgate above the glass or to the lower tailgate panel. " +
            "If an upright GT wing is present, it is chassis-mounted behind the bumper. " +
            "Nothing crosses or pierces the tailgate glass.";
          break;
        case "truck":
          rearWingNote =
            "Any bed spoiler or wing mounts only to the bed wall or tailgate — not over the cab.";
          break;
        default:
          rearWingNote =
            "Rear wing or spoiler: both stanchion bases rest on a solid body panel. " +
            "The wing does not cross or touch any glass surface.";
      }
      return (
        rearWingNote + " " +
        "Rear diffuser attached to the underside of the rear bumper, rear bumper with integrated aero elements, " +
        "exhaust outlets, rear air vents, tail light surrounds, rear bumper splitter."
      );
    }
  }
}

// ─── Angle configs (static label + camera; kit focus now body-style-aware) ──

export const ANGLE_CONFIGS: Record<AngleKey, AngleConfig> = {
  "close-up-detail": {
    label: "Close-Up Detail",
    cameraDirective:
      "Extreme close-up macro photography with ultra-shallow depth of field, " +
      "camera positioned inches from the body panel surface, " +
      "dramatic side-raking light exposing carbon fiber weave texture.",
    kitFocus: getKitFocus("close-up-detail", "unknown"),
  },
  "front-elevation": {
    label: "Front Elevation",
    cameraDirective:
      "Straight-on front elevation, camera at headlight height, perfectly centered on the vehicle, " +
      "symmetrical composition with no perspective distortion.",
    kitFocus: getKitFocus("front-elevation", "unknown"),
  },
  "side-profile": {
    label: "Side Profile",
    cameraDirective:
      "Pure 90-degree side profile from the driver side, camera at door-mirror height, " +
      "perfectly flat side-on view showing the complete vehicle silhouette.",
    kitFocus: getKitFocus("side-profile", "unknown"),
  },
  "rear-three-quarter": {
    label: "Rear 3/4",
    cameraDirective:
      "Rear three-quarter low angle, camera below bumper height positioned at the rear corner, " +
      "looking up slightly at the rear and side simultaneously.",
    kitFocus: getKitFocus("rear-three-quarter", "unknown"),
  },
};

// ─── Interior angle types and configs ────────────────────────────────────────

export type InteriorAngleKey =
  | "interior-seats"
  | "interior-dashboard"
  | "interior-center-console"
  | "interior-steering-wheel";

export interface InteriorAngleConfig {
  label: string;
  sceneDirective: string;
}

export const INTERIOR_ANGLE_CONFIGS: Record<InteriorAngleKey, InteriorAngleConfig> = {
  "interior-seats": {
    label: "Seats",
    sceneDirective:
      "Rear-facing interior view from the B-pillar region looking forward toward the front seats. " +
      "Wide-angle lens capturing both bucket seats or sport seats, the transmission tunnel between them, " +
      "lower dash fascia, and door card panels. " +
      "LEFT-HAND DRIVE: the driver seat is on the LEFT side of the frame; the steering wheel is on the LEFT. " +
      "The centre console / transmission tunnel treatment (any console upgrade specified in the identity block above) " +
      "must be clearly visible between the front seats — render it with full material fidelity consistent with the identity block. " +
      "Dramatic overhead studio lighting accented by subtle " +
      "ambient OLED strips running along the door sills and console tunnel. Depth of field keeps " +
      "seat bolsters sharp with soft background fade toward the windshield.",
  },
  "interior-dashboard": {
    label: "Dashboard",
    sceneDirective:
      "Driver-centric perspective from slightly above and behind the steering wheel, facing the full " +
      "instrument panel. " +
      "LEFT-HAND DRIVE: the steering wheel is mounted on the LEFT side of the cabin; the instrument cluster " +
      "is on the LEFT; the infotainment screen is in the centre; do NOT place the steering wheel on the right. " +
      "Captures the instrument cluster (LEFT), central infotainment touchscreen, climate vent array, " +
      "steering wheel spokes and hub (LEFT-mounted), and the upper dash surface. " +
      "The lower third of the frame shows the top of the centre console and gear selector area — " +
      "any console upgrade from the identity block must be rendered here with the same material and finish as the other panels. " +
      "Precision balanced lighting that reveals " +
      "every material texture — carbon fiber trim inserts, Alcantara headliner, brushed aluminum trim rings — " +
      "without any specular bloom or blown highlights.",
  },
  "interior-center-console": {
    label: "Center Console",
    sceneDirective:
      "Overhead three-quarter angle looking down at the center console between the front seats. " +
      "LEFT-HAND DRIVE: the driver side is on the LEFT; pedals and footwell are visible on the LEFT if the " +
      "viewing angle reveals them; gear selector is in the centre console. " +
      "Any centre console upgrade from the identity block is the HERO element of this shot — " +
      "render it prominently with full material fidelity, filling the frame with the upgrade's distinctive treatment. " +
      "Also captures the integrated armrest lid, storage cubby openings, " +
      "USB-C charging ports, the ambient lighting strip running through the console tunnel, and cup holders. " +
      "Clean perspective at console height with natural window light supplemented by a warm ambient strip. " +
      "No distracting reflections on glossy surfaces.",
  },
  "interior-steering-wheel": {
    label: "Steering Wheel",
    sceneDirective:
      "Extreme close-up detail shot centred on the steering wheel, steering column, and instrument cluster. " +
      "LEFT-HAND DRIVE: the steering wheel is on the LEFT side of the cabin — never on the right. " +
      "The steering wheel is the HERO of this shot — fill at least two-thirds of the frame with it. " +
      "Capture every surface detail: rim material texture (stitching, suede grain, carbon weave, or wood grain), " +
      "spoke shape and finish, paddle-shift attachments if present, the 12 o'clock centre-stripe or marker, " +
      "thumb-rest contours, and the horn pad or centre badge. " +
      "The instrument cluster behind the wheel is partially visible and softly bokeh'd — readable but not competing. " +
      "The steering column shroud and its trim material must be consistent with the identity block. " +
      "Any steering wheel upgrade specified in the identity block is MANDATORY here — " +
      "render it with absolute fidelity to the descriptor: material, colour, spoke design, and any accent details. " +
      "Studio macro lighting from a slight upper-right angle to reveal every surface texture " +
      "without specular bloom; a single soft fill from the lower left eliminates shadow in the spoke recesses.",
  },
};

// ─── Interior shared identity block ─────────────────────────────────────────
// Assembled once per build and injected byte-identically into EVERY interior
// angle prompt (seats, dashboard, center console) so all panels share the
// same material, colour, lighting, and LHD specification. Callers must pass
// the same instance to each angle call — the function is pure/deterministic
// so identical inputs always produce the same string.

export interface InteriorIdentityBlockInput {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  dashboardDesc: string;
  seatsDesc: string;
  leatherToneHex: string | null;
  accentStitchHex: string | null;
  twoToneActive: boolean;
  bolsterToneHex: string | null;
  upperDashToneHex: string | null;
  // Optional upholstery material id (e.g. "nappa", "alcantara", "tweed").
  // When provided and recognised, the material's name, family, and tactile
  // descriptor are folded into the upholstery directive line so the model
  // actually renders the chosen fabric — perforated Nappa vs ballistic
  // nylon vs Saville-Row tweed are all materially different surfaces.
  upholsteryMaterialId?: string | null;
  // Optional center-console upgrade id (e.g. "trd-quick-shift",
  // "alcantara-driver-bridge", "vanguard-custom"). When provided and
  // recognised, the upgrade's name and render descriptor are folded into a
  // dedicated centre-console directive so the AI actually renders the
  // chosen treatment in centre-console / cockpit angles. Unknown ids and
  // the "oem-stock" default both fall back to no directive (factory look).
  centerConsoleUpgradeId?: string | null;
  // Optional steering wheel upgrade id (e.g. "flat-bottom-alcantara",
  // "racing-suede-stripe", "carbon-rim-performance", "vanguard-custom").
  // When provided and recognised, the wheel's name and render descriptor
  // are folded into a dedicated steering-wheel directive so the AI renders
  // the chosen wheel in all interior angles. Unknown ids and the
  // "oem-stock" default both fall back to no directive (factory wheel).
  steeringWheelId?: string | null;
}

// ─── Upholstery material catalog (server mirror) ────────────────────────────
// Mirror of the client-side catalog in artifacts/vanguard/src/App.tsx so the
// server can translate the material id into render-directive language
// without trusting client-supplied prompt text. Adding a new material here
// AND in the client catalog keeps the two sides in sync; an unknown id
// gracefully falls back to "no material directive" rather than erroring.
type UpholsteryMaterialInfo = {
  name: string;
  family: "Leathers" | "Technical" | "Performance" | "Exotic";
  descriptor: string;
};

export const UPHOLSTERY_MATERIAL_CATALOG: Record<string, UpholsteryMaterialInfo> = {
  "nappa":              { name: "Nappa Leather",              family: "Leathers",    descriptor: "soft full-grain nappa with a smooth, low-sheen finish and gentle hand-feel pull" },
  "semi-aniline":       { name: "Semi-Aniline Leather",       family: "Leathers",    descriptor: "lightly pigmented semi-aniline with subtle pore texture and a warm matte sheen" },
  "full-aniline":       { name: "Full-Aniline Leather",       family: "Leathers",    descriptor: "pure full-aniline hide with visible natural grain, warm patina, and no surface coating" },
  "quilted-nappa":      { name: "Quilted Nappa",              family: "Leathers",    descriptor: "diamond-quilted nappa with raised baffles and contrast piping along each quilt line" },
  "perforated-nappa":   { name: "Perforated Nappa",           family: "Leathers",    descriptor: "ventilated nappa with a precision micro-perforation pattern on the seat centres" },
  "bridge-of-weir":     { name: "Bridge of Weir Leather",     family: "Leathers",    descriptor: "Scottish premium hide with tight grain, deep saturation, and a soft matte sheen" },
  "saddle-hand-stitched":{ name: "Saddle / Hand-stitched Leather", family: "Leathers", descriptor: "vegetable-tanned saddle-grade tan leather with pronounced grain and visible hand-stitched saddler seams" },
  "alcantara":          { name: "Alcantara",                  family: "Technical",   descriptor: "premium microfiber suede with a uniform short pile and soft directional sheen" },
  "dinamica":           { name: "Dinamica",                   family: "Technical",   descriptor: "recycled microfiber suede with matte uniform pile and a slightly drier hand than Alcantara" },
  "perforated-alcantara":{ name: "Perforated Alcantara",      family: "Technical",   descriptor: "Alcantara microfiber suede with laser-perforated breathing zones on seat centres" },
  "race-cloth-houndstooth":{ name: "Race Cloth (Houndstooth)", family: "Performance", descriptor: "heritage motorsport houndstooth wool weave with high-contrast micro pattern on seat centres" },
  "ballistic-nylon":    { name: "Ballistic Nylon",            family: "Performance", descriptor: "tightly woven matte ballistic nylon with a coarse technical weave and zero sheen" },
  "tweed":              { name: "Saville Row Tweed",          family: "Exotic",      descriptor: "British wool tweed with flecked herringbone weave and warm matte tactile depth" },
  "mohair":             { name: "Mohair",                     family: "Exotic",      descriptor: "long-pile mohair wool with a soft directional lustre that shifts under raking light" },
  "cashmere-blend":     { name: "Cashmere Wool Blend",        family: "Exotic",      descriptor: "fine cashmere/wool blend with a dense soft pile and quiet matte finish" },
  "com":                { name: "Customer's Own Material",    family: "Exotic",      descriptor: "customer-supplied premium textile applied with bespoke-tailored seams and piping" },
};

// ─── Center Console upgrade catalog (server mirror) ─────────────────────────
// Mirror of the client-side catalog in
// artifacts/vanguard/src/data/constants.ts (CENTER_CONSOLE_UPGRADES). The
// server owns the AI render directive — `descriptor` is the language folded
// into the interior identity block so the model actually paints the chosen
// centre-console treatment in centre-console / cockpit angles.
//
// The default "oem-stock" id and unknown ids both deliberately resolve to
// `null` so the identity block omits the directive entirely — i.e. the AI
// is free to render the factory console as it normally would.
//
// "vanguard-custom" is the AI signature option: rather than describing a
// real product, the descriptor tells the model to invent an original
// Vanguard signature centre-console treatment that still matches the rest
// of the interior identity (upholstery, stitch, dashboard, lighting).
// Vehicle market — Worldwide is the catch-all for unrecognised makes.
// Mirror of MAKE_MARKET_MAP in artifacts/vanguard/src/data/constants.ts so
// the server can independently reject cross-market console upgrades without
// trusting any client-supplied market signal.
export type Market = "CDM" | "JDM" | "EDM" | "USDM" | "KDM" | "AUDM" | "Worldwide";

const MAKE_MARKET_MAP: Record<string, Market> = {
  // EDM — European Domestic Market
  "BMW": "EDM", "Mercedes-Benz": "EDM", "Audi": "EDM", "Porsche": "EDM",
  "Volkswagen": "EDM", "MINI": "EDM", "Skoda": "EDM", "SEAT": "EDM",
  "Volvo": "EDM", "Bentley": "EDM", "Rolls-Royce": "EDM", "Aston Martin": "EDM",
  "Ferrari": "EDM", "Lamborghini": "EDM", "McLaren": "EDM", "Maserati": "EDM",
  "Renault": "EDM", "Peugeot": "EDM", "Citroën": "EDM", "Fiat": "EDM",
  "Dacia": "EDM", "Land Rover": "EDM", "Bugatti": "EDM", "Jaguar": "EDM",
  // JDM
  "Toyota": "JDM", "Honda": "JDM", "Nissan": "JDM", "Mazda": "JDM",
  "Mitsubishi": "JDM", "Subaru": "JDM", "Suzuki": "JDM", "Lexus": "JDM",
  "Infiniti": "JDM", "Acura": "JDM", "Datsun": "JDM",
  // USDM
  "Ford": "USDM", "Chevrolet": "USDM", "Dodge": "USDM", "Jeep": "USDM",
  "Ram": "USDM", "Tesla": "USDM", "Buick": "USDM", "Pontiac": "USDM",
  "Plymouth": "USDM", "Cadillac": "USDM", "GMC": "USDM", "Chrysler": "USDM",
  "Lincoln": "USDM", "Shelby": "USDM",
  // CDM
  "BYD": "CDM", "Geely": "CDM", "NIO": "CDM", "Nio": "CDM", "Lynk & Co": "CDM",
  // KDM
  "Hyundai": "KDM", "Kia": "KDM", "Genesis": "KDM",
  // AUDM
  "Holden": "AUDM", "HSV": "AUDM", "Walkinshaw": "AUDM",
};

export function getVehicleMarket(make: string | null | undefined): Market {
  if (typeof make !== "string") return "Worldwide";
  return MAKE_MARKET_MAP[make] ?? "Worldwide";
}

type CenterConsoleUpgradeInfo = {
  name: string;
  descriptor: string;
  /**
   * Markets in which this upgrade is available. "Worldwide" means every
   * vehicle (used for OEM/Stock and the Vanguard Custom signature option).
   * Mirrors the `markets` field on each CENTER_CONSOLE_UPGRADES entry in
   * artifacts/vanguard/src/data/constants.ts — keep both sides in sync.
   */
  markets: Market[];
};

export const CENTER_CONSOLE_UPGRADE_CATALOG: Record<string, CenterConsoleUpgradeInfo> = {
  // CDM
  "byd-dilink-rotating":   { name: "BYD DiLink Rotating Console",        markets: ["CDM"], descriptor: "BYD-style crystal rotary shifter knob on a glossy black centre console bridge, with the signature rotating-tablet motif suggested above the console face" },
  "nio-nomi-companion":    { name: "NIO NOMI Companion Console",         markets: ["CDM"], descriptor: "slim brushed-metal centre tunnel with a small spherical NIO NOMI AI companion mounted at the top of the centre stack and a soft mood-light halo across the console face" },
  "lynkco-floating-bridge":{ name: "Lynk & Co Floating Bridge",          markets: ["CDM"], descriptor: "floating brushed-alloy centre console bridge with a copper trim insert and a low-profile rotary drive-mode selector" },
  // JDM
  "trd-quick-shift":       { name: "TRD Quick-Shift Console",            markets: ["JDM"], descriptor: "short-throw alloy gated manual shifter on a dry carbon-fibre centre tunnel with a red anodised shifter surround and TRD-style stitched arm pad" },
  "nardi-walnut-classic":  { name: "Nardi Walnut & Alloy Console",       markets: ["JDM"], descriptor: "open-pore walnut centre console bridge with a brushed-alloy gated shifter, vintage Nardi / Nismo refit tuner vibe" },
  "wangan-carbon-qr":      { name: "Wangan Carbon Quick-Release Console",markets: ["JDM"], descriptor: "full dry-carbon-fibre centre tunnel with a quick-release hydraulic handbrake lever and visible countersunk titanium bolt heads — Wangan tuner build" },
  // EDM
  "alcantara-driver-bridge":{ name: "Alcantara Driver Bridge",           markets: ["EDM"], descriptor: "wraparound Alcantara-wrapped centre console with contrast stitching matching the seats, brushed-metal drive controls and AMG / M-Sport tuner finish" },
  "carbon-driver-zone":    { name: "Carbon Bridge Driver Zone",          markets: ["EDM"], descriptor: "sculpted dry-carbon centre bridge with a metal gear-shift collar and an aluminium drive-mode rotary dial, Porsche / Lamborghini house-style driver-focused architecture" },
  "burl-walnut-gt":        { name: "Burl Walnut Grand Tourer Console",   markets: ["EDM"], descriptor: "open-pore burl walnut centre bridge with chrome bezels around the controls and a soft ivory ambient strip — Bentley / Rolls-Royce grand-tourer house style" },
  // USDM
  "hellcat-pistol-grip":   { name: "Hellcat Pistol-Grip Console",        markets: ["USDM"], descriptor: "brushed-aluminium centre tunnel with a classic American pistol-grip gear lever and a red ignition starter badge — Dodge Hellcat / SRT muscle style" },
  "shelby-track-console":  { name: "Shelby Track-Pack Console",          markets: ["USDM"], descriptor: "bare brushed-metal centre tunnel with a Cobra-emblem shifter knob, exposed quick-release rivets and a track-pack utilitarian finish" },
  "captains-bridge":       { name: "Captain's Bridge Console",           markets: ["USDM"], descriptor: "full-width quilted-leather centre bridge with a bourbon-wood inlay strip and chrome bezels — full-size American SUV / pickup captain's-bridge luxury" },
  // KDM
  "n-eshift-paddle":       { name: "Hyundai N e-Shift Paddle Console",   markets: ["KDM"], descriptor: "short-throw paddle-style e-shifter on a brushed-metal centre tunnel with Hyundai N Performance-Blue contrast stitching across the arm pad" },
  "genesis-crystal-sphere":{ name: "Genesis Crystal Sphere Console",     markets: ["KDM"], descriptor: "diamond-cut crystal rotary shifter sphere mounted on a copper-trim leather centre bridge — Genesis house style premium finish" },
  // AUDM
  "walkinshaw-performance":{ name: "Walkinshaw Performance Console",     markets: ["AUDM"], descriptor: "alloy-trimmed black leather centre tunnel with red-stitched arm pad and a gated alloy shifter — Walkinshaw / HSV AUDM factory tuner DNA" },
  "hsv-maloo-utility":     { name: "HSV Maloo Utility Console",          markets: ["AUDM"], descriptor: "heavy-duty bolster-mounted centre tunnel with an HSV badge, integrated side-grab handles and a chrome shifter — AUDM ute house style" },
  // Signature — Worldwide
  "vanguard-custom":       { name: "Vanguard Custom Console",            markets: ["Worldwide"], descriptor: "original Vanguard signature centre-console concept — invent an aspirational bespoke centre console that is unmistakably premium, with a single hero material (carbon, machined billet, exotic wood, or leather) and one accent touch that ties back to the chosen upholstery and stitch colour; do not copy any existing OEM design" },
};

export const CENTER_CONSOLE_UPGRADE_DEFAULT_ID = "oem-stock";

// ─── Steering Wheel upgrade catalog (server mirror) ──────────────────────────
// Mirror of the client-side catalog in
// artifacts/vanguard/src/data/constants.ts (STEERING_WHEEL_OPTIONS). All
// options are Worldwide (no market filter required). The server owns the AI
// render directive — `descriptor` is the language folded into the interior
// identity block so the model renders the chosen wheel in every interior angle.
//
// The default "oem-stock" id and unknown ids both deliberately resolve to
// `null` so the identity block omits the directive entirely — i.e. the AI
// renders the factory steering wheel as it normally would.
type SteeringWheelInfo = {
  name: string;
  descriptor: string;
};

export const STEERING_WHEEL_CATALOG: Record<string, SteeringWheelInfo> = {
  "flat-bottom-alcantara":    { name: "Flat-Bottom Alcantara Sport Wheel",    descriptor: "sport flat-bottom steering wheel with Alcantara microsuede rim, contrast-coloured stitching matching the seat accent stitch, and pronounced thumb-rests at the 9 and 3 o'clock positions — render it clearly on the steering column in all interior angles" },
  "racing-suede-stripe":      { name: "Racing Suede & Centre Stripe Wheel",   descriptor: "full Dinamica racing-suede steering wheel with a 12 o'clock centre-stripe in the upholstery accent colour, lightweight circular carbon-fibre horn pad, and slender spokes — render it clearly on the steering column in all interior angles" },
  "classic-three-spoke-wood": { name: "Classic Three-Spoke Wood Wheel",       descriptor: "heritage three-spoke steering wheel with a polished open-pore walnut rim section, slender chrome spokes, and a small chrome horn boss — grand-tourer provenance; render it clearly on the steering column in all interior angles" },
  "carbon-rim-performance":   { name: "Carbon-Rim Performance Wheel",         descriptor: "track-focused flat-bottom steering wheel with a dry-carbon-fibre rim, forged-aluminium spokes, and integrated paddle-shift attachments — race-derived ergonomics; render it clearly on the steering column in all interior angles" },
  "vanguard-custom":          { name: "Vanguard Custom Steering Wheel",       descriptor: "original Vanguard signature steering wheel concept — design an aspirational bespoke wheel using a single hero material (carbon, machined billet, exotic wood, or Alcantara) with one accent touch that ties directly back to the chosen upholstery and stitch colour; it must be recognisably a steering wheel but distinctly Vanguard — do not copy any existing OEM design; render it clearly on the steering column in all interior angles" },
};

export const STEERING_WHEEL_DEFAULT_ID = "oem-stock";

/**
 * Server-side market enforcement for center-console upgrade ids. Mirrors the
 * client-side `getAvailableCenterConsoleUpgrades(market)` filter so the API
 * cannot be coerced into rendering or persisting an upgrade that wouldn't be
 * offered for the vehicle's home market (e.g. a USDM Hellcat console on a
 * JDM Skyline). This is the single defence the AI render + persistence
 * paths rely on; do not bypass.
 *
 * Behaviour:
 * - Missing / empty / non-string id → CENTER_CONSOLE_UPGRADE_DEFAULT_ID
 *   (caller treats this as "no upgrade — render the factory console").
 * - "oem-stock" → default (no directive, factory look).
 * - Worldwide entry (e.g. "vanguard-custom") → always returned verbatim.
 * - Catalog id whose markets include the vehicle's market → returned verbatim.
 * - Otherwise (unknown id, or market mismatch) → default.
 */
export function resolveServerCenterConsoleUpgrade(
  savedId: string | null | undefined,
  vehicleMake: string | null | undefined,
): string {
  if (typeof savedId !== "string" || savedId.length === 0) {
    return CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
  }
  if (savedId === CENTER_CONSOLE_UPGRADE_DEFAULT_ID) {
    return CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
  }
  const entry = CENTER_CONSOLE_UPGRADE_CATALOG[savedId];
  if (!entry) return CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
  const market = getVehicleMarket(vehicleMake);
  const allowed =
    entry.markets.includes("Worldwide") || entry.markets.includes(market);
  return allowed ? savedId : CENTER_CONSOLE_UPGRADE_DEFAULT_ID;
}

/**
 * Builds the byte-identical interior identity block for a given build.
 * Must be assembled once per build (not per angle) and prepended to every
 * interior angle prompt so seats, dashboard, and center-console panels are
 * provably described with the same upholstery colour, stitching accent,
 * dashboard material, headliner, lighting mood, and LHD specification.
 *
 * The function is pure: the same input always returns the same string.
 * That determinism is the sole requirement for cross-angle consistency —
 * even regenerate-single-angle will stay on-brief as long as the caller
 * passes the same params that were used for the other angles.
 */
export function buildInteriorIdentityBlock(input: InteriorIdentityBlockInput): string {
  // Resolve the chosen upholstery material (if any) to render directives.
  // Unknown ids silently fall back to no material directive — the catalog
  // is the single source of truth, never accept free-form material text.
  const material = input.upholsteryMaterialId
    ? UPHOLSTERY_MATERIAL_CATALOG[input.upholsteryMaterialId] ?? null
    : null;
  const materialSuffix = material
    ? ` — material: ${material.name} (${material.family}), ${material.descriptor}`
    : "";

  const leatherLine = input.leatherToneHex
    ? `upholstery: ${input.seatsDesc} — primary leather tone ${input.leatherToneHex}${materialSuffix}`
    : `upholstery: ${input.seatsDesc}${materialSuffix}`;

  const stitchLine = input.accentStitchHex
    ? `stitching: contrast accent stitching in ${input.accentStitchHex} across seats, door cards, steering wheel trim, and centre console`
    : `stitching: tone-on-tone stitching matching primary leather`;

  const twoToneLine = input.twoToneActive
    ? `two-tone split: seat bolsters / outer wings in ${input.bolsterToneHex ?? "contrast tone"}; ` +
      `upper dash pad in ${input.upperDashToneHex ?? "contrast tone"}; ` +
      `keep the colour boundary crisp and consistent across all three interior panels`
    : null;

  const dashLine =
    `dashboard: ${input.dashboardDesc} trim — ` +
    `same finish consistent across instrument panel, centre console fascia, and door card inserts`;

  // Center-console upgrade — explicit aftermarket / tuner / signature
  // treatment that overrides the factory console. Only emitted when the
  // chosen id is recognised AND is not the "oem-stock" default; both the
  // default and unknown ids produce no directive (factory look preserved).
  const consoleUpgrade =
    input.centerConsoleUpgradeId && input.centerConsoleUpgradeId !== "oem-stock"
      ? CENTER_CONSOLE_UPGRADE_CATALOG[input.centerConsoleUpgradeId] ?? null
      : null;
  const consoleUpgradeLine = consoleUpgrade
    ? `centre console upgrade: ${consoleUpgrade.name} — ${consoleUpgrade.descriptor}; ` +
      `this REPLACES the factory centre console treatment and MUST appear in ALL THREE interior views: ` +
      `in the SEATS view it is clearly visible between the front seats on the transmission tunnel; ` +
      `in the DASHBOARD view it is visible at the base of the dash and gear selector area; ` +
      `in the CENTER CONSOLE view it is the hero element dominating the frame. ` +
      `Integrate visually with the upholstery, stitching, and dashboard material above. ` +
      `Keep the LHD layout (driver seat / steering wheel / pedals on the LEFT) unchanged`
    : null;

  // Steering wheel upgrade — only emitted when the chosen id is recognised
  // AND is not the "oem-stock" default; both the default and unknown ids
  // produce no directive (factory wheel preserved).
  const steeringWheelUpgrade =
    input.steeringWheelId && input.steeringWheelId !== "oem-stock"
      ? STEERING_WHEEL_CATALOG[input.steeringWheelId] ?? null
      : null;
  const steeringWheelLine = steeringWheelUpgrade
    ? `steering wheel upgrade: ${steeringWheelUpgrade.name} — ${steeringWheelUpgrade.descriptor}; ` +
      `this REPLACES the factory steering wheel and must integrate visually with the upholstery, stitching, and dashboard above; ` +
      `ensure it is clearly visible from all interior camera angles`
    : null;

  const lhdLine =
    `DRIVE CONFIG: LEFT-HAND DRIVE (LHD) — steering wheel on the LEFT, driver seat on the LEFT, ` +
    `instrument cluster on the LEFT, pedals to the LEFT of the centre console; ` +
    `dashboard view is from behind a LEFT-mounted steering wheel; ` +
    `applies to ALL makes (BMW, Mercedes, Porsche, JDM, UK, AU); DO NOT render RHD`;

  const lines = [
    `INTERIOR IDENTITY (identical across all interior panels — read this first, it is the single ground truth):`,
    `  vehicle: ${input.vehicleYear} ${input.vehicleMake} ${input.vehicleModel}`,
    `  ${leatherLine}`,
    `  ${stitchLine}`,
    ...(twoToneLine ? [`  ${twoToneLine}`] : []),
    `  ${dashLine}`,
    ...(consoleUpgradeLine ? [`  ${consoleUpgradeLine}`] : []),
    ...(steeringWheelLine ? [`  ${steeringWheelLine}`] : []),
    `  headliner: Alcantara or premium soft fabric — same material and colour across all three interior panels`,
    `  ambient lighting: dark studio background, overhead precision key light, warm OLED ambient strips along door sills and console tunnel — consistent mood across all panels`,
    `  ${lhdLine}`,
  ].join("\n");

  return lines;
}

// ─── Vanguard diamond-weave material spec ───────────────────────────────────
// Concrete, render-directive definition of the Vanguard signature carbon
// pattern. Replaces the bare phrase "diamond-weave" so the image model has
// enough geometric detail to actually render a recognizable pattern instead
// of generic carbon twill. Cell size, fiber angle, lattice geometry, gloss
// level, and surface depth are all specified.
export const VANGUARD_DIAMOND_WEAVE_DEF =
  "Vanguard diamond-weave (8 mm × 12 mm rhombic cells laid on a ±45° fiber bias " +
  "forming a continuous X-lattice across the panel; alternating light and dark " +
  "diamonds catch the light differently as the eye moves across the surface; " +
  "deep 2K gloss clear-coat with 2–3 mm of perceived weave depth under raking " +
  "light)";

// ─── Per-angle amplification directives ─────────────────────────────────────
// Each render angle has a single hero dimension that the prompt must amplify
// so every panel earns its place in the four-up reveal — rear 3/4 sells aero,
// the front sells the fascia, the side sells silhouette, the close-up sells
// material craft. Returned as a one-line directive ready to append to the
// design-team appendix.
export function getAngleAmplificationDirective(angle: AngleKey | null): string {
  switch (angle) {
    case "rear-three-quarter":
      return (
        "ANGLE AMPLIFICATION (rear-3/4): This panel must hero the rear aero — diffuser " +
        "fin depth, wing or spoiler trailing-edge geometry, exhaust integration, and " +
        "the way the rear haunches flow into the diffuser; the rear of the car carries " +
        "this image."
      );
    case "front-elevation":
      return (
        "ANGLE AMPLIFICATION (front elevation): This panel must hero the front fascia — " +
        "splitter element layering, canard dive-plane geometry, intake mouth depth, " +
        "headlight signature, and the symmetrical aggression of the bumper architecture."
      );
    case "side-profile":
      return (
        "ANGLE AMPLIFICATION (side profile): This panel must hero the silhouette — " +
        "roofline arc, beltline crease, the rake of the bonnet into the windshield, " +
        "fender-arch flow, ride-height stance, and the dominant character line that " +
        "runs the length of the car."
      );
    case "close-up-detail":
      return (
        "ANGLE AMPLIFICATION (close-up detail): This panel must hero the materials — " +
        "specular highlight on the paint flake, exact weave geometry on the carbon " +
        "(see Vanguard diamond-weave spec), the paint-to-carbon transition line, and " +
        "the micro-reflection that reveals the surface curvature under the key light."
      );
    case null:
    default:
      return "";
  }
}

// ─── Creative lanes ──────────────────────────────────────────────────────────

export interface CreativeLane {
  name: string;
  environment: string;
  lightingMood: string;
  cameraEthos: string;
  surfacingLanguage: string;
  stanceDirective: string;
}

const CREATIVE_LANES: Record<string, CreativeLane> = {
  "jdm-time-attack": {
    name: "JDM Time-Attack",
    environment: "plain dark asphalt surface with a subtle dark-to-mid gradient sky — no landmarks, no scenery, the car is the sole subject",
    lightingMood: "single dramatic key light from above-right raking across the hood and front splitter, deep wheel-well shadows, tungsten-warm pit-lane fill bleeding in from the left, no fill on the shadow side — let the darkness work",
    cameraEthos: "aggressive low and wide 24mm feel, car dominates 80 % of frame, nose pointed slightly into the corner, ground-level tarmac reflection visible in the foreground",
    surfacingLanguage: "razor-sharp panel edges read as functional race hardware; every vent, duct, and intake follows logical airflow paths; overfenders show bolt-head shadow detail; diffuser fins create geometric depth under the rear fascia",
    stanceDirective: "slammed ride height with maximum negative camber, front splitter nearly kissing the tarmac, tyres stretched flush with the overfender lip, rear haunches fill the arches completely",
  },
  "widebody-gt": {
    name: "Widebody GT",
    environment: "smooth plain tarmac under a soft gradient sky — warm amber low on the horizon fading to cool blue above, no landmarks, no city, no scenery",
    lightingMood: "cinematic three-point: warm golden key from the driver's-side rear catching the widened arches and rear quarter, cool blue fill from the front-left, razor-thin white rim light tracing the widebody shoulder and door crease simultaneously",
    cameraEthos: "mid-low 35mm three-quarter rear angle, car fully centered, very slight Dutch tilt adds dynamism without distortion, emphasis on the pumped rear hips and full-width stance",
    surfacingLanguage: "flowing body lines curve expressively over the pumped arches, muscular rear shoulders read as sculpted mass, diffuser fins create a layered architectural depth below the fascia, every aero surface transitions cleanly to the next",
    stanceDirective: "lowered but planted, wide track, tyres sitting visually flush with the arch edges, front lip within 40 mm of the tarmac, assertive four-corner contact stance",
  },
  "overland-brutalist": {
    name: "Overland Brutalist",
    environment: "flat plain open ground under a wide gradient sky — neutral open outdoor setting with no specific terrain features, landmarks, or scenery",
    lightingMood: "low-angle golden dawn key light from driver's-side front casting long dramatic shadows under the bumper and running boards, blue-purple shadow fill from the open sky on the opposite side, hard specular highlights on skid plates and light bars",
    cameraEthos: "ultra-wide 18–20mm shooting up from near-ground level at the imposing front grille and bumper, vehicle's high ride height and massive tyres fill the lower two-thirds, sky provides the dramatic backdrop",
    surfacingLanguage: "squared-off purposeful geometry — flat hood, upright windshield, boxed arches, angular bumper bash-plates — every surface signals capability; matte or satin finishes that absorb light rather than reflecting it",
    stanceDirective: "maximum ride height, leveled stance showing full suspension travel, aggressive all-terrain or M/T tyres with visible sidewall tread, clear daylight under the chassis, approach angle crisp and unobstructed",
  },
  "hyper-gt": {
    name: "Hyper GT",
    environment: "ultra-minimalist infinite white cove studio — seamless white cyc wall and polished black floor creating a deep mirror reflection of the entire underside and diffuser",
    lightingMood: "precision hero three-point: large soft-box key light at 45° above-right delivering maximum specular punch on the paint, cool-white fill from above-left maintaining mid-tone separation, hairline rim light along the rear quarter outlining the GT wing end-plate and body silhouette against the white background",
    cameraEthos: "55mm equivalent at sill height, rear three-quarter angle simultaneously showing the full GT wing, splitter depth, and rear diffuser complexity in one frame, car fills 85 % of the image",
    surfacingLanguage: "sculpted compound curves catch light and shadow simultaneously creating visual depth; every vent and duct is an engineering statement; the GT wing reads as kinetic sculpture; aero surfaces flow from panel to panel without interruption like a single cast form",
    stanceDirective: "near-zero race-ready ride height, maximum track width, tyres stretched tight over deep-dish wheels, front splitter element depth clearly visible in profile",
  },
  "american-pro-street": {
    name: "American Pro-Street",
    environment: "plain black tarmac under a clear open sky — minimal, uncluttered setting with no grandstands, signage, or scenery",
    lightingMood: "harsh overhead midday-sun key light creating hard specular flares on chrome and glass, long diagonal shadow stretching from the body down the tarmac, rim light on the muscle-car haunches picking out the wide rear rubber",
    cameraEthos: "low frontal or front three-quarter wide angle capturing the full imposing hood bulge and front fascia, car centered with open tarmac stretching ahead, slightly below headlight height",
    surfacingLanguage: "bold surfaces with preserved muscle-car proportions: prominent hood scoop or power dome, wide rear haunches, large-diameter exhaust outlets, chrome accents as punctuation, straight-line aero optimised visually for top-speed credibility",
    stanceDirective: "classic drag stance — slightly nose-up attitude, rear tyres noticeably wider than front, rear rubber fills the arches completely, front wheels tucked neatly under the guards",
  },
  "luxury-sport-gt": {
    name: "Luxury Sport GT",
    environment: "neutral light-grey studio cove — seamless cyclorama backdrop with polished dark floor creating a clean mirror reflection of the underside, no props or surroundings",
    lightingMood: "sophisticated and restrained: warm tungsten spot key from above-right, cool white architectural fill from front-left, thin rim light tracing the sweeping roofline and rear haunches — controlled contrast, no harsh shadows",
    cameraEthos: "50mm equivalent at shoulder height with slight elevated angle showing the sweeping bonnet and roofline simultaneously, grand-tourer proportions celebrated with generous negative space around the car",
    surfacingLanguage: "long flowing body lines transition between panels without interruption, chrome or satin brightwork reads as jewellery rather than ornament, the boot-lip spoiler is understated refinement, every surface communicates quality through restraint",
    stanceDirective: "firm but composed stance, slight negative camber, large-diameter forged multi-spoke wheels with thin side-wall tyres, ride height firm and purposeful — not slammed, not lifted",
  },
  "period-restomod": {
    name: "Period Restomod",
    environment: "clean neutral studio or plain open tarmac under soft diffuse natural light — no props, no era-specific signage, no workshop context visible",
    lightingMood: "warm golden-hour key from low front angle, gentle diffuse fill preserving period character, soft highlights catching chrome bumpers and original body lines — nostalgic quality of light that flatters the vintage silhouette",
    cameraEthos: "40mm classic documentary framing, slight elevation showing the full silhouette, bodywork and period design cues as the hero, car centered with breathing room on all sides",
    surfacingLanguage: "factory body lines completely preserved and untouched, modern touches are deliberate and minimal, chrome and lacquered steel dominate, original proportions are sacred — any modification reads as a whisper not a shout",
    stanceDirective: "period-correct or mildly lowered stance emphasizing the vintage roofline, classic wheel sizing appropriate to the era, original arches — no modern extreme stretch, extreme camber, or track-day stance",
  },
  "neo-tokyo": {
    name: "Neo-Tokyo Night",
    environment: "rain-slicked black asphalt under a neon-purple-and-cyan night sky — no city skyline, no signage; only the wet ground reflecting saturated magenta and cyan accent light around the car",
    lightingMood: "high-contrast neon: saturated magenta key light from above-rear catching the roofline and rear quarter, cool cyan fill from the front-left bouncing off the wet ground, hairline white rim along the front fascia, deep blacks everywhere else — Blade-Runner colour separation",
    cameraEthos: "low 28mm three-quarter front, camera at headlight height, the wet tarmac in the foreground holding a long colour-saturated reflection of the underbody and front splitter",
    surfacingLanguage: "tight, technical surface detail — vented arches, sharp shoulder creases, exposed canard edges and diffuser fins all reading as functional time-attack hardware; the wet body finish doubles every highlight",
    stanceDirective: "track-ready slammed stance with aggressive negative camber, tyres stretched flush with widened arches, splitter hovering millimetres above the wet tarmac, weight clearly planted on all four corners",
  },
  "desert-gt": {
    name: "Desert GT",
    environment: "open hard-packed sand flat under a wide cloudless sky — no dunes in close framing, no scenery, no signage; just compacted desert ground stretching to a hazy horizon",
    lightingMood: "hard low-angle golden key from a desert sun positioned just above the horizon, long crisp body-length shadow trailing across the sand, cool lavender shadow fill from the open sky on the opposite side, fine atmospheric dust catching rim light along the roofline",
    cameraEthos: "wide 24mm three-quarter front from a slightly low angle, car planted on the desert floor with breathing room and a clean horizon line behind, dust haze softening the far background only",
    surfacingLanguage: "sun-baked surfaces show every body line in raking light, paint reads with maximum specular punch on the bright side and saturated hue in the shadow, satin trim and forged wheel faces catch hard sun glints — every surface is described by light, not by gloss",
    stanceDirective: "purposeful planted stance suited to open-road grand tourism — firm ride height (not slammed), wide track, large-diameter forged wheels with assertive sidewall presence, all four wheels visibly loaded onto the desert floor",
  },
  "sculpture-gallery": {
    name: "Sculpture Gallery",
    environment: "minimalist indoor sculpture-gallery setting — large seamless light-grey concrete floor, plain off-white wall, one shallow architectural recess of soft shadow behind the car; no people, no props, no artwork visible, no signage",
    lightingMood: "museum-grade three-point: large soft top key delivering an even gradient across the bonnet and roofline, narrow accent spot picking out the rear shoulder and door crease as a single graphic line, deep clean shadow under the car, no hot specular flares",
    cameraEthos: "elevated eye-level 50mm three-quarter front, car positioned slightly off-centre as if a sculpture on display, generous symmetrical negative space framing the silhouette, perfectly horizontal horizon",
    surfacingLanguage: "the car is read as a finished sculpture — long uninterrupted body lines, each panel transition deliberate, brightwork treated as jewellery, every surface inflection chosen to be looked at and walked around; nothing reads as a decal or accessory",
    stanceDirective: "composed and confident — firm sport ride height with the car visibly settled on its suspension, mild negative camber, large forged wheels with thin sidewalls, no extreme slammed posture and no track-day tyre stretch",
  },
  "coastal-grand-tour": {
    name: "Coastal Grand Tour",
    environment: "empty coastal touring road on a high cliff section — smooth dark asphalt under a cool morning sky with a single soft horizon line of distant ocean haze; no railings, no buildings, no other cars",
    lightingMood: "soft directional morning key from camera-right, cool diffuse sky fill, a thin warm rim light tracing the long roofline and rear shoulder simultaneously — controlled contrast, a touring-magazine cover quality of light",
    cameraEthos: "long 70mm three-quarter from a slight elevation showing the full length of the car, body framed against the road and the soft horizon line, slow shutter feel to the background only",
    surfacingLanguage: "sweeping uninterrupted side surfaces, the long roofline and tailgate read as a single flowing gesture, brightwork and trim used as continuous lines rather than punctuation, every panel emphasises length and poise rather than aggression",
    stanceDirective: "settled grand-tourer stance — firm but not slammed ride height, large multi-spoke or forged wheels filling the arches, equal front/rear ride height, the car reading as planted touring hardware rather than track hardware",
  },
  "circuit-veteran": {
    name: "Circuit Veteran",
    environment: "weathered concrete pit-lane apron under an overcast sky — no garages visible, no signage, no other cars; only a clean section of textured concrete and a soft uniform sky behind the car",
    lightingMood: "broad soft overcast key (large-source diffuse) wrapping the body evenly, gentle directional bias from above-left, restrained specular highlights along the shoulder and roofline, deep shadow inside the wheel arches — documentary, not theatrical",
    cameraEthos: "35mm side-quarter at door height, slight forward lean to the framing, the worn concrete apron visible as a quiet foreground texture, full vehicle silhouette unobstructed",
    surfacingLanguage: "purposeful and slightly austere — every aero element is functional rather than decorative, body lines feel earned and lived-in rather than showroom-fresh, the surface tells a story of laps run rather than a parts catalog assembly",
    stanceDirective: "race-ready ride height with negative camber up front, square tyre fitment, exposed lug detail on forged wheels, the car visibly squatting on its suspension as if just rolled out of the pit lane",
  },
};

export function resolveCreativeLane(
  vehicleCategory: string,
  bodyStyle: BodyStyle,
  kitStyleId: string
): CreativeLane {
  // Kit-style overrides — applied first, regardless of category/body style.
  if (
    kitStyleId === "period-correct" ||
    kitStyleId === "hot-rod" ||
    kitStyleId === "drag-pack" ||
    kitStyleId === "restomod" ||
    kitStyleId === "pro-touring-classic"
  ) {
    return CREATIVE_LANES["period-restomod"]!;
  }
  // Track / circuit kit overrides route to the circuit-veteran lane so a
  // race-built sports coupe doesn't share the same JDM-night look as a
  // street-tuned one.
  if (
    kitStyleId === "track-attack" ||
    kitStyleId === "race-spec" ||
    kitStyleId === "circuit-spec" ||
    kitStyleId === "track-pack"
  ) {
    return CREATIVE_LANES["circuit-veteran"]!;
  }
  // Desert / overland kit overrides route any vehicle (including hypercars
  // styled for the GCC market) into the desert-gt lane.
  if (
    kitStyleId === "desert-gt" ||
    kitStyleId === "gcc-spec" ||
    kitStyleId === "dune-runner"
  ) {
    return CREATIVE_LANES["desert-gt"]!;
  }

  // Explicit vehicle category mapping — covers every supported category and
  // is now intentionally diversified so two adjacent body styles never share
  // the same lane (hatchback ≠ sports-coupe, sedan ≠ wagon).
  switch (vehicleCategory) {
    case "hypercar":      return CREATIVE_LANES["hyper-gt"]!;
    case "muscle":        return CREATIVE_LANES["american-pro-street"]!;
    case "grand-tourer":  return CREATIVE_LANES["luxury-sport-gt"]!;
    case "classic":       return CREATIVE_LANES["period-restomod"]!;
    case "sports-coupe":  return CREATIVE_LANES["jdm-time-attack"]!;
    case "hatchback":     return CREATIVE_LANES["neo-tokyo"]!;
    case "sedan":         return CREATIVE_LANES["sculpture-gallery"]!;
    case "wagon":         return CREATIVE_LANES["coastal-grand-tour"]!;
    case "suv":           return CREATIVE_LANES["desert-gt"]!;
    case "truck":         return CREATIVE_LANES["overland-brutalist"]!;
    case "crossover":     return CREATIVE_LANES["overland-brutalist"]!;
    case "pickup":        return CREATIVE_LANES["overland-brutalist"]!;
    case "minivan":       return CREATIVE_LANES["widebody-gt"]!;
  }

  // Body style fallback for categories not enumerated above — every BodyStyle
  // value gets an intentional lane, never a silent generic default.
  switch (bodyStyle) {
    case "truck":       return CREATIVE_LANES["overland-brutalist"]!;
    case "suv":         return CREATIVE_LANES["desert-gt"]!;
    case "convertible": return CREATIVE_LANES["coastal-grand-tour"]!;
    case "wagon":       return CREATIVE_LANES["coastal-grand-tour"]!;
    case "sedan":       return CREATIVE_LANES["sculpture-gallery"]!;
    case "hatchback":   return CREATIVE_LANES["neo-tokyo"]!;
    case "coupe":       return CREATIVE_LANES["jdm-time-attack"]!;
    case "unknown":     return CREATIVE_LANES["jdm-time-attack"]!;
  }

  // Unreachable in practice — all known category and body-style paths are
  // handled above. This explicit choice (JDM time-attack) is deliberate:
  // any truly unclassified vehicle skews sporty/performance, not generic GT.
  return CREATIVE_LANES["jdm-time-attack"]!;
}

// ─── Prompt builders ─────────────────────────────────────────────────────────

function buildPaintDescription(
  paintName: string,
  paintHex: string,
  paintHex2?: string,
  paintShiftLabel?: string
): string {
  if (paintHex2 && paintShiftLabel) {
    return (
      `${paintName} — a ${paintShiftLabel} color-shift / ChromaFlair paint that flips between ` +
      `${paintHex} and ${paintHex2} depending on viewing angle and lighting, ` +
      `with both hues clearly visible across the body panels`
    );
  }
  return `${paintName} (${paintHex})`;
}

function buildWheelColorSentence(rimDesc: string, rimColorName?: string, rimColorHex?: string): string {
  if (rimColorName && rimColorHex) {
    return `Wheels: ${rimDesc} — the wheel finish is ${rimColorName} (${rimColorHex}) and this exact color is mandatory on every visible wheel.`;
  }
  return `Wheels: ${rimDesc}.`;
}

/**
 * Minimal subset of DesignConceptBrief consumed by the prompt builders.
 * Defined here to avoid a circular import with `design-team/agents/render-design-concept`,
 * which itself imports `CreativeLane` from this module.
 */
export interface DesignConceptBriefForPrompt {
  signatureElement: string;
  proportionEmphasis: string;
  kitGeometryLanguage: string;
  aeroPhilosophy: string;
  surfaceTransitionDetail: string;
  lightingHeroMoment: string;
}

/**
 * Compose a bespoke surfacing-language string from a DesignConceptBrief.
 * When provided, the renderer uses this instead of the generic lane
 * `surfacingLanguage`, so every render carries its own per-build vocabulary
 * rather than the lane default that all renders in the same lane would share.
 */
function composeSurfacingLanguage(
  lane: CreativeLane,
  designConceptBrief?: DesignConceptBriefForPrompt
): string {
  if (!designConceptBrief) return lane.surfacingLanguage;
  return (
    `${designConceptBrief.kitGeometryLanguage} ` +
    `Surface transition focus: ${designConceptBrief.surfaceTransitionDetail} ` +
    `Hero element: ${designConceptBrief.signatureElement} ` +
    `(proportion emphasis: ${designConceptBrief.proportionEmphasis}; ` +
    `aero philosophy: ${designConceptBrief.aeroPhilosophy})`
  );
}

/**
 * Compose a bespoke lighting directive that layers the design-concept's
 * `lightingHeroMoment` on top of the creative lane's `lightingMood`.
 */
function composeLightingMood(
  lane: CreativeLane,
  designConceptBrief?: DesignConceptBriefForPrompt
): string {
  if (!designConceptBrief) return lane.lightingMood;
  return `${lane.lightingMood} HERO LIGHTING MOMENT: ${designConceptBrief.lightingHeroMoment}`;
}

export function buildVanguardConceptPrompt(
  vehicleYear: string,
  vehicleMake: string,
  vehicleModel: string,
  paintName: string,
  paintHex: string,
  rimDesc: string,
  angle: AngleKey | null,
  wideBody: boolean = false,
  bodyStyle: BodyStyle = "unknown",
  paintHex2?: string,
  paintShiftLabel?: string,
  rimColorName?: string,
  rimColorHex?: string,
  kitStyleId: string = "vanguard-custom",
  vehicleCategory: string = "sports-coupe",
  paintKitBodyColor: boolean = false,
  kitPartFinishes?: KitPartFinishes | null,
  rearAeroTypeOverride?: RearAeroType,
  creativeLane?: CreativeLane,
  designConceptBrief?: DesignConceptBriefForPrompt,
  wingMounting?: RearWingMounting
): string {
  const effectiveFinishes = resolveKitPartFinishes(paintKitBodyColor, kitPartFinishes);
  const summary = summarizeKitFinishes(effectiveFinishes);
  const cfg = angle ? ANGLE_CONFIGS[angle] : null;
  const kitFocus = angle
    ? getKitFocus(angle, bodyStyle)
    : summary.allBody
    ? "the complete redesigned body, aero elements, wide-body stance, and signature monochrome body-color painted aero surfaces"
    : summary.allCarbon
    ? "the complete redesigned body, aero elements, wide-body stance, and signature carbon surfaces"
    : `the complete redesigned body, aero elements, wide-body stance, and the deliberate contrast between body-color painted parts (${summary.bodyLabels.join("; ")}) and exposed carbon parts (${summary.carbonLabels.join("; ")})`;
  const wheelSentence = buildWheelColorSentence(rimDesc, rimColorName, rimColorHex);
  const paintDesc = buildPaintDescription(paintName, paintHex, paintHex2, paintShiftLabel);
  const kitFinishWideBody = summary.allBody
    ? `All arch extensions, bumper extensions, splitter, diffuser, canards, and aero surfaces are PAINTED IN THE EXACT SAME ${paintDesc} body paint as the rest of the car — same color, same finish, same reflectivity, same metallic flake or pearl/color-shift behavior. NO exposed carbon fiber weave on any kit part. The kit reads as one continuous monochrome painted body, not as carbon-fiber accents.`
    : summary.allCarbon
    ? `All arch extensions and aero surfaces in gloss carbon fiber rendered as the ${VANGUARD_DIAMOND_WEAVE_DEF}.`
    : `MIXED FINISH KIT — render the contrast clearly: ${summary.bodyLabels.join(", ")} are PAINTED IN THE EXACT SAME ${paintDesc} body paint as the rest of the car (same gloss, reflectivity, metallic flake or pearl/color-shift behavior, NO visible carbon weave on these parts), while ${summary.carbonLabels.join(", ")} are EXPOSED gloss carbon fiber rendered as the ${VANGUARD_DIAMOND_WEAVE_DEF}, visibly distinct from generic carbon twill. Painted vs carbon surfaces must read as a deliberate two-material design language, not as accidental inconsistency.`;
  const kitFinishStandard = summary.allBody
    ? `All aero surfaces (front splitter, canards, side skirts, diffuser, fender flares, vented hood inserts, rear ${getRearAeroSpec(getRearAeroType(bodyStyle, kitStyleId, vehicleCategory)).name.toLowerCase()}) are PAINTED IN THE EXACT SAME ${paintDesc} body paint as the rest of the car — same color, same finish, same reflectivity, same metallic flake or pearl/color-shift behavior. NO visible carbon-fiber weave anywhere on the kit. The aero reads as monochrome painted bodywork, not exposed carbon.`
    : summary.allCarbon
    ? `All aero surfaces in gloss carbon fiber rendered as the ${VANGUARD_DIAMOND_WEAVE_DEF}.`
    : `MIXED FINISH KIT — render the contrast clearly: ${summary.bodyLabels.join(", ")} are PAINTED IN THE EXACT SAME ${paintDesc} body paint as the rest of the car (same gloss, reflectivity, metallic flake or pearl/color-shift behavior, NO visible carbon weave on these parts), while ${summary.carbonLabels.join(", ")} are EXPOSED gloss carbon fiber rendered as the ${VANGUARD_DIAMOND_WEAVE_DEF}. The painted and carbon parts must coexist as a deliberate two-material design — painted surfaces show no weave, carbon surfaces show the diamond-weave pattern.`;
  const carbonWeaveLightingNote = summary.allBody
    ? `and a deep rim of light catching the painted body-color contours of the aero kit (no carbon weave to highlight).`
    : summary.allCarbon
    ? `and deep rim of light catching the carbon fiber weave on all aero surfaces.`
    : `and deep rim of light catching both the painted body-color contours and the carbon fiber weave on the carbon parts (${summary.carbonLabels.join(", ")}).`;
  const wideBodyCarbonLightingNote = summary.allBody
    ? `and a deep rim of light catching the painted body-color flares and bumper extensions (no carbon weave to highlight).`
    : summary.allCarbon
    ? `and deep rim of light catching the carbon fiber weave on the pumped arches.`
    : `and a deep rim of light highlighting both the painted body-color parts and the exposed carbon weave on the remaining kit parts.`;

  const rearAeroType = rearAeroTypeOverride ?? getRearAeroType(bodyStyle, kitStyleId, vehicleCategory);
  const rearAeroSpec = getRearAeroSpec(rearAeroType, wingMounting);

  const classicNote = vehicleCategory === "classic"
    ? (kitStyleId === "period-correct"
        ? "CLASSIC CAR — PERIOD CORRECT KIT: Render the authentic factory-stock silhouette with NO modern LED bars, NO carbon fibre aero, NO contemporary splitters or diffusers. Use era-accurate chrome bumpers, OEM steel or period-correct alloy wheels, and stock ride height. The car must look exactly as it rolled off the production line in its era. "
        : kitStyleId === "hot-rod"
        ? "CLASSIC CAR — HOT ROD KIT: Render a period-correct hot rod style — chopped and lowered stance, exposed chrome engine components if appropriate, big-and-little tyre stagger, classic moon disc or steelies wheels, no modern carbon aero. The silhouette must be vintage American street rod, not a modern performance car. "
        : kitStyleId === "drag-pack"
        ? "CLASSIC CAR — DRAG PACK KIT: Render a vintage drag strip build — cowl-induction hood scoop, rear wheelie stance (nose slightly raised), skinny front tyres, wide slick-style rear rubber, traction bars visible, period-correct chrome details. No modern LED bars or carbon aero. "
        : kitStyleId === "restomod"
        ? "CLASSIC CAR — RESTOMOD KIT: The original vintage body shell is preserved and restored; subtle modern aero accents (mild front chin spoiler, tasteful rear lip) may appear but must complement the classic silhouette. No extreme carbon wings. Chrome may mix with modern finishes. The car should look like a high-quality restomod, not a modern supercar. "
        : kitStyleId === "pro-touring-classic"
        ? "CLASSIC CAR — PRO TOURING KIT: A road-course classic with pumped fender flares, modern large-diameter wheels, lowered stance, and mild aero. The period-correct body shape is clearly preserved. Subtle chin and rear lip are acceptable but no tall GT wings unless explicitly part of the build. "
        : "CLASSIC CAR: Render the authentic vintage silhouette of this car with period-correct proportions and details. Avoid modern LED light bars, excessive carbon aero, or contemporary bodywork cues unless the kit specifically calls for them. ")
    : "";

  const lane = creativeLane ?? resolveCreativeLane(vehicleCategory, bodyStyle, kitStyleId);

  if (wideBody) {
    const cameraDirective = cfg
      ? cfg.cameraDirective.replace(
          "Rear three-quarter low angle, camera below bumper height positioned at the rear corner, looking up slightly at the rear and side simultaneously.",
          "Rear three-quarter low angle, camera positioned wide and low to emphasize the dramatically stretched track width and massively pumped rear arches — pull back framing to capture the extreme width of the stance."
        ).replace(
          "Pure 90-degree side profile from the driver side, camera at door-mirror height, perfectly flat side-on view showing the complete vehicle silhouette.",
          "Pure 90-degree side profile from the driver side, camera set lower than normal to show the extreme lowered ride height and the ground-scraping stance of the wide-body conversion."
        )
      : lane.cameraEthos;

    return (
      `Best-in-class automotive concept reveal render. ` +
      `Hyperrealistic professional automotive concept visualization of a ${vehicleYear} ${vehicleMake} ${vehicleModel} ` +
      `wearing an extreme VANGUARD WIDE BODY EDITION — an entirely original wide-body concept created specifically for this car. ` +
      `ORIGINAL DESIGN MANDATE: this wide-body kit is Vanguard's own in-house design language, invented for this exact body. ` +
      `It must NOT reproduce, imitate, or approximate any recognizable existing aftermarket or tuner wide-body kit, and must NOT copy any OEM factory performance-package styling. ` +
      `Every flare, extension, and aero element must be derived from THIS car's own body lines and read as a bespoke one-off Vanguard concept that does not exist anywhere else. ` +
      `NO aftermarket brand logos, tuner badges, sponsor decals, or livery text anywhere on the car. ` +
      `The Wide Body Edition design intent: ` +
      `massively pumped fender arch extensions (+100–120 mm per side) that dramatically widen the car's visual stance, ` +
      `flush wide-body fitment with tyres sitting perfectly flush with the flare edge, ` +
      `widened front bumper extensions matching the flare width with integrated ${effectiveFinishes.front === "body" ? `body-color painted` : `carbon`} canards, ` +
      `widened rear bumper end caps matched to the rear arch width, ` +
      (effectiveFinishes.sides === "body"
        ? `body-color painted arch liners visible inside the flares (matching the body paint, no exposed carbon weave on the side flares), `
        : `exposed carbon arch liners visible inside the flares, `) +
      `aggressively lowered ride height — the car should sit extremely close to the ground, ` +
      `stretched front and rear track width making the car appear significantly wider than stock, ` +
      `and deep rear diffuser with Gurney fins. ` +
      `${kitFinishWideBody} ` +
      classicNote +
      (rearAeroType === "none"
        ? `REAR AERO: NONE — CLEAN TAIL. No spoiler or wing of any kind. The rear bodywork trailing edge must be completely smooth and unmodified. `
        : rearAeroType === "gt-wing"
        ? (() => {
            const mounting = wingMounting ?? "swan-neck";
            const mountLabel = mounting === "pedestal"
              ? "pedestal uprights bolted to the boot floor"
              : mounting === "trunk-mount"
              ? "trunk-mount bracket bases sitting flat on the trunk lid"
              : "swan-neck stanchions arching up from the trunk lid";
            const glassRule = bodyStyle === "hatchback"
              ? `Both mounting bases are on the lower solid tailgate panel below the rear glass — wing element clears the hatch glass entirely, NOT on glass. `
              : bodyStyle === "wagon"
              ? `Both mounting bases are on solid bodywork — wing element clears the glass line entirely, NOT on glass. `
              : `Both mounting bases are on the trunk lid / rear deck — wing element clears the boot glass entirely, bases on solid metal. `;
            return `REAR AERO: This build uses a ${rearAeroSpec.name}. ` +
              `Render the wing with ${mountLabel}. ` +
              glassRule +
              `DO NOT skip the wing. `;
          })()
        : `REAR AERO: This build uses a ${rearAeroSpec.name} — ${rearAeroSpec.description}. ` +
          `Mounting: ${rearAeroSpec.mountingSurface}. DO NOT render a swan-neck GT wing or elevated stanchion wing on this build. `) +
      `The car is finished in ${buildPaintDescription(paintName, paintHex, paintHex2, paintShiftLabel)} paint. ` +
      `${wheelSentence} ` +
      `Camera angle: ${cameraDirective} ` +
      `Camera ethos: ${lane.cameraEthos} ` +
      `Pay close attention to: ${kitFocus} ` +
      `SURFACING LANGUAGE: ${composeSurfacingLanguage(lane, designConceptBrief)} ` +
      `STANCE: ${lane.stanceDirective} ` +
      `Setting: ${lane.environment}. Keep the backdrop clean and uncluttered — the car is the sole subject; do NOT add busy scenery, landmarks, city skylines, or atmospheric locations. ` +
      `Lighting: ${composeLightingMood(lane, designConceptBrief)}. ` +
      `${wideBodyCarbonLightingNote} ` +
      `DRIVE CONFIG: LEFT-HAND DRIVE (LHD) — steering wheel on the LEFT, driver seat on the LEFT; applies to ALL makes including JDM, UK, AU; DO NOT render RHD. ` +
      `8K ultra high resolution, photorealistic concept automotive photography — hero reveal quality, no text, no watermarks, hyperdetailed.`
    );
  }

  const cameraDirective = cfg
    ? cfg.cameraDirective
    : "dramatic three-quarter front perspective, low shooting angle, slightly elevated";

  const rearAeroFeature =
    rearAeroType === "gt-wing"
      ? (() => {
          const m = wingMounting ?? "swan-neck";
          if (m === "pedestal") return `an adjustable GT rear wing on straight vertical pedestal uprights bolted to the boot floor, with sculpted end plates`;
          if (m === "trunk-mount") return `an adjustable GT rear wing on low-profile trunk-mount bracket bases sitting flat on the trunk lid, with sculpted end plates`;
          return `a swan-neck adjustable rear wing with curved stanchions arching up from the trunk lid and sculpted end plates`;
        })()
      : rearAeroType === "duck-tail"
      ? `a classic duck-tail spoiler moulded flush into the rear deck lid trailing edge — NO elevated stanchions or swan-neck wing`
      : rearAeroType === "boot-lip"
      ? `a discrete flush boot-lid lip spoiler bonded to the trailing edge — NO tall wing or stanchions`
      : rearAeroType === "roofline-lip"
      ? `a slim roofline spoiler bonded flush along the top rear edge of the roof or hatch — NO elevated wing`
      : rearAeroType === "deck-lid-lip"
      ? `a low deck-lid lip spoiler on the rear bodywork — NO tall wing`
      : `no rear spoiler or wing — clean uninterrupted tail`;

  const rearAeroConstraint =
    rearAeroType === "gt-wing"
      ? (() => {
          const m = wingMounting ?? "swan-neck";
          if (m === "pedestal") return `REAR AERO: Render a GT wing on straight vertical pedestal uprights — flat-based pedestals bolted visibly to the boot floor, wing element rising straight from the pedestals. Both pedestal bases on solid metal. NO swan-neck curve.`;
          if (m === "trunk-mount") return `REAR AERO: Render a GT wing on flat trunk-mount bracket bases sitting directly on the trunk lid skin. Brackets bolt flat to the trunk lid — NO swan-neck arch and NO tall pedestal uprights. Wing sits lower and closer to the trunk lid.`;
          return `REAR AERO: Render a swan-neck GT wing — stanchions curve upward from the trunk lid. Both stanchion bases bolted visibly to solid trunk metal.`;
        })()
      : `REAR AERO: Render a ${rearAeroSpec.name} — ${rearAeroSpec.description}. DO NOT render a tall swan-neck GT wing or elevated stanchion wing on this body.`;

  return (
    `Best-in-class automotive concept reveal render. ` +
    `Hyperrealistic professional automotive concept visualization of a ${vehicleYear} ${vehicleMake} ${vehicleModel} ` +
    `wearing an exclusive VANGUARD SIGNATURE custom body kit — an entirely original design created specifically for this car. ` +
    `ORIGINAL DESIGN MANDATE: this kit is Vanguard's own in-house design language, invented for this exact body. ` +
    `It must NOT reproduce, imitate, or approximate any recognizable existing aftermarket or tuner body kit, and must NOT copy any OEM factory performance-package styling. ` +
    `Every aero element must be derived from THIS car's own body lines and read as a bespoke one-off Vanguard concept that does not exist anywhere else. ` +
    `NO aftermarket brand logos, tuner badges, sponsor decals, or livery text anywhere on the car. ` +
    classicNote +
    `The Vanguard Signature house style features: ` +
    (effectiveFinishes.front === "body"
      ? `razor-sharp painted blade elements (in body color) that follow the car's natural body lines, `
      : `razor-sharp carbon fiber blade elements that follow the car's natural body lines, `) +
    (effectiveFinishes.sides === "body"
      ? `aggressive wide-body fender flares painted in matching body color (+60–80 mm per side), `
      : `aggressive wide-body fender flares with exposed carbon weave (+60–80 mm per side), `) +
    `a multi-element front splitter system with canard dive planes, ` +
    `a deep rear diffuser with integrated Gurney fins, ` +
    `${rearAeroFeature}, ` +
    `and vented hood with dual heat-extraction slots. ` +
    `${kitFinishStandard} ` +
    `The car is finished in ${paintDesc} paint. ` +
    `${wheelSentence} ` +
    `${rearAeroConstraint} ` +
    `Camera angle: ${cameraDirective} ` +
    `Camera ethos: ${lane.cameraEthos} ` +
    `Pay close attention to: ${kitFocus} ` +
    `SURFACING LANGUAGE: ${composeSurfacingLanguage(lane, designConceptBrief)} ` +
    `STANCE: ${lane.stanceDirective} ` +
    `Setting: ${lane.environment}. Keep the backdrop clean and uncluttered — the car is the sole subject; do NOT add busy scenery, landmarks, city skylines, or atmospheric locations. ` +
    `Lighting: ${composeLightingMood(lane, designConceptBrief)}. ` +
    `${carbonWeaveLightingNote} ` +
    `DRIVE CONFIG: LEFT-HAND DRIVE (LHD) — steering wheel on the LEFT, driver seat on the LEFT; applies to ALL makes including JDM, UK, AU; DO NOT render RHD. ` +
    `8K ultra high resolution, photorealistic concept automotive photography — hero reveal quality, no text, no watermarks, hyperdetailed.`
  );
}

export function buildStandardPrompt(
  vehicleYear: string,
  vehicleMake: string,
  vehicleModel: string,
  paintName: string,
  paintHex: string,
  rimDesc: string,
  kitsDesc: string,
  angle: AngleKey | null,
  bodyStyle: BodyStyle = "unknown",
  paintHex2?: string,
  paintShiftLabel?: string,
  rimColorName?: string,
  rimColorHex?: string,
  paintKitBodyColor: boolean = false,
  kitPartFinishes?: KitPartFinishes | null,
  creativeLane?: CreativeLane,
  vehicleCategory: string = "sports-coupe",
  kitStyleId: string = "stock",
  designConceptBrief?: DesignConceptBriefForPrompt
): string {
  const cameraDirective = angle
    ? ANGLE_CONFIGS[angle].cameraDirective
    : "dramatic three-quarter front perspective, low shooting angle.";
  const kitFocusText = angle
    ? `Pay close attention to: ${getKitFocus(angle, bodyStyle)} `
    : "";
  const wheelSentence = buildWheelColorSentence(rimDesc, rimColorName, rimColorHex);
  const paintDesc = buildPaintDescription(paintName, paintHex, paintHex2, paintShiftLabel);
  const summary = summarizeKitFinishes(resolveKitPartFinishes(paintKitBodyColor, kitPartFinishes));
  const monochromeKitNote = summary.allBody
    ? `IMPORTANT: All body kit / aero parts (front bumper, splitter, side skirts, diffuser, rear wing or spoiler, fender flares) are PAINTED IN THE EXACT SAME ${paintDesc} body paint as the rest of the car — same color, same finish, same reflectivity, same metallic flake or pearl/color-shift behavior. NO visible carbon-fiber weave anywhere on the kit. The aero reads as one continuous monochrome painted body. `
    : summary.mixed
    ? `IMPORTANT — MIXED FINISH KIT: Some body kit parts are PAINTED BODY COLOR (matching the ${paintDesc} body paint exactly — same gloss, reflectivity, metallic flake or pearl/color-shift behavior, with NO visible carbon-fiber weave on those parts), while other kit parts are EXPOSED CARBON FIBER (visible weave pattern under gloss). Specifically — body-color painted: ${summary.bodyLabels.join(", ")}. Exposed carbon fiber: ${summary.carbonLabels.join(", ")}. The contrast between painted and carbon parts must be clearly visible: painted surfaces show no weave, carbon surfaces show the weave pattern. `
    : "";
  const lane = creativeLane ?? resolveCreativeLane(vehicleCategory, bodyStyle, kitStyleId);
  return (
    `Best-in-class automotive editorial concept shoot. ` +
    `This render must look like a hero magazine reveal, not a stock catalog photo. ` +
    `Hyperrealistic professional automotive photography of a ${vehicleYear} ${vehicleMake} ${vehicleModel}, ` +
    `finished in ${paintDesc} paint, ${kitsDesc}. ` +
    `${wheelSentence} ` +
    `${monochromeKitNote}` +
    `Camera angle: ${cameraDirective} ` +
    `Camera ethos: ${lane.cameraEthos} ` +
    kitFocusText +
    `SURFACING LANGUAGE: ${composeSurfacingLanguage(lane, designConceptBrief)} ` +
    `STANCE: ${lane.stanceDirective} ` +
    `Setting: ${lane.environment}. Keep the backdrop clean and uncluttered — the car is the sole subject; do NOT add busy scenery, landmarks, city skylines, or atmospheric locations. ` +
    `Lighting: ${composeLightingMood(lane, designConceptBrief)}. ` +
    `DRIVE CONFIG: LEFT-HAND DRIVE (LHD) — steering wheel on the LEFT, driver seat on the LEFT; applies to ALL makes including JDM, UK, AU; DO NOT render RHD. ` +
    `8K ultra high resolution, photorealistic, no text, no watermarks, hyperdetailed automotive editorial photography.`
  );
}

