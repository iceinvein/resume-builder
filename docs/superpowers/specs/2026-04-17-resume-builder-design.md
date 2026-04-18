# Resume Builder: MDX to PDF via Typst

**Date:** 2026-04-17
**Status:** Approved design; ready for implementation plan.

## Summary

A browser-based resume builder. Users edit their resume via a structured form (with an MDX escape hatch and BYO MDX import), see a live PDF-quality preview, and export to PDF. Runs entirely client-side: Typst compiles in a Web Worker via `typst.ts` (WASM); resumes persist in IndexedDB. No backend, no accounts.

The schema is the single source of truth. MDX is a serialization format. The Typst template reads the schema as JSON and owns all visual decisions. One default template ships in v1; structure supports additional templates later.

## Architecture & stack

- **Runtime/build**: Bun dev server + bundler. `bun --hot ./src/index.ts` serves an HTML entry.
- **UI**: React + TypeScript. Two-pane layout; editor left, preview right.
- **Renderer**: `@myriaddreamin/typst.ts` (WASM) inside a Web Worker. Emits SVG for preview, PDF bytes on export.
- **Persistence**: IndexedDB via `idb-keyval`. One "current resume" slot in v1; structure permits multiple slots later.
- **State**: Zustand. Schema-first; UI reads and writes the schema.
- **Deployment**: static files. Any CDN or Pages host.

Data flow:

```
Form UI       ───┐
                  ├─► Schema (Zod-validated JSON) ─► Typst template ─► typst.ts worker ─► SVG preview
MDX editor    ───┘                                                                      └─► PDF (on export)
BYO .mdx import ─► MDX parser ─► Schema ─────────────────────────────────────────────────┘
```

## Data model

Zod-validated schema. TypeScript shape:

```ts
type InlineNode =
  | { t: "text"; v: string }
  | { t: "strong"; c: InlineNode[] }
  | { t: "em"; c: InlineNode[] }
  | { t: "code"; v: string }
  | { t: "link"; u: string; c: InlineNode[] };

type Resume = {
  meta: {
    name: string;
    title?: string;
    summary?: InlineNode[];
  };
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start: string;                // normalized to "YYYY-MM" (or "YYYY" if only year given)
    end: string | "present";      // same normalization or the literal "present"
    bullets: InlineNode[][];      // structured inline nodes per bullet
    tech?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    start?: string;
    end?: string;
    details?: string[];
  }>;
  skills: Array<{ group?: string; items: string[] }>;
  projects?: Array<{
    name: string;
    description?: string;
    url?: string;
    tech?: string[];
    bullets?: string[];
  }>;
  extras?: Array<{
    heading: string;              // e.g. "Certifications", "Awards"
    items: Array<{
      title: string;
      subtitle?: string;
      date?: string;
      details?: string[];
    }>;
  }>;
};
```

Design calls:

- `extras` is a generic bucket for certifications, awards, publications. Keeps schema small; no schema change needed to add a new section type.
- Dates stored as strings. Parsed and formatted at render time.
- Bullets are structured inline node trees, not pre-rendered strings. The Typst template walks the tree via a helper function (no string injection into markup, no escape pitfalls).
- All non-core fields optional so minimal resumes work.

## MDX format

Six components, each mapping 1:1 to a schema slice. Frontmatter holds header-level data.

```mdx
---
name: Dik Rana
title: Senior Software Engineer
summary: One-paragraph professional summary.
---

<Contact
  email="dik@example.com"
  phone="+61 400 000 000"
  location="Perth, AU"
  links={[
    { label: "GitHub", url: "https://github.com/dikrana" },
    { label: "LinkedIn", url: "..." }
  ]}
/>

## Experience

<Experience
  company="Mechanical Rock"
  role="Senior Software Engineer"
  location="Perth"
  start="2024-01"
  end="present"
  tech={["TypeScript", "Bun", "AWS"]}
>
- Shipped **X** that reduced latency by 40%
- Led a team of 4 on [Project Y](https://...)
</Experience>

## Education

<Education institution="UWA" degree="BSc" field="Computer Science" start="2018" end="2021" />

## Skills

<Skills group="Languages" items={["TypeScript", "Rust", "Python"]} />
<Skills group="Infra" items={["AWS", "Docker", "Kubernetes"]} />

## Projects

<Project name="Resume Builder" url="..." tech={["Bun", "Typst"]}>
- MDX to PDF converter running fully client-side
</Project>

## Certifications

<Extra heading="Certifications">
  <Item title="AWS Solutions Architect" date="2023" />
</Extra>
```

Component set: `Contact`, `Experience`, `Education`, `Skills`, `Project`, `Extra` / `Item`.

**Parser**: `@mdx-js/mdx` + `remark-mdx` produces an MDAST. A walker extracts frontmatter, reads JSX component attributes, and collects child markdown as structured inline-node trees for each bullet. The schema stores `InlineNode[]` trees (see Data model); no string-level Typst markup appears until the template renders.

**Serializer**: deterministic schema-to-MDX output so form edits produce clean, diff-friendly MDX when the user flips to the MDX tab.

**Validation**: MDX parse errors and Zod schema errors both surface with line numbers in the MDX tab or field paths in the Form tab.

## Typst template

Single family, weight-driven hierarchy. Inter Regular/Medium/Semibold/Light.

Reference direction confirmed by research across ChiCV, basic-resume, Jake's Resume, Harvard OCS, Butterick (Practical Typography), and Tirso Gamboa's typography principles. Key moves:

- **Single column** (ATS-safe; right-flush dates via explicit `grid(columns: (1fr, auto))` create an implicit grid without a real sidebar).
- **Section headings**: Inter Semibold, 9.5pt, uppercase, 0.10em tracking, followed by a 0.5pt full-width rule.
- **Name**: Inter Semibold, 22pt, centered; title line below in Light, 11pt, `#4a4a4a`.
- **Body**: Inter Regular, 10.5pt, color `#1a1a1a` (not pure black).
- **Entry header**: role + company in Medium, location in Light, dates flush-right via grid.
- **Margins**: 0.95in sides, 0.7in top/bottom.
- **Page size**: US Letter default; A4 configurable via template option.
- **No external Typst packages** in v1 to keep the WASM compile surface minimal and avoid registry fetches.

Template sketch (`templates/default.typ`):

```typst
#let resume = json("resume.json")

#set page(paper: "us-letter", margin: (x: 0.95in, y: 0.7in))
#set text(font: "Inter", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(leading: 0.55em, justify: false)

#let render-inline(nodes) = {
  for n in nodes {
    if n.t == "text" { n.v }
    else if n.t == "strong" [*#render-inline(n.c)*]
    else if n.t == "em" [_#render-inline(n.c)_]
    else if n.t == "code" { raw(n.v) }
    else if n.t == "link" [#link(n.u)[#render-inline(n.c)]]
  }
}

#let section-heading(body) = {
  v(0.7em)
  text(size: 9.5pt, weight: 600, tracking: 0.10em, upper(body))
  v(-0.1em)
  line(length: 100%, stroke: 0.5pt)
  v(0.25em)
}

#let entry-header(left, right) = grid(
  columns: (1fr, auto),
  align(left)[#left],
  align(right)[#text(fill: rgb("#4a4a4a"))[#right]],
)

// Header, Summary, Experience, Education, Skills, Projects, Extras
// use section-heading, entry-header, and render-inline.
```

Bullets and summary are rendered by a `render-inline` helper that pattern-matches on the node tag (`text`, `strong`, `em`, `code`, `link`). No string markup is evaluated at runtime; all content flows as typed data.

**Pagination**: `block(breakable: false)` on entry header + first bullet pair (prevents orphaned headers); `block(breakable: true)` on the rest of the entry.

**Font loading**: Inter WOFF2 variants bundled and injected into the Typst worker at initialization.

Structural scaffold can fork `basic-resume` (Unlicense) or `ChiCV` (CC0/MIT). Typography is ours.

## Editor UX

Two-pane layout: editor (left), live preview (right).

**Editor pane, three tabs:**

1. **Form** (default). Structured UI driven by the Zod schema. Repeatable cards for experience, education, projects with drag-to-reorder. Bullet editor supports inline bold/italic/code/link via a minimal toolbar and markdown shortcuts.
2. **MDX**. CodeMirror 6 with MDX syntax highlighting. Form tab and MDX tab are two views of the same schema; tab switch re-serializes. Parse errors surface inline; form tab stays editable from the last valid state.
3. **Import**. Drop or paste an `.mdx` file. Parsed into the schema; user is prompted if anything doesn't map cleanly, then dropped into the Form tab.

**Preview pane:**

- Typst renders pages to SVG; pages stack vertically with zoom and page numbers.
- Debounced recompile: 150ms after last keystroke. Worker compiles off the main thread.
- Compile-latency chip shows last render time.
- "Export PDF" materializes the PDF blob and triggers download.

**Top bar:** editable resume name, auto-save state indicator (saves to IndexedDB every ~1s idle), template picker (single option v1; structure exists for future templates), export button.

**Empty state:** example resume as preview; explicit invitation to "Fill the form", "Paste MDX", or "See example."

**Keyboard:** `Cmd/Ctrl+S` forces a save; `Cmd/Ctrl+K` opens a command palette (template switch, export, reset).

**Deferred to v2:**

- Multiple saved resumes (structure the state so adding slots later is straightforward).
- Template customization UI (user-provided `.typ` files).
- Sharing or public links.

## Error handling

**MDX parse errors.** Position-aware errors from `@mdx-js/mdx` surface inline in the MDX tab (CodeMirror gutter markers plus a banner). Preview freezes on last good render with a dimmed overlay. Form tab is unaffected; form edits cannot produce invalid MDX.

**Schema validation.** Zod `safeParse` maps errors to field paths. Form tab highlights the field; MDX tab shows a banner with field path plus message. Partial rendering: valid subset still renders so fixing one field doesn't blank the preview.

**Typst compile errors.** Users never write Typst in v1, so these are bugs (template issue or unescaped interpolation). Caught, logged to console with full context, surfaced as a non-blocking toast: "Render failed; using last good preview." All string interpolation goes through a Typst escape helper.

**Font / WASM init.** Worker boots on app load (~200-500ms). Preview pane shows "Preparing renderer..." state until ready. If WASM fails to load, show "Your browser can't run the renderer. Please use Chrome, Firefox, or Safari 16+." Form still works; PDF export disabled.

**IndexedDB unavailable.** Private browsing and similar. Detect on boot, fall back to in-memory state, warn: "Your browser is blocking local storage. Your resume will not be saved." Everything else works. Quota-exceeded: modal to prompt deletion.

**Principle**: the preview should almost never go blank. Keep the last successful render on screen during transient errors.

## Testing

Four layers.

1. **Schema and parser round-trip** (`bun test`). Golden MDX fixtures: MDX → schema → MDX → compare (normalized whitespace). Guarantees lossless round-trip.
2. **Typst template snapshots** (`bun test`). Representative schemas (minimal, maximal, long names, many bullets, unicode, markdown-heavy bullets) → render via typst.ts → hash PDF bytes → compare to committed snapshot. Regenerate with `bun test --update-snapshots` when template changes are intentional. Typst output is deterministic.
3. **Component tests** (`bun test` + happy-dom). Form components: bullet editor, entry card (add/remove/reorder), validation display. Thin; behavior only.

   Note: Bun's test runner supports DOM globals via happy-dom preloaded in `bun.config.ts`.
4. **E2E smoke via agent-browser.** Fill form, switch tabs, export PDF, import fixture MDX, verify zero console errors.

**Out of scope v1**: visual regression on preview SVG (PDF snapshots cover rendering); cross-browser matrix (Chrome + Firefox + Safari via agent-browser is enough).

## Project structure

```
resume-builder/
  src/
    schema/
      resume.ts           # Zod schema, TS types
      defaults.ts         # Empty resume, example resume
    mdx/
      parse.ts            # MDX → schema
      serialize.ts        # schema → MDX
      inline.ts           # Markdown inline → Typst markup
      components.ts       # Component name → schema slice mapping
    typst/
      worker.ts           # typst.ts WASM wrapper (Web Worker entry)
      client.ts           # Main-thread client for the worker
      escape.ts           # Typst string escaping
    templates/
      default.typ         # The one template
      default.ts          # Template manifest + fonts
    ui/
      app.tsx             # Shell, tab state
      form/               # Form tab components
      editor/             # MDX CodeMirror tab
      preview/            # SVG preview + zoom + export
      shell/              # Top bar, layout
    state/
      store.ts            # Zustand (or equivalent); schema-first state
      persist.ts          # IndexedDB sync
    index.html            # Bun HTML entry
    index.tsx             # React mount
  templates-raw/
    default/              # Typst source pre-bundling (fonts, etc.)
  fixtures/
    minimal.mdx
    maximal.mdx
  tests/
    schema.test.ts
    parse.test.ts
    serialize.test.ts
    template.snapshot.test.ts
    components.test.tsx
  public/
    fonts/                # Inter WOFF2 variants
  bun.config.ts
  package.json
  tsconfig.json
```

Module boundaries: `schema` has no dependencies on `mdx` or `typst`. `mdx` depends only on `schema`. `typst` depends on `schema` plus the bundled template. `ui` is the only layer reaching into `state`.

## Research anchors

Templates and principles consulted for the typographic direction:

- **ChiCV** (skyzh/chicv, CC0/MIT): benchmark for minimal-correct. Margins, rule weight, line height.
- **basic-resume** (stuxf, Unlicense): cleanest starting baseline; no friction to fork.
- **typographic-resume** (Typst Universe, MIT): multi-font hierarchy lessons.
- **brilliant-cv** (Apache 2.0): content/style separation via TOML; active maintenance reference.
- **imprecv** (Apache 2.0): engineering resume canon, r/EngineeringResumes wiki alignment.
- **modern-cv** (DeveloperPaul, MIT): Awesome-CV port.
- **Jake's Resume**, **Harvard OCS guide**, **Butterick's Practical Typography**, **Tirso Gamboa on typography principles**: consensus on single-column, one-typeface-with-weight-range, hairline rules, right-flush dates, margin discipline.

Templates to avoid as a base: `vercanard` (GPL-3).

## Risks

1. **typst.ts feature lag**: stick to stable primitives; no external Typst packages in v1.
2. **WASM bundle size**: ~3-5MB plus Inter fonts. Lazy-load on first render, show "Preparing renderer..." state.
3. **MDX exotic content**: arbitrary JSX, imports, non-spec components are dropped. BYO import warns about unsupported nodes.
4. **IndexedDB in private mode**: graceful in-memory fallback with warning; non-fatal.

## Open questions (not v1-blocking)

- **Template extensibility API**: when we add templates, what's the interface? Likely schema-to-Typst function plus fonts manifest; worth a small design doc before v2.
- **Schema versioning**: trivial for v1 (one schema), but saved IDB state will need a `version` field and migration runner as schema evolves.
- **PDF/A export**: Typst supports PDF/A-2u and PDF/A-3u; add when there is a real ask from HR-system users.

## Success criteria (v1)

- A user can open the app, fill the form, and download a PDF that looks professionally typeset.
- A user can paste or upload a valid MDX resume and see it render.
- Round-trip: form edit → MDX tab → form edit produces no content loss.
- Preview updates in under 300ms from keystroke to on-screen SVG on a mid-range laptop.
- App loads and is interactive (form usable) before the Typst worker finishes booting.
- No backend. Static deploy works on any CDN.
