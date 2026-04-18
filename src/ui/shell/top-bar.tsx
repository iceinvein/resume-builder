import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";

export type TopBarProps = {
  onExport: () => void;
  lastSavedAt: number | null;
};

export function TopBar({ onExport, lastSavedAt }: TopBarProps) {
  const name = useResumeStore((s) => s.name);
  const saveLabel = lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Unsaved";
  return (
    <div style={{
      display: "flex", gap: 16, alignItems: "center", padding: "10px 18px",
      borderBottom: "1px solid #e6e3dd", background: "#fafaf7",
    }}>
      <strong style={{ letterSpacing: "0.04em" }}>Resume Builder</strong>
      <input
        value={name}
        onChange={(e) => resumeStore.setState({ name: e.target.value })}
        style={{ flex: 1, fontSize: 14, padding: "6px 8px", border: "1px solid #d9d6ce", borderRadius: 4 }}
      />
      <span style={{ fontSize: 12, color: "#6a6a6a" }}>{saveLabel}</span>
      <button onClick={onExport} style={{ padding: "6px 12px", fontSize: 13 }}>Export PDF</button>
    </div>
  );
}
