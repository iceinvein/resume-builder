import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "../theme/kbd";

export type Command = {
  id: string;
  title: string;
  hint?: string;
  group?: string;
  shortcut?: string[];
  run: () => void;
};

type Props = {
  open: boolean;
  commands: Command[];
  onClose: () => void;
};

/**
 * Minimal command palette. Filters by case-insensitive substring match on
 * title and hint. Arrow up/down to navigate, Enter to execute, Esc to close.
 *
 * Rendered as a dialog overlay. The brief rejects modals-for-modals'-sake,
 * but the palette is a specific Linear/Notion/Vercel pattern users recognize,
 * and it's keyboard-first (opens and dismisses without touching the mouse),
 * which is exactly the brand's "keyboard-first" principle.
 */
export function CommandPalette({ open, commands, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const hay = `${c.title} ${c.hint ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus the input after the element mounts.
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  if (!open) return null;

  const execute = (cmd: Command) => {
    onClose();
    // Let the palette close paint before the action fires; otherwise, an
    // action that focuses another element races with the input blur.
    window.requestAnimationFrame(() => cmd.run());
  };

  return (
    <div
      className="palette-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette">
        <input
          ref={inputRef}
          className="palette-input"
          type="text"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(filtered.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const cmd = filtered[active];
              if (cmd) execute(cmd);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            } else if (e.key === "Home") {
              e.preventDefault();
              setActive(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setActive(filtered.length - 1);
            }
          }}
        />
        <div className="palette-list" ref={listRef} role="listbox">
          {filtered.length === 0 && (
            <div className="palette-empty caption">No commands match "{query}".</div>
          )}
          {filtered.map((c, i) => {
            const isActive = i === active;
            return (
              <div
                key={c.id}
                role="option"
                aria-selected={isActive}
                className={`palette-row${isActive ? " palette-row-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => execute(c)}
              >
                <div className="palette-row-body">
                  <span className="palette-row-title">{c.title}</span>
                  {c.hint && <span className="palette-row-hint">{c.hint}</span>}
                </div>
                {c.shortcut && (
                  <span className="palette-row-shortcut">
                    <Kbd>{c.shortcut}</Kbd>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
