import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { inkBounds } from "./part-sheet";

function pngWithBox(width: number, height: number, box: { x0: number; y0: number; x1: number; y1: number }) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Black outline of the box on white, like a line drawing.
      const onEdge = (x >= box.x0 && x <= box.x1 && (y === box.y0 || y === box.y1)) ||
        (y >= box.y0 && y <= box.y1 && (x === box.x0 || x === box.x1));
      const v = onEdge ? 0 : 255;
      png.data[i] = v; png.data[i + 1] = v; png.data[i + 2] = v; png.data[i + 3] = 255;
    }
  }
  return { data: PNG.sync.write(png), mime: "image/png" };
}

describe("inkBounds", () => {
  it("finds the drawn part inside a white image", () => {
    const b = inkBounds(pngWithBox(400, 300, { x0: 100, y0: 60, x1: 300, y1: 240 }));
    expect(b.width).toBe(400);
    expect(b.x0).toBeGreaterThanOrEqual(98);
    expect(b.x0).toBeLessThanOrEqual(101);
    expect(b.x1).toBeGreaterThanOrEqual(298);
    expect(b.y0).toBeLessThanOrEqual(61);
    expect(b.y1).toBeGreaterThanOrEqual(238);
  });

  it("falls back to the central area for blank or non-PNG images", () => {
    const svg = inkBounds({ data: Buffer.from("<svg/>"), mime: "image/svg+xml" });
    expect(svg.x0).toBeCloseTo(153.6);
    expect(svg.x1).toBeCloseTo(1382.4);
    const blank = inkBounds(pngWithBox(200, 100, { x0: -1, y0: -1, x1: -1, y1: -1 }));
    expect(blank).toMatchObject({ x0: 20, x1: 180, y0: 10, y1: 90 });
  });
});
