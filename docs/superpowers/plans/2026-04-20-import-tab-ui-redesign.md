# Import MDX tab UI redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Import MDX tab into a single progressive import surface with matching chrome to the MDX tab, live parse feedback, and a single explicit commit action.

**Architecture:** One self-contained React component (`ImportTab`) with local state for buffer, parse result, drag state, and content source. A new co-located CSS file (`import-tab.css`) carries all styling through design tokens, following the same file-level pattern as `mdx-editor.css`. No store surface changes; commit still flips `resume` and `tab` on `resumeStore`.

**Tech Stack:** React 18 + TypeScript, Tailwind CSS 4 + hand-rolled tokens (`src/ui/theme/tokens.css`), Zustand vanilla store, `@testing-library/react` + `userEvent` on happy-dom for unit tests, `bun test` as runner. Parser is `parseMdxToResume` from `src/mdx/parse.ts`.

**Spec:** `docs/superpowers/specs/2026-04-20-import-tab-ui-design.md`.

---

## File structure

- Create: `src/ui/editor/import-tab.css`
- Modify: `src/ui/editor/import-tab.tsx` (full rewrite, same export)
- Create: `src/ui/editor/import-tab.test.tsx` (co-located, matches `src/ui/form/*.test.tsx` pattern)

No other files change. The component is still consumed by `src/ui/app.tsx` via its default named export `ImportTab`.

---

## Task 1: Add the import-tab stylesheet

**Files:**
- Create: `src/ui/editor/import-tab.css`

All classes are token-only; no hardcoded colors. Class cadence mirrors `.mdx-editor-*` so the two tabs read as siblings.

- [ ] **Step 1: Create `src/ui/editor/import-tab.css`**

```css
/*
 * Import tab styling. The import surface is a single card with a toolbar,
 * a swappable primary surface (empty vs filled), and an action bar. The
 * class cadence mirrors mdx-editor.css so both tabs read as siblings of
 * the same editor chrome family.
 */

.import-tab {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 0;
  background: var(--color-surface-muted);
  color: var(--color-text);
}

/* ---- Toolbar strip --------------------------------------------------- */

.import-tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-canvas);
  border-bottom: var(--border-hairline) solid var(--color-border-subtle);
}

.import-tab-title {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

.import-tab-title-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 16%, transparent);
}

.import-tab-toolbar-right {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.import-tab-status-chip {
  padding: 0.125rem var(--space-2xs);
  border: var(--border-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.import-tab-status-chip.is-ok {
  color: var(--color-success-soft-text);
  border-color: color-mix(in oklab, var(--color-success) 35%, transparent);
}

.import-tab-status-chip.is-error {
  color: var(--color-danger-soft-text);
  border-color: color-mix(in oklab, var(--color-danger) 35%, transparent);
}

/* ---- Primary surface ------------------------------------------------- */

.import-tab-surface {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: var(--space-md);
  border: var(--border-hairline) dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-canvas);
  overflow: hidden;
  transition: background-color 120ms ease, border-color 120ms ease;
}

.import-tab-surface.is-dragging {
  border-color: var(--color-accent);
  border-style: solid;
  background: color-mix(in oklab, var(--color-accent) 6%, var(--color-canvas));
}

.import-tab-surface.is-filled {
  border-style: solid;
  border-color: var(--color-border-subtle);
}

.import-tab-dropzone {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-text-secondary);
}

.import-tab-dropzone-icon {
  width: 28px;
  height: 28px;
  color: var(--color-text-tertiary);
}

.import-tab-dropzone-headline {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: var(--track-tight);
}

.import-tab-dropzone-row {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
}

.import-tab-dropzone-caption {
  max-width: 42ch;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: var(--leading-snug);
}

.import-tab-source-hint {
  padding: var(--space-2xs) var(--space-md);
  background: var(--color-canvas);
  border-bottom: var(--border-hairline) solid var(--color-border-subtle);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--color-text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.import-tab-preview {
  flex: 1;
  min-height: 0;
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  padding: var(--space-md);
  background: transparent;
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.65;
  white-space: pre-wrap;
}

.import-tab-preview:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--color-accent) 40%, transparent);
}

/* ---- Hidden file input ---------------------------------------------- */

.import-tab-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---- Action bar ------------------------------------------------------ */

.import-tab-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-canvas);
  border-top: var(--border-hairline) solid var(--color-border-subtle);
}

.import-tab-pill {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-xs);
  min-width: 0;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.import-tab-pill-label {
  font-family: var(--font-sans);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-tight);
  color: var(--color-text);
}

.import-tab-pill-body {
  font-family: var(--font-mono);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.import-tab-pill.is-error .import-tab-pill-label {
  color: var(--color-danger-soft-text);
}

.import-tab-pill.is-error .import-tab-pill-body {
  color: var(--color-danger-soft-text);
}

.import-tab-action-bar-right {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.import-tab-warning-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0.125rem var(--space-xs);
  border-radius: var(--radius-xs);
  background: var(--color-warning-soft);
  color: var(--color-warning-soft-text);
  font-size: 0.6875rem;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/ui/editor/import-tab.css
git commit -m "feat(ui): add import-tab stylesheet scaffold"
```

---

## Task 2: Write failing tests for the rewritten Import tab

**Files:**
- Create: `src/ui/editor/import-tab.test.tsx`

These tests capture the full behavior surface from the spec. They will fail against the current component (which lacks the status chip, pill, and a live-parse surface). Subsequent tasks implement each behavior until the file passes as a whole.

- [ ] **Step 1: Create `src/ui/editor/import-tab.test.tsx`**

```tsx
import { test, expect, beforeEach } from "bun:test";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportTab } from "./import-tab";
import { resumeStore } from "../../state/store";
import { emptyResume } from "../../schema/defaults";

const VALID_MDX = `---
name: Plan Test
---

<Contact email="plan@example.com" />

## Experience

<Experience company="Acme" role="Engineer" start="2023-01" end="present">
- Did work
</Experience>
`;

const INVALID_MDX = `---
name: Broken
---

<Experience company="x"
- no closing tag
`;

beforeEach(() => {
  resumeStore.setState({ resume: emptyResume, tab: "import" });
});

test("empty state renders headline, Browse button, and paste kbd hint", () => {
  render(<ImportTab />);
  expect(screen.getByText(/Drop an \.mdx file here/i)).toBeDefined();
  expect(screen.getByRole("button", { name: /Browse files/i })).toBeDefined();
  expect(screen.getByText(/paste to fill the canvas/i)).toBeDefined();
  expect(screen.getByText(/Empty/i)).toBeDefined();
  cleanup();
});

test("typing valid MDX populates the parsed pill and enables Import", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);

  await waitFor(() =>
    expect(screen.getByText(/Plan Test/)).toBeDefined(),
  );
  expect(screen.getByText(/1 experience entry/)).toBeDefined();
  const importBtn = screen.getByRole("button", { name: /^Import$/ }) as HTMLButtonElement;
  expect(importBtn.disabled).toBe(false);
  cleanup();
});

test("typing invalid MDX shows the error pill and disables Import", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(INVALID_MDX);

  await waitFor(() => {
    const pill = screen.getByRole("status");
    expect(pill.textContent ?? "").toMatch(/error|parse/i);
  });
  const importBtn = screen.getByRole("button", { name: /^Import$/ }) as HTMLButtonElement;
  expect(importBtn.disabled).toBe(true);
  cleanup();
});

test("Import click commits parsed resume and switches to form tab", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  await user.click(screen.getByRole("button", { name: /^Import$/ }));

  expect(resumeStore.getState().resume.meta.name).toBe("Plan Test");
  expect(resumeStore.getState().tab).toBe("form");
  cleanup();
});

test("dirty draft shows Replaces current draft warning and renames Import to Replace draft", async () => {
  resumeStore.setState({
    resume: { ...emptyResume, meta: { ...emptyResume.meta, name: "Existing" } },
    tab: "import",
  });
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  expect(screen.getByText(/Replaces current draft/i)).toBeDefined();
  expect(screen.getByRole("button", { name: /Replace draft/i })).toBeDefined();
  cleanup();
});

test("Clear button resets the canvas to empty and does not touch the store", async () => {
  const user = userEvent.setup();
  render(<ImportTab />);

  await user.paste(VALID_MDX);
  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());

  await user.click(screen.getByRole("button", { name: /Clear/i }));

  expect(screen.getByText(/Drop an \.mdx file here/i)).toBeDefined();
  expect(resumeStore.getState().resume).toEqual(emptyResume);
  cleanup();
});

test("dropping an .mdx file loads content and fires parse", async () => {
  render(<ImportTab />);
  const region = screen.getByRole("region", { name: /Import MDX/i });

  const file = new File([VALID_MDX], "plan.mdx", { type: "text/markdown" });
  fireEvent.drop(region, { dataTransfer: { files: [file] } });

  await waitFor(() => expect(screen.getByText(/Plan Test/)).toBeDefined());
  expect(screen.getByText(/Loaded from plan\.mdx/i)).toBeDefined();
  cleanup();
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `bun test src/ui/editor/import-tab.test.tsx`

Expected: every test fails (or throws) because the current `ImportTab` has neither a status chip, a status-role pill, a Clear button, a Browse button, nor live parsing.

- [ ] **Step 3: Commit failing tests**

```bash
git add src/ui/editor/import-tab.test.tsx
git commit -m "test(ui): add failing import-tab redesign tests"
```

---

## Task 3: Rewrite the Import tab component

**Files:**
- Modify: `src/ui/editor/import-tab.tsx` (full rewrite)

One commit. The rewrite replaces the component end-to-end; there is no intermediate viable state between the old and new shape, so a staged rewrite would invent half-states the design does not want. The tests from Task 2 will flip from failing to passing.

- [ ] **Step 1: Replace the contents of `src/ui/editor/import-tab.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { parseMdxToResume } from "../../mdx/parse";
import { resumeStore } from "../../state/store";
import { useResumeStore } from "../shell/use-store";
import { emptyResume } from "../../schema/defaults";
import type { Resume } from "../../schema/resume";
import { Button } from "../primitives/button";
import { Kbd } from "../theme/kbd";
import "./import-tab.css";

const PARSE_DEBOUNCE_MS = 250;

type Source = "drop" | "paste" | "browse" | null;
type ParseStatus = "idle" | "parsing" | "ok" | "error";

function isResumeDirty(r: Resume): boolean {
  return JSON.stringify(r) !== JSON.stringify(emptyResume);
}

function experienceLabel(n: number): string {
  return `${n} experience ${n === 1 ? "entry" : "entries"}`;
}

function UploadIcon() {
  return (
    <svg
      className="import-tab-dropzone-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function ImportTab() {
  const currentResume = useResumeStore((s) => s.resume);
  const dirty = useMemo(() => isResumeDirty(currentResume), [currentResume]);

  const [text, setText] = useState("");
  const [source, setSource] = useState<Source>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);

  const [parsed, setParsed] = useState<Resume | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>("idle");

  const [isDragging, setIsDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!text) {
      setParsed(null);
      setParseError(null);
      setParseStatus("idle");
      return;
    }
    setParseStatus("parsing");
    const handle = setTimeout(() => {
      parseMdxToResume(text)
        .then((r) => {
          setParsed(r);
          setParseError(null);
          setParseStatus("ok");
        })
        .catch((e: Error) => {
          setParsed(null);
          setParseError(e.message);
          setParseStatus("error");
        });
    }, PARSE_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [text]);

  const onFile = async (f: File, from: Source) => {
    const src = await f.text();
    setText(src);
    setSource(from);
    setSourceName(f.name);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const ok =
      f.type === "text/markdown" ||
      f.name.endsWith(".mdx") ||
      f.name.endsWith(".md");
    if (!ok) {
      setText("");
      setSource(null);
      setSourceName(null);
      setParsed(null);
      setParseError(`Unsupported file type: ${f.type || "unknown"}`);
      setParseStatus("error");
      return;
    }
    onFile(f, "drop");
  };

  const onPasteCapture = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (text) return;
    const pasted = e.clipboardData.getData("text/plain");
    if (!pasted) return;
    e.preventDefault();
    setText(pasted);
    setSource("paste");
    setSourceName(null);
  };

  const onClear = () => {
    setText("");
    setSource(null);
    setSourceName(null);
    setParsed(null);
    setParseError(null);
    setParseStatus("idle");
  };

  const onImport = () => {
    if (!parsed) return;
    resumeStore.setState({ resume: parsed, tab: "form" });
  };

  const statusChip =
    parseStatus === "ok" ? { label: "Parsed", cls: "is-ok" as const }
    : parseStatus === "error" ? { label: "Error", cls: "is-error" as const }
    : !text ? { label: "Empty", cls: "" as const }
    : parseStatus === "parsing" ? { label: "Parsing…", cls: "" as const }
    : { label: `${text.split("\n").length} ln`, cls: "" as const };

  const pill = !text ? null
    : parseStatus === "parsing" ? { tone: "neutral" as const, label: "Parsing", body: "…" }
    : parseStatus === "error" && parseError ? {
        tone: "error" as const,
        label: "Parse error",
        body: parseError.split("\n")[0] ?? parseError,
      }
    : parsed ? {
        tone: "neutral" as const,
        label: "Parsed",
        body: `${parsed.meta.name || "Untitled"}, ${experienceLabel(parsed.experience.length)}`,
      }
    : null;

  const canImport = Boolean(parsed);

  return (
    <div
      className="import-tab"
      role="region"
      aria-label="Import MDX"
      onPasteCapture={onPasteCapture}
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setIsDragging(false);
      }}
      onDrop={onDrop}
      tabIndex={0}
    >
      <div className="import-tab-toolbar">
        <span className="import-tab-title">
          <span className="import-tab-title-dot" aria-hidden />
          Import MDX
        </span>
        <div className="import-tab-toolbar-right">
          <span className={`import-tab-status-chip ${statusChip.cls}`}>
            {statusChip.label}
          </span>
          {text && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <div
        className={
          "import-tab-surface" +
          (isDragging ? " is-dragging" : "") +
          (text ? " is-filled" : "")
        }
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mdx,.md,text/markdown"
          className="import-tab-file-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f, "browse");
            e.target.value = "";
          }}
        />

        {!text && (
          <div className="import-tab-dropzone">
            <UploadIcon />
            <span className="import-tab-dropzone-headline">
              {isDragging ? "Drop to load" : "Drop an .mdx file here"}
            </span>
            <span className="import-tab-dropzone-row">
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </Button>
              <span>or</span>
              <Kbd>⌘V</Kbd>
              <span>paste to fill the canvas</span>
            </span>
            <span className="import-tab-dropzone-caption">
              Frontmatter plus MDX body with &lt;Experience&gt;, &lt;Project&gt;,
              and &lt;Skill&gt; blocks.
            </span>
          </div>
        )}

        {text && (
          <>
            <div className="import-tab-source-hint">
              {source === "drop" && sourceName ? `Loaded from ${sourceName}`
                : source === "browse" && sourceName ? `Loaded from ${sourceName}`
                : "Pasted content"}
            </div>
            <textarea
              className="import-tab-preview font-mono"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              aria-label="MDX buffer"
            />
          </>
        )}
      </div>

      <div className="import-tab-action-bar">
        <div
          className={`import-tab-pill ${pill?.tone === "error" ? "is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {pill && (
            <>
              <span className="import-tab-pill-label">{pill.label}</span>
              <span className="import-tab-pill-body">{pill.body}</span>
            </>
          )}
        </div>
        <div className="import-tab-action-bar-right">
          {dirty && parsed && (
            <span className="import-tab-warning-badge" role="note">
              Replaces current draft
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onImport}
            disabled={!canImport}
          >
            {dirty && parsed ? "Replace draft" : "Import"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the import-tab unit tests**

Run: `bun test src/ui/editor/import-tab.test.tsx`

Expected: all 7 tests pass.

- [ ] **Step 3: Run the full suite to confirm no regressions**

Run: `bun test`

Expected: all tests pass. If the paste-based tests flake because of a missing `clipboardData` stub, re-run with `--timeout 10000`. The parser is async, so allow for the 250ms debounce; `waitFor` already retries up to 1000ms by default.

- [ ] **Step 4: Typecheck**

Run: `bun run typecheck`

Expected: zero errors. If `exactOptionalPropertyTypes` flags any prop, narrow the type rather than widening to `undefined`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/editor/import-tab.tsx
git commit -m "feat(ui): rewrite import tab as a unified preview-first surface"
```

---

## Task 4: Manual browser smoke via agent-browser

**Files:** none (verification only)

Per `CLAUDE.md`: after UI changes, use the `agent-browser` skill (not Playwright) to confirm the page renders and the new surface behaves.

- [ ] **Step 1: Start the dev server**

Run: `bun run dev`

Wait for Vite to print the dev URL (default `http://localhost:3000`).

- [ ] **Step 2: Drive the Import tab with agent-browser**

Use the `agent-browser` skill to:

1. Navigate to the dev URL.
2. Click the `Import` tab in the top nav.
3. Confirm the empty state shows the `Drop an .mdx file here` headline, the `Browse files` button, and the `⌘V` kbd chip.
4. Confirm the status chip reads `Empty`.
5. Paste the contents of `fixtures/minimal.mdx` into the region and wait for the pill to read `Parsed Min Resume, 1 experience entry`.
6. Click `Import`. Confirm the app switches to the `Form` tab and the contact email field holds `min@example.com`.
7. Switch back to `Import`. Confirm the empty state is restored (fresh component mount) OR that the previous buffer is present; either is acceptable since component state is local to the tab mount.

- [ ] **Step 3: Stop the dev server**

Kill the background dev server process.

- [ ] **Step 4: Commit (only if the smoke pass required any follow-up tweaks)**

If no tweaks were needed, skip this commit. If you changed CSS or handlers in response to what you saw, commit:

```bash
git add src/ui/editor/
git commit -m "fix(ui): address import-tab smoke findings"
```

---

## Self-review

**Spec coverage:**

- Header + status chip + Clear: Task 1 (CSS), Task 3 (markup).
- Empty state with icon, Browse, kbd, caption: Task 1 (CSS), Task 3 (markup).
- Filled state with source hint + editable monospace preview: Task 1 (CSS), Task 3 (markup).
- Preview-first flow for drop, paste, and browse: Task 3, covered by tests 4 and 7 in Task 2.
- Live parse with 250ms debounce + pill states: Task 3 `useEffect` + Task 2 tests 2 and 3.
- Dirty-draft inline warning + Import -> Replace draft rename: Task 3 + Task 2 test 5.
- Drag-over styling, drop-surface region semantics, paste capture: Task 1 + Task 3.
- A11y (role=region, status pill live region, tabIndex for paste capture): Task 3.
- Tests per spec: Task 2 covers the six behaviors the spec calls out, plus one for drop.
- Agent-browser smoke: Task 4.

**Placeholder scan:** none spotted. All steps show the full code.

**Type consistency:** `Source`, `ParseStatus`, `Resume` all defined once and used consistently. `experienceLabel` is a single helper reused in both the pill body and the tests' assertion text.

**Scope check:** single tab, single card, three files. Does not need sub-project decomposition.

**Ambiguity check:** test 7 uses `fireEvent.drop` rather than `userEvent` because happy-dom's `userEvent` does not model `dataTransfer.files`. This is documented inline in the test and is the standard RTL pattern for drop tests.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-import-tab-ui-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)**: I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution**: Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
