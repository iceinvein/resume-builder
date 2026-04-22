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

// Typst's font parser handles TTF/OTF directly; it does NOT decompress WOFF2.
// Keep these as TTF to ensure glyphs render in the preview SVG and exported PDF.
const FONT_URLS = [
  "/fonts/Inter-Regular.ttf",
  "/fonts/Inter-Medium.ttf",
  "/fonts/Inter-SemiBold.ttf",
  "/fonts/Inter-Light.ttf",
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

      // Render the full document to a single SVG, then split it into one
      // string per page so the preview can paint each page on its own paper
      // surface with a visible gap. Without this, every Typst page break
      // appears as a 1.4in whitespace band (bottom margin of page N + top
      // margin of page N+1) inside one continuous SVG.
      const svgPages: string[] = await renderer.runWithSession(
        { format: "vector", artifactContent: artifact },
        async (session) => {
          const fullSvg = await session.renderSvg({});
          const pages = renderer.retrievePagesInfoFromSession(session);
          return splitSvgByPages(fullSvg, pages);
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

type PageInfo = { pageOffset: number; width: number; height: number };

// typst.ts renders the whole document as a single SVG whose viewBox spans all
// pages stacked vertically. To paint pages as separate surfaces we produce one
// SVG string per page by cropping the root viewBox to that page's y-range.
// The inner content (glyph defs, page groups) is duplicated; IDs are prefixed
// per page so `<use href="#...">` lookups don't collide across sibling SVGs in
// the same document. The typst.ts bootstrap `<script>` is dropped: the preview
// doesn't need text selection / link interactivity, and leaving it in would
// re-declare the same globals N times.
function splitSvgByPages(fullSvg: string, pages: PageInfo[]): string[] {
  const [first] = pages;
  if (!first) return [];
  if (pages.length === 1) return [fullSvg];

  const stripped = stripScripts(fullSvg);
  const unitFactor = detectUnitFactor(fullSvg, first);
  const out: string[] = [];
  let cumulativeY = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const pw = page.width * unitFactor;
    const ph = page.height * unitFactor;
    const withIds = rewriteIds(stripped, `p${i}-`);
    out.push(
      rewriteRootSvg(withIds, {
        viewBox: `0 ${cumulativeY} ${pw} ${ph}`,
        width: `${page.width}pt`,
        height: `${page.height}pt`,
      }),
    );
    cumulativeY += ph;
  }
  return out;
}

function stripScripts(svg: string): string {
  return svg.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

// typst.ts SVG output may use pt or px (= pt * 3) for the viewBox. Compare
// the viewBox width to the first page's reported width_pt to infer which.
function detectUnitFactor(svg: string, firstPage: PageInfo): number {
  const vb = svg.match(/viewBox="([^"]+)"/);
  if (!vb) return 1;
  const parts = vb[1]!.trim().split(/\s+/);
  const vbW = Number(parts[2]);
  if (!Number.isFinite(vbW) || firstPage.width <= 0) return 1;
  const ratio = vbW / firstPage.width;
  return Math.abs(ratio - 3) < 0.2 ? 3 : 1;
}

function rewriteIds(svg: string, prefix: string): string {
  return svg
    .replace(/\bid="([^"]+)"/g, `id="${prefix}$1"`)
    .replace(/\bhref="#([^"]+)"/g, `href="#${prefix}$1"`)
    .replace(/\bxlink:href="#([^"]+)"/g, `xlink:href="#${prefix}$1"`);
}

function rewriteRootSvg(
  svg: string,
  opts: { viewBox: string; width: string; height: string },
): string {
  return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    let out = attrs;
    out = setOrAppendAttr(out, "viewBox", opts.viewBox);
    out = setOrAppendAttr(out, "width", opts.width);
    out = setOrAppendAttr(out, "height", opts.height);
    return `<svg${out}>`;
  });
}

function setOrAppendAttr(attrs: string, name: string, value: string): string {
  const re = new RegExp(`\\b${name}="[^"]*"`);
  if (re.test(attrs)) return attrs.replace(re, `${name}="${value}"`);
  return `${attrs} ${name}="${value}"`;
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const res = await handle(ev.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res);
};
