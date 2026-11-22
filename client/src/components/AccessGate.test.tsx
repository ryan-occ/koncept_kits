// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { AccessGate } from "./AccessGate";

vi.mock("../api", () => ({ api: { accessStatus: vi.fn(), login: vi.fn() } }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("AccessGate", () => {
  let container: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.resetAllMocks();
  });

  it("keeps the app hidden until a valid six-digit login succeeds", async () => {
    vi.mocked(api.accessStatus).mockResolvedValue({ enabled: true, authenticated: false });
    vi.mocked(api.login).mockResolvedValue({ enabled: true, authenticated: true });
    container = document.createElement("div");
    root = createRoot(container);

    act(() => root.render(<AccessGate><div>Private app</div></AccessGate>));
    expect(container.textContent).not.toContain("Private app");
    await act(async () => { await Promise.resolve(); });
    expect(container.textContent).toContain("Enter access code");
    expect(container.textContent).not.toContain("Private app");

    const input = container.querySelector<HTMLInputElement>("#access-code")!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "482913");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(input.value).toBe("482913");
    const submitButton = container.querySelector<HTMLButtonElement>("button[type='submit']")!;
    expect(submitButton.disabled).toBe(false);
    await act(async () => {
      container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });

    expect(api.login).toHaveBeenCalledWith("482913");
    expect(container.textContent).toContain("Private app");
  });

  it("opens immediately when the server reports that the gate is disabled", async () => {
    vi.mocked(api.accessStatus).mockResolvedValue({ enabled: false, authenticated: true });
    container = document.createElement("div");
    root = createRoot(container);
    act(() => root.render(<AccessGate><div>Private app</div></AccessGate>));

    await act(async () => { await Promise.resolve(); });
    expect(container.textContent).toContain("Private app");
    expect(container.textContent).not.toContain("Enter access code");
  });
});
