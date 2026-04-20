import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";
import { Button } from "../theme/button";
import { Kbd } from "../theme/kbd";

export type TopBarProps = {
  onExport: () => void;
  exporting: boolean;
  lastSavedAt: number | null;
};

function formatSaved(ts: number | null): string {
  if (ts === null) return "Unsaved";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Draft saved ${hh}:${mm}`;
}

export function TopBar({ onExport, exporting, lastSavedAt }: TopBarProps) {
  const name = useResumeStore((s) => s.name);
  return (
    <div
      className="surface-divider"
      style={{
        display: "flex",
        gap: "var(--space-md)",
        alignItems: "center",
        padding: "var(--space-sm) var(--space-lg)",
        background: "var(--color-canvas)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
        <strong style={{ fontWeight: "var(--weight-semibold)" }}>Resume Builder</strong>
        <span title="Open command palette (⌘K)" aria-hidden>
          <Kbd>{["⌘", "K"]}</Kbd>
        </span>
      </div>
      <input
        value={name}
        aria-label="Resume filename"
        onChange={(e) => resumeStore.setState({ name: e.target.value })}
        style={{ flex: 1 }}
      />
      <span className="caption tabular-nums" style={{ color: "var(--color-text-tertiary)" }}>
        {formatSaved(lastSavedAt)}
      </span>
      <Button
        variant="primary"
        onClick={onExport}
        disabled={exporting}
        aria-busy={exporting}
        title="Export PDF (⌘⇧E)"
      >
        {exporting ? "Preparing PDF…" : "Export PDF"}
      </Button>
    </div>
  );
}
