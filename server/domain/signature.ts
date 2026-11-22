import { createHash } from "node:crypto";
import type { BuildConfig } from "../../shared/types";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value as object).sort()
      .filter(key => (value as Record<string, unknown>)[key] !== undefined)
      .map(key => [key, stable((value as Record<string, unknown>)[key])]));
  }
  return value;
}

/**
 * Identifies the exact build the drawings were made for. Approved drawings
 * only unlock renders while the live config still has the same signature.
 */
export function configSignature(config: BuildConfig): string {
  return createHash("sha256").update(JSON.stringify(stable(config))).digest("hex").slice(0, 32);
}
