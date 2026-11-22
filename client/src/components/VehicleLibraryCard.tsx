import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import {
  VEHICLE_PHOTO_VIEWS, VEHICLE_PHOTO_VIEW_LABELS,
  type VehicleCatalogDto, type VehiclePhotoView, type VehicleProfileDto, type VehicleProfileEdit, type VehicleRef,
} from "../../../shared/vehicles";

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const DIMENSIONS = [
  ["lengthMm", "Length"], ["widthMm", "Width"], ["heightMm", "Height"], ["wheelbaseMm", "Wheelbase"],
] as const;

function dateText(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "never";
}

/** Profile for the selected car: research, review, verify, photos. Drawings only use verified profiles. */
export function VehicleLibraryCard({ car, aiMode, catalog, disabled, onCatalogChange, onPickCar }: {
  car: VehicleRef;
  aiMode: "live" | "mock" | null;
  catalog: VehicleCatalogDto | null;
  disabled: boolean;
  onCatalogChange: (catalog: VehicleCatalogDto) => void;
  onPickCar: (car: VehicleRef) => void;
}) {
  const [profile, setProfile] = useState<VehicleProfileDto | null | undefined>(undefined);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VehicleProfileEdit | null>(null);
  const [cuesText, setCuesText] = useState("");
  const [photoView, setPhotoView] = useState<VehiclePhotoView>("side");
  const [adding, setAdding] = useState(false);
  const [newCar, setNewCar] = useState({ make: "", model: "", year: String(new Date().getFullYear()) });

  const load = useCallback(async () => {
    try {
      setProfile(await api.vehicleProfile(car));
    } catch (e) {
      setError(errorText(e));
    }
  }, [car.make, car.model, car.year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setProfile(undefined);
    setEditing(null);
    setError(null);
    void load();
  }, [load]);

  // Poll while research runs in the background.
  const researching = profile?.research.state === "running";
  useEffect(() => {
    if (!researching) return;
    const timer = window.setInterval(() => { void load(); }, 3000);
    return () => window.clearInterval(timer);
  }, [researching, load]);

  const run = async (label: string, work: () => Promise<VehicleProfileDto | null | void>) => {
    setBusy(label);
    setError(null);
    try {
      const next = await work();
      if (next !== undefined) setProfile(next);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (p: VehicleProfileDto) => {
    setEditing({
      yearFrom: p.yearFrom, yearTo: p.yearTo, generation: p.generation, dimensions: { ...p.dimensions },
      signatureCues: p.signatureCues, faceliftNotes: p.faceliftNotes,
    });
    setCuesText(p.signatureCues.join("\n"));
  };

  const saveEdit = (p: VehicleProfileDto, edit: VehicleProfileEdit) => run("save", async () => {
    const signatureCues = cuesText.split("\n").map(line => line.trim()).filter(Boolean).slice(0, 8);
    const next = await api.editVehicleProfile(p.id, { ...edit, signatureCues });
    setEditing(null);
    return next;
  });

  const addCar = async () => {
    const year = Number(newCar.year);
    if (!newCar.make.trim() || !newCar.model.trim() || !Number.isInteger(year)) {
      setError("Enter a make, a model and a four-digit year.");
      return;
    }
    setBusy("add");
    setError(null);
    try {
      const added = await api.addVehicle({ make: newCar.make, model: newCar.model, year });
      onCatalogChange(await api.vehicleCatalog());
      setAdding(false);
      setNewCar({ make: "", model: "", year: newCar.year });
      onPickCar(added.car);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const checkNewModels = async () => {
    setBusy("sync");
    setError(null);
    try {
      onCatalogChange(await api.checkNewModels());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  };

  const syncing = catalog?.sync.state === "running";
  useEffect(() => {
    if (!syncing) return;
    const timer = window.setInterval(() => { void api.vehicleCatalog().then(onCatalogChange).catch(() => {}); }, 5000);
    return () => window.clearInterval(timer);
  }, [syncing, onCatalogChange]);

  const carName = `${car.year} ${car.make} ${car.model}`;
  const p = profile;
  const locked = disabled || busy !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} aria-labelledby="vehicle-profile-heading">
      <h3 className="label" id="vehicle-profile-heading" style={{ marginBottom: 0 }}>Vehicle profile</h3>

      {error && <div className="banner error" role="alert">{error}</div>}

      {p === undefined && <p className="hint" role="status">Checking the vehicle library…</p>}

      {p === null && (
        <div className="part-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
          <p className="hint" style={{ flex: "1 1 280px" }}>
            No saved profile for the {carName} yet. Research it to add its generation, size and design details. Drawings use a profile only after you verify it.
            {aiMode === "mock" && " Mock mode: research makes an empty draft you can fill in yourself."}
          </p>
          <button type="button" className="btn primary" disabled={locked} onClick={() => run("research", () => api.researchVehicle(car))}>
            {busy === "research" ? "Starting…" : "Research this car"}
          </button>
        </div>
      )}

      {p && (
        <div className="part-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "var(--space-3)" }}>
          <div className="actions" style={{ justifyContent: "space-between" }}>
            <span className="actions">
              <span className="tile-title">{p.make} {p.model}{p.generation ? ` · ${p.generation}` : ""} · {p.yearFrom}–{p.yearTo}</span>
              {researching ? <span className="badge"><span className="spinner" style={{ display: "inline-block", verticalAlign: "-1px" }} /> Researching</span>
                : p.status === "verified" ? <span className="badge ok">Verified</span>
                : <span className="badge warn">Needs review</span>}
              {p.stale && <span className="badge warn">Over a year old</span>}
            </span>
            {!editing && !researching && (
              <span className="actions">
                {p.status === "researched" && (
                  <button type="button" className="btn ok" disabled={locked} onClick={() => run("verify", () => api.verifyVehicleProfile(p.id))}>
                    {busy === "verify" ? "Verifying…" : "Verify"}
                  </button>
                )}
                <button type="button" className="btn" disabled={locked} onClick={() => startEdit(p)}>Edit</button>
                <button type="button" className="btn" disabled={locked} onClick={() => run("refresh", () => api.refreshVehicleProfile(p.id))}>
                  {busy === "refresh" ? "Starting…" : "Research again"}
                </button>
                <button
                  type="button" className="btn danger" disabled={locked}
                  onClick={() => {
                    if (!window.confirm(`Delete the saved profile and photos for the ${p.make} ${p.model} (${p.yearFrom}–${p.yearTo})? This can't be undone.`)) return;
                    void run("delete", async () => { await api.deleteVehicleProfile(p.id); return null; });
                  }}
                >
                  Delete
                </button>
              </span>
            )}
          </div>

          {p.research.state === "failed" && (
            <div className="banner error" role="alert">Research failed: {p.research.error}. Try “Research again”, or fill the details in with Edit.</div>
          )}
          {p.status === "researched" && !researching && p.research.state !== "failed" && (
            <p className="hint">Check these details against the real car, correct anything with Edit, then verify. Until then, drawings ignore this profile.</p>
          )}

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div className="grid">
                <div className="field">
                  <label className="label" htmlFor="vp-generation">Generation</label>
                  <input id="vp-generation" type="text" maxLength={80} value={editing.generation ?? ""} placeholder="e.g. G82"
                    onChange={e => setEditing({ ...editing, generation: e.target.value || null })} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="vp-from">First model year</label>
                  <input id="vp-from" type="text" inputMode="numeric" value={editing.yearFrom}
                    onChange={e => setEditing({ ...editing, yearFrom: Number(e.target.value) || 0 })} />
                </div>
                <div className="field">
                  <label className="label" htmlFor="vp-to">Last model year</label>
                  <input id="vp-to" type="text" inputMode="numeric" value={editing.yearTo}
                    onChange={e => setEditing({ ...editing, yearTo: Number(e.target.value) || 0 })} />
                </div>
                {DIMENSIONS.map(([key, label]) => (
                  <div className="field" key={key}>
                    <label className="label" htmlFor={`vp-${key}`}>{label} (mm)</label>
                    <input id={`vp-${key}`} type="text" inputMode="numeric" value={editing.dimensions[key] ?? ""} placeholder="Unknown"
                      onChange={e => setEditing({ ...editing, dimensions: { ...editing.dimensions, [key]: e.target.value ? Number(e.target.value) || null : null } })} />
                  </div>
                ))}
              </div>
              <div className="field">
                <label className="label" htmlFor="vp-cues">Design details (one per line, up to 8)</label>
                <textarea id="vp-cues" value={cuesText} onChange={e => setCuesText(e.target.value)} placeholder="e.g. tall vertical twin-kidney grille" />
              </div>
              <div className="field">
                <label className="label" htmlFor="vp-facelift">Model-year changes</label>
                <textarea id="vp-facelift" maxLength={1000} value={editing.faceliftNotes ?? ""} placeholder="e.g. 2025 facelift: slimmer headlights, new rear bumper"
                  onChange={e => setEditing({ ...editing, faceliftNotes: e.target.value || null })} />
              </div>
              <div className="actions">
                <button type="button" className="btn primary" disabled={locked} onClick={() => saveEdit(p, editing)}>{busy === "save" ? "Saving…" : "Save changes"}</button>
                <button type="button" className="btn" disabled={locked} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : !researching && (
            <>
              <p className="hint">
                {DIMENSIONS.map(([key, label]) => `${label} ${p.dimensions[key] ? `${p.dimensions[key]!.toLocaleString()} mm` : "unknown"}`).join(" · ")}
              </p>
              {p.signatureCues.length > 0 ? (
                <ul className="export-list" style={{ listStyle: "disc", paddingLeft: "var(--space-4)" }}>
                  {p.signatureCues.map(cue => <li key={cue}>{cue}</li>)}
                </ul>
              ) : <p className="hint">No design details yet.</p>}
              {p.faceliftNotes && <p className="hint">Model-year changes: {p.faceliftNotes}</p>}
              <p className="hint">
                {p.sources.length > 0 ? (
                  <>Sources: {p.sources.map((s, i) => (
                    <span key={s.url}>{i > 0 && ", "}<a href={s.url} target="_blank" rel="noreferrer noopener" style={{ color: "var(--text-muted)" }}>{s.title}</a></span>
                  ))}. </>
                ) : "No sources. "}
                Checked {dateText(p.checkedAt)}.
              </p>
            </>
          )}

          {!researching && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span className="label" style={{ marginBottom: 0 }}>Reference photos of the stock car</span>
              {p.photos.length > 0 && (
                <div className="actions">
                  {p.photos.map(photo => (
                    <figure key={photo.id} className="tile" style={{ width: 140 }}>
                      <div className="tile-media"><img src={photo.url} alt={`${VEHICLE_PHOTO_VIEW_LABELS[photo.view]} photo of the ${p.make} ${p.model}`} /></div>
                      <figcaption className="tile-foot">
                        <span className="hint">{VEHICLE_PHOTO_VIEW_LABELS[photo.view]}</span>
                        <button type="button" className="btn danger" style={{ padding: "4px 10px" }} disabled={locked}
                          onClick={() => run("photo", async () => { await api.deleteVehiclePhoto(photo.id); return api.vehicleProfile(car); })}>
                          Remove
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <div className="actions">
                <select aria-label="Photo view" value={photoView} onChange={e => setPhotoView(e.target.value as VehiclePhotoView)}
                  style={{ background: "var(--bg)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-control)", padding: "6px 8px" }}>
                  {VEHICLE_PHOTO_VIEWS.map(v => <option key={v} value={v}>{VEHICLE_PHOTO_VIEW_LABELS[v]}</option>)}
                </select>
                <label className="btn" aria-disabled={locked} style={locked ? { opacity: 0.45, cursor: "not-allowed" } : undefined}>
                  {busy === "photo" ? "Uploading…" : "Add photo"}
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={locked}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void run("photo", () => api.addVehiclePhoto(p.id, photoView, file));
                    }}
                  />
                </label>
              </div>
              <p className="hint">A clear photo of the factory car is the strongest way to get an unusual car right. PNG, JPEG or WebP, up to 10 MB.</p>
            </div>
          )}
        </div>
      )}

      <div className="actions" style={{ justifyContent: "space-between" }}>
        {adding ? (
          <div className="actions" style={{ alignItems: "flex-end" }}>
            <div className="field">
              <label className="label" htmlFor="new-car-make">Make</label>
              <input id="new-car-make" type="text" maxLength={60} value={newCar.make} placeholder="e.g. Honda" onChange={e => setNewCar({ ...newCar, make: e.target.value })} />
            </div>
            <div className="field">
              <label className="label" htmlFor="new-car-model">Model</label>
              <input id="new-car-model" type="text" maxLength={80} value={newCar.model} placeholder="e.g. Prelude" onChange={e => setNewCar({ ...newCar, model: e.target.value })} />
            </div>
            <div className="field" style={{ width: 90 }}>
              <label className="label" htmlFor="new-car-year">Year</label>
              <input id="new-car-year" type="text" inputMode="numeric" maxLength={4} value={newCar.year} onChange={e => setNewCar({ ...newCar, year: e.target.value })} />
            </div>
            <button type="button" className="btn primary" disabled={locked} onClick={addCar}>{busy === "add" ? "Adding…" : "Add and research"}</button>
            <button type="button" className="btn" disabled={locked} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className="btn" disabled={locked} onClick={() => setAdding(true)}>Add a car not in the list</button>
        )}
        <span className="actions">
          <span className="hint" role="status">
            {syncing ? "Checking NHTSA for new model years (about 5 minutes)…"
              : `New US model years last checked ${dateText(catalog?.sync.lastRunAt ?? null)}${catalog?.sync.lastAdded != null ? `, ${catalog.sync.lastAdded} added` : ""}.`
                + (catalog?.sync.lastError ? ` Some lookups failed: ${catalog.sync.lastError}` : "")}
          </span>
          <button type="button" className="btn" disabled={locked || syncing || !catalog} onClick={checkNewModels}>Check now</button>
        </span>
      </div>
    </div>
  );
}
