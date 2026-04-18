import { useEffect, useRef, useState } from "react";
import { TypstClient } from "../../typst/client";
import { DEFAULT_TEMPLATE_SOURCE } from "../../templates/default";
import type { Resume } from "../../schema/resume";

const DEBOUNCE_MS = 150;

export type RenderState = {
  pages: string[];
  error: string | null;
  compileMs: number | null;
  booting: boolean;
};

export function useTypstRender(resume: Resume): RenderState & { exportPdf: () => Promise<Uint8Array> } {
  const clientRef = useRef<TypstClient | null>(null);
  const [state, setState] = useState<RenderState>({ pages: [], error: null, compileMs: null, booting: true });

  useEffect(() => {
    clientRef.current = new TypstClient();
    return () => clientRef.current?.terminate();
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    const timer = setTimeout(async () => {
      try {
        const res = await client.compile(DEFAULT_TEMPLATE_SOURCE, JSON.stringify(resume));
        setState({ pages: res.svgPages, error: null, compileMs: res.durationMs, booting: false });
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message, booting: false }));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [resume]);

  const exportPdf = async () => {
    const client = clientRef.current;
    if (!client) throw new Error("renderer not ready");
    const res = await client.exportPdf(DEFAULT_TEMPLATE_SOURCE, JSON.stringify(resume));
    return res.pdf;
  };

  return { ...state, exportPdf };
}
