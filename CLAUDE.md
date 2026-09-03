## Project

Client-side browser app. MDX in, PDF out, typeset with Typst (WASM). No server, no backend. Everything runs in the user's tab; drafts persist to IndexedDB.

## Stack

- Vite 8 (dev/build) with `@vitejs/plugin-react` and `@tailwindcss/vite`
- React 18 + TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Tailwind CSS 4 layered on top of hand-rolled design tokens (`src/ui/theme/tokens.css`)
- Zustand (vanilla store) for state; `idb-keyval` for persistence
- `@mdx-js/mdx` + remark for MDX parse/serialize; CodeMirror 6 for the MDX editor
- Zod v4 for schema validation
- `@myriaddreamin/typst.ts` compiled inside a Web Worker for SVG preview + PDF export
- `@base-ui-components/react` primitives; `@dnd-kit/*` for sortable lists
- Bun is the package manager and test runner; Vite is the bundler

## Commands

```sh
bun install
bun run dev          # Vite dev server on :3000 with HMR
bun run build        # Static build to dist/ (esnext target)
bun run preview      # Preview the built bundle
bun run typecheck    # tsc --noEmit
bun test             # bun:test + happy-dom (see bunfig.toml preload)
bun run e2e:serve    # Boots dev server and prints URL for agent-browser e2e
```

## Architecture

```
src/
  index.tsx            React root; loads fonts + theme CSS layers in order
  schema/              Zod schemas (resume.ts, inline.ts) and defaults (empty / example resume)
  state/               Zustand store, IDB autosave (1s debounce), toasts, soft-remove/undo
  mdx/                 MDX <-> Resume parsing, inline-node serialisation, expr evaluation, component allowlist
  templates/           Typst source generator (default.ts) that consumes the Zod-validated resume
  typst/               Web Worker running typst.ts WASM + main-thread client wrapper
  ui/
    app.tsx            Shell: top bar, tabs, two-pane layout, command palette, env probe, export
    shell/             Top bar, tabs, layout, command palette, shortcuts, empty state, env-check
    form/              Structured editor: contact / experience / education / skills / projects / extras
    editor/            CodeMirror MDX tab + import tab (paste / drop .mdx)
    preview/           Preview pane, SVG page renderer, useTypstRender hook
    primitives/        Base UI wrappers (button, input, label, popover, textarea)
    theme/             tokens.css, tailwind.css, type.css, components.css, kbd.tsx, toast-portal.tsx
    lib/cn.ts          tailwind-merge + clsx helper
tests/                 bun:test unit tests (parse/serialize/schema/store/template/inline + form widgets)
tests/e2e/             Placeholder smoke test; real e2e runs via agent-browser skill
fixtures/              minimal.mdx, maximal.mdx used by tests and manual e2e
public/fonts/          Inter TTF files served to the Typst worker at runtime
scripts/e2e.ts         Spawns `bun run dev`, detects URL, prints it for the agent-browser skill
docs/superpowers/      Design specs (for example 2026-04-17-resume-builder-design.md)
```

## Data flow (one sentence)

Form edits mutate the Zustand `Resume` → autosaved to IDB → serialised to MDX for the MDX tab and to JSON + Typst source for `templates/default.ts` → posted to the Typst worker → worker returns SVG pages (preview) or PDF bytes (export).

## Gotchas

- Do not replace Vite with `Bun.serve()`. The WASM + worker + Tailwind-v4-plugin pipeline is wired through Vite; CSS tokens, worker URL resolution (`new URL("./worker.ts", import.meta.url)`), and `?url` imports for the typst WASM binaries all depend on Vite's bundler.
- Worker uses **Inter TTF** (not WOFF2): Typst's font parser does not decompress WOFF2. Keep `public/fonts/*.ttf`. If fonts are missing the worker falls back to jsDelivr defaults.
- Typst compile runs against **shadow files**: the worker maps `/main.typ` and `/resume.json` via `compiler.mapShadow` before each compile. Don't try to read from disk.
- Store is a **vanilla** Zustand store (`zustand/vanilla`), not the React hook form. The React binding lives in `src/ui/shell/use-store.ts`.
- The app has three tabs driven by `resumeStore.tab` (`form | mdx | import`); keep the tri-state in sync when adding new edit surfaces.
- Autosave debounce is 1000ms; tests that mutate the store and then assert persistence must await that window or call the persistence function directly.
- First-run empty state is gated by `isFirstRun()` in `src/state/store.ts`: the explicit `started` flag wins, and the content check (`meta.name === emptyResume.meta.name && experience.length === 0`) only stands in for drafts saved before that flag existed. Any new "begin editing" entry point must set `started: true`, or it will bounce straight back to the empty state. `started` is persisted alongside the draft.
- TS config has `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true`; `foo?: string` is not assignable to `foo: string | undefined`, and array access is `T | undefined`.
- Tests preload happy-dom via `tests/setup.ts` (configured in `bunfig.toml`). Don't re-register globals inside tests.
- E2E is not a scripted `bun test`; use `bun run e2e:serve` + the agent-browser skill as documented in `tests/e2e/smoke.test.ts`.

## Code style

- Prefer `type` over `interface` unless you need `implements`, declaration merging, or class `extends`.
- TypeScript strict everything; fix types, don't widen to `any` or `unknown` without a narrow.
- Use `Bun.file` and `Bun.$` in scripts/tests; avoid `node:fs`/`execa` for new code.

## Browser automation

Use the `agent-browser` skill (not Playwright MCP) for verification. After UI changes: start `bun run dev`, then use agent-browser to confirm the page renders, the three tabs switch, and the preview pane shows a non-empty SVG.

## Design Context

### Users

A broad general audience who needs a polished PDF resume. Spans mid-career professionals updating for a specific role, career-changers starting fresh, and technical users who prefer the MDX escape hatch and keyboard-driven editing. Shared emotional state: the resume is a high-stakes document tied to identity and opportunity; users are purposeful but quietly anxious, want the tool to get out of the way, and judge quality by the PDF it produces. Primary jobs to be done: (1) open the app and produce a credible PDF quickly, (2) iterate on wording and structure with a live preview, (3) trust that local-only persistence won't lose their work.

### Brand Personality

**Three words:** precise, quiet, craftsmanlike.

Voice is a well-engineered workshop tool: confident, unembellished, useful. Never chirpy, never cute, never apologetic. UX copy is declarative and specific ("Draft saved 14:22", not "Your resume is being saved, don't worry!"). The tool should feel like it was made by someone who cares about typography and respects the user's time. The PDF it produces is the product; the UI is the workbench.

Emotional goals: reassurance through restraint. Users should close the app feeling that their resume was taken seriously.

### Aesthetic Direction

**Visual tone.** Refined utilitarian, with the spatial confidence of Linear / Notion / Vercel but rendered on warm, paper-like surfaces instead of the cold neutral grays those products lean on. The app is a document tool, not a SaaS dashboard. Two-pane discipline: editor chrome recedes, the PDF preview takes visual priority. Rhythm is quiet; density is earned (empty state is generous; MDX editor is tight; form sections breathe).

**References.** Linear (command palette discipline, keyboard fluency, zero ornamental chrome), Notion (spatial confidence, generous whitespace, considered type hierarchy), Vercel (monochrome restraint, type-driven hierarchy). Plus a dash of editorial print: a resume is a document, and document tools earn trust through typographic care.

**Anti-references.** FlowCV, Canva, Zety, Resume.io (template-y, illustrated, accent-heavy, sidebar-with-progress-ring energy). Generic SaaS dashboards. Dark-mode-with-neon-accents. Glassmorphism, gradient text, drop-shadow cards, illustrated empty states with cartoon mascots. AI landing-page aesthetic (purple-to-blue gradients, cyan-on-dark).

**Theme.** Light and dark parity; both modes properly tuned. Light is primary: a warm off-white base (`oklch(0.985 0.006 85)` neighborhood) that reads as paper rather than UI. Dark is a warm graphite, never pure black, tinted to the same hue family so the two modes feel like one product in different lighting.

**Color.** Warm neutrals tinted toward a single brand hue. One sharp accent used sparingly (primary action, focus rings, save indicator). Accent must survive both light and dark with matched perceptual lightness. No status-color theatre; use typography and placement for hierarchy, not a palette of badges.

**Typography.** Pair Hanken Grotesk (warm neo-grotesque, UI and body) with Azeret Mono (MDX editor, tabular dates, keyboard shortcuts, kbd chips). Display moments use Hanken at heavy weight with tight tracking; no second display face. Modular scale with >= 1.25 ratio between steps. Fixed `rem` scale in app UI; fluid `clamp()` only on marketing-style surfaces if/when they appear. Tabular figures enabled for dates and durations (`font-variant-numeric: tabular-nums`).

**Motion.** One well-orchestrated page-load reveal (staggered: top bar, tabs, form, preview). Tab transitions are near-instant. Preview updates are silent. No bounce easing. No animations on layout properties. Respect `prefers-reduced-motion`.

### Design Principles

1. **Document-forward.** The PDF preview is the product. Every chrome decision should make the preview look better, not compete with it.
2. **Warm precision.** Warm neutrals tinted to the brand hue; crisp hairline borders (1px), small radii (2-6px), no decorative shadows. Precision is shown through alignment and spacing, not through ornament.
3. **Earned density.** Empty state is generous and teaches the interface. Form sections breathe. The MDX editor and preview are denser because the user has committed. Don't apply the same padding everywhere.
4. **Keyboard-first.** A broad audience includes power users. Every primary action has a shortcut; focus rings are visible; kbd chips appear in tooltips and empty states so shortcuts are discoverable without a modal.
5. **Confident quiet.** No decorative illustrations, no hero metrics, no glassmorphism, no accent walls, no "wow moments" in the chrome. The wow is the PDF.
