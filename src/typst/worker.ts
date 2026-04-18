/// <reference lib="webworker" />
import {
  createTypstCompiler,
  createTypstRenderer,
} from "@myriaddreamin/typst.ts";
import { loadFonts, disableDefaultFontAssets } from "@myriaddreamin/typst.ts/options.init";
import type { WorkerRequest, WorkerResponse } from "./types";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";

const compiler = createTypstCompiler();
const renderer = createTypstRenderer();

const RESUME_JSON_PATH = "/resume.json";
const MAIN_PATH = "/main.typ";

const FONT_URLS = [
  "/fonts/Inter-Regular.woff2",
  "/fonts/Inter-Medium.woff2",
  "/fonts/Inter-SemiBold.woff2",
  "/fonts/Inter-Light.woff2",
];

let ready: Promise<void> | null = null;

async function init(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // Load font data eagerly so we can pass Uint8Array buffers directly.
      const fontBuffers: Uint8Array[] = await Promise.all(
        FONT_URLS.map(async (url) => {
          try {
            const resp = await fetch(url);
            return new Uint8Array(await resp.arrayBuffer());
          } catch {
            // Font file not found; skip gracefully (smoke test has no fonts dir).
            return new Uint8Array(0);
          }
        }),
      );
      const nonEmpty = fontBuffers.filter((b) => b.length > 0);

      await compiler.init({
        getModule: () => fetch(compilerWasmUrl),
        beforeBuild: [
          // Use default text assets from jsDelivr when no local fonts exist.
          ...(nonEmpty.length === 0 ? [] : [disableDefaultFontAssets()]),
          ...(nonEmpty.length > 0 ? [loadFonts(nonEmpty)] : []),
        ],
      });
      await renderer.init({
        getModule: () => fetch(rendererWasmUrl),
        beforeBuild: [
          ...(nonEmpty.length === 0 ? [] : [disableDefaultFontAssets()]),
          ...(nonEmpty.length > 0 ? [loadFonts(nonEmpty)] : []),
        ],
      });
    })();
  }
  await ready;
}

async function handle(msg: WorkerRequest): Promise<WorkerResponse> {
  try {
    await init();

    // Map shadow files so the compiler can read them.
    compiler.mapShadow(
      RESUME_JSON_PATH,
      new TextEncoder().encode(msg.resumeJson),
    );
    compiler.mapShadow(MAIN_PATH, new TextEncoder().encode(msg.mainSource));

    if (msg.kind === "compile") {
      const start = performance.now();

      // Compile to vector format (Uint8Array artifact).
      const compileResult = await compiler.compile({
        mainFilePath: MAIN_PATH,
        diagnostics: "none",
      });

      const artifact = compileResult.result;
      if (!artifact) {
        const diag =
          compileResult.diagnostics && compileResult.diagnostics.length > 0
            ? String(compileResult.diagnostics[0])
            : "compilation produced no output";
        throw new Error(diag);
      }

      // Render each page as a separate SVG string using a session.
      const svgPages: string[] = await renderer.runWithSession(
        { format: "vector", artifactContent: artifact },
        async (session) => {
          const pages = renderer.retrievePagesInfoFromSession(session);
          if (pages.length === 0) {
            // Fall back: render whole document as single page.
            const svg = await session.renderSvg({});
            return [svg];
          }
          const results: string[] = [];
          let cumulativeHeight = 0;
          for (const page of pages) {
            const svg = await session.renderSvg({
              window: {
                lo: { x: 0, y: cumulativeHeight },
                hi: { x: page.width, y: cumulativeHeight + page.height },
              },
            });
            results.push(svg);
            cumulativeHeight += page.height;
          }
          return results;
        },
      );

      return {
        kind: "compiled",
        id: msg.id,
        svgPages,
        durationMs: performance.now() - start,
      };
    }

    // PDF export path.
    const pdfResult = await compiler.compile({
      mainFilePath: MAIN_PATH,
      format: 1 /* CompileFormatEnum.pdf */,
      diagnostics: "none",
    });

    const pdfBytes = pdfResult.result;
    if (!pdfBytes) {
      throw new Error("PDF compilation produced no output");
    }

    return { kind: "pdfReady", id: msg.id, pdf: pdfBytes };
  } catch (err) {
    return {
      kind: "error",
      id: msg.id,
      message: (err as Error).message ?? String(err),
    };
  }
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const res = await handle(ev.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res);
};
