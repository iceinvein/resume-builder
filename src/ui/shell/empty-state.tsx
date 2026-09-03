import { useEffect, type ReactNode } from "react";
import { resumeStore } from "../../state/store";
import { exampleResume, emptyResume } from "../../schema/defaults";
import { Button } from "../primitives/button";
import { Kbd } from "../theme/kbd";

type Choice = {
  title: string;
  description: string;
  shortcut: string;
  actionLabel: string;
  action: () => void;
  variant: "primary" | "secondary" | "ghost";
};

const choices: Choice[] = [
  {
    title: "Start from a blank form",
    description: "Structured fields for every section. Recommended if this is your first resume or you want guardrails.",
    shortcut: "N",
    actionLabel: "Start blank",
    action: () => resumeStore.setState({ resume: emptyResume, tab: "form", started: true }),
    variant: "primary",
  },
  {
    title: "Import or paste MDX",
    description: "Drop a .mdx file or paste markdown. Useful if you version-control your resume or migrated from another tool.",
    shortcut: "I",
    actionLabel: "Import MDX",
    action: () => resumeStore.setState({ tab: "import", started: true }),
    variant: "secondary",
  },
  {
    title: "See a worked example",
    description: "Load a sample resume to study the structure. Replaces any draft you have.",
    shortcut: "E",
    actionLabel: "Load example",
    action: () => resumeStore.setState({ resume: exampleResume, tab: "form", started: true }),
    variant: "ghost",
  },
];

export function EmptyState() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const key = e.key.toLowerCase();
      const match = choices.find((c) => c.shortcut.toLowerCase() === key);
      if (!match) return;
      e.preventDefault();
      match.action();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{
        padding: "var(--space-3xl) var(--space-xl)",
        display: "grid",
        gap: "var(--space-xl)",
        maxWidth: "60ch",
      }}
    >
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        <h1 className="display-title">Start your resume</h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: "52ch" }}>
          Everything happens in your browser; your draft stays on this device. Pick a path to begin.
        </p>
      </div>

      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-lg)" }}>
        {choices.map((c, i) => (
          <ChoiceRow key={c.title} index={i + 1} choice={c} />
        ))}
      </ol>
    </div>
  );
}

function ChoiceRow({ index, choice }: { index: number; choice: Choice }) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: "var(--space-md)",
        rowGap: "var(--space-xs)",
        alignItems: "start",
      }}
    >
      <Marker>{index}</Marker>
      <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "baseline" }}>
          <strong style={{ fontWeight: "var(--weight-semibold)" }}>{choice.title}</strong>
          <Kbd>{choice.shortcut}</Kbd>
        </div>
        <p
          className="caption"
          style={{ color: "var(--color-text-secondary)", maxWidth: "48ch", lineHeight: "var(--leading-normal)" }}
        >
          {choice.description}
        </p>
        <div style={{ marginTop: "var(--space-2xs)" }}>
          <Button variant={choice.variant} onClick={choice.action}>
            {choice.actionLabel}
          </Button>
        </div>
      </div>
    </li>
  );
}

function Marker({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="caption tabular-nums"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "var(--radius-full)",
        border: "var(--border-hairline) solid var(--color-border)",
        color: "var(--color-text-tertiary)",
        marginTop: "0.125rem",
      }}
    >
      {children}
    </span>
  );
}
