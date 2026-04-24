# Resume Builder

Client-side browser app for writing resumes in MDX and exporting typeset PDFs. No server, no backend; everything runs in your tab and drafts persist to IndexedDB.

- **MDX in, PDF out.** A small fixed JSX dialect parses into a Zod-validated `Resume` object, renders through a Typst (WASM) worker, and exports as PDF.
- **Live preview.** Typst SVG pages update as you type in either the structured form or the MDX editor.
- **Local-only.** Drafts autosave to IndexedDB (1s debounce). Nothing leaves the browser.
- **Three editing surfaces.** Structured form, MDX editor (CodeMirror 6), and an import tab for pasting or dropping `.mdx` files.

## Quick start

```sh
bun install
bun run dev          # Vite dev server on http://localhost:3000
```

Other commands:

```sh
bun run build        # static build to dist/ (also regenerates resume.schema.json)
bun run preview      # preview the built bundle
bun test             # bun:test + happy-dom
bun run typecheck    # tsc --noEmit
bun run schema       # regenerate public/resume.schema.json from src/schema/*
bun run e2e:serve    # boot dev server for the agent-browser e2e skill
```

Bun is the package manager and test runner; Vite is the bundler. Do not swap Vite for `Bun.serve()`: the WASM worker, Tailwind v4 plugin, and `?url` imports are wired through Vite.

## MDX format

The importer accepts a small fixed JSX dialect (seven components: `Contact`, `Experience`, `Education`, `Skills`, `Project`, `Extra`, `Item`). Full reference: [`docs/mdx-format.md`](docs/mdx-format.md). Machine-readable JSON Schema: [`public/resume.schema.json`](public/resume.schema.json).

Minimal example:

```mdx
---
name: Ada Lovelace
title: Engineer
---

<Contact email="ada@example.com" />

## Experience

<Experience company="Analytical Engine Co" role="Engineer" start="1843-01" end="present">
- Wrote the first algorithm.
</Experience>
```

See [`fixtures/maximal.mdx`](fixtures/maximal.mdx) for every component exercised together.

## Architecture

```
src/
  schema/      Zod schemas (resume.ts, inline.ts) and empty/example defaults
  state/       Zustand vanilla store, IDB autosave, toasts, soft-remove/undo
  mdx/         MDX <-> Resume parse/serialize, inline node handling, component allowlist
  templates/   Typst source generator consuming the validated resume
  typst/       Web Worker running typst.ts WASM + main-thread client
  ui/
    app.tsx    Shell: top bar, tabs, two-pane layout, command palette, export
    shell/     Top bar, tabs, layout, command palette, shortcuts, env-check
    form/      Structured editor (contact / experience / education / skills / projects / extras)
    editor/    CodeMirror MDX tab and import tab
    preview/   Preview pane, SVG page renderer, useTypstRender hook
    primitives/Base UI wrappers (button, input, popover, ...)
    theme/     Design tokens, Tailwind layer, typography, kbd chips, toast portal
tests/         bun:test units (parse/serialize/schema/store/template/form)
tests/e2e/     Smoke placeholder; real e2e runs via agent-browser
fixtures/      minimal.mdx, maximal.mdx
public/fonts/  Inter TTFs served to the Typst worker
scripts/       build-schema.ts, e2e.ts
docs/          mdx-format.md and design specs under superpowers/
```

Data flow: form edits mutate the Zustand `Resume`, autosave to IDB, serialise to MDX for the MDX tab and to JSON + Typst source for `templates/default.ts`, post to the Typst worker, and receive SVG pages (preview) or PDF bytes (export).

## Stack

- Vite 8 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- React 18 + TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Tailwind CSS 4 over hand-rolled design tokens (`src/ui/theme/tokens.css`)
- Zustand (vanilla) for state, `idb-keyval` for persistence
- `@mdx-js/mdx` + remark for MDX parse/serialize, CodeMirror 6 for the MDX editor
- Zod v4 for schema validation
- `@myriaddreamin/typst.ts` running in a Web Worker for SVG preview and PDF export
- `@base-ui-components/react` primitives, `@dnd-kit/*` for sortable lists

## Gotchas

- The worker uses **Inter TTF** (not WOFF2). Typst's font parser does not decompress WOFF2; keep `public/fonts/*.ttf`. Missing fonts fall back to jsDelivr defaults.
- Typst compiles against **shadow files**: the worker maps `/main.typ` and `/resume.json` via `compiler.mapShadow` before each compile. Nothing is read from disk.
- The store is vanilla Zustand (`zustand/vanilla`); the React binding lives in `src/ui/shell/use-store.ts`.
- Tabs are tri-state (`form | mdx | import`) driven by `resumeStore.tab`. Keep all three in sync when adding edit surfaces.
- Autosave debounce is 1000ms; tests that assert persistence must wait that window or call the persistence function directly.
- First-run empty state is detected by `meta.name === emptyResume.meta.name && experience.length === 0`. Don't pre-fill the default name.
- `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true` are on; `foo?: string` is not assignable to `foo: string | undefined`, and array access is `T | undefined`.

## Design

Brand voice, aesthetic direction, and design principles live in the "Design Context" section of `CLAUDE.md`. Short version: refined utilitarian, warm neutrals, document-forward, keyboard-first. The PDF is the product; the UI is the workbench.
