import { useState } from "react";
import { RENDER_ANGLES, RENDER_ANGLE_LABELS, type BuildDto, type RenderAngle } from "../../../shared/types";

export function RendersStep({ build, onRender, onNext }: {
  build: BuildDto;
  onRender: (angles: RenderAngle[]) => Promise<unknown>;
  onNext: () => void;
}) {
  const missing = RENDER_ANGLES.filter(a => !build.renders.some(r => r.angle === a && r.current));
  const [selected, setSelected] = useState<RenderAngle[]>(missing.length ? missing : ["front-three-quarter"]);
  const [busy, setBusy] = useState(false);
  const job = build.job?.kind === "renders" ? build.job : null;
  const running = !!build.job && !build.job.done;

  const toggle = (angle: RenderAngle) =>
    setSelected(current => (current.includes(angle) ? current.filter(a => a !== angle) : [...current, angle]));
  const render = async () => {
    setBusy(true);
    // Clear the ticks once queued so a second click can't silently re-pay for the same angles.
    try { if (await onRender(selected)) setSelected([]); } finally { setBusy(false); }
  };

  return (
    <section className="panel" aria-labelledby="renders-heading">
      <h2 id="renders-heading">Renders</h2>
      <p className="panel-intro">
        Each render is made from the approved drawings: the side and front views are turned straight into photographs, and the 3/4 angles use all the drawings as their geometry reference. Side and front are made first, and every new render matches the paint and carbon of the renders already made; when you re-render some angles, the ones you keep set the look.
        Pick the angles you want — each one is a single high-quality image.
      </p>
      {job?.done && job.failed.length > 0 && (
        <div className="banner error" role="alert">
          {job.failed.map(f => `${RENDER_ANGLE_LABELS[f.item as RenderAngle] ?? f.item}: ${f.error}`).join(" · ")}
        </div>
      )}

      <div className="tiles">
        {RENDER_ANGLES.map(angle => {
          const render = build.renders.find(r => r.angle === angle);
          const pending = !!job && !job.done && job.pending.includes(angle);
          return (
            <figure className="tile" key={angle}>
              <div className="tile-media">
                {pending ? (
                  <span className="placeholder"><span className="spinner" /> Rendering…</span>
                ) : render ? (
                  <a href={render.url} target="_blank" rel="noreferrer" title="Open full size">
                    <img src={render.url} alt={`${RENDER_ANGLE_LABELS[angle]} render`} />
                  </a>
                ) : (
                  <span className="placeholder">Not rendered</span>
                )}
              </div>
              <figcaption className="tile-foot">
                <span className="tile-title">{RENDER_ANGLE_LABELS[angle]}</span>
                <span className="actions">
                  {render && !render.current && <span className="badge warn" title="Made before the latest approval; not included in the export">Older drawings</span>}
                  <label className="check">
                    <input type="checkbox" checked={selected.includes(angle)} onChange={() => toggle(angle)} disabled={running} />
                    {render ? "Re-render" : "Render"}
                  </label>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="actions">
        <button className="btn primary" onClick={render} disabled={running || busy || selected.length === 0}>
          {running && job ? <span className="spinner" /> : null}
          Render {selected.length} {selected.length === 1 ? "angle" : "angles"}
        </button>
        <button className="btn" onClick={onNext} disabled={running}>Next: export →</button>
      </div>
    </section>
  );
}
