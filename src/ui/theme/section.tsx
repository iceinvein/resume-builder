import type { ReactNode } from "react";
import { SectionTitle } from "./section-title";

type SectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Form section wrapper. Owns the vertical rhythm between title, hint, and body
 * so every section reads with the same shape: title tight on the hint, hint
 * loose on the body.
 */
export function Section({ title, hint, children }: SectionProps) {
  return (
    <section style={{ display: "grid", gap: "var(--space-sm)" }}>
      <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
        <SectionTitle>{title}</SectionTitle>
        {hint && (
          <p className="caption" style={{ color: "var(--color-text-tertiary)" }}>
            {hint}
          </p>
        )}
      </div>
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>{children}</div>
    </section>
  );
}
