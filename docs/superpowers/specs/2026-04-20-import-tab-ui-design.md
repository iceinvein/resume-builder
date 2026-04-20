---
title: Import MDX tab UI redesign
date: 2026-04-20
status: approved
---

# Import MDX tab UI redesign

## Context

The MDX tab recently gained proper editor chrome (toolbar, status bar, tuned
CodeMirror canvas; commit `295c2e9`). The Import tab
(`src/ui/editor/import-tab.tsx`) still looks like a scaffolding step: inline
styles, a raw `<input type="file">`, an unlabelled `<textarea>`, a draft-replace
card that floats above the layout, and three separate status affordances
(pending replace card, error block, success caption).

Goal: bring the Import tab up to the same finish level as the MDX tab, and
unify the three input paths (drop, paste, browse) into a single progressive
import surface with one shared commit action.

## Scope

In-scope:

- Visual and structural redesign of `src/ui/editor/import-tab.tsx`.
- New dedicated stylesheet for the import surface (tokens only, no hardcoded
  colors). Follows the same file-level pattern as `mdx-editor.css`.
- Behavior change: every import path now flows through a preview step before
  committing. No more auto-commit on clean draft when a file is dropped.
- Inline draft-replace warning folded into the action bar. No top-of-pane
  alertdialog card.
- Live parse of the pasted / loaded MDX with a small debounce so the status
  pill and action button reflect the current buffer.

Out of scope:

- CodeMirror in the Import tab. The monospace preview stays as a styled
  `<textarea>` to keep this tab lightweight (that's what the MDX tab is for).
- Changes to `parseMdxToResume` or to the Resume schema. The parser surface is
  reused as-is.
- Changes to the draft-persistence or undo pipeline.
- New features: no version diffing, no "merge into current draft" path, no
  sample-template dropdown. Those were explicitly not asked for.

## Users and intent

Two entry points matter:

1. A user returning with an existing `.mdx` resume wants to drop or browse a
   file and see that the tool understood it, then commit.
2. A user pasting MDX from elsewhere wants to paste, glance at a parse
   summary, and commit.

Both paths should feel identical after the first action. The new design
treats drop, paste, and browse as three ways to populate the same canvas;
commit is always one explicit action.

## Shape

Single card laid out as four stacked regions, matching the MDX tab's visual
language:

```
+----------------------------------------------------------+
| header:   Import MDX              status chip   [ Clear ]|
+----------------------------------------------------------+
|                                                          |
|   primary surface                                        |
|     - empty state: drop target + Browse + paste kbd hint |
|     - filled state: monospace preview (editable)         |
|                                                          |
+----------------------------------------------------------+
| action bar:  parse pill              [Import  ▸]         |
|              (replace-draft warning folds in when dirty) |
+----------------------------------------------------------+
```

### 1. Header

- Matches `.mdx-editor-toolbar` spacing and typography.
- Left: `Import MDX` label using the same filename-dot + mono treatment.
- Right: a status chip that mirrors `mdx-editor-meta-chip` but carries state:
  - `Empty` (tertiary)
  - `n ln / m ch` (when filled but not yet parsed)
  - `Parsed` (success)
  - `Error` (danger)
- `Clear` ghost button appears only when the surface has content. Resets
  textarea to empty and status to `Empty`. Does not touch the live Resume.

### 2. Primary surface

Two states, single container, swap contents based on whether `text` is empty.

**Empty state** (no content yet):

- Large warm canvas filling the vertical space.
- Centered stack: 16-20px icon (upload cloud, single stroke; token color
  `--color-text-tertiary`), then headline `Drop an .mdx file here`, then
  secondary row: styled `Browse files` primary-ghost button + a kbd chip
  reading `⌘V` with the label `paste to fill the canvas`.
- Below, one small caption explaining the shape: `Frontmatter plus MDX body`
  `with <Experience>, <Project>, and <Skill> blocks.`
- Dashed hairline border (`var(--border-hairline)`) on the outer canvas.
- Drag-over state: accent border, background warms one step
  (`color-mix(in oklab, var(--color-accent) 6%, var(--color-surface-muted))`),
  caption swaps to `Drop to load`. No scale transform.
- Paste anywhere inside the surface populates the textarea (handled by a
  `paste` listener on the container, falling through to the native textarea
  when filled).

**Filled state** (content present):

- The canvas becomes a scrollable monospace preview. Implementation: a styled
  `<textarea>` with the mono font tokens, line wrapping, padded gutter, no
  visible border (the card border covers it), `min-height` matching the empty
  state so switching states doesn't reflow the card.
- A tiny hint row above the textarea: `Loaded from <filename>` when source is
  a file, or `Pasted content` when source is paste. Fades to tertiary after
  a few seconds (no animation library; a CSS opacity transition via a
  data-attribute toggled by a `setTimeout`).
- Dropping another file over the filled state replaces the content (no
  modal; the action bar already guards the commit).

### 3. Action bar

- Sticky bottom of the card, same height language as `.mdx-editor-status`.
- Left: parse-result pill. States:
  - `Parsed Jane Doe, 3 experience entries`
  - `Parsed <unnamed>, 0 experience entries` (still valid; button enabled)
  - `Line 12: unexpected JSX closing tag` (danger tone, mono font for the
    diagnostic portion, sans for the prefix). Multi-line errors truncate to
    the first line with a `more` affordance that expands in-place.
  - `Parsing…` while the debounce is in-flight (subtle, no spinner; just
    tertiary text).
  - Hidden entirely when the canvas is empty.
- Right: primary `Import` button. Disabled when empty or when parse errored.
- When the current draft is dirty (same detector as today, `isResumeDirty`),
  a warning badge appears between the pill and the button:
  `Replaces current draft`. The button label swaps to `Replace draft`. No
  modal dialog.

### 4. Error and success feedback

- Parse errors live inside the action bar pill. The top-level red block and
  the green success caption from the current implementation are removed.
- On successful import: the tab switches to Form as it does today, so no
  lingering success message is needed in this pane.

## Behavior change: preview-first for every path

Today, dropping or browsing a file calls `attemptImport` immediately and, if
the current draft is clean, commits without confirmation. The redesign folds
all three paths through the preview step:

- Drop / browse loads the file's text into the textarea, sets a `source`
  hint, fires live parse.
- Paste sets the text and fires live parse.
- `Import` is the only commit. When draft is dirty, `Import` label becomes
  `Replace draft` and the warning badge appears.

Trade-off: one extra click on the previous happy path (clean draft + file
drop). Gain: the user sees the parse summary before committing on every
path, no hidden auto-commit behavior to learn, and the dirty-draft path
stops needing a separate alertdialog.

## Live parsing

- Run `parseMdxToResume` on the current buffer with a 250ms trailing debounce.
- Parser is already async and pure, so this is a `useEffect` keyed on `text`
  with a `setTimeout` + cleanup.
- Success updates the pill to `Parsed <name>, <n> experience entries` and
  caches the parsed `Resume` in component state so `Import` does not re-parse.
- Failure updates the pill to the error message and clears the cached resume;
  `Import` is disabled.
- When `text` is empty, both pill and cached resume are cleared.

## Components and files

- `src/ui/editor/import-tab.tsx`: rewritten. All inline styles removed.
  Uses the new CSS classes.
- `src/ui/editor/import-tab.css`: new. All import-tab-specific classes. Token
  only. Matches the naming cadence of `mdx-editor.css`
  (`.import-tab`, `.import-tab-toolbar`, `.import-tab-surface`,
  `.import-tab-surface.is-dragging`, `.import-tab-surface.is-filled`,
  `.import-tab-dropzone`, `.import-tab-preview`, `.import-tab-action-bar`,
  `.import-tab-pill`, `.import-tab-pill.is-error`, `.import-tab-warning`).
- `src/ui/primitives/button.tsx`: reused, no changes. `Browse files` renders
  as a `variant="primary"` button that owns a ref to a hidden
  `<input type="file">` elsewhere in the tree and calls `.click()` on press.
  (Not a `<label>`, so we keep the `Button` primitive's styling and
  keyboard semantics.)
- Icon: no icon library in tree today. Inline a single-stroke SVG directly in
  `import-tab.tsx`. Current-color stroke so the token handles light / dark.

No other files change.

## State machine

Component-local state (no store changes):

```
text: string
source: "drop" | "paste" | null           // for the hint row; cleared by Clear
parsed: Resume | null                      // latest successful parse
parseError: string | null
parseStatus: "idle" | "parsing" | "ok" | "error"
isDragging: boolean
```

Transitions:

- `onDrop(file)` -> read text, `source = "drop"`, kick parse.
- `onPaste` anywhere in surface -> write through to textarea, `source = "paste"`.
- Textarea change -> `text` update, debounced parse.
- Parse success -> `parsed`, `parseStatus = "ok"`, clear error.
- Parse failure -> `parseError`, `parseStatus = "error"`, clear `parsed`.
- `Clear` -> reset all component state. Does not touch the store.
- `Import` click -> if `parsed` is set, `resumeStore.setState({ resume: parsed, tab: "form" })`.

Dirty-draft warning is derived, not stored: compare current store resume
against `emptyResume` on every render (cheap; same check as today).

## Edge cases

- Empty textarea: action bar hidden, `Import` not reachable.
- Large paste (e.g. 5000 lines): debounced parse keeps the UI responsive;
  the textarea is already scrollable; no virtualization needed for this tab.
- Parse returns a valid resume with zero experience entries: `Import` is
  enabled. The pill says `Parsed <name or 'Untitled'>, 0 experience entries`.
- File that isn't text or is wildly long: `.mdx`, `.md`, and `text/markdown`
  continue to be the only accepts. Non-matching files are ignored by the
  native `accept` attribute; dropped files outside this set show the error
  pill with `Unsupported file type: <mime>`.
- Drag leaves without drop: `isDragging` resets on `dragleave` with a ref
  counter to survive nested child `dragleave` events.
- Reduced motion: no motion in this surface. Drag-over uses only color and
  border, not transform.

## Accessibility

- Drop surface is a `<div role="region" aria-label="Import MDX">` with a
  visible label. The dropzone's instructions are in real text, not alt text.
- `Browse files` is a real `<button>` that triggers the hidden file input.
- Paste capture: the container has `tabIndex={0}` so it can hold focus, and
  the `paste` event on the container catches paste whether the user is
  focused on the surface or the textarea. A visible kbd chip announces the
  shortcut so keyboard users don't have to guess.
- Parse pill uses `role="status"` with `aria-live="polite"`.
- Error text in the pill is read by the same live region; we avoid
  `role="alert"` to prevent interrupting keyboard-driven paste iterations.
- Focus order: Browse button, textarea, Clear, Import. Focus ring reuses the
  existing accent token.

## Testing

Existing tests for `parseMdxToResume` and the store are unchanged. New tests:

- `tests/ui/import-tab.test.tsx` (new, happy-dom):
  - Empty state renders Browse button and kbd hint.
  - Typing invalid MDX eventually shows the error pill and disables Import.
  - Typing valid MDX eventually shows the parsed summary and enables Import.
  - Clicking Import with a parsed resume updates the store and flips
    `resumeStore.tab` to `"form"`.
  - When current draft is dirty, the warning badge appears and the button
    label becomes `Replace draft`.
  - Clear resets component state but does not touch the store.

Manual smoke via agent-browser (per CLAUDE.md): switch to Import tab, drop
`fixtures/minimal.mdx`, confirm parse pill, click Import, confirm Form tab
activates and the drafted resume is populated.

## Risks

- Live parsing on every keystroke could be annoying if parse errors flicker.
  Mitigated by the 250ms debounce and by keeping the pill in a single slot
  (no stacked toast history).
- The preview textarea can be edited in place; a user could make it diverge
  from the source file on disk without noticing. The `Loaded from <name>`
  hint plus the explicit `Import` commit make this easy to understand; the
  MDX tab remains the authoritative editor.
- Behavior change for muscle memory: users who relied on "drop auto-imports"
  will need one extra click. Acceptable given the reliability gain and the
  consistency of one commit path.

## Non-goals

- No template picker, no "start from example" button. Empty state stays a
  drop / paste prompt.
- No file history. One active buffer at a time.
- No diff view between current draft and incoming resume.
