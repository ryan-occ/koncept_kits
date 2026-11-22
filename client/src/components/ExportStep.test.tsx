// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BuildDto } from "../../../shared/types";
import { api } from "../api";
import { ExportStep } from "./ExportStep";

vi.mock("../api", () => ({ api: { exportZip: vi.fn() } }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ExportStep", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("retries a failed fetch as a browser-managed ZIP download", async () => {
    container = document.createElement("div");
    root = createRoot(container);
    vi.mocked(api.exportZip).mockRejectedValue(new TypeError("Failed to fetch"));
    const clickedLinks: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clickedLinks.push(this);
    });
    const onError = vi.fn();

    act(() => root.render(
      <ExportStep
        build={{ id: 3, name: "Honda Civic build", renders: [], job: null } as unknown as BuildDto}
        onError={onError}
      />,
    ));

    await act(async () => {
      container.querySelector("button")!.click();
      await Promise.resolve();
    });

    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0].getAttribute("href")).toBe("/api/builds/3/export");
    expect(clickedLinks[0].download).toBe("honda-civic-build-production.zip");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenLastCalledWith(null);
  });
});
