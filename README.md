# Resume Builder

Client-side web app. MDX in, PDF out, typeset with Typst. Runs entirely in the browser.

## Development

- `bun install`
- `bun run dev` (hot-reloading dev server)
- `bun test`
- `bun run typecheck`
- `bun run build` (static build to `dist/`)

## Design

See `docs/superpowers/specs/2026-04-17-resume-builder-design.md`.

## Stack

Bun, React, TypeScript, Zod, `@mdx-js/mdx`, `@myriaddreamin/typst.ts` (WASM), CodeMirror 6, Zustand, `idb-keyval`.
