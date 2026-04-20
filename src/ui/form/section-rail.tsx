import { useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";

export type SectionRailItem = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  items: SectionRailItem[];
  active: string;
  onActivate: (id: string) => void;
  className?: string;
};

export function SectionRail({ items, active, onActivate, className }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const item = items[clamped];
    const el = refs.current[clamped];
    if (item && el) {
      el.focus();
      onActivate(item.id);
    }
  }, [items, onActivate]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, current: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(current + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusIndex(items.length - 1);
    }
  };

  return (
    <nav
      role="tablist"
      aria-orientation="vertical"
      className={cn("flex flex-col gap-2xs py-md pr-md w-[200px] shrink-0", className)}
    >
      {items.map((item, i) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onActivate(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "group flex items-center justify-between gap-sm pl-md pr-sm py-xs",
              "text-sm rounded-sm text-text-secondary",
              "border-l-2 border-transparent",
              "hover:bg-surface-muted hover:text-text",
              "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
              isActive && "text-text font-semibold border-accent bg-surface-muted",
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[1.25rem] px-xs",
                  "text-xs font-mono tabular-nums rounded-full",
                  "bg-surface border border-border-subtle text-text-tertiary",
                  isActive && "text-text bg-surface-raised",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
