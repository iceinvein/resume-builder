import { useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";
import { Label } from "../primitives/label";
import { SortableList, SortableHandle } from "./sortable-list";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";
import type { InlineNode } from "../../schema/inline";

type Props = {
  bullets: InlineNode[][];
  onChange: (next: InlineNode[][]) => void;
};

function emptyBullet(): InlineNode[] {
  return mdToInlineNodes("");
}

export function BulletList({ bullets, onChange }: Props) {
  const refs = useRef<Array<HTMLTextAreaElement | null>>([]);

  const setRow = useCallback(
    (index: number, text: string) => {
      const next = bullets.map((b, i) => (i === index ? mdToInlineNodes(text) : b));
      onChange(next);
    },
    [bullets, onChange],
  );

  const insertAfter = useCallback(
    (index: number) => {
      const next = [...bullets];
      next.splice(index + 1, 0, emptyBullet());
      onChange(next);
      queueMicrotask(() => refs.current[index + 1]?.focus());
    },
    [bullets, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      if (bullets.length <= 1) return;
      const next = bullets.filter((_, i) => i !== index);
      onChange(next);
      queueMicrotask(() => {
        const target = refs.current[Math.max(0, index - 1)];
        if (target) {
          target.focus();
          target.setSelectionRange(target.value.length, target.value.length);
        }
      });
    },
    [bullets, onChange],
  );

  const onReorder = useCallback(
    (from: number, to: number) => {
      const next = [...bullets];
      const [item] = next.splice(from, 1);
      if (item) next.splice(to, 0, item);
      onChange(next);
    },
    [bullets, onChange],
  );

  return (
    <div className="grid gap-xs">
      <div className="flex items-baseline justify-between">
        <Label>Bullets</Label>
        <span className="text-xs text-text-tertiary">
          Markdown: <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>
        </span>
      </div>
      <SortableList
        items={bullets}
        keyFor={(_, i) => String(i)}
        onReorder={onReorder}
        renderItem={(b, i) => (
          <BulletRow
            key={i}
            index={i}
            text={inlineNodesToMd(b)}
            setRef={(el) => {
              refs.current[i] = el;
            }}
            onText={(text) => setRow(i, text)}
            onEnterAtEnd={() => insertAfter(i)}
            onBackspaceAtStart={() => removeAt(i)}
            onRemove={() => removeAt(i)}
            canRemove={bullets.length > 1}
          />
        )}
      />
      <div>
        <button
          type="button"
          onClick={() => onChange([...bullets, emptyBullet()])}
          className={cn(
            "text-xs text-text-secondary hover:text-text px-sm py-2xs rounded-sm",
            "hover:bg-surface-muted",
          )}
        >
          + Add bullet
        </button>
      </div>
    </div>
  );
}

function BulletRow({
  index,
  text,
  setRef,
  onText,
  onEnterAtEnd,
  onBackspaceAtStart,
  onRemove,
  canRemove,
}: {
  index: number;
  text: string;
  setRef: (el: HTMLTextAreaElement | null) => void;
  onText: (text: string) => void;
  onEnterAtEnd: () => void;
  onBackspaceAtStart: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "Enter" && !e.shiftKey) {
      const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
      if (atEnd) {
        e.preventDefault();
        onEnterAtEnd();
      }
    } else if (e.key === "Backspace") {
      const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
      if (atStart && el.value === "") {
        e.preventDefault();
        onBackspaceAtStart();
      }
    }
  };

  return (
    <div className="flex items-start gap-2xs">
      <div className="pt-xs">
        <SortableHandle aria-label={`Drag bullet ${index + 1}`} />
      </div>
      <textarea
        ref={setRef}
        rows={1}
        value={text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKey}
        className={cn(
          "flex-1 bg-surface-raised text-text border border-border rounded-sm",
          "px-sm py-xs text-sm font-sans resize-none leading-snug",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-accent",
          "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        )}
      />
      <button
        type="button"
        aria-label={`Remove bullet ${index + 1}`}
        disabled={!canRemove}
        onClick={onRemove}
        className={cn(
          "w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-sm",
          "text-text-tertiary hover:text-text hover:bg-surface-muted",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
        )}
      >
        <span aria-hidden="true">x</span>
      </button>
    </div>
  );
}
