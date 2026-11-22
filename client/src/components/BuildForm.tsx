import { useEffect, useState, type ReactNode } from "react";
import {
  BODY_STYLE_LABELS, CAR_DB, CATEGORY_KIT_STYLES, CF_MATERIALS, PAINTS, RIM_COLORS, RIM_STYLES,
  SPOILER_LABELS, WING_MOUNTING_LABELS, getBodyStyleChoices, getHondaFactoryVariant, getHondaFactoryVariants, getValidMountings,
} from "../../../shared/catalog";
import { aeroOptions, normalizeAero, withVehicle } from "../../../shared/defaults";
import { favoriteVehicleKey, PART_IDS, PART_LABELS, type BuildConfig, type FavoriteVehicle } from "../../../shared/types";

function Field({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return (
    <div className="field">
      {id ? <label className="label" htmlFor={id}>{label}</label> : <span className="label">{label}</span>}
      {children}
    </div>
  );
}

function filterOptions(options: string[], query: string) {
  const search = query.trim().toLocaleLowerCase();
  return search ? options.filter(option => option.toLocaleLowerCase().includes(search)) : options;
}

function SearchableSelector({ id, value, options, placeholder, onSelect }: {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (value: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const filteredOptions = filterOptions(options, query === value ? "" : query);

  useEffect(() => setQuery(value), [value]);

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    const selected = options.find(option => option.toLocaleLowerCase() === nextQuery.trim().toLocaleLowerCase());
    if (selected) onSelect(selected);
  };

  return (
    <>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        autoComplete="off"
        list={`${id}-options`}
        value={query}
        placeholder={placeholder}
        onChange={event => updateQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key !== "Enter") return;
          const matches = filterOptions(options, event.currentTarget.value);
          const alreadySelected = options.some(option =>
            option.toLocaleLowerCase() === event.currentTarget.value.trim().toLocaleLowerCase(),
          );
          if (!alreadySelected && matches.length === 1) {
            event.preventDefault();
            updateQuery(matches[0]!);
          }
        }}
        onBlur={() => setQuery(value)}
      />
      <datalist id={`${id}-options`}>
        {filteredOptions.map(option => <option key={option} value={option} />)}
      </datalist>
      {query !== value && filteredOptions.length === 0 && <span className="hint" role="status">No matches. Try another search.</span>}
    </>
  );
}

export function BuildForm({
  config, favorites, favoriteGroups, favoriteBackupReport, onToggleFavorite, onCreateFavoriteGroup,
  onExportFavorites, onImportFavorites, hasDrawings, disabled, onChange, onNext,
}: {
  config: BuildConfig;
  favorites: FavoriteVehicle[];
  favoriteGroups: string[];
  favoriteBackupReport: { kind: "success" | "error"; message: string; details?: string[] } | null;
  onToggleFavorite: (favorite: FavoriteVehicle, isFavorite: boolean) => Promise<void>;
  onCreateFavoriteGroup: (name: string) => Promise<string | null>;
  onExportFavorites: () => Promise<void>;
  onImportFavorites: (file: File) => Promise<void>;
  hasDrawings: boolean;
  disabled: boolean;
  onChange: (config: BuildConfig) => void;
  onNext: () => void;
}) {
  const makes = Object.keys(CAR_DB).sort();
  const models = Object.keys(CAR_DB[config.make] ?? {}).sort();
  const years = [...(CAR_DB[config.make]?.[config.model] ?? [config.year])].sort((a, b) => b - a);
  const selectedVariant = getHondaFactoryVariant(config.make, config.model, config.year, config.trim);
  const bodyChoices = selectedVariant
    ? { options: [selectedVariant.bodyStyle], default: selectedVariant.bodyStyle }
    : getBodyStyleChoices(config.make, config.model);
  const factoryVariants = getHondaFactoryVariants(config.make, config.model, config.year);
  const [selectedGroup, setSelectedGroup] = useState("Favorites");
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [favoriteBackupBusy, setFavoriteBackupBusy] = useState<"idle" | "exporting" | "importing">("idle");
  const currentFavorite: FavoriteVehicle = {
    make: config.make,
    model: config.model,
    year: config.year,
    ...(config.trim ? { trim: config.trim } : {}),
    groupName: selectedGroup,
  };
  const savedFavorite = favorites.find(favorite => favoriteVehicleKey(favorite) === favoriteVehicleKey(currentFavorite));
  const isFavorite = !!savedFavorite;
  const isInSelectedGroup = (favorite: FavoriteVehicle) => (favorite.groupName ?? "Favorites") === selectedGroup;
  const isFavoriteInSelectedGroup = !!savedFavorite && isInSelectedGroup(savedFavorite);
  const groupFavorites = favorites.filter(isInSelectedGroup);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const kits = CATEGORY_KIT_STYLES[config.category];
  const aero = aeroOptions(config);
  const rim = RIM_STYLES.find(r => r.id === config.rim.styleId) ?? RIM_STYLES[0]!;
  const set = (patch: Partial<BuildConfig>) => onChange(normalizeAero({ ...config, ...patch }));

  const pickVehicle = (make: string, model?: string) => {
    const nextModel = model ?? Object.keys(CAR_DB[make] ?? {}).sort()[0]!;
    const nextYears = CAR_DB[make]?.[nextModel] ?? [config.year];
    const year = nextYears.includes(config.year) ? config.year : nextYears[nextYears.length - 1]!;
    onChange(withVehicle(config, make, nextModel, year));
  };

  const pickFavorite = (favorite: FavoriteVehicle) => {
    onChange(withVehicle({ ...config, trim: favorite.trim }, favorite.make, favorite.model, favorite.year));
  };

  return (
    <section className="panel" aria-labelledby="build-heading">
      <h2 id="build-heading">Configure the build</h2>
      <p className="panel-intro">
        Pick the car and the kit. Nothing is generated here — the next step makes cheap line drawings you approve before any render is paid for.
      </p>
      {hasDrawings && (
        <div className="banner warn">
          This build already has drawings. Changing anything here means drawing it again before you can render or export.
        </div>
      )}

      <fieldset disabled={disabled} style={{ border: "none", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div className="grid">
          <Field label="Make" id="make">
            <SearchableSelector
              id="make"
              value={config.make}
              options={makes}
              placeholder="Search makes"
              onSelect={make => pickVehicle(make)}
            />
          </Field>
          <Field label="Model" id="model">
            <SearchableSelector
              id="model"
              value={config.model}
              options={models}
              placeholder="Search models"
              onSelect={model => pickVehicle(config.make, model)}
            />
          </Field>
          <Field label="Year" id="year">
            <select id="year" value={config.year} onChange={e => onChange(withVehicle(config, config.make, config.model, Number(e.target.value)))}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </Field>
          {factoryVariants.length > 0 && (
            <Field label="Factory variant" id="trim">
              <select
                id="trim"
                value={config.trim ?? ""}
                onChange={e => onChange(withVehicle({ ...config, trim: e.target.value || undefined }, config.make, config.model, config.year))}
              >
                <option value="">Standard / not specified</option>
                {factoryVariants.map(variant => <option key={variant.id} value={variant.id}>{variant.label}</option>)}
              </select>
            </Field>
          )}
          {bodyChoices.options.length > 1 && (
            <Field label="Body style" id="body">
              <select id="body" value={config.bodyStyle} onChange={e => set({ bodyStyle: e.target.value as BuildConfig["bodyStyle"] })}>
                {bodyChoices.options.map(b => <option key={b} value={b}>{BODY_STYLE_LABELS[b]}</option>)}
              </select>
            </Field>
          )}
        </div>

        <div className="grid">
          <Field label="Favorite group" id="favorite-group">
            <select id="favorite-group" value={selectedGroup} onChange={event => setSelectedGroup(event.target.value)}>
              {favoriteGroups.map(group => <option key={group} value={group}>{group}</option>)}
            </select>
          </Field>
          <div className="field">
            <label className="label" htmlFor="new-favorite-group">Create a favorite group</label>
            <div className="actions">
              <input
                id="new-favorite-group"
                type="text"
                maxLength={40}
                value={newGroupName}
                placeholder="e.g. Track cars"
                onChange={event => setNewGroupName(event.target.value)}
              />
              <button
                type="button"
                className="btn"
                disabled={!newGroupName.trim() || creatingGroup}
                onClick={async () => {
                  setCreatingGroup(true);
                  try {
                    const created = await onCreateFavoriteGroup(newGroupName);
                    if (created) {
                      setSelectedGroup(created);
                      setNewGroupName("");
                    }
                  } finally {
                    setCreatingGroup(false);
                  }
                }}
              >
                {creatingGroup ? "Creating…" : "Create group"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid">
          <Field label="Export saved vehicles">
            <button
              type="button"
              className="btn"
              disabled={favoriteBackupBusy !== "idle"}
              onClick={async () => {
                setFavoriteBackupBusy("exporting");
                try {
                  await onExportFavorites();
                } finally {
                  setFavoriteBackupBusy("idle");
                }
              }}
            >
              {favoriteBackupBusy === "exporting" ? "Preparing backup…" : "Download JSON backup"}
            </button>
          </Field>
          <Field label="Import saved vehicles" id="favorite-backup-file">
            <input
              id="favorite-backup-file"
              type="file"
              accept=".json,application/json"
              disabled={favoriteBackupBusy !== "idle"}
              onChange={async event => {
                const input = event.currentTarget;
                const file = input.files?.[0];
                if (!file) return;
                setFavoriteBackupBusy("importing");
                try {
                  await onImportFavorites(file);
                } finally {
                  setFavoriteBackupBusy("idle");
                  input.value = "";
                }
              }}
            />
          </Field>
        </div>
        {favoriteBackupBusy === "importing" && <p className="hint" role="status">Validating and importing backup…</p>}
        {favoriteBackupReport?.kind === "success" && <p className="hint" role="status">{favoriteBackupReport.message}</p>}
        {favoriteBackupReport?.kind === "error" && (
          <div className="banner error" role="alert">
            <p>{favoriteBackupReport.message}</p>
            {favoriteBackupReport.details && (
              <ul>{favoriteBackupReport.details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul>
            )}
          </div>
        )}

        <div className="grid">
          <Field label="Saved vehicles" id="favorite-vehicle">
            <select
              id="favorite-vehicle"
              defaultValue=""
              onChange={event => {
                const favorite = groupFavorites.find(item => favoriteVehicleKey(item) === event.target.value);
                if (favorite) pickFavorite(favorite);
                event.currentTarget.value = "";
              }}
            >
              <option value="">Choose a vehicle in {selectedGroup}</option>
              {groupFavorites.map(favorite => {
                const variantLabel = favorite.trim
                  ? getHondaFactoryVariant(favorite.make, favorite.model, favorite.year, favorite.trim)?.label ?? favorite.trim
                  : null;
                return (
                  <option key={favoriteVehicleKey(favorite)} value={favoriteVehicleKey(favorite)}>
                    {favorite.year} {favorite.make} {favorite.model}{variantLabel ? ` — ${variantLabel}` : ""}
                  </option>
                );
              })}
            </select>
          </Field>
          <div className="field">
            <span className="label">Current vehicle</span>
            <button
              type="button"
              className={`btn${isFavoriteInSelectedGroup ? " ok" : ""}`}
              aria-pressed={isFavoriteInSelectedGroup}
              disabled={savingFavorite}
              onClick={async () => {
                setSavingFavorite(true);
                try {
                  await onToggleFavorite(currentFavorite, isFavorite);
                } finally {
                  setSavingFavorite(false);
                }
              }}
            >
              {savingFavorite
                ? "Saving…"
                : isFavoriteInSelectedGroup
                  ? `★ Saved in ${selectedGroup}`
                  : isFavorite
                    ? `Move to ${selectedGroup}`
                    : `☆ Save to ${selectedGroup}`}
            </button>
          </div>
        </div>

        <Field label="Kit style">
          <div className="chips">
            {kits.map(k => (
              <button
                key={k.id} type="button" className="chip" title={k.desc}
                aria-pressed={config.kitStyleId === k.id}
                onClick={() => set({ kitStyleId: k.id, kitStyleLabel: k.label.replace(/^✦\s*/, "") })}
              >{k.label}</button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 6 }}>{kits.find(k => k.id === config.kitStyleId)?.desc}</p>
        </Field>

        <Field label="Body setup">
          <div className="chips" role="group" aria-label="Body setup">
            <button type="button" className="chip" aria-pressed={!config.wideBody} onClick={() => set({ wideBody: false })}>
              Normal body
            </button>
            <button type="button" className="chip" aria-pressed={config.wideBody} onClick={() => set({ wideBody: true })}>
              Wide body
            </button>
          </div>
          <p className="hint" style={{ marginTop: 6 }}>
            {config.wideBody
              ? "Flared wheel-arch extensions on all four corners, with the wider track drawn into every view."
              : "Factory wheel arches and body width — the kit fits the standard body."}
          </p>
        </Field>

        <Field label="Kit parts — include and finish">
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {PART_IDS.map(id => {
              const part = config.parts[id];
              const update = (patch: Partial<typeof part>) => set({ parts: { ...config.parts, [id]: { ...part, ...patch } } });
              return (
                <div className="part-row" key={id}>
                  <label>
                    <input type="checkbox" checked={part.included} onChange={e => update({ included: e.target.checked })} />
                    {PART_LABELS[id]}
                  </label>
                  <div className="toggle" role="group" aria-label={`${PART_LABELS[id]} finish`}>
                    <button type="button" aria-pressed={part.finish === "carbon"} disabled={!part.included} onClick={() => update({ finish: "carbon" })}>Carbon</button>
                    <button type="button" aria-pressed={part.finish === "body"} disabled={!part.included} onClick={() => update({ finish: "body" })}>Body colour</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Field>

        <div className="grid">
          <Field label="Carbon material" id="carbon">
            <select id="carbon" value={config.carbonMaterialId} onChange={e => set({ carbonMaterialId: e.target.value })}>
              {CF_MATERIALS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Field>
        </div>

        {config.parts.wing.included && (
          <Field label={aero.locked ? "Rear aero — fixed by this kit" : "Rear aero"}>
            <div className="chips">
              {aero.options.map(type => (
                <button key={type} type="button" className="chip" aria-pressed={config.rearAero === type} onClick={() => set({ rearAero: type })}>
                  {SPOILER_LABELS[type]}
                </button>
              ))}
            </div>
            {config.rearAero === "gt-wing" && (
              <div className="chips" style={{ marginTop: 8 }}>
                {getValidMountings("gt-wing").map(m => (
                  <button key={m} type="button" className="chip" aria-pressed={config.wingMounting === m} onClick={() => set({ wingMounting: m })}>
                    {WING_MOUNTING_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          </Field>
        )}

        <Field label="Paint">
          <div className="chips">
            {PAINTS.map(p => (
              <button
                key={p.name} type="button" className="chip"
                aria-pressed={config.paint.name === p.name}
                onClick={() => set({ paint: { name: p.name, hex: p.hex, ...(p.hex2 ? { hex2: p.hex2 } : {}), ...(p.shiftLabel ? { shiftLabel: p.shiftLabel } : {}) } })}
              >
                <span className="swatch" style={{ background: p.hex2 ? `linear-gradient(135deg, ${p.hex}, ${p.hex2})` : p.hex }} />
                {p.name}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid">
          <Field label="Wheel design" id="rim">
            <select id="rim" value={rim.id} onChange={e => {
              const next = RIM_STYLES.find(r => r.id === e.target.value)!;
              set({ rim: { ...config.rim, styleId: next.id, styleName: next.name, size: next.sizes.includes(config.rim.size) ? config.rim.size : next.sizes[0]! } });
            }}>
              {RIM_STYLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Wheel size" id="rim-size">
            <select id="rim-size" value={config.rim.size} onChange={e => set({ rim: { ...config.rim, size: e.target.value } })}>
              {rim.sizes.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Wheel colour">
            <div className="chips">
              {RIM_COLORS.map(c => (
                <button key={c.name} type="button" className="chip" aria-pressed={config.rim.colorName === c.name}
                  onClick={() => set({ rim: { ...config.rim, colorName: c.name, colorHex: c.hex } })}>
                  <span className="swatch" style={{ background: c.hex }} />{c.name}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </fieldset>

      <div className="actions">
        <button className="btn primary" onClick={onNext}>Next: drawings →</button>
      </div>
    </section>
  );
}
