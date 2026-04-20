import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const SPLIT_STORAGE_KEY = "resume-builder:pane-split";
const SPLIT_MIN = 0.25;
const SPLIT_MAX = 0.75;
const SPLIT_DEFAULT = 0.5;
const KEY_STEP = 0.02;

function readStoredSplit(): number {
  if (typeof window === "undefined") return SPLIT_DEFAULT;
  const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
  if (raw === null) return SPLIT_DEFAULT;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return SPLIT_DEFAULT;
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, parsed));
}

export function TwoPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [split, setSplit] = useState<number>(readStoredSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SPLIT_STORAGE_KEY, String(split));
    } catch {
      // localStorage quota/disabled; split simply won't persist.
    }
  }, [split]);

  const applyFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setSplit(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, ratio)));
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      applyFromClientX(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [applyFromClientX]);

  const onHandleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Horizontal dragging only makes sense in the side-by-side layout. At
    // narrow viewports the resizer becomes cosmetic (pure CSS swap); ignore
    // mouse drag there to avoid confusing behavior.
    if (window.matchMedia("(max-width: 900px)").matches) return;
    e.preventDefault();
    dragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSplit((s) => Math.max(SPLIT_MIN, s - KEY_STEP));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSplit((s) => Math.min(SPLIT_MAX, s + KEY_STEP));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSplit(SPLIT_MIN);
    } else if (e.key === "End") {
      e.preventDefault();
      setSplit(SPLIT_MAX);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSplit(SPLIT_DEFAULT);
    }
  };

  const percent = Math.round(split * 100);

  return (
    <div
      ref={containerRef}
      className="two-pane"
      style={{ "--pane-split": split } as React.CSSProperties}
    >
      <div className="two-pane-left">{left}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        aria-valuenow={percent}
        aria-valuemin={Math.round(SPLIT_MIN * 100)}
        aria-valuemax={Math.round(SPLIT_MAX * 100)}
        tabIndex={0}
        onMouseDown={onHandleMouseDown}
        onKeyDown={onHandleKeyDown}
        className="pane-resizer"
      />
      <div className="two-pane-right">{right}</div>
    </div>
  );
}
