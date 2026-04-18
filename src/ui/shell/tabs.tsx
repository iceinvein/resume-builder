import type { Tab } from "../../state/store";
import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "form", label: "Form" },
  { id: "mdx", label: "MDX" },
  { id: "import", label: "Import" },
];

export function Tabs() {
  const tab = useResumeStore((s) => s.tab);
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e6e3dd" }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => resumeStore.setState({ tab: t.id })}
          style={{
            padding: "10px 16px",
            border: "none",
            background: tab === t.id ? "#fff" : "transparent",
            borderBottom: tab === t.id ? "2px solid #1a1a1a" : "2px solid transparent",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
