import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
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
      <Input
        value={name}
        aria-label="Resume filename"
        onChange={(e) => resumeStore.setState({ name: e.target.value })}
        className="flex-1"
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

export function SharedTopBar(
  { onDownloadSource, onExport, exporting, exportDisabled, downloadDisabled }: {
    onDownloadSource: () => void;
    onExport: () => void;
    exporting: boolean;
    exportDisabled: boolean;
    downloadDisabled: boolean;
  },
) {
  const name = useResumeStore((s) => s.resume.meta.name || s.name || "Resume");

  return (
    <div
      className="surface-divider"
      style={{
        display: "flex",
        gap: "var(--space-md)",
        alignItems: "center",
        padding: "var(--space-sm) var(--space-lg)",
        background: "var(--color-canvas)",
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: "0.125rem", minWidth: 0, flex: 1 }}>
        <strong style={{ fontWeight: "var(--weight-semibold)" }}>{name}</strong>
        <span className="caption" style={{ color: "var(--color-text-tertiary)" }}>
          Shared resume viewer
        </span>
      </div>
      <Button variant="secondary" onClick={onDownloadSource} disabled={downloadDisabled}>
        Download MDX
      </Button>
      <Button
        variant="primary"
        onClick={onExport}
        disabled={exporting || exportDisabled}
        aria-busy={exporting}
        title="Download PDF (⌘⇧E)"
      >
        {exporting ? "Preparing PDF…" : "Download PDF"}
      </Button>
      <span title="Export PDF (⌘⇧E)" aria-hidden>
        <Kbd>{["⌘", "⇧", "E"]}</Kbd>
      </span>
    </div>
  );
}
