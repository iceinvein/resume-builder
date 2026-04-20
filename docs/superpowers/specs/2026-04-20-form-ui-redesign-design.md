# Form tab UI redesign

Date: 2026-04-20
Status: Approved, awaiting implementation plan

## Problem

The Form tab is the primary authoring surface of the resume builder, and
today it does not feel like a well-designed workshop tool. Every section
(Meta, Contact, Experience, Education, Skills, Projects, Extras) is rendered
in a single long scroll inside a constrained `68ch` column. Within each
section, repeating items (roles, education entries, projects, skill groups,
links) are dense `.card` blocks whose fields are shoved into 2- and 3-column
grids with inline `style={{}}` spacing. Key fields use primitives that do
not match the product's stated care level: `tech` and `skills` are raw
comma-separated text inputs, and `bullets` is one textarea with markdown
crammed in. Reordering experience entries is a pair of "Up" / "Down"
buttons.

The user described the form as "a mess" and the UI as "dog shit" and asked
for a ground-up redo using shadcn with Base UI as primitives.

## Goals

1. A Form tab that feels like the rest of the product aspires to: refined
   utilitarian, keyboard-first, warm-paper aesthetic, generous but earned
   density.
2. Real component primitives for the fields that currently feel flat:
   chip input for tag-style lists, a per-row bullet editor with drag
   reorder, a proper month/year picker, drag-to-reorder for repeating
   cards.
3. A section rail that makes long resumes navigable without hiding content
   from the rest of the app.
4. A styling foundation (Tailwind v4 layered over the existing token system)
   that lets us adopt shadcn and Base UI without giving up the established
   design language.

## Non-goals

- No changes to MDX tab, Import tab, top bar, preview pane, command
  palette, empty state, toasts, env checks, shortcuts, TwoPane resizer.
- No changes to the resume schema, the zustand store shape, or the
  persistence layer.
- No dark-mode retuning; dark inherits from existing tokens.
- No new sections or new fields on existing sections.
- No rich-text editor for bullets. Markdown source remains the authoring
  contract, consistent with the MDX tab.

## Current state (summary)

- Vite + React 18 + TypeScript. No Tailwind, no component library.
- Styling is a pure CSS custom-property token system in
  `src/ui/theme/tokens.css` plus hand-written component CSS in
  `src/ui/theme/components.css`.
- Fonts: Hanken Grotesk (UI, body) + Azeret Mono (MDX editor, kbd chips,
  tabular figures).
- `src/ui/form/form-tab.tsx` renders all seven sections stacked in a single
  grid. Each repeating item is a `.card` div with ad hoc inline styles.
- `src/ui/form/fields.tsx` provides `Label`, `TextField`, `TextArea`, `Row`,
  `Grid` helpers over bare HTML elements.
- `src/ui/form/bullet-editor.tsx` is a textarea; each line is one bullet;
  markdown is parsed on change via `mdToInlineNodes`.
- `src/ui/form/date-field.tsx` is a Month/Year/Present composite.
- Reorder is Up/Down buttons in `experience-section.tsx`, etc.
- Zustand store in `src/state/store.ts`. Autosave and undo operate on the
  store and are independent of the form components.

## Design

### 1. Form tab layout

Inside the left pane of the existing `TwoPane`, the Form tab becomes a
two-column composition:

```
Form pane
  Section rail (~200px, sticky, not scrollable)
    Meta
    Contact
    Experience  3
    Education   1
    Skills
    Projects
    Extras
  Section body (flex 1, scrollable)
    Section header: title + hint (same copy as today)
    Section content (fields, or a list of repeating cards)
    + Add <item> (when applicable)
```

Only one section is rendered at a time in the body; switching is instant
and scroll resets to the top. Section counts next to the rail row show the
number of repeating items when non-zero (e.g. `Experience 3`).

Rail keyboard behaviour: arrow keys move focus within the rail list;
Enter activates. Active section has a left accent bar and bold text,
matching the treatment used on the top-level tabs.

Narrow viewport (`max-width: 900px`): the rail collapses into a horizontal
segmented control above the section body. `TwoPane` already stacks
vertically at this breakpoint, so the form stays usable in one column.

### 2. Styling foundation

Add Tailwind v4 as a utility layer over the existing tokens; tokens stay
the source of truth.

1. `bun add -d tailwindcss@latest @tailwindcss/vite`. Register the Vite
   plugin in `vite.config.ts`.
2. `src/ui/theme/tokens.css` is unchanged and remains canonical for
   `--color-*`, `--space-*`, `--radius-*`, `--text-*`, `--font-*`,
   `--duration-*`, `--ease-*`.
3. New `src/ui/theme/tailwind.css` imports Tailwind and declares an
   `@theme` block that re-exports tokens to Tailwind's theme namespaces.
   Example entries:
   - `--color-canvas: var(--color-canvas);`
   - `--color-surface-raised: var(--color-surface-raised);`
   - `--color-accent: var(--color-accent);`
   - `--spacing-md: var(--space-md);`
   - `--radius-sm: var(--radius-sm);`
   - `--font-sans: var(--font-sans);`
   - `--font-mono: var(--font-mono);`
   This makes `bg-canvas`, `border-subtle`, `rounded-sm`, `p-md`,
   `font-sans` valid Tailwind utilities backed by our tokens.
4. `index.html` loads `tailwind.css`; `tailwind.css` imports `tokens.css`
   first so `@theme` references resolve.
5. Most of `src/ui/theme/components.css` is retired as components move to
   Tailwind. Keep: `prefers-reduced-motion` media query, toast keyframes,
   `.palette*` rules (command palette is out of scope), pane resizer
   rules. Those are either global or scoped to surfaces we are not
   changing.

Dark mode keeps using the existing mechanism (no change needed; tokens
already flip).

Fallback if Tailwind v4 + shadcn Base UI registry conflict: Tailwind v3
with a `tailwind.config.ts` that reads token values via
`getComputedStyle` at build time. Try v4 first.

### 3. Component library

Adopt shadcn with the Base UI registry. Install source, do not depend on
`@shadcn/ui` as a runtime package.

1. `bunx shadcn@latest init` pointed at `src/ui/primitives/` (not the
   default `components/ui`). Use the Base UI registry URL.
2. Runtime dep: `@base-ui-components/react`. Base UI ships zero styles;
   all visual treatment comes from our Tailwind classes.
3. `src/ui/lib/cn.ts` exports `cn` (clsx + tailwind-merge).

Primitives installed from the registry:

- Form atoms: `button`, `input`, `label`, `textarea`, `select`,
  `separator`
- Layout: `tabs` (for the section rail, vertical orientation), optional
  `scroll-area` if the section body needs a styled scrollbar
- Disclosure: `collapsible` (for repeating item cards)
- Overlay: `popover` (date picker)
- Feedback: `tooltip` (kbd hints on icon buttons)

Custom primitives (built on Base UI, not from the registry):

- `ChipInput`
- `BulletList`
- `SortableList` (wraps `@dnd-kit/sortable`)
- `MonthYearPicker`
- `SectionRail`
- `FormCard` (collapsible wrapper for repeating items)

Not used:

- Dialog: command palette already exists and is out of scope.
- Toast / sonner: existing toast system stays.
- Form (react-hook-form wrapper): the app is directly controlled against
  zustand with autosave; adding RHF would fight that pattern.

### 4. Field primitives

#### ChipInput

Replaces: comma-separated `TextField` for `tech` (experience, projects)
and `items` (skills groups).

- Value: `string[]`; `onChange(next: string[])`.
- Rendered as a row of chips followed by a flex-growing input.
- Commit: Enter, Comma, or Tab with non-empty input.
- Delete: Backspace on empty input focuses last chip; second Backspace
  deletes it. Chip click selects; chip `x` icon deletes.
- Paste: split on commas and newlines; commit each non-empty token.
- Validation: trim whitespace, dedupe case-insensitively inside the
  instance, cap individual chip at 64 characters (silent trim, no toast).
- Focus ring, sizing, and placeholder match `Input`.

#### BulletList

Replaces: `src/ui/form/bullet-editor.tsx` textarea.

- Each bullet is a row: `[drag handle] [auto-growing single-line
  textarea] [remove]`.
- Enter at end of a bullet: insert a new empty bullet below and focus
  it.
- Backspace at start of an empty bullet: remove it and focus end of the
  previous one.
- Tab / Shift-Tab: move between bullet rows.
- Drag handle reorders; keyboard equivalent is Alt-Arrow Up/Down on a
  focused row.
- Markdown remains the storage layer. On change, re-parse the row with
  `mdToInlineNodes`. Hint line below the list: "Markdown: **bold**,
  *italic*, `code`".
- Value: `InlineNode[][]`; shape identical to today.

#### SortableList

Generic wrapper over `@dnd-kit/sortable` + `@dnd-kit/core`.

```tsx
<SortableList
  items={experience}
  keyFor={(_, i) => String(i)}
  onReorder={(from, to) => moveExperience(from, to)}
  renderItem={(value, index) => <ExperienceCard index={index} value={value} />}
/>
```

- Handle rendered inside `renderItem` via a `<SortableHandle />` slot
  (context-passed).
- Keyboard: focus handle, Space/Enter grabs, Arrow moves, Space/Enter
  drops, Escape cancels. Use dnd-kit's accessibility announcer
  (`aria-live`).
- Used by experience, education, projects, skills groups, contact links,
  extras, and the BulletList internal rows.
- Up/Down buttons are removed from every section.

#### MonthYearPicker

Replaces: `src/ui/form/date-field.tsx`.

- Value contract unchanged; emits and consumes whatever `DateField` does
  today. This is a UI swap, not a data model change.
- Trigger: a `button` showing the rendered value (`Mar 2024`, `Present`,
  or a placeholder dash).
- Popover content: Month select (Jan-Dec), Year select (current year + 1
  down to current year - 50), "Present" checkbox gated on
  `allowPresent` (end dates only), Clear link.

### 5. File changes

New:

- `src/ui/primitives/` (shadcn + Base UI atoms, multiple files)
- `src/ui/lib/cn.ts`
- `src/ui/theme/tailwind.css`
- `src/ui/form/chip-input.tsx`
- `src/ui/form/bullet-list.tsx`
- `src/ui/form/sortable-list.tsx`
- `src/ui/form/month-year-picker.tsx`
- `src/ui/form/section-rail.tsx`
- `src/ui/form/form-card.tsx`
- `vite.config.ts` (Tailwind plugin registration; additive)

Rewritten:

- `src/ui/form/form-tab.tsx`
- `src/ui/form/meta-section.tsx`
- `src/ui/form/contact-section.tsx`
- `src/ui/form/experience-section.tsx`
- `src/ui/form/education-section.tsx`
- `src/ui/form/skills-section.tsx`
- `src/ui/form/projects-section.tsx`
- `src/ui/form/extras-section.tsx`

Deleted:

- `src/ui/form/fields.tsx`
- `src/ui/form/bullet-editor.tsx`
- `src/ui/form/date-field.tsx`
- Large parts of `src/ui/theme/components.css` (see section 2 for what
  survives). `src/ui/theme/button.tsx` and `src/ui/theme/section.tsx`
  are retired in favour of the new primitives and Tailwind layout.

Unchanged:

- `src/state/*`, `src/schema/*`, `src/mdx/*`, `src/typst/*`,
  `src/templates/*`
- `src/ui/shell/*` (top bar, tabs, layout, command palette, shortcuts,
  empty state, env check, filename, use-store)
- `src/ui/preview/*`
- `src/ui/editor/*`
- `src/ui/theme/tokens.css` and `src/ui/theme/type.css`

### 6. Migration order

The whole redesign ships as one coherent change, not a half-rewritten
mix of old and new. Internal ordering:

1. Add Tailwind v4 + `@theme` bridge. App renders unchanged; no class
   changes yet.
2. Scaffold `src/ui/primitives/` with shadcn/Base UI atoms. No call
   sites touched yet.
3. Build `ChipInput`, `MonthYearPicker`, `SortableList`, `BulletList`,
   `FormCard`, `SectionRail` with colocated tests.
4. Rewrite `form-tab.tsx` and the seven section files against the new
   primitives. Delete the retired files.
5. Retire orphaned CSS in `components.css`.
6. Smoke the whole happy path: empty state, load example, edit every
   section, PDF preview updates, export.

### 7. Testing

Runner: `bun test` with the existing happy-dom global registrator.

New tests:

- Primitive tests colocated as `*.test.tsx`:
  - `chip-input.test.tsx`: Enter/Comma/Tab commit, Backspace-on-empty
    deletes, paste splitting, dedupe, length cap.
  - `bullet-list.test.tsx`: Enter splits, Backspace-at-start merges,
    drag-reorder via keyboard, round-trip `InlineNode[]` through
    `inlineNodesToMd` and `mdToInlineNodes`.
  - `sortable-list.test.tsx`: `onReorder(from, to)` fires with the
    right indices on keyboard reorder.
  - `month-year-picker.test.tsx`: emits the same shape `DateField` emits
    for every reachable UI state.
- Section integration tests (new, one per section): mount the section
  against a real zustand store, simulate user input, assert store
  mutations. These are the primary guard against wire-up regressions in
  the rewrite.
- One snapshot-style test for `<FormTab />` with the example resume
  asserting the rail renders all seven sections with the expected
  counts.

Existing tests (schema, state, mdx, typst) are untouched; they must
continue to pass.

Manual verification after implementation (per CLAUDE.md, via
agent-browser skill): section switching, drag reorder on experience
cards and bullet rows, chip paste behaviour, month/year keyboard nav,
PDF preview updates after every form interaction, export download,
autosave indicator, undo toasts.

## Risks

- Tailwind v4 + shadcn Base UI registry friction. Well-known registry
  was v3-first; v4 support is newer. Fallback: Tailwind v3 with a
  `tailwind.config.ts` that reads tokens via `getComputedStyle` at
  build time. Contained to step 1.
- `@dnd-kit` focus handling may not cooperate cleanly with Base UI
  popovers and collapsibles. Fallback: an HTML5 Sortable wrapper with
  identical props.
- Bullet editor data regression. `InlineNode[]` is load-bearing for
  PDF output. Round-trip tests on `BulletList` are the guard.
- Preview and autosave regression. Both read from the store, not from
  the form, so they should be immune. Section integration tests assert
  store shape after every simulated interaction, which is the only
  surface that can break them.

## Success criteria

- Form tab renders a section rail; only the active section's content
  is in the body.
- `tech` and skills `items` are chip inputs; no raw comma list
  anywhere in the form.
- Bullets are per-row with drag reorder and keyboard splitting /
  merging; markdown is still the storage layer and the PDF is
  byte-identical for the same `InlineNode[]`.
- Experience, education, projects, skills groups, contact links, and
  extras reorder by drag with keyboard equivalence; no Up/Down
  buttons remain.
- Date fields open a popover with Month, Year, and (where applicable)
  Present.
- No inline `style={{}}` spacing or color literals remain in
  `src/ui/form/*`; all layout and color comes through Tailwind
  utilities backed by the token system.
- `bun test` passes, `bun run typecheck` passes.
- Dark mode still works without retuning.
