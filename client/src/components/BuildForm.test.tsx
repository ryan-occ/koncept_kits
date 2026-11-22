// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, withVehicle } from "../../../shared/defaults";
import { favoriteVehicleKey, type BuildConfig, type FavoriteVehicle } from "../../../shared/types";
import { BuildForm } from "./BuildForm";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("BuildForm vehicle search", () => {
  let container: HTMLDivElement;
  let root: Root;

  const renderForm = (
    config: BuildConfig,
    onChange: (next: BuildConfig) => void,
    favorites: FavoriteVehicle[] = [],
    onToggleFavorite: (favorite: FavoriteVehicle, isFavorite: boolean) => Promise<void> = async () => {},
  ) => {
    act(() => {
      root.render(
        <BuildForm
          config={config}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
          hasDrawings={false}
          disabled={false}
          onChange={onChange}
          onNext={() => {}}
        />,
      );
    });
  };

  const typeIn = (id: string, value: string) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return input;
  };

  const pressEnter = (id: string) => {
    const input = container.querySelector<HTMLInputElement>(`#${id}`)!;
    act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  };

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("filters makes and models as the user types", () => {
    container = document.createElement("div");
    root = createRoot(container);
    const onChange = vi.fn();
    renderForm(defaultConfig(), onChange);

    const makeInput = typeIn("make", "hond");
    expect(makeInput.getAttribute("list")).toBe("make-options");
    expect(container.querySelector("#make-options option[value='Honda']")).not.toBeNull();
    expect(container.querySelector("#make-options option[value='BMW']")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    renderForm(withVehicle(defaultConfig(), "Honda", "Accord", 2025), onChange);
    const modelInput = typeIn("model", "civ");
    expect(modelInput.getAttribute("list")).toBe("model-options");
    expect(container.querySelector("#model-options option[value='Civic']")).not.toBeNull();
    expect(container.querySelector("#model-options option[value='Accord']")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("selects exact make and model matches without breaking year choices", () => {
    container = document.createElement("div");
    root = createRoot(container);
    let config = defaultConfig();
    const onChange = (next: BuildConfig) => { config = next; };
    renderForm(config, onChange);

    typeIn("make", "Honda");
    expect(config.make).toBe("Honda");
    expect(config.model).toBe("Accord");
    expect(config.year).toBe(2025);

    renderForm(config, onChange);
    typeIn("model", "Civic");
    expect(config.make).toBe("Honda");
    expect(config.model).toBe("Civic");
    expect(config.year).toBe(2025);

    renderForm(config, onChange);
    const year = container.querySelector<HTMLSelectElement>("#year")!;
    expect(year.value).toBe("2025");
    expect(Array.from(year.options, option => option.value)).toContain("2025");

    const makeInput = container.querySelector<HTMLInputElement>("#make")!;
    expect(makeInput.getAttribute("aria-autocomplete")).toBe("list");
    expect(makeInput.getAttribute("role")).toBe("combobox");
  });

  it("lets keyboard users accept a single matching model", () => {
    container = document.createElement("div");
    root = createRoot(container);
    let config = withVehicle(defaultConfig(), "Honda", "Civic", 2025);
    const onChange = (next: BuildConfig) => { config = next; };
    renderForm(config, onChange);

    typeIn("model", "Acc");
    pressEnter("model");

    expect(config.model).toBe("Accord");
    expect(config.year).toBe(2025);
  });

  it("loads a saved vehicle into the build and lets users toggle its favorite", async () => {
    container = document.createElement("div");
    root = createRoot(container);
    let config = defaultConfig();
    const onChange = (next: BuildConfig) => { config = next; };
    const favorite = { make: "Honda", model: "Civic", year: 2024, trim: "civic-type-r" };
    const onToggleFavorite = vi.fn().mockResolvedValue(undefined);
    renderForm(config, onChange, [favorite], onToggleFavorite);

    const saveCurrent = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "☆ Save vehicle")!;
    await act(async () => { saveCurrent.click(); await Promise.resolve(); });
    expect(onToggleFavorite).toHaveBeenCalledWith(
      { make: "BMW", model: "M4", year: config.year },
      false,
    );
    onToggleFavorite.mockClear();

    const picker = container.querySelector<HTMLSelectElement>("#favorite-vehicle")!;
    expect(Array.from(picker.options, option => option.textContent)).toContain("2024 Honda Civic — Type R");
    act(() => {
      picker.value = favoriteVehicleKey(favorite);
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(config).toMatchObject({ make: "Honda", model: "Civic", year: 2024, trim: "civic-type-r", bodyStyle: "hatchback" });

    renderForm(config, onChange, [favorite], onToggleFavorite);
    const removeCurrent = Array.from(container.querySelectorAll("button")).find(button => button.textContent === "★ Saved vehicle")!;
    await act(async () => { removeCurrent.click(); await Promise.resolve(); });
    expect(onToggleFavorite).toHaveBeenCalledWith(favorite, true);
  });
});
