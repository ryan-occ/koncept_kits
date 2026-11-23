import { useState } from "react";
import {
  DRAWING_VIEWS, DRAWING_VIEW_LABELS, PART_IDS, PART_LABELS, PART_SHEET_VIEWS, partKey,
  type BuildDto, type DrawingKey, type UsageDto,
} from "../../../shared/types";

const mm = (n: number) => n.toLocaleString("en-GB");

function keyLabel(key: string): string {
  if (key.startsWith("part:")) return `${PART_LABELS[key.slice(5) as keyof typeof PART_LABELS] ?? key} close-up`;
  return DRAWING_VIEW_LABELS[key as keyof typeof DRAWING_VIEW_LABELS] ?? key;
}

export function DrawingsStep({ build, usage, onGenerate, onRedraw, onApprove, onReopen, onEditBuild }: {
  build: BuildDto;
  usage: UsageDto | null;
  onGenerate: () => Promise<unknown>;
  onRedraw: (views: DrawingKey[], notes: string) => Promise<unknown>;
  onApprove: () => Promise<unknown>;
  onReopen: () => Promise<unknown>;
  onEditBuild: () => void;
}) {
  const [selected, setSelected] = useState<DrawingKey[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const set = build.drawingSet;
  const job = build.job && (build.job.kind === "drawings" || build.job.kind === "redraw") ? build.job : null;
  const running = !!build.job && !build.job.done;
  const approved = set?.status === "approved";
  const parts = PART_IDS.filter(id => build.config.parts[id].included);
  const complete = !!set && DRAWING_VIEWS.every(v => set.drawings.some(d => d.view === v))
    && parts.every(p => set.parts.some(s => s.partId === p));
  const imageCount = DRAWING_VIEWS.length + parts.length;
  const quality = usage?.drawingQuality ?? "high";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  const generate = () => {
    if (set && !window.confirm("Generate a fresh set of drawings? This replaces the current drawings and any renders made from them.")) return;
    void run(async () => { await onGenerate(); setSelected([]); setNotes(""); });
  };
  const toggle = (view: DrawingKey) =>
    setSelected(current => (current.includes(view) ? current.filter(v => v !== view) : [...current, view]));

  if (!set) {
    return (
      <section className="panel" aria-labelledby="drawings-heading">
        <h2 id="drawings-heading">Technical drawings</h2>
        <p className="panel-intro">
          Four orthographic line drawings of the whole car — side, front, rear and top — then a close-up of each kit part ({parts.length}) on a measured sheet.
          All are made at <strong>{quality}</strong> image quality{quality === "low" ? ", so the whole set costs a fraction of one render" : ""}. The side view is drawn first and everything else is matched to it.
          Review them, ask for changes, and approve before rendering.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={generate} disabled={busy || running}>
            {busy ? <span className="spinner" /> : null} Generate drawings · {imageCount} images
          </button>
          <button className="btn" onClick={onEditBuild}>← Back to build</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" aria-labelledby="drawings-heading">
      <h2 id="drawings-heading">Technical drawings</h2>

      {set.stale && (
        <div className="banner warn">
          The build changed after these drawings were made, so they can't be approved or rendered. Generate new drawings for the updated build.
        </div>
      )}
      {approved && !set.stale && (
        <div className="banner ok">
          Approved {set.approvedAt ? new Date(set.approvedAt).toLocaleString() : ""}. Renders and export are unlocked and will follow these drawings.
        </div>
      )}
      {!approved && !set.stale && (
        <p className="panel-intro">
          Check each view looks like the real {build.config.make} {build.config.model} with the right kit. Tick the views that need changes, describe them, and redraw — or approve when they're right.
        </p>
      )}
      {job?.done && job.failed.length > 0 && (
        <div className="banner error" role="alert">
          {job.failed.map(f => `${keyLabel(f.item)}: ${f.error}`).join(" · ")}
        </div>
      )}

      <div className="tiles">
        {DRAWING_VIEWS.map(view => {
          const drawing = set.drawings.find(d => d.view === view);
          const pending = !!job && !job.done && job.pending.includes(view);
          const failed = job?.done ? job.failed.find(f => f.item === view) : undefined;
          return (
            <figure className="tile" key={view}>
              <div className="tile-media paper">
                {pending ? (
                  <span className="placeholder"><span className="spinner" /> Drawing {view}…</span>
                ) : drawing ? (
                  <a href={drawing.url} target="_blank" rel="noreferrer" title="Open full size">
                    <img src={drawing.url} alt={`${DRAWING_VIEW_LABELS[view]} line drawing`} />
                  </a>
                ) : (
                  <span className="placeholder">{failed ? "Not drawn" : "Waiting"}</span>
                )}
              </div>
              <figcaption className="tile-foot">
                <span className="tile-title">{DRAWING_VIEW_LABELS[view]}</span>
                <span className="actions">
                  {drawing && drawing.revision > 1 && <span className="badge">Rev {drawing.revision}</span>}
                  {!approved && !set.stale && (
                    <label className="check">
                      <input type="checkbox" checked={selected.includes(view)} onChange={() => toggle(view)} disabled={running} />
                      Redraw
                    </label>
                  )}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <h3 className="label" style={{ marginTop: "var(--space-2)" }}>Kit part sheets — close-up with measurements</h3>
      {parts.length === 0 ? (
        <p className="hint">No kit parts are included in this build.</p>
      ) : (
        <div className="tiles">
          {parts.map(partId => {
            const key = partKey(partId);
            const sheet = set.parts.find(p => p.partId === partId);
            const pending = !!job && !job.done && job.pending.includes(key);
            const failed = job?.done ? job.failed.find(f => f.item === key) : undefined;
            const axes = PART_SHEET_VIEWS[partId];
            return (
              <figure className="tile" key={key}>
                <div className="tile-media paper" style={{ aspectRatio: "1600 / 1131" }}>
                  {pending ? (
                    <span className="placeholder"><span className="spinner" /> Drawing part…</span>
                  ) : sheet ? (
                    <a href={sheet.sheetUrl} target="_blank" rel="noreferrer" title="Open the measured sheet full size">
                      <img src={sheet.sheetUrl} alt={`${PART_LABELS[partId]} measured sheet`} />
                    </a>
                  ) : (
                    <span className="placeholder">{failed ? "Not drawn" : "Waiting"}</span>
                  )}
                </div>
                <figcaption className="tile-foot">
                  <span style={{ minWidth: 0 }}>
                    <span className="tile-title" style={{ display: "block" }}>{PART_LABELS[partId]}</span>
                    {sheet && (
                      <span className="hint">
                        {mm(sheet.dimensions[axes.horizontal])} × {mm(sheet.dimensions[axes.vertical])} mm · {sheet.estimateSource === "ai" ? "AI estimate" : "rule estimate"}
                      </span>
                    )}
                  </span>
                  <span className="actions">
                    {sheet && sheet.revision > 1 && <span className="badge">Rev {sheet.revision}</span>}
                    {!approved && !set.stale && (
                      <label className="check">
                        <input type="checkbox" checked={selected.includes(key)} onChange={() => toggle(key)} disabled={running} />
                        Redraw
                      </label>
                    )}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      {parts.length > 0 && (
        <p className="hint">
          Shapes are AI line drawings; the dimension lines and values are added by the app from the part estimates, so they're always legible. Sheets are not to scale, and the holes drawn are indicative — the mounting-point count in each title block is the spec. Verify every dimension on the car before fabrication.
        </p>
      )}

      {!approved && !set.stale && (
        <>
          <div className="field">
            <label className="label" htmlFor="redraw-notes">Changes for the selected drawings</label>
            <textarea
              id="redraw-notes"
              value={notes}
              maxLength={1500}
              placeholder="e.g. Make the front splitter 30% deeper and add two canards per side. Headlights should be the slimmer facelift shape."
              onChange={e => setNotes(e.target.value)}
              disabled={running}
            />
            <p className="hint" style={{ marginTop: 6 }}>Each redrawn view is one more {quality}-quality image. Previous notes: {set.notes ?? "none"}</p>
          </div>
          <div className="actions">
            <button
              className="btn"
              disabled={running || busy || selected.length === 0 || !notes.trim()}
              onClick={() => run(async () => { await onRedraw(selected, notes.trim()); setSelected([]); })}
            >
              {running && job?.kind === "redraw" ? <span className="spinner" /> : null}
              Redraw {selected.length || ""} {selected.length === 1 ? "drawing" : "drawings"}
            </button>
            <button className="btn ok" disabled={running || busy || !complete} onClick={() => run(onApprove)}
              title={complete ? undefined : "Every car view and part close-up must be drawn before approving"}>
              ✓ Approve drawings
            </button>
            <button className="btn" onClick={generate} disabled={running || busy}>Start over</button>
          </div>
        </>
      )}
      {approved && !set.stale && (
        <div className="actions">
          <button className="btn" onClick={() => run(onReopen)} disabled={running || busy}>Reopen for changes</button>
        </div>
      )}
      {set.stale && (
        <div className="actions">
          <button className="btn primary" onClick={generate} disabled={running || busy}>Generate new drawings · {imageCount} images</button>
          <button className="btn" onClick={onEditBuild}>← Back to build</button>
        </div>
      )}
    </section>
  );
}
