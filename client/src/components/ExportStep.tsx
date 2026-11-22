import { useState } from "react";
import type { BuildDto } from "../../../shared/types";
import { api } from "../api";

export function ExportStep({ build, onError }: { build: BuildDto; onError: (message: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const currentRenders = build.renders.filter(r => r.current).length;
  const running = !!build.job && !build.job.done;

  const downloadDirectly = () => {
    const link = document.createElement("a");
    link.href = `/api/builds/${build.id}/export`;
    link.download = `${build.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || `build-${build.id}`}-production.zip`;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const download = async () => {
    setBusy(true);
    onError(null);
    try {
      const { blob, filename } = await api.exportZip(build.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof TypeError) {
        // Some preview proxies redirect binary fetches to a shield page, which
        // fetch cannot follow cross-origin. Let the browser handle the download.
        downloadDirectly();
      } else {
        onError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="export-heading">
      <h2 id="export-heading">Production export</h2>
      <p className="panel-intro">
        One ZIP with everything a fabricator needs for this build. Part dimensions are estimates (one low-cost text request when the drawings are made) and must be measured on the car before cutting anything.
      </p>
      <ul className="export-list">
        <li><code>drawings/</code> — the 4 approved whole-car line drawings</li>
        <li><code>renders/</code> — {currentRenders ? `${currentRenders} render${currentRenders === 1 ? "" : "s"} made from the approved drawings` : "no renders yet (optional)"}</li>
        <li><code>SPEC_SHEET.pdf</code> — build summary with the side drawing and hero render</li>
        <li><code>parts/KIT_PART_SHEETS.pdf</code> — measured close-up sheet per kit part (plus SVG and raw drawing)</li>
        <li><code>BILL_OF_MATERIALS.csv</code>, <code>PART_SPECS.json</code>, <code>BUILD_CONFIG.json</code></li>
      </ul>
      <div className="actions">
        <button className="btn primary" onClick={download} disabled={busy || running}>
          {busy ? <span className="spinner" /> : null} Download production ZIP
        </button>
      </div>
    </section>
  );
}
