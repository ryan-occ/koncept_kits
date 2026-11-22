import { useCallback, useEffect, useRef, useState } from "react";
import { favoriteVehicleKey, type BuildConfig, type BuildDto, type BuildSummaryDto, type FavoriteVehicle, type UsageDto } from "../../shared/types";
import { defaultBuildName, defaultConfig, syncBuildNameWithVehicle } from "../../shared/defaults";
import { api } from "./api";
import { Sidebar } from "./components/Sidebar";
import { BuildForm } from "./components/BuildForm";
import { DrawingsStep } from "./components/DrawingsStep";
import { RendersStep } from "./components/RendersStep";
import { ExportStep } from "./components/ExportStep";

export type Step = "build" | "drawings" | "renders" | "export";
const STEPS: Array<{ id: Step; label: string }> = [
  { id: "build", label: "Build" },
  { id: "drawings", label: "Drawings" },
  { id: "renders", label: "Renders" },
  { id: "export", label: "Export" },
];

export function approvedAndCurrent(build: BuildDto | null): boolean {
  return !!build?.drawingSet && build.drawingSet.status === "approved" && !build.drawingSet.stale;
}

function initialStep(build: BuildDto): Step {
  if (approvedAndCurrent(build)) return "renders";
  if (build.drawingSet) return "drawings";
  return "build";
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function App() {
  const [builds, setBuilds] = useState<BuildSummaryDto[] | null>(null);
  const [build, setBuild] = useState<BuildDto | null>(null);
  const [step, setStep] = useState<Step>("build");
  const [usage, setUsage] = useState<UsageDto | null>(null);
  const [favoriteVehicles, setFavoriteVehicles] = useState<FavoriteVehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"idle" | "pending" | "saving" | "saved">("idle");
  const pendingPatch = useRef<{ name?: string; config?: BuildConfig } | null>(null);
  const saveTimer = useRef<number | null>(null);

  const refreshList = useCallback(async () => {
    const [list, u] = await Promise.all([api.listBuilds(), api.usage()]);
    setBuilds(list);
    setUsage(u);
    return list;
  }, []);

  const open = useCallback(async (id: number) => {
    setError(null);
    try {
      const next = await api.getBuild(id);
      setBuild(next);
      setStep(initialStep(next));
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    refreshList()
      .then(list => { if (list[0]) void open(list[0].id); })
      .catch(e => { setBuilds([]); setError(errorText(e)); });
  }, [refreshList, open]);

  useEffect(() => {
    api.listFavoriteVehicles()
      .then(setFavoriteVehicles)
      .catch(e => setError(errorText(e)));
  }, []);

  const toggleFavoriteVehicle = async (favorite: FavoriteVehicle, isFavorite: boolean) => {
    setError(null);
    try {
      if (isFavorite) {
        await api.deleteFavoriteVehicle(favorite);
        const key = favoriteVehicleKey(favorite);
        setFavoriteVehicles(current => current.filter(item => favoriteVehicleKey(item) !== key));
      } else {
        const saved = await api.saveFavoriteVehicle(favorite);
        setFavoriteVehicles(current => current.some(item => favoriteVehicleKey(item) === favoriteVehicleKey(saved))
          ? current
          : [...current, saved].sort((a, b) => `${a.make} ${a.model} ${a.year}`.localeCompare(`${b.make} ${b.model} ${b.year}`)));
      }
    } catch (e) {
      setError(errorText(e));
    }
  };

  // Save edits shortly after the user stops changing things; actions flush first.
  const flush = useCallback(async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const patch = pendingPatch.current;
    if (!patch || !build) return build;
    pendingPatch.current = null;
    setSaving("saving");
    try {
      const next = await api.updateBuild(build.id, patch);
      // Keep anything typed while the save was in flight; take the server's derived state (stale flags etc.).
      setBuild(current => {
        if (!current || current.id !== next.id) return current;
        return pendingPatch.current ? { ...next, name: current.name, config: current.config } : next;
      });
      setSaving("saved");
      void refreshList();
      return next;
    } catch (e) {
      setSaving("idle");
      setError(errorText(e));
      throw e;
    }
  }, [build, refreshList]);

  const queueSave = (patch: { name?: string; config?: BuildConfig }) => {
    if (!build) return;
    const name = patch.name !== undefined
      ? patch.name
      : patch.config
        ? syncBuildNameWithVehicle(build.name, build.config, patch.config)
        : build.name;
    const nextPatch = name !== build.name ? { ...patch, name } : patch;
    pendingPatch.current = { ...pendingPatch.current, ...nextPatch };
    setBuild({ ...build, ...nextPatch } as BuildDto);
    setSaving("pending");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void flush().catch(() => {}); }, 600);
  };

  // While a drawing or render job runs, poll the build so tiles fill in as they finish.
  const jobRunning = !!build?.job && !build.job.done;
  useEffect(() => {
    if (!jobRunning || !build) return;
    const id = build.id;
    const timer = window.setInterval(async () => {
      try {
        const next = await api.getBuild(id);
        setBuild(current => (current?.id === id ? next : current));
        if (!next.job || next.job.done) void refreshList();
      } catch (e) {
        setError(errorText(e));
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [jobRunning, build?.id, refreshList]);

  /** Runs an action after saving pending edits; shows its error in the banner. */
  const act = async (fn: (id: number) => Promise<BuildDto>) => {
    if (!build) return;
    setError(null);
    try {
      await flush();
      const next = await fn(build.id);
      setBuild(next);
      void refreshList();
      return next;
    } catch (e) {
      setError(errorText(e));
      return undefined;
    }
  };

  const newBuild = async () => {
    setError(null);
    try {
      await flush();
      const config = defaultConfig();
      const created = await api.createBuild(defaultBuildName(config), config);
      await refreshList();
      setBuild(created);
      setStep("build");
    } catch (e) {
      setError(errorText(e));
    }
  };

  const deleteBuild = async () => {
    if (!build || !window.confirm(`Delete "${build.name}" with its drawings and renders? This can't be undone.`)) return;
    try {
      await api.deleteBuild(build.id);
      pendingPatch.current = null;
      setBuild(null);
      const list = await refreshList();
      if (list[0]) void open(list[0].id);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const stepEnabled = (id: Step) => id === "build" || id === "drawings" || approvedAndCurrent(build);
  const stepDone = (id: Step) =>
    (id === "build" && !!build?.drawingSet) ||
    (id === "drawings" && approvedAndCurrent(build)) ||
    (id === "renders" && approvedAndCurrent(build) && !!build?.renders.some(r => r.current));

  return (
    <div className="app">
      <Sidebar
        builds={builds}
        selectedId={build?.id ?? null}
        usage={usage}
        onSelect={async id => { await flush().catch(() => {}); void open(id); }}
        onNew={newBuild}
      />
      <main className="main">
        {!build ? (
          <div className="empty">
            <h1>Draw it first, render it once</h1>
            <p className="panel-intro">
              Configure a car and kit, approve low-cost technical drawings, then make photoreal renders from the approved drawings.
            </p>
            {error && <div className="banner error" role="alert">{error}</div>}
            <button className="btn primary" onClick={newBuild} disabled={builds === null}>New build</button>
          </div>
        ) : (
          <div className="main-inner">
            <div className="topbar">
              <input
                className="name-input"
                aria-label="Build name"
                value={build.name}
                maxLength={80}
                onChange={e => queueSave({ name: e.target.value })}
                onBlur={() => { if (!build.name.trim()) queueSave({ name: defaultBuildName(build.config) }); }}
              />
              <span className="save-state" aria-live="polite">
                {saving === "pending" || saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}
              </span>
              <button className="btn danger" onClick={deleteBuild} disabled={jobRunning}>Delete</button>
            </div>

            <nav aria-label="Build steps">
              <ol className="stepper">
                {STEPS.map((s, i) => (
                  <li key={s.id}>
                    <button
                      className={`step${stepDone(s.id) ? " done" : ""}`}
                      aria-current={step === s.id ? "step" : undefined}
                      disabled={!stepEnabled(s.id)}
                      title={stepEnabled(s.id) ? undefined : "Approve the drawings first"}
                      onClick={() => setStep(s.id)}
                    >
                      <span className="step-dot">{stepDone(s.id) ? "✓" : i + 1}</span>
                      {s.label}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            {error && <div className="banner error" role="alert">{error}</div>}

            {step === "build" && (
              <BuildForm
                config={build.config}
                favorites={favoriteVehicles}
                onToggleFavorite={toggleFavoriteVehicle}
                hasDrawings={!!build.drawingSet}
                disabled={jobRunning}
                onChange={config => queueSave({ config })}
                onNext={() => setStep("drawings")}
              />
            )}
            {step === "drawings" && (
              <DrawingsStep
                build={build}
                usage={usage}
                onGenerate={() => act(api.generateDrawings)}
                onRedraw={(views, notes) => act(id => api.redraw(id, views, notes))}
                onApprove={async () => { const next = await act(api.approve); if (next) setStep("renders"); }}
                onReopen={() => act(api.reopen)}
                onEditBuild={() => setStep("build")}
              />
            )}
            {step === "renders" && (
              <RendersStep
                build={build}
                onRender={angles => act(id => api.render(id, angles))}
                onNext={() => setStep("export")}
              />
            )}
            {step === "export" && (
              <ExportStep build={build} onError={setError} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
