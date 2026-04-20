import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { SortableHandle } from "./sortable-list";
import { Button } from "../primitives/button";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  onRemove: () => void;
  removeLabel?: string;
  children: ReactNode;
  dragLabel?: string;
};

export function FormCard({
  title,
  subtitle,
  onRemove,
  removeLabel = "Remove",
  children,
  dragLabel,
}: Props) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={cn(
        "bg-surface-raised border border-border-subtle rounded-md",
        "overflow-hidden",
      )}
    >
      <div className="flex items-center gap-xs px-sm py-xs border-b border-border-subtle">
        <SortableHandle aria-label={dragLabel ?? "Reorder item"} />
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex-1 text-left inline-flex items-baseline gap-sm min-w-0",
            "hover:bg-surface-muted rounded-sm px-2xs -mx-2xs py-2xs",
            "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
          )}
        >
          <span className="text-sm font-medium text-text truncate">{title}</span>
          {subtitle && (
            <span className="text-xs text-text-secondary truncate">{subtitle}</span>
          )}
          <span aria-hidden="true" className="ml-auto text-text-tertiary text-xs">
            {open ? "collapse" : "expand"}
          </span>
        </button>
        <Button variant="danger" size="sm" onClick={onRemove}>{removeLabel}</Button>
      </div>
      {open && <div className="p-md grid gap-sm">{children}</div>}
    </div>
  );
}
