import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

// Inputs pick up color, border, radius, padding, focus ring from components.css;
// callers only need to pass value/change handlers and optional className.

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="field-label" style={{ color: "var(--color-text-secondary)" }}>
      {children}
    </label>
  );
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ width: "100%", ...props.style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{ width: "100%", minHeight: 72, resize: "vertical", ...props.style }}
    />
  );
}

export function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: "var(--space-2xs)", marginBottom: "var(--space-sm)" }}>
      {children}
    </div>
  );
}

export function Grid({ columns, children }: { columns: number; children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "var(--space-sm)",
        marginBottom: "var(--space-sm)",
      }}
    >
      {children}
    </div>
  );
}
