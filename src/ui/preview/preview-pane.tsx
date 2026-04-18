import { useEffect, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { useTypstRender } from "./use-typst-render";
import { SvgPage } from "./svg-page";

export function PreviewPane({ onExportReady }: { onExportReady: (fn: () => Promise<Uint8Array>) => void }) {
  const resume = useResumeStore((s) => s.resume);
  const { pages, error, compileMs, booting, exportPdf } = useTypstRender(resume);
  const [zoom, setZoom] = useState(1);

  useEffect(() => { onExportReady(exportPdf); }, [exportPdf, onExportReady]);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: 16, gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#4a4a4a" }}>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>+</button>
        {booting && <span>Preparing renderer…</span>}
        {!booting && compileMs != null && <span>Rendered in {Math.round(compileMs)}ms</span>}
        {error && <span style={{ color: "crimson" }}>{error}</span>}
      </div>
      <div style={{ overflow: "auto", display: "grid", gap: 16, justifyContent: "center" }}>
        {pages.map((svg, i) => <SvgPage key={i} svg={svg} zoom={zoom} />)}
      </div>
    </div>
  );
}
