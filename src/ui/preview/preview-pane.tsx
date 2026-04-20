import { useEffect, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { useTypstRender } from "./use-typst-render";
import { SvgPage } from "./svg-page";
import { Button } from "../primitives/button";

const ZOOM_STORAGE_KEY = "resume-builder:preview-zoom";
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

function readStoredZoom(): number {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY);
  if (raw === null) return 1;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parsed));
}

export function PreviewPane({ onExportReady }: { onExportReady: (fn: () => Promise<Uint8Array>) => void }) {
  const resume = useResumeStore((s) => s.resume);
  const { pages, error, compileMs, booting, exportPdf } = useTypstRender(resume);
  const [zoom, setZoom] = useState<number>(readStoredZoom);

  useEffect(() => { onExportReady(exportPdf); }, [exportPdf, onExportReady]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
    } catch {
      // localStorage quota/disabled; zoom simply won't persist this session.
    }
  }, [zoom]);

  return (
    <div
      style={{
        height: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        padding: "var(--space-md) var(--space-lg)",
        gap: "var(--space-md)",
      }}
    >
      {/* Toolbar: zoom group left, live status right. Negative-space separation
          rather than a divider keeps the preview reading as a document. */}
      <div
        className="caption"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-md)",
          color: "var(--color-text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2xs)" }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.1))}
            aria-label="Zoom out"
          >
            −
          </Button>
          <span className="tabular-nums" style={{ minWidth: "3ch", textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.1))}
            aria-label="Zoom in"
          >
            +
          </Button>
        </div>
        <div
          style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}
          aria-live="polite"
        >
          {booting && <span>Preparing renderer…</span>}
          {!booting && compileMs != null && (
            <span className="tabular-nums">Rendered in {Math.round(compileMs)}ms</span>
          )}
          {error && <span style={{ color: "var(--color-danger-soft-text)" }}>{error}</span>}
        </div>
      </div>
      <div
        style={{
          overflow: "auto",
          display: "grid",
          gap: "var(--space-lg)",
          justifyContent: "center",
          padding: "var(--space-sm) 0 var(--space-xl)",
        }}
      >
        {pages.map((svg, i) => (
          <SvgPage key={i} svg={svg} zoom={zoom} />
        ))}
      </div>
    </div>
  );
}
