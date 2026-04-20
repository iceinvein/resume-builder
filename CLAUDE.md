
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

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

