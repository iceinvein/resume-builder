import { useCallback, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

const MAX_CHIP_LEN = 64;

function normalize(raw: string): string {
  return raw.trim().slice(0, MAX_CHIP_LEN);
}

function addTokens(existing: string[], tokens: string[]): string[] {
  const lowered = new Set(existing.map((x) => x.toLowerCase()));
  const next = [...existing];
  for (const t of tokens) {
    const norm = normalize(t);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (lowered.has(key)) continue;
    lowered.add(key);
    next.push(norm);
  }
  return next;
}

export function ChipInput({ value, onChange, placeholder, className }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(
    (raw: string) => {
      const tokens = raw.split(/[,\n]/g);
      const next = addTokens(value, tokens);
      if (next.length !== value.length) onChange(next);
      setDraft("");
    },
    [value, onChange],
  );

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      }
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[,\n]/.test(text)) {
      e.preventDefault();
      commit(text);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2xs min-h-9 w-full",
        "bg-surface-raised border border-border rounded-sm px-xs py-2xs",
        "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className={cn(
            "inline-flex items-center gap-2xs pl-sm pr-2xs py-2xs rounded-full",
            "bg-surface-muted border border-border-subtle text-xs text-text",
          )}
        >
          <span>{chip}</span>
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((_, idx) => idx !== i));
            }}
            className={cn(
              "w-4 h-4 inline-flex items-center justify-center rounded-full",
              "text-text-secondary hover:text-text hover:bg-surface focus:outline-none",
              "focus-visible:shadow-[var(--focus-ring)]",
            )}
          >
            <span aria-hidden="true">x</span>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className={cn(
          "flex-1 min-w-[6rem] bg-transparent border-0 outline-none text-sm py-2xs",
          "placeholder:text-text-tertiary",
        )}
      />
    </div>
  );
}
