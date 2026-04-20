import type { Tab } from "../../state/store";
import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "form", label: "Form", hint: "Structured fields for every section (⌘1)" },
  { id: "mdx", label: "MDX", hint: "Edit the raw source: markdown with inline React components (⌘2)" },
  { id: "import", label: "Import", hint: "Drop or paste an .mdx file to replace your draft (⌘3)" },
];

export function Tabs() {
  const tab = useResumeStore((s) => s.tab);
  return (
    <div
      className="surface-divider"
      style={{ display: "flex", background: "var(--color-canvas)" }}
      role="tablist"
    >
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            title={t.hint}
            onClick={() => resumeStore.setState({ tab: t.id })}
            className="tab"
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
