import type { ReactNode } from "react";
import {
  BODY_STYLE_LABELS, CAR_DB, CATEGORY_KIT_STYLES, CF_MATERIALS, PAINTS, RIM_COLORS, RIM_STYLES,
  SPOILER_LABELS, WING_MOUNTING_LABELS, getBodyStyleChoices, getHondaFactoryVariant, getHondaFactoryVariants, getValidMountings,
} from "../../../shared/catalog";
import { aeroOptions, normalizeAero, withVehicle } from "../../../shared/defaults";
import { PART_IDS, PART_LABELS, type BuildConfig } from "../../../shared/types";

function Field({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return (
    <div className="field">
      {id ? <label className="label" htmlFor={id}>{label}</label> : <span className="label">{label}</span>}
      {children}
    </div>
  );
}

export function BuildForm({ config, hasDrawings, disabled, onChange, onNext }: {
  config: BuildConfig;
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
            <select id="make" value={config.make} onChange={e => pickVehicle(e.target.value)}>
              {makes.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Model" id="model">
            <select id="model" value={config.model} onChange={e => pickVehicle(config.make, e.target.value)}>
              {models.map(m => <option key={m}>{m}</option>)}
            </select>
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
