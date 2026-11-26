import type { BuildSummaryDto, UsageDto } from "../../../shared/types";

const STAGE_LABEL: Record<BuildSummaryDto["stage"], string> = {
  configure: "Not drawn yet",
  drawings: "Drawings in review",
  approved: "Drawings approved",
  rendered: "Rendered",
};

export function Sidebar({ builds, selectedId, usage, onSelect, onNew }: {
  builds: BuildSummaryDto[] | null;
  selectedId: number | null;
  usage: UsageDto | null;
  onSelect: (id: number) => void;
  onNew: () => void;
}) {
  return (
    <aside className="sidebar" aria-label="Saved builds">
      <div className="sidebar-head">
        <div className="brand">
          <img className="brand-mark" src="/vanguard-mark.png" alt="Vanguard Draft mark" />
          <span>VANGUARD<br />DRAFT</span>
        </div>
        <button className="btn primary" onClick={onNew}>+ New build</button>
      </div>
      <ul className="build-list">
        {builds === null && <li className="hint" style={{ padding: "var(--space-2)" }}>Loading builds…</li>}
        {builds?.length === 0 && <li className="hint" style={{ padding: "var(--space-2)" }}>No saved builds yet.</li>}
        {builds?.map(b => (
          <li key={b.id}>
            <button className="build-item" aria-current={b.id === selectedId} onClick={() => onSelect(b.id)}>
              {b.thumbnailUrl ? <img className="build-thumb" src={b.thumbnailUrl} alt="" /> : <span className="build-thumb" />}
              <span style={{ minWidth: 0 }}>
                <span className="build-name" style={{ display: "block" }}>{b.name}</span>
                <span className="build-meta">{STAGE_LABEL[b.stage]}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {usage && (
        <div className="usage">
          <div>Images today: {usage.imagesToday} / {usage.dailyImageLimit}</div>
          <div>Drawings: {usage.drawingQuality} quality · Renders: {usage.renderQuality}</div>
          {usage.aiMode === "mock" && <div style={{ color: "var(--warn)" }}>Mock AI — placeholder images, no cost</div>}
          {usage.storage === "memory" && <div style={{ color: "var(--warn)" }}>No database — builds vanish on restart</div>}
        </div>
      )}
    </aside>
  );
}
