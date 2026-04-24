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
  const renderKey = (key: ReactNode, index: number) => {
    const label = typeof key === "string" || typeof key === "number" ? String(key) : null;
    const isSymbolOnly = label !== null && /^[^A-Za-z0-9]+$/.test(label);

    return (
      <kbd
        key={index}
        className={`kbd${isSymbolOnly ? " kbd-key-symbol" : ""}`}
      >
        <span className="kbd-label">{key}</span>
      </kbd>
    );
  };

  if (Array.isArray(children)) {
    return (
      <span className="kbd-group">
        {children.map((c, i) => renderKey(c, i))}
      </span>
    );
  }
  return renderKey(children, 0);
}
