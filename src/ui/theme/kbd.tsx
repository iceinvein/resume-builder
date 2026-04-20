import type { ReactNode } from "react";

/**
 * Keyboard shortcut chip. Use adjacent to button labels and in empty-state
 * hints so shortcuts are discoverable without a modal.
 *
 * Accepts either a plain string ("Enter", "⌘S") or an array of key fragments
 * that will be rendered as separate chips joined by thin separators; good for
 * chords like ["⌘", "⇧", "E"].
 */
export function Kbd({ children }: { children: ReactNode | ReactNode[] }) {
  if (Array.isArray(children)) {
    return (
      <span style={{ display: "inline-flex", gap: 2 }}>
        {children.map((c, i) => (
          <kbd key={i} className="kbd">{c}</kbd>
        ))}
      </span>
    );
  }
  return <kbd className="kbd">{children}</kbd>;
}
