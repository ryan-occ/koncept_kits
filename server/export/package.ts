/**
 * Production export: everything a fabricator needs for one approved build.
 *
 *   README.txt                 what is in the package and its status
 *   BUILD_CONFIG.json          exact configuration + signature the drawings were approved for
 *   SPEC_SHEET.pdf             summary sheet with the approved side drawing and hero render
 *   BILL_OF_MATERIALS.csv      one row per included part
 *   PART_SPECS.json            per-part dimensions (AI or rule-based estimate)
 *   drawings/<view>.png        approved whole-car line drawings
 *   renders/<angle>.png        renders made from the approved drawings
 *   parts/KIT_PART_SHEETS.pdf  one measured close-up sheet per kit part
 *   parts/<part>-sheet.svg     the same sheets as editable SVG
 *   parts/<part>-drawing.png   the raw close-up line drawings
 */
import JSZip from "jszip";
import PDFDocument from "pdfkit";
import { CF_MATERIALS } from "../../shared/catalog";
import {
  DRAWING_VIEW_LABELS, PART_LABELS, RENDER_ANGLE_LABELS,
  type BuildConfig, type DrawingView, type PartId, type RenderAngle,
} from "../../shared/types";
import type { PartSpec } from "../domain/part-specs";
import { vehicleName } from "../domain/prompts";
import SVGtoPDF from "svg-to-pdfkit";
import { INDICATIVE_HOLES_NOTE } from "./part-sheet";

export interface ExportInput {
  buildId: number;
  name: string;
  config: BuildConfig;
  configSignature: string;
  approvedAt: Date;
  drawings: Array<{ view: DrawingView; revision: number; data: Buffer; mime: string }>;
  renders: Array<{ angle: RenderAngle; data: Buffer; mime: string; createdAt: Date }>;
  /** Measured close-up sheet (SVG) and its raw line drawing, per included part. */
  partSheets: Array<{ partId: PartId; svg: string; drawing: { data: Buffer; mime: string } }>;
  specs: PartSpec[];
  specSource: "ai" | "estimate";
  now?: Date;
}

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
const ext = (mime: string) => EXT[mime] ?? "bin";

export function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "build";
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function billOfMaterials(input: ExportInput): string {
  const header = ["Part ID", "Part", "Finish", "Material", "Length mm", "Width mm", "Height mm", "Thickness mm", "Weight kg", "Mounting points (spec)", "Notes"];
  const rows = input.specs.map(s => [
    s.partId, s.name, s.surfaceFinish, s.material.grade,
    s.dimensions.length, s.dimensions.width, s.dimensions.height, s.thickness, s.weight, s.mountingPoints, s.notes,
  ]);
  return [header, ...rows].map(r => r.map(csvCell).join(",")).join("\n") + "\n";
}

/** One A3 landscape page per measured part sheet. */
async function partSheetsPdf(input: ExportInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A3", layout: "landscape", margin: 0, autoFirstPage: false,
    info: { Title: `${input.name} — Kit part sheets`, Author: "Vanguard Draft", Subject: "Estimated dimensions — verify before fabrication" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  for (const sheet of input.partSheets) {
    doc.addPage({ size: "A3", layout: "landscape", margin: 0 });
    SVGtoPDF(doc, sheet.svg, 0, 0, { width: doc.page.width, height: doc.page.height, preserveAspectRatio: "xMidYMid meet", assumePt: false });
  }
  doc.end();
  return done;
}

async function specSheetPdf(input: ExportInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 40, info: { Title: `${input.name} — Spec Sheet`, Author: "Vanguard Draft" } });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });

  const c = input.config;
  const cf = CF_MATERIALS.find(m => m.id === c.carbonMaterialId);
  doc.fontSize(20).fillColor("#0f172a").text(input.name);
  doc.moveDown(0.2).fontSize(11).fillColor("#475569")
    .text(`${vehicleName(c)} · ${c.kitStyleLabel} · Drawings approved ${input.approvedAt.toISOString().slice(0, 10)} · Config ${input.configSignature.slice(0, 12)}`);
  doc.moveDown(0.8);

  const embed = (image: { data: Buffer; mime: string } | undefined, label: string) => {
    if (!image || (image.mime !== "image/png" && image.mime !== "image/jpeg")) return;
    doc.fontSize(9).fillColor("#64748b").text(label.toUpperCase());
    doc.image(image.data, { fit: [515, 230], align: "center" });
    doc.moveDown(0.6);
  };
  embed(input.drawings.find(d => d.view === "side"), "Approved side elevation");
  embed(input.renders.find(r => r.angle === "front-three-quarter") ?? input.renders[0], "Render");

  const rows: Array<[string, string]> = [
    ["Vehicle", `${vehicleName(c)} (${c.bodyStyle}, ${c.category})`],
    ["Kit", `${c.kitStyleLabel}${c.wideBody ? " — wide-body" : ""}`],
    ["Paint", `${c.paint.name} ${c.paint.hex}${c.paint.hex2 ? ` → ${c.paint.hex2}` : ""}`],
    ["Wheels", `${c.rim.size} ${c.rim.styleName}, ${c.rim.colorName}`],
    ["Carbon", cf ? `${cf.name} (${cf.w})` : c.carbonMaterialId],
    ["Rear aero", c.parts.wing.included ? `${c.rearAero}${c.wingMounting ? ` / ${c.wingMounting}` : ""}` : "none"],
  ];
  doc.fontSize(12).fillColor("#0f172a").text("Configuration");
  doc.moveDown(0.3).fontSize(10);
  for (const [k, v] of rows) doc.fillColor("#64748b").text(`${k}: `, { continued: true }).fillColor("#0f172a").text(v);
  doc.moveDown(0.8);

  doc.fontSize(12).fillColor("#0f172a").text(`Parts (${input.specSource === "ai" ? "AI estimate" : "rule-based estimate"} — verify before fabrication)`);
  doc.moveDown(0.3).fontSize(9);
  if (input.specs.length === 0) doc.fillColor("#475569").text("No body-kit parts included in this build.");
  else doc.fillColor("#475569").text(INDICATIVE_HOLES_NOTE).moveDown(0.3);
  for (const s of input.specs) {
    doc.fillColor("#0f172a").text(
      `${s.name}: ${s.dimensions.length} × ${s.dimensions.width} × ${s.dimensions.height} mm, ${s.thickness} mm wall, ${s.weight} kg, ${s.mountingPoints} mounting points (spec) — ${s.surfaceFinish}`,
    );
  }
  doc.end();
  return done;
}

function readme(input: ExportInput): string {
  return [
    `${input.name}`,
    `${vehicleName(input.config)} — ${input.config.kitStyleLabel}`,
    ``,
    `Status: drawings approved ${input.approvedAt.toISOString()}; config signature ${input.configSignature}.`,
    `Part dimensions are ${input.specSource === "ai" ? "AI estimates" : "rule-based estimates"} and are NOT verified against the vehicle.`,
    `Do not cut tooling or parts until dimensions are measured on the actual car.`,
    `Mounting points: the count in each part's title block and the BOM is the specification; hole positions and counts drawn in the part sheets are indicative only.`,
    ``,
    `Contents:`,
    `  BUILD_CONFIG.json        exact configuration the drawings were approved for`,
    `  SPEC_SHEET.pdf           summary sheet`,
    `  BILL_OF_MATERIALS.csv    one row per part`,
    `  PART_SPECS.json          per-part dimensions`,
    `  drawings/                approved whole-car line drawings (${input.drawings.map(d => DRAWING_VIEW_LABELS[d.view]).join(", ")})`,
    `  renders/                 ${input.renders.length ? input.renders.map(r => RENDER_ANGLE_LABELS[r.angle]).join(", ") : "none yet"}`,
    `  parts/                   measured close-up sheet per kit part (${input.partSheets.map(p => PART_LABELS[p.partId]).join(", ") || "none"})`,
    ``,
  ].join("\n");
}

export async function buildExportZip(input: ExportInput): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("README.txt", readme(input));
  zip.file("BUILD_CONFIG.json", JSON.stringify({
    buildId: input.buildId, name: input.name, configSignature: input.configSignature,
    drawingsApprovedAt: input.approvedAt.toISOString(), config: input.config,
    parts: Object.fromEntries(Object.entries(input.config.parts).map(([id, p]) => [id, { ...p, label: PART_LABELS[id as keyof typeof PART_LABELS] }])),
  }, null, 2));
  zip.file("PART_SPECS.json", JSON.stringify({ source: input.specSource, parts: input.specs }, null, 2));
  zip.file("BILL_OF_MATERIALS.csv", billOfMaterials(input));
  zip.file("SPEC_SHEET.pdf", await specSheetPdf(input));

  for (const d of input.drawings) zip.file(`drawings/${d.view}-r${d.revision}.${ext(d.mime)}`, d.data);
  for (const r of input.renders) zip.file(`renders/${r.angle}.${ext(r.mime)}`, r.data);

  if (input.partSheets.length) {
    zip.file("parts/KIT_PART_SHEETS.pdf", await partSheetsPdf(input));
    for (const sheet of input.partSheets) {
      zip.file(`parts/${sheet.partId}-sheet.svg`, sheet.svg);
      zip.file(`parts/${sheet.partId}-drawing.${ext(sheet.drawing.mime)}`, sheet.drawing.data);
    }
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
