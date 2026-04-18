import { useEffect } from "react";

export function useShortcuts(handlers: { onSave?: () => void; onCommandPalette?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "s") { e.preventDefault(); handlers.onSave?.(); }
      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); handlers.onCommandPalette?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers.onSave, handlers.onCommandPalette]);
}
