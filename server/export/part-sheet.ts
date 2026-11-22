/**
 * Measured production sheet for one kit part: the AI close-up line drawing,
 * with dimension lines, values and a title block drawn by code (image models
 * garble numbers, so no number on the sheet comes from the image).
 */
import { PNG } from "pngjs";
import type { Img } from "../ai";
import { CF_MATERIALS } from "../../shared/catalog";
import { PART_LABELS, PART_SHEET_VIEWS, type BuildConfig, type PartId } from "../../shared/types";
import type { PartSpec } from "../domain/part-specs";
import { vehicleName } from "../domain/prompts";

/** Bump when the sheet layout changes, so browsers drop cached (immutable) sheet URLs. */
export const SHEET_LAYOUT_VERSION = 3;

/** Shown wherever a part's mounting points appear: the drawing's holes are not authoritative. */
export const INDICATIVE_HOLES_NOTE = "Hole positions and count in the drawing are indicative only — use the specified number of mounting points.";

export function partDrawingNumber(buildId: number, partId: PartId): string {
  return `VD-${String(buildId).padStart(4, "0")}-${partId.toUpperCase()}`;
}

export interface InkBounds { width: number; height: number; x0: number; y0: number; x1: number; y1: number }

/** Bounding box of the drawn lines (dark pixels) in a PNG; falls back to the central 80% for other formats. */
export function inkBounds(image: Img): InkBounds {
  const fallback = (w: number, h: number): InkBounds => ({ width: w, height: h, x0: w * 0.1, y0: h * 0.1, x1: w * 0.9, y1: h * 0.9 });
  if (image.mime !== "image/png") return fallback(1536, 1024);
  let png: PNG;
  try {
    png = PNG.sync.read(image.data);
  } catch {
    return fallback(1536, 1024);
  }
  const { width, height, data } = png;
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  // Every other pixel is plenty for a bounding box and halves the work on 1.5 MP images.
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      if (data[i + 3]! < 128) continue;
      const lum = 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
      if (lum < 170) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0 || x1 - x0 < 10 || y1 - y0 < 10) return fallback(width, height);
  return { width, height, x0, y0, x1, y1 };
}

const W = 1600, H = 1131; // A3 landscape proportions
const PAD = 20;
const TITLE_H = 250;
const AREA = { x: PAD + 40, y: PAD + 40, w: W - 2 * PAD - 80, h: H - 2 * PAD - TITLE_H - 60 };
const FONT = `font-family="Helvetica, Arial, sans-serif"`;
const INK = "#0f172a", DIM = "#1e3a8a", MUTED = "#475569";

function esc(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[ch]!));
}

const mm = (n: number) => `${Math.round(n).toLocaleString("en-GB")} mm`;

function arrow(x: number, y: number, angle: number): string {
  const a = (angle * Math.PI) / 180, s = 12, w = 4.5;
  const bx = x - s * Math.cos(a), by = y - s * Math.sin(a);
  const px = -Math.sin(a) * w, py = Math.cos(a) * w;
  return `<path d="M${x},${y} L${bx + px},${by + py} L${bx - px},${by - py} Z" fill="${DIM}"/>`;
}

function hDim(x0: number, x1: number, yEdge: number, y: number, value: string, label: string): string {
  const mid = (x0 + x1) / 2;
  return `<g stroke="${DIM}" stroke-width="1.2" fill="none">` +
    `<line x1="${x0}" y1="${yEdge + 6}" x2="${x0}" y2="${y + 10}"/><line x1="${x1}" y1="${yEdge + 6}" x2="${x1}" y2="${y + 10}"/>` +
    `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/></g>` +
    arrow(x0, y, 180) + arrow(x1, y, 0) +
    `<rect x="${mid - 78}" y="${y - 15}" width="156" height="30" fill="#fff"/>` +
    `<text x="${mid}" y="${y + 6}" text-anchor="middle" ${FONT} font-size="20" font-weight="700" fill="${DIM}">${esc(value)}</text>` +
    `<text x="${mid}" y="${y + 34}" text-anchor="middle" ${FONT} font-size="12" letter-spacing="2" fill="${MUTED}">${esc(label)}</text>`;
}

function vDim(y0: number, y1: number, xEdge: number, x: number, value: string, label: string): string {
  const mid = (y0 + y1) / 2;
  return `<g stroke="${DIM}" stroke-width="1.2" fill="none">` +
    `<line x1="${xEdge + 6}" y1="${y0}" x2="${x + 10}" y2="${y0}"/><line x1="${xEdge + 6}" y1="${y1}" x2="${x + 10}" y2="${y1}"/>` +
    `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/></g>` +
    arrow(x, y0, 270) + arrow(x, y1, 90) +
    `<g transform="translate(${x},${mid}) rotate(-90)">` +
    `<rect x="-78" y="-15" width="156" height="30" fill="#fff"/>` +
    `<text x="0" y="6" text-anchor="middle" ${FONT} font-size="20" font-weight="700" fill="${DIM}">${esc(value)}</text>` +
    `<text x="0" y="-22" text-anchor="middle" ${FONT} font-size="12" letter-spacing="2" fill="${MUTED}">${esc(label)}</text></g>`;
}

export interface PartSheetInput {
  partId: PartId;
  spec: PartSpec;
  source: "ai" | "estimate";
  config: BuildConfig;
  image: Img;
  revision: number;
  drawingNumber: string;
  date: string;
}

export function buildPartSheetSvg(input: PartSheetInput): string {
  const { spec, config, partId } = input;
  const sheet = PART_SHEET_VIEWS[partId];
  const b = inkBounds(input.image);
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  // Leave room right and below for the dimension lines.
  const availW = AREA.w - 180, availH = AREA.h - 130;
  const scale = Math.min(availW / bw, availH / bh);
  const dw = bw * scale, dh = bh * scale;
  const dx = AREA.x + 30 + (availW - dw) / 2;
  const dy = AREA.y + 30 + (availH - dh) / 2;
  const imgX = dx - b.x0 * scale, imgY = dy - b.y0 * scale;
  const href = `data:${input.image.mime};base64,${input.image.data.toString("base64")}`;
  const dims = spec.dimensions;
  const depthKey = (["length", "width", "height"] as const).find(k => k !== sheet.horizontal && k !== sheet.vertical)!;
  const label = (k: "length" | "width" | "height") => (k === "length" ? "LENGTH" : k === "width" ? "DEPTH" : "HEIGHT");
  const cf = CF_MATERIALS.find(m => m.id === config.carbonMaterialId);

  const ty = H - PAD - TITLE_H;
  const cells: Array<[string, string, number, number, number]> = [
    // [label, value, x, y, width]
    ["PART", spec.name, PAD, ty, 520],
    ["VEHICLE", vehicleName(config), PAD + 520, ty, 520],
    ["KIT", `${config.kitStyleLabel}${config.wideBody ? " · wide body" : ""}`, PAD + 1040, ty, W - 2 * PAD - 1040],
    ["VIEW", sheet.label.toUpperCase(), PAD, ty + 62, 260],
    [label(depthKey), mm(dims[depthKey]), PAD + 260, ty + 62, 260],
    ["WALL THICKNESS", `${spec.thickness} mm`, PAD + 520, ty + 62, 260],
    ["WEIGHT", `${spec.weight} kg`, PAD + 780, ty + 62, 260],
    ["MOUNTING POINTS (SPEC)", String(spec.mountingPoints), PAD + 1040, ty + 62, W - 2 * PAD - 1040],
    ["MATERIAL", cf ? `${cf.name}, ${spec.material.layerCount} plies, ${spec.material.resinSystem}` : spec.material.grade, PAD, ty + 124, 780],
    ["FINISH", spec.surfaceFinish, PAD + 780, ty + 124, W - 2 * PAD - 780],
    ["DRAWING NO.", input.drawingNumber, PAD, ty + 186, 260],
    ["REV", String(input.revision), PAD + 260, ty + 186, 130],
    ["DATE", input.date, PAD + 390, ty + 186, 260],
    ["SCALE", "NTS", PAD + 650, ty + 186, 130],
  ];
  const status = input.source === "ai" ? "AI-ESTIMATED DIMENSIONS" : "RULE-BASED ESTIMATED DIMENSIONS";

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="#fff"/>` +
    `<defs><clipPath id="area"><rect x="${AREA.x}" y="${AREA.y}" width="${AREA.w}" height="${AREA.h}"/></clipPath></defs>` +
    `<g clip-path="url(#area)"><image x="${imgX}" y="${imgY}" width="${b.width * scale}" height="${b.height * scale}" href="${href}" xlink:href="${href}" preserveAspectRatio="none"/></g>` +
    `<text x="${W - PAD - 16}" y="${PAD + 34}" text-anchor="end" ${FONT} font-size="12" font-style="italic" fill="${MUTED}">${esc(INDICATIVE_HOLES_NOTE)}</text>` +
    hDim(dx, dx + dw, dy + dh, dy + dh + 60, mm(dims[sheet.horizontal]), label(sheet.horizontal)) +
    vDim(dy, dy + dh, dx + dw, dx + dw + 70, mm(dims[sheet.vertical]), label(sheet.vertical)) +
    `<rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${H - 2 * PAD}" fill="none" stroke="${INK}" stroke-width="2"/>` +
    `<rect x="${PAD + 12}" y="${PAD + 12}" width="${Math.round(36 + PART_LABELS[partId].length * 11.5)}" height="34" fill="${INK}"/>` +
    `<text x="${PAD + 24}" y="${PAD + 35}" ${FONT} font-size="14" font-weight="700" letter-spacing="2" fill="#fff">${esc(PART_LABELS[partId].toUpperCase())}</text>` +
    cells.map(([k, v, x, y, w]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="62" fill="#fff" stroke="${INK}" stroke-width="1"/>` +
      `<text x="${x + 10}" y="${y + 18}" ${FONT} font-size="10" letter-spacing="1.5" fill="${MUTED}">${esc(k)}</text>` +
      `<text x="${x + 10}" y="${y + 45}" ${FONT} font-size="${v.length > 46 ? 13 : 16}" font-weight="700" fill="${INK}">${esc(v.length > 70 ? `${v.slice(0, 69)}…` : v)}</text>`).join("") +
    `<rect x="${PAD + 780}" y="${ty + 186}" width="${W - 2 * PAD - 780}" height="62" fill="#fef2f2" stroke="${INK}" stroke-width="1"/>` +
    `<text x="${PAD + 790}" y="${ty + 211}" ${FONT} font-size="13" font-weight="700" fill="#b91c1c">${status} — NOT TO SCALE</text>` +
    `<text x="${PAD + 790}" y="${ty + 235}" ${FONT} font-size="12" fill="#7f1d1d">Verify every dimension on the vehicle before tooling or fabrication.</text>` +
    `</svg>`;
}
