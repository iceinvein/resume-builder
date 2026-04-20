import { useEffect } from "react";

export type ShortcutHandlers = {
  onSave?: () => void;
  onCommandPalette?: () => void;
  onExport?: () => void;
  onTab1?: () => void;
  onTab2?: () => void;
  onTab3?: () => void;
};

/**
 * Global keyboard shortcuts. Each binding is preventDefault'd so the browser
 * doesn't intercept (⌘S would save the HTML page; ⌘K opens the URL bar in
 * most browsers when a page hasn't claimed it).
 */
export function useShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (!cmd) return;
      const key = e.key.toLowerCase();
      if (key === "s" && !e.shiftKey) {
        e.preventDefault();
        handlers.onSave?.();
      } else if (key === "k" && !e.shiftKey) {
        e.preventDefault();
        handlers.onCommandPalette?.();
      } else if (key === "e" && e.shiftKey) {
        e.preventDefault();
        handlers.onExport?.();
      } else if (key === "1") {
        e.preventDefault();
        handlers.onTab1?.();
      } else if (key === "2") {
        e.preventDefault();
        handlers.onTab2?.();
      } else if (key === "3") {
        e.preventDefault();
        handlers.onTab3?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    handlers.onSave,
    handlers.onCommandPalette,
    handlers.onExport,
    handlers.onTab1,
    handlers.onTab2,
    handlers.onTab3,
  ]);
}
