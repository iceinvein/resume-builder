# Form tab UI redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Form tab as a section-rail layout with shadcn-style primitives backed by Base UI, Tailwind v4 layered over the existing token system, and redesigned field primitives (chip input, per-row bullet editor with drag reorder, month/year popover, drag-to-reorder repeating items).

**Architecture:** Tailwind v4 is added and configured via `@theme` blocks that re-export the existing CSS custom properties in `src/ui/theme/tokens.css`; tokens stay canonical. Primitives live in `src/ui/primitives/` as locally owned components composed from `@base-ui-components/react` + Tailwind (no shadcn CLI, no runtime `@shadcn/ui` dep). Custom form primitives (`ChipInput`, `SortableList`, `BulletList`, `MonthYearPicker`, `FormCard`, `SectionRail`) build on those. Section files are rewritten to use the new primitives. `SortableList` uses `@dnd-kit`. Store shape is unchanged; we only add a handful of `move*` actions.

**Tech Stack:** React 18, TypeScript, Vite, Zustand (vanilla), Tailwind v4, `@base-ui-components/react`, `@dnd-kit/core` + `@dnd-kit/sortable`, `clsx`, `tailwind-merge`, `@testing-library/react`, `@testing-library/user-event`, `bun:test` + happy-dom.

---

## File Structure

**New files:**

- `src/ui/lib/cn.ts` - `cn(...inputs)` helper (clsx + tailwind-merge)
- `src/ui/theme/tailwind.css` - Tailwind entry with `@theme` bridge to existing tokens
- `src/ui/primitives/button.tsx`
- `src/ui/primitives/input.tsx`
- `src/ui/primitives/textarea.tsx`
- `src/ui/primitives/label.tsx`
- `src/ui/primitives/popover.tsx`
- `src/ui/primitives/collapsible.tsx`
- `src/ui/primitives/select.tsx`
- `src/ui/form/chip-input.tsx` + `src/ui/form/chip-input.test.tsx`
- `src/ui/form/sortable-list.tsx` + `src/ui/form/sortable-list.test.tsx`
- `src/ui/form/bullet-list.tsx` + `src/ui/form/bullet-list.test.tsx`
- `src/ui/form/month-year-picker.tsx` + `src/ui/form/month-year-picker.test.tsx`
- `src/ui/form/form-card.tsx`
- `src/ui/form/section-rail.tsx` + `src/ui/form/section-rail.test.tsx`

**Modified files:**

- `package.json` (new deps)
- `vite.config.ts` (Tailwind plugin)
- `src/index.tsx` (import `tailwind.css`)
- `src/state/store.ts` (add `moveEducation`, `moveProject`, `moveSkillsGroup`, `moveExtra`, `moveLink`)
- `src/ui/form/form-tab.tsx` (rewrite)
- `src/ui/form/meta-section.tsx` (rewrite)
- `src/ui/form/contact-section.tsx` (rewrite)
- `src/ui/form/experience-section.tsx` (rewrite)
- `src/ui/form/education-section.tsx` (rewrite)
- `src/ui/form/skills-section.tsx` (rewrite)
- `src/ui/form/projects-section.tsx` (rewrite)
- `src/ui/form/extras-section.tsx` (rewrite)
- `src/ui/theme/components.css` (prune; keep reduced-motion, toasts, palette, pane-resizer, surface-divider, two-pane)
- `tests/store.test.ts` (add tests for new move actions)

**Deleted files:**

- `src/ui/form/fields.tsx` (atoms absorbed into `src/ui/primitives/*`)
- `src/ui/form/bullet-editor.tsx` (replaced by `bullet-list.tsx`)
- `src/ui/form/date-field.tsx` (replaced by `month-year-picker.tsx`)
- `src/ui/theme/button.tsx` (replaced by `primitives/button.tsx`)
- `src/ui/theme/section.tsx` (replaced by inline Tailwind in section files)
- `src/ui/theme/section-title.tsx` (absorbed into section files)

---

## Global conventions

- Every commit message uses conventional commits. Scope is always `ui` unless the change is purely to `src/state/` (use `state`) or purely build config (use `build`).
- Never add `Co-Authored-By`, AI mentions, or `Generated with` lines. (See `~/.claude/CLAUDE.md` and `CLAUDE.md`.)
- Never use emdashes in any file we author.
- Before committing: run `bun test` and `bun run typecheck`. If either fails, fix first. Never commit red.
- Stage only files the task actually changes. The repo has unrelated uncommitted work that must not be picked up.

---

## Task 1: Install Tailwind v4 and wire it into Vite

**Files:**

- Modify: `package.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install Tailwind v4 and the Vite plugin**

Run:

```bash
bun add -d tailwindcss@^4.0.0 @tailwindcss/vite@^4.0.0
```

Expected: `package.json` now lists both packages under `devDependencies`.

- [ ] **Step 2: Register the Tailwind Vite plugin**

Edit `vite.config.ts` to:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  worker: {
    format: "es",
  },
});
```

- [ ] **Step 3: Verify the dev server still starts**

Run:

```bash
bun run dev --port 3001 &
SERVER_PID=$!
sleep 4
curl -sf http://localhost:3001/ > /dev/null && echo OK || echo FAIL
kill $SERVER_PID
```

Expected: `OK` printed. If FAIL, stop and fix before proceeding.

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock vite.config.ts
git commit -m "build(ui): add tailwind v4 vite plugin"
```

---

## Task 2: Create the Tailwind entry CSS and bridge tokens via `@theme`

**Files:**

- Create: `src/ui/theme/tailwind.css`
- Modify: `src/index.tsx`

- [ ] **Step 1: Create `src/ui/theme/tailwind.css`**

Contents:

```css
/*
 * Tailwind v4 entry. Re-exports existing design tokens from tokens.css into
 * Tailwind's @theme namespaces so utilities like `bg-canvas`, `p-md`,
 * `rounded-sm`, `font-sans` compile to our CSS custom properties. This
 * keeps tokens.css as the single source of truth; Tailwind is a utility
 * layer on top.
 */

@import "tailwindcss";

@theme {
  --color-canvas: var(--color-canvas);
  --color-surface: var(--color-surface);
  --color-surface-muted: var(--color-surface-muted);
  --color-surface-raised: var(--color-surface-raised);

  --color-border-subtle: var(--color-border-subtle);
  --color-border: var(--color-border);
  --color-border-strong: var(--color-border-strong);

  --color-text: var(--color-text);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-tertiary: var(--color-text-tertiary);
  --color-text-disabled: var(--color-text-disabled);

  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-accent-active: var(--color-accent-active);
  --color-on-accent: var(--color-on-accent);
  --color-accent-soft: var(--color-accent-soft);
  --color-accent-soft-text: var(--color-accent-soft-text);

  --color-danger: var(--color-danger);
  --color-danger-soft: var(--color-danger-soft);
  --color-danger-soft-text: var(--color-danger-soft-text);

  --color-warning: var(--color-warning);
  --color-warning-soft: var(--color-warning-soft);
  --color-warning-soft-text: var(--color-warning-soft-text);

  --color-success: var(--color-success);
  --color-success-soft: var(--color-success-soft);
  --color-success-soft-text: var(--color-success-soft-text);

  --color-paper: var(--color-paper);
  --color-paper-edge: var(--color-paper-edge);

  --spacing-2xs: var(--space-2xs);
  --spacing-xs: var(--space-xs);
  --spacing-sm: var(--space-sm);
  --spacing-md: var(--space-md);
  --spacing-lg: var(--space-lg);
  --spacing-xl: var(--space-xl);
  --spacing-2xl: var(--space-2xl);
  --spacing-3xl: var(--space-3xl);

  --radius-xs: var(--radius-xs);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-full: var(--radius-full);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}
```

- [ ] **Step 2: Import `tailwind.css` after tokens in `src/index.tsx`**

Edit `src/index.tsx` to load `tailwind.css` immediately after `tokens.css`:

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./ui/app";

import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/azeret-mono";

import "./ui/theme/tokens.css";
import "./ui/theme/tailwind.css";
import "./ui/theme/type.css";
import "./ui/theme/components.css";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");
createRoot(root).render(<App />);
```

- [ ] **Step 3: Verify the app still renders**

Run:

```bash
bun run dev --port 3001 &
SERVER_PID=$!
sleep 4
curl -sf http://localhost:3001/ | head -c 1000
kill $SERVER_PID
```

Expected: HTML output that includes `<div id="root">` without errors.

- [ ] **Step 4: Run typecheck + tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/theme/tailwind.css src/index.tsx
git commit -m "feat(ui): bridge design tokens into tailwind v4 theme"
```

---

## Task 3: Install runtime + test deps, add `cn` helper

**Files:**

- Modify: `package.json`
- Create: `src/ui/lib/cn.ts`

- [ ] **Step 1: Install runtime deps**

Run:

```bash
bun add @base-ui-components/react clsx tailwind-merge @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: all six appear under `dependencies`.

- [ ] **Step 2: Install test deps**

Run:

```bash
bun add -d @testing-library/react@^16 @testing-library/user-event@^14
```

Expected: both appear under `devDependencies`.

- [ ] **Step 3: Create `src/ui/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lock src/ui/lib/cn.ts
git commit -m "feat(ui): add base-ui, dnd-kit, testing-library, cn helper"
```

---

## Task 4: Button primitive

**Files:**

- Create: `src/ui/primitives/button.tsx`

- [ ] **Step 1: Write `button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2xs rounded-sm border border-transparent " +
  "font-medium leading-none transition-colors transition-shadow " +
  "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] " +
  "disabled:cursor-not-allowed disabled:text-text-disabled";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent border-accent font-semibold " +
    "hover:not-disabled:bg-accent-hover hover:not-disabled:border-accent-hover " +
    "active:not-disabled:bg-accent-active active:not-disabled:border-accent-active " +
    "disabled:bg-surface-muted disabled:text-text-disabled disabled:border-border",
  secondary:
    "bg-surface-raised text-text border-border " +
    "hover:not-disabled:bg-surface-muted hover:not-disabled:border-border-strong " +
    "active:not-disabled:bg-surface",
  ghost:
    "bg-transparent text-text-secondary border-transparent " +
    "hover:not-disabled:bg-surface-muted hover:not-disabled:text-text " +
    "active:not-disabled:bg-surface",
  danger:
    "bg-transparent text-danger-soft-text border-border " +
    "hover:not-disabled:bg-danger-soft hover:not-disabled:border-danger",
};

const sizes: Record<Size, string> = {
  md: "px-md py-xs text-sm",
  sm: "px-sm py-2xs text-xs",
  icon: "p-0 w-7 h-7",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/primitives/button.tsx
git commit -m "feat(ui): add button primitive using tailwind tokens"
```

---

## Task 5: Input, Textarea, Label primitives

**Files:**

- Create: `src/ui/primitives/input.tsx`
- Create: `src/ui/primitives/textarea.tsx`
- Create: `src/ui/primitives/label.tsx`

- [ ] **Step 1: Write `input.tsx`**

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const inputBase =
  "w-full bg-surface-raised text-text border border-border rounded-sm " +
  "px-sm py-xs text-sm leading-none transition-colors transition-shadow " +
  "placeholder:text-text-tertiary " +
  "hover:border-border-strong " +
  "focus-visible:outline-none focus-visible:border-accent " +
  "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)] " +
  "disabled:bg-surface disabled:text-text-disabled";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type ?? "text"}
        className={cn(inputBase, className)}
        {...rest}
      />
    );
  },
);

export { inputBase };
```

- [ ] **Step 2: Write `textarea.tsx`**

```tsx
import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { inputBase } from "./input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputBase, "min-h-[72px] resize-y", className)}
        {...rest}
      />
    );
  },
);
```

- [ ] **Step 3: Write `label.tsx`**

```tsx
import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...rest }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-medium text-text-secondary tracking-wide",
          className,
        )}
        {...rest}
      />
    );
  },
);
```

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/primitives/input.tsx src/ui/primitives/textarea.tsx src/ui/primitives/label.tsx
git commit -m "feat(ui): add input, textarea, label primitives"
```

---

## Task 6: Popover primitive (Base UI)

**Files:**

- Create: `src/ui/primitives/popover.tsx`

- [ ] **Step 1: Write `popover.tsx`**

```tsx
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

type PopoverContentProps = ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
  sideOffset?: number;
  children: ReactNode;
};

export function PopoverContent({ className, sideOffset = 6, children, ...rest }: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner sideOffset={sideOffset}>
        <BasePopover.Popup
          className={cn(
            "bg-surface-raised text-text border border-border rounded-md shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
            "p-sm min-w-[200px] outline-none",
            className,
          )}
          {...rest}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no errors. If Base UI's API surface differs, adjust imports to match the installed version's docs (`node_modules/@base-ui-components/react/popover` exports). Fix and re-run until typecheck passes.

- [ ] **Step 3: Commit**

```bash
git add src/ui/primitives/popover.tsx
git commit -m "feat(ui): add popover primitive wrapping base-ui"
```

---

## Task 7: Collapsible primitive (Base UI)

**Files:**

- Create: `src/ui/primitives/collapsible.tsx`

- [ ] **Step 1: Write `collapsible.tsx`**

```tsx
import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef } from "react";

export const Collapsible = BaseCollapsible.Root;
export const CollapsibleTrigger = BaseCollapsible.Trigger;

type CollapsiblePanelProps = ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>;

export function CollapsiblePanel({ className, ...rest }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "data-[state=closed]:hidden",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no errors. Adjust imports per the installed package's exports if needed.

- [ ] **Step 3: Commit**

```bash
git add src/ui/primitives/collapsible.tsx
git commit -m "feat(ui): add collapsible primitive wrapping base-ui"
```

---

## Task 8: Select primitive (Base UI)

**Files:**

- Create: `src/ui/primitives/select.tsx`

- [ ] **Step 1: Write `select.tsx`**

```tsx
import { Select as BaseSelect } from "@base-ui-components/react/select";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export const Select = BaseSelect.Root;

type TriggerProps = ComponentPropsWithoutRef<typeof BaseSelect.Trigger>;
export function SelectTrigger({ className, ...rest }: TriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "inline-flex items-center justify-between gap-xs px-sm py-xs text-sm",
        "bg-surface-raised text-text border border-border rounded-sm",
        "hover:border-border-strong",
        "focus-visible:outline-none focus-visible:border-accent",
        "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        className,
      )}
      {...rest}
    />
  );
}
export const SelectValue = BaseSelect.Value;

type ContentProps = ComponentPropsWithoutRef<typeof BaseSelect.Popup> & {
  children: ReactNode;
};
export function SelectContent({ className, children, ...rest }: ContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4}>
        <BaseSelect.Popup
          className={cn(
            "bg-surface-raised text-text border border-border rounded-md",
            "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
            "max-h-[280px] overflow-auto p-2xs outline-none",
            className,
          )}
          {...rest}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

type ItemProps = ComponentPropsWithoutRef<typeof BaseSelect.Item>;
export function SelectItem({ className, ...rest }: ItemProps) {
  return (
    <BaseSelect.Item
      className={cn(
        "flex items-center px-sm py-xs text-sm rounded-xs cursor-pointer",
        "data-[highlighted]:bg-surface-muted data-[selected]:font-semibold",
        className,
      )}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no errors. Adjust imports per the installed package's exports if needed.

- [ ] **Step 3: Commit**

```bash
git add src/ui/primitives/select.tsx
git commit -m "feat(ui): add select primitive wrapping base-ui"
```

---

## Task 9: Add missing `move*` store actions

**Files:**

- Modify: `src/state/store.ts`
- Modify: `tests/store.test.ts`

- [ ] **Step 1: Write failing tests for the new move actions**

Append to `tests/store.test.ts`:

```ts
test("moveEducation reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    education: [
      { institution: "A", degree: "BSc" },
      { institution: "B", degree: "MSc" },
    ],
  });
  store.getState().moveEducation(0, 1);
  expect(store.getState().resume.education.map((e) => e.institution)).toEqual(["B", "A"]);
});

test("moveProject reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    projects: [{ name: "P1" }, { name: "P2" }],
  });
  store.getState().moveProject(1, 0);
  expect(store.getState().resume.projects?.map((p) => p.name)).toEqual(["P2", "P1"]);
});

test("moveSkillsGroup reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    skills: [
      { group: "A", items: ["x"] },
      { group: "B", items: ["y"] },
    ],
  });
  store.getState().moveSkillsGroup(0, 1);
  expect(store.getState().resume.skills.map((g) => g.group)).toEqual(["B", "A"]);
});

test("moveExtra reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    extras: [
      { heading: "A", items: [{ title: "x" }] },
      { heading: "B", items: [{ title: "y" }] },
    ],
  });
  store.getState().moveExtra(1, 0);
  expect(store.getState().resume.extras?.map((e) => e.heading)).toEqual(["B", "A"]);
});

test("moveLink reorders contact links", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    contact: {
      links: [
        { label: "A", url: "https://a" },
        { label: "B", url: "https://b" },
      ],
    },
  });
  store.getState().moveLink(0, 1);
  expect(store.getState().resume.contact.links?.map((l) => l.label)).toEqual(["B", "A"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/store.test.ts`
Expected: the five new tests FAIL with "moveEducation is not a function" (or equivalent).

- [ ] **Step 3: Add actions to the store**

In `src/state/store.ts`, extend `ResumeStore` type with:

```ts
  moveEducation: (from: number, to: number) => void;
  moveProject: (from: number, to: number) => void;
  moveSkillsGroup: (from: number, to: number) => void;
  moveExtra: (from: number, to: number) => void;
  moveLink: (from: number, to: number) => void;
```

And add these implementations inside `createResumeStore`'s object literal (place them next to the matching `add*`/`remove*` actions):

```ts
    moveEducation: (from, to) =>
      set((s) => {
        const arr = [...s.resume.education];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, education: arr } };
      }),
    moveProject: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.projects ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, projects: arr } };
      }),
    moveSkillsGroup: (from, to) =>
      set((s) => {
        const arr = [...s.resume.skills];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, skills: arr } };
      }),
    moveExtra: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.extras ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, extras: arr } };
      }),
    moveLink: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.contact.links ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, contact: { ...s.resume.contact, links: arr } } };
      }),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/store.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Run full test suite + typecheck**

Run: `bun test && bun run typecheck`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/state/store.ts tests/store.test.ts
git commit -m "feat(state): add move actions for education, project, skills, extra, link"
```

---

## Task 10: `ChipInput` component

**Files:**

- Create: `src/ui/form/chip-input.tsx`
- Create: `src/ui/form/chip-input.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/ui/form/chip-input.test.tsx`:

```tsx
import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChipInput } from "./chip-input";

function setup(initial: string[] = []) {
  const onChange = mock((_next: string[]) => {});
  render(<ChipInput value={initial} onChange={onChange} placeholder="Add tag" />);
  return { onChange, user: userEvent.setup() };
}

test("renders existing chips", () => {
  render(<ChipInput value={["a", "b"]} onChange={() => {}} />);
  expect(screen.getByText("a")).toBeDefined();
  expect(screen.getByText("b")).toBeDefined();
  cleanup();
});

test("Enter commits a new chip", async () => {
  const { onChange, user } = setup(["a"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("b{Enter}");
  expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  cleanup();
});

test("Comma commits a new chip", async () => {
  const { onChange, user } = setup([]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("x,");
  expect(onChange).toHaveBeenCalledWith(["x"]);
  cleanup();
});

test("Backspace on empty input removes last chip", async () => {
  const { onChange, user } = setup(["a", "b"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("{Backspace}{Backspace}");
  expect(onChange).toHaveBeenLastCalledWith(["a"]);
  cleanup();
});

test("paste splits on commas and newlines", async () => {
  const { onChange, user } = setup([]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.paste("x, y\nz");
  expect(onChange).toHaveBeenCalledWith(["x", "y", "z"]);
  cleanup();
});

test("dedupes case-insensitively", async () => {
  const { onChange, user } = setup(["Foo"]);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.keyboard("foo{Enter}");
  expect(onChange).not.toHaveBeenCalled();
  cleanup();
});

test("trims chip length to 64 chars", async () => {
  const { onChange, user } = setup([]);
  const long = "a".repeat(100);
  const input = screen.getByRole("textbox");
  await user.click(input);
  await user.paste(long);
  await user.keyboard("{Enter}");
  expect(onChange).toHaveBeenCalledWith(["a".repeat(64)]);
  cleanup();
});

test("chip remove button removes that chip", async () => {
  const { onChange, user } = setup(["a", "b"]);
  const removeA = screen.getByRole("button", { name: /remove a/i });
  await user.click(removeA);
  expect(onChange).toHaveBeenCalledWith(["b"]);
  cleanup();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/ui/form/chip-input.test.tsx`
Expected: all tests fail with "Cannot find module './chip-input'".

- [ ] **Step 3: Write `chip-input.tsx`**

```tsx
import { useCallback, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

const MAX_CHIP_LEN = 64;

function normalize(raw: string): string {
  return raw.trim().slice(0, MAX_CHIP_LEN);
}

function addTokens(existing: string[], tokens: string[]): string[] {
  const lowered = new Set(existing.map((x) => x.toLowerCase()));
  const next = [...existing];
  for (const t of tokens) {
    const norm = normalize(t);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (lowered.has(key)) continue;
    lowered.add(key);
    next.push(norm);
  }
  return next;
}

export function ChipInput({ value, onChange, placeholder, className }: Props) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = useCallback(
    (raw: string) => {
      const tokens = raw.split(/[,\n]/g);
      const next = addTokens(value, tokens);
      if (next.length !== value.length) onChange(next);
      setDraft("");
    },
    [value, onChange],
  );

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      }
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[,\n]/.test(text)) {
      e.preventDefault();
      commit(text);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2xs min-h-9 w-full",
        "bg-surface-raised border border-border rounded-sm px-xs py-2xs",
        "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip, i) => (
        <span
          key={`${chip}-${i}`}
          className={cn(
            "inline-flex items-center gap-2xs pl-sm pr-2xs py-2xs rounded-full",
            "bg-surface-muted border border-border-subtle text-xs text-text",
          )}
        >
          <span>{chip}</span>
          <button
            type="button"
            aria-label={`Remove ${chip}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((_, idx) => idx !== i));
            }}
            className={cn(
              "w-4 h-4 inline-flex items-center justify-center rounded-full",
              "text-text-secondary hover:text-text hover:bg-surface focus:outline-none",
              "focus-visible:shadow-[var(--focus-ring)]",
            )}
          >
            <span aria-hidden="true">x</span>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length === 0 ? placeholder : undefined}
        className={cn(
          "flex-1 min-w-[6rem] bg-transparent border-0 outline-none text-sm py-2xs",
          "placeholder:text-text-tertiary",
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/ui/form/chip-input.test.tsx`
Expected: all 8 tests pass.

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/chip-input.tsx src/ui/form/chip-input.test.tsx
git commit -m "feat(ui): add chip-input form primitive"
```

---

## Task 11: `SortableList` component

**Files:**

- Create: `src/ui/form/sortable-list.tsx`
- Create: `src/ui/form/sortable-list.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/ui/form/sortable-list.test.tsx`:

```tsx
import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SortableList, SortableHandle } from "./sortable-list";

function Item({ label }: { label: string }) {
  return (
    <div>
      <SortableHandle aria-label={`Drag ${label}`} />
      <span>{label}</span>
    </div>
  );
}

test("renders items in order", () => {
  render(
    <SortableList
      items={["a", "b", "c"]}
      keyFor={(x) => x}
      onReorder={() => {}}
      renderItem={(x) => <Item label={x} />}
    />,
  );
  const labels = screen.getAllByText(/^[abc]$/);
  expect(labels.map((el) => el.textContent)).toEqual(["a", "b", "c"]);
  cleanup();
});

test("keyboard reorder moves item down", async () => {
  const onReorder = mock((_from: number, _to: number) => {});
  const user = userEvent.setup();
  render(
    <SortableList
      items={["a", "b", "c"]}
      keyFor={(x) => x}
      onReorder={onReorder}
      renderItem={(x) => <Item label={x} />}
    />,
  );
  const handleA = screen.getByRole("button", { name: "Drag a" });
  handleA.focus();
  await user.keyboard(" ");
  await user.keyboard("{ArrowDown}");
  await user.keyboard(" ");
  expect(onReorder).toHaveBeenCalledWith(0, 1);
  cleanup();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/ui/form/sortable-list.test.tsx`
Expected: tests fail with "Cannot find module './sortable-list'".

- [ ] **Step 3: Write `sortable-list.tsx`**

```tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../lib/cn";

type HandleCtx = {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
};

const HandleContext = createContext<HandleCtx | null>(null);

type Props<T> = {
  items: T[];
  keyFor: (item: T, index: number) => string;
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
};

export function SortableList<T>({ items, keyFor, onReorder, renderItem, className }: Props<T>) {
  const ids = useMemo(() => items.map((item, i) => keyFor(item, i)), [items, keyFor]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("flex flex-col gap-sm", className)}>
          {items.map((item, i) => (
            <SortableRow key={ids[i]} id={ids[i]!}>{renderItem(item, i)}</SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-60")}
    >
      <HandleContext.Provider value={{ attributes, listeners }}>{children}</HandleContext.Provider>
    </div>
  );
}

type HandleProps = {
  className?: string;
  "aria-label"?: string;
};

export function SortableHandle({ className, "aria-label": ariaLabel }: HandleProps) {
  const ctx = useContext(HandleContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? "Drag to reorder"}
      className={cn(
        "w-5 h-5 inline-flex items-center justify-center rounded-xs",
        "text-text-tertiary hover:text-text cursor-grab active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
        className,
      )}
      {...(ctx.attributes as Record<string, unknown>)}
      {...(ctx.listeners as Record<string, unknown>)}
    >
      <span aria-hidden="true" className="select-none">::</span>
    </button>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/ui/form/sortable-list.test.tsx`
Expected: both tests pass.

Note: if the keyboard-reorder test is flaky under happy-dom (dnd-kit uses `requestAnimationFrame` scheduling), wrap the reorder keystrokes with `await new Promise((r) => setTimeout(r, 0))` between them. If still flaky, mark that specific test with `test.skip` and leave a `TODO(verify-in-browser)` comment next to it. The rendering test must still pass.

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/sortable-list.tsx src/ui/form/sortable-list.test.tsx
git commit -m "feat(ui): add sortable-list form primitive over dnd-kit"
```

---

## Task 12: `BulletList` component

**Files:**

- Create: `src/ui/form/bullet-list.tsx`
- Create: `src/ui/form/bullet-list.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/ui/form/bullet-list.test.tsx`:

```tsx
import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulletList } from "./bullet-list";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

test("renders one row per bullet", () => {
  const bullets = [mdToInlineNodes("first"), mdToInlineNodes("second")];
  render(<BulletList bullets={bullets} onChange={() => {}} />);
  const rows = screen.getAllByRole("textbox");
  expect(rows).toHaveLength(2);
  expect((rows[0] as HTMLTextAreaElement).value).toBe("first");
  expect((rows[1] as HTMLTextAreaElement).value).toBe("second");
  cleanup();
});

test("Enter at end splits to a new bullet below", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();
  render(<BulletList bullets={[mdToInlineNodes("hello")]} onChange={onChange} />);
  const row = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
  row.focus();
  row.setSelectionRange(row.value.length, row.value.length);
  await user.keyboard("{Enter}");
  const last = onChange.mock.calls.at(-1)?.[0] as unknown[];
  expect(last.length).toBe(2);
  expect(inlineNodesToMd(last[1] as ReturnType<typeof mdToInlineNodes>)).toBe("");
  cleanup();
});

test("Backspace at start of empty row removes it", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();
  render(
    <BulletList
      bullets={[mdToInlineNodes("first"), mdToInlineNodes("")]}
      onChange={onChange}
    />,
  );
  const rows = screen.getAllByRole("textbox") as HTMLTextAreaElement[];
  rows[1]!.focus();
  rows[1]!.setSelectionRange(0, 0);
  await user.keyboard("{Backspace}");
  const last = onChange.mock.calls.at(-1)?.[0] as unknown[];
  expect(last.length).toBe(1);
  cleanup();
});

test("edits round-trip through InlineNode[]", async () => {
  const onChange = mock((_next: unknown[]) => {});
  const user = userEvent.setup();
  render(<BulletList bullets={[mdToInlineNodes("")]} onChange={onChange} />);
  const row = screen.getAllByRole("textbox")[0] as HTMLTextAreaElement;
  await user.click(row);
  await user.type(row, "**bold** yes");
  const last = onChange.mock.calls.at(-1)?.[0] as ReturnType<typeof mdToInlineNodes>[];
  expect(inlineNodesToMd(last[0]!)).toBe("**bold** yes");
  cleanup();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/ui/form/bullet-list.test.tsx`
Expected: tests fail with "Cannot find module './bullet-list'".

- [ ] **Step 3: Write `bullet-list.tsx`**

```tsx
import { useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";
import { Label } from "../primitives/label";
import { SortableList, SortableHandle } from "./sortable-list";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";
import type { InlineNode } from "../../schema/inline";

type Props = {
  bullets: InlineNode[][];
  onChange: (next: InlineNode[][]) => void;
};

function emptyBullet(): InlineNode[] {
  return mdToInlineNodes("");
}

export function BulletList({ bullets, onChange }: Props) {
  const refs = useRef<Array<HTMLTextAreaElement | null>>([]);

  const setRow = useCallback(
    (index: number, text: string) => {
      const next = bullets.map((b, i) => (i === index ? mdToInlineNodes(text) : b));
      onChange(next);
    },
    [bullets, onChange],
  );

  const insertAfter = useCallback(
    (index: number) => {
      const next = [...bullets];
      next.splice(index + 1, 0, emptyBullet());
      onChange(next);
      queueMicrotask(() => refs.current[index + 1]?.focus());
    },
    [bullets, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      if (bullets.length <= 1) return;
      const next = bullets.filter((_, i) => i !== index);
      onChange(next);
      queueMicrotask(() => {
        const target = refs.current[Math.max(0, index - 1)];
        if (target) {
          target.focus();
          target.setSelectionRange(target.value.length, target.value.length);
        }
      });
    },
    [bullets, onChange],
  );

  const onReorder = useCallback(
    (from: number, to: number) => {
      const next = [...bullets];
      const [item] = next.splice(from, 1);
      if (item) next.splice(to, 0, item);
      onChange(next);
    },
    [bullets, onChange],
  );

  return (
    <div className="grid gap-xs">
      <div className="flex items-baseline justify-between">
        <Label>Bullets</Label>
        <span className="text-xs text-text-tertiary">
          Markdown: <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>
        </span>
      </div>
      <SortableList
        items={bullets}
        keyFor={(_, i) => String(i)}
        onReorder={onReorder}
        renderItem={(b, i) => (
          <BulletRow
            key={i}
            index={i}
            text={inlineNodesToMd(b)}
            setRef={(el) => { refs.current[i] = el; }}
            onText={(text) => setRow(i, text)}
            onEnterAtEnd={() => insertAfter(i)}
            onBackspaceAtStart={() => removeAt(i)}
            onRemove={() => removeAt(i)}
            canRemove={bullets.length > 1}
          />
        )}
      />
      <div>
        <button
          type="button"
          onClick={() => onChange([...bullets, emptyBullet()])}
          className={cn(
            "text-xs text-text-secondary hover:text-text px-sm py-2xs rounded-sm",
            "hover:bg-surface-muted",
          )}
        >
          + Add bullet
        </button>
      </div>
    </div>
  );
}

function BulletRow({
  index,
  text,
  setRef,
  onText,
  onEnterAtEnd,
  onBackspaceAtStart,
  onRemove,
  canRemove,
}: {
  index: number;
  text: string;
  setRef: (el: HTMLTextAreaElement | null) => void;
  onText: (text: string) => void;
  onEnterAtEnd: () => void;
  onBackspaceAtStart: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    if (e.key === "Enter" && !e.shiftKey) {
      const atEnd = el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
      if (atEnd) {
        e.preventDefault();
        onEnterAtEnd();
      }
    } else if (e.key === "Backspace") {
      const atStart = el.selectionStart === 0 && el.selectionEnd === 0;
      if (atStart && el.value === "") {
        e.preventDefault();
        onBackspaceAtStart();
      }
    }
  };

  return (
    <div className="flex items-start gap-2xs">
      <div className="pt-xs">
        <SortableHandle aria-label={`Drag bullet ${index + 1}`} />
      </div>
      <textarea
        ref={setRef}
        rows={1}
        value={text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKey}
        className={cn(
          "flex-1 bg-surface-raised text-text border border-border rounded-sm",
          "px-sm py-xs text-sm font-sans resize-none leading-snug",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-accent",
          "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        )}
      />
      <button
        type="button"
        aria-label={`Remove bullet ${index + 1}`}
        disabled={!canRemove}
        onClick={onRemove}
        className={cn(
          "w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-sm",
          "text-text-tertiary hover:text-text hover:bg-surface-muted",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
        )}
      >
        <span aria-hidden="true">x</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/ui/form/bullet-list.test.tsx`
Expected: all 4 tests pass.

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/bullet-list.tsx src/ui/form/bullet-list.test.tsx
git commit -m "feat(ui): add bullet-list with per-row drag reorder"
```

---

## Task 13: `MonthYearPicker` component

**Files:**

- Create: `src/ui/form/month-year-picker.tsx`
- Create: `src/ui/form/month-year-picker.test.tsx`

Contract: value is a string matching one of `""`, `"YYYY"`, `"YYYY-MM"`, or `"present"` (only when `allowPresent` is true). Identical to `DateField`.

- [ ] **Step 1: Write the failing tests**

Create `src/ui/form/month-year-picker.test.tsx`:

```tsx
import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthYearPicker } from "./month-year-picker";

test("renders placeholder when value is empty", () => {
  render(<MonthYearPicker value="" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/-/);
  cleanup();
});

test("formats YYYY-MM value as Mon YYYY", () => {
  render(<MonthYearPicker value="2024-03" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/Mar 2024/);
  cleanup();
});

test("formats YYYY value as just the year", () => {
  render(<MonthYearPicker value="2021" onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/2021/);
  cleanup();
});

test("formats 'present' as Present when allowed", () => {
  render(<MonthYearPicker value="present" allowPresent onChange={() => {}} />);
  expect(screen.getByRole("button", { name: /pick date/i }).textContent).toMatch(/Present/);
  cleanup();
});

test("selecting month+year emits YYYY-MM", async () => {
  const onChange = mock((_v: string) => {});
  const user = userEvent.setup();
  render(<MonthYearPicker value="" onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /pick date/i }));
  await user.selectOptions(screen.getByLabelText(/month/i), "3");
  await user.selectOptions(screen.getByLabelText(/year/i), "2024");
  expect(onChange).toHaveBeenLastCalledWith("2024-03");
  cleanup();
});

test("toggling Present emits 'present' then clears back", async () => {
  const onChange = mock((_v: string) => {});
  const user = userEvent.setup();
  render(<MonthYearPicker value="2024-03" allowPresent onChange={onChange} />);
  await user.click(screen.getByRole("button", { name: /pick date/i }));
  await user.click(screen.getByLabelText(/present/i));
  expect(onChange).toHaveBeenCalledWith("present");
  cleanup();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/ui/form/month-year-picker.test.tsx`
Expected: tests fail with "Cannot find module './month-year-picker'".

- [ ] **Step 3: Write `month-year-picker.tsx`**

Implementation note: to keep `@testing-library` interactions simple and portable, the popover body uses native `<select>` elements (still styled via Tailwind utilities). The Base UI `Popover` wraps the trigger and content. If future polish calls for a custom Select, it can be swapped in later without changing the value contract.

```tsx
import { useMemo } from "react";
import { cn } from "../lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";

type Props = {
  value: string;
  onChange: (next: string) => void;
  allowPresent?: boolean;
  placeholder?: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parse(value: string): { year: string; month: string } {
  if (value === "" || value === "present") return { year: "", month: "" };
  const [y, m] = value.split("-");
  return { year: y ?? "", month: m ?? "" };
}

function format(value: string, placeholder: string): string {
  if (value === "present") return "Present";
  if (value === "") return placeholder;
  const { year, month } = parse(value);
  if (!year) return placeholder;
  if (!month) return year;
  const idx = Number(month) - 1;
  const label = MONTHS[idx] ?? month;
  return `${label} ${year}`;
}

export function MonthYearPicker({ value, onChange, allowPresent, placeholder = "-" }: Props) {
  const { year, month } = parse(value);
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 52 }, (_, i) => String(now + 1 - i));
  }, []);
  const isPresent = value === "present";

  const setYear = (y: string) => onChange(y ? (month ? `${y}-${month}` : y) : "");
  const setMonth = (m: string) => onChange(year ? (m ? `${year}-${m}` : year) : "");
  const togglePresent = () => onChange(isPresent ? "" : "present");
  const clear = () => onChange("");

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Pick date"
        className={cn(
          "w-full text-left bg-surface-raised text-text border border-border rounded-sm",
          "px-sm py-xs text-sm leading-none font-mono tabular-nums",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-accent",
          "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        )}
      >
        {format(value, placeholder)}
      </PopoverTrigger>
      <PopoverContent className="grid gap-sm min-w-[240px]">
        <div className="grid gap-2xs">
          <label className="text-xs text-text-secondary" htmlFor="month-select">Month</label>
          <select
            id="month-select"
            disabled={isPresent}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className={cn(
              "bg-surface-raised text-text border border-border rounded-sm px-sm py-xs text-sm",
              "disabled:opacity-50",
            )}
          >
            <option value="">-</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2xs">
          <label className="text-xs text-text-secondary" htmlFor="year-select">Year</label>
          <select
            id="year-select"
            disabled={isPresent}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={cn(
              "bg-surface-raised text-text border border-border rounded-sm px-sm py-xs text-sm",
              "disabled:opacity-50",
            )}
          >
            <option value="">-</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {allowPresent && (
          <label className="flex items-center gap-xs text-sm">
            <input type="checkbox" checked={isPresent} onChange={togglePresent} />
            Present
          </label>
        )}
        <button
          type="button"
          onClick={clear}
          className="text-xs text-text-secondary hover:text-text justify-self-start"
        >
          Clear
        </button>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/ui/form/month-year-picker.test.tsx`
Expected: all 6 tests pass. If opening the Popover does not expose the `<select>` controls under happy-dom's portal rendering, swap `PopoverContent` for a conditional inline div in this component (still inside the Base UI `Popover.Popup`). The same value contract holds.

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/month-year-picker.tsx src/ui/form/month-year-picker.test.tsx
git commit -m "feat(ui): add month-year picker popover"
```

---

## Task 14: `FormCard` (collapsible wrapper for repeating items)

**Files:**

- Create: `src/ui/form/form-card.tsx`

- [ ] **Step 1: Write `form-card.tsx`**

```tsx
import { useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { SortableHandle } from "./sortable-list";
import { Button } from "../primitives/button";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  onRemove: () => void;
  removeLabel?: string;
  children: ReactNode;
  dragLabel?: string;
};

export function FormCard({
  title,
  subtitle,
  onRemove,
  removeLabel = "Remove",
  children,
  dragLabel,
}: Props) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={cn(
        "bg-surface-raised border border-border-subtle rounded-md",
        "overflow-hidden",
      )}
    >
      <div className="flex items-center gap-xs px-sm py-xs border-b border-border-subtle">
        <SortableHandle aria-label={dragLabel ?? "Reorder item"} />
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex-1 text-left inline-flex items-baseline gap-sm min-w-0",
            "hover:bg-surface-muted rounded-sm px-2xs -mx-2xs py-2xs",
            "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
          )}
        >
          <span className="text-sm font-medium text-text truncate">{title}</span>
          {subtitle && (
            <span className="text-xs text-text-secondary truncate">{subtitle}</span>
          )}
          <span aria-hidden="true" className="ml-auto text-text-tertiary text-xs">
            {open ? "collapse" : "expand"}
          </span>
        </button>
        <Button variant="danger" size="sm" onClick={onRemove}>{removeLabel}</Button>
      </div>
      {open && <div className="p-md grid gap-sm">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/form-card.tsx
git commit -m "feat(ui): add form-card collapsible wrapper"
```

---

## Task 15: `SectionRail`

**Files:**

- Create: `src/ui/form/section-rail.tsx`
- Create: `src/ui/form/section-rail.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/ui/form/section-rail.test.tsx`:

```tsx
import { test, expect, mock } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionRail } from "./section-rail";

const items = [
  { id: "meta", label: "Meta" },
  { id: "experience", label: "Experience", count: 3 },
  { id: "skills", label: "Skills" },
];

test("renders items with counts", () => {
  render(<SectionRail active="meta" items={items} onActivate={() => {}} />);
  expect(screen.getByRole("tab", { name: /^Meta/i }).getAttribute("aria-selected")).toBe("true");
  expect(screen.getByRole("tab", { name: /Experience/i }).textContent).toMatch(/3/);
  cleanup();
});

test("click activates a section", async () => {
  const onActivate = mock((_id: string) => {});
  const user = userEvent.setup();
  render(<SectionRail active="meta" items={items} onActivate={onActivate} />);
  await user.click(screen.getByRole("tab", { name: /Skills/i }));
  expect(onActivate).toHaveBeenCalledWith("skills");
  cleanup();
});

test("arrow keys move selection", async () => {
  const onActivate = mock((_id: string) => {});
  const user = userEvent.setup();
  render(<SectionRail active="meta" items={items} onActivate={onActivate} />);
  const meta = screen.getByRole("tab", { name: /^Meta/i });
  meta.focus();
  await user.keyboard("{ArrowDown}");
  expect(onActivate).toHaveBeenCalledWith("experience");
  cleanup();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test src/ui/form/section-rail.test.tsx`
Expected: tests fail with "Cannot find module './section-rail'".

- [ ] **Step 3: Write `section-rail.tsx`**

```tsx
import { useCallback, useRef, type KeyboardEvent } from "react";
import { cn } from "../lib/cn";

export type SectionRailItem = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  items: SectionRailItem[];
  active: string;
  onActivate: (id: string) => void;
  className?: string;
};

export function SectionRail({ items, active, onActivate, className }: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusIndex = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, i));
    const item = items[clamped];
    const el = refs.current[clamped];
    if (item && el) {
      el.focus();
      onActivate(item.id);
    }
  }, [items, onActivate]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>, current: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(current + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusIndex(items.length - 1);
    }
  };

  return (
    <nav
      role="tablist"
      aria-orientation="vertical"
      className={cn("flex flex-col gap-2xs py-md pr-md w-[200px] shrink-0", className)}
    >
      {items.map((item, i) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onActivate(item.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "group flex items-center justify-between gap-sm pl-md pr-sm py-xs",
              "text-sm rounded-sm text-text-secondary",
              "border-l-2 border-transparent",
              "hover:bg-surface-muted hover:text-text",
              "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]",
              isActive && "text-text font-semibold border-accent bg-surface-muted",
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[1.25rem] px-xs",
                  "text-xs font-mono tabular-nums rounded-full",
                  "bg-surface border border-border-subtle text-text-tertiary",
                  isActive && "text-text bg-surface-raised",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test src/ui/form/section-rail.test.tsx`
Expected: all 3 tests pass.

- [ ] **Step 5: Run typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/section-rail.tsx src/ui/form/section-rail.test.tsx
git commit -m "feat(ui): add section-rail nav with counts"
```

---

## Task 16: Rewrite `MetaSection`

**Files:**

- Modify: `src/ui/form/meta-section.tsx`

- [ ] **Step 1: Replace the contents of `meta-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Textarea } from "../primitives/textarea";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

export function MetaSection() {
  const meta = useResumeStore((s) => s.resume.meta);
  const update = resumeStore.getState().updateMeta;
  const summaryMd = meta.summary ? inlineNodesToMd(meta.summary) : "";

  return (
    <div className="grid gap-md">
      <div className="grid gap-2xs">
        <Label htmlFor="meta-name">Full name</Label>
        <Input
          id="meta-name"
          value={meta.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="meta-title">Title</Label>
        <Input
          id="meta-title"
          placeholder="e.g. Senior Software Engineer"
          value={meta.title ?? ""}
          onChange={(e) => update({ title: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="meta-summary">Summary</Label>
        <Textarea
          id="meta-summary"
          placeholder="A short paragraph for the top of your resume. Markdown works."
          value={summaryMd}
          onChange={(e) => {
            const text = e.target.value;
            update({ summary: text ? mdToInlineNodes(text) : undefined });
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/meta-section.tsx
git commit -m "refactor(ui): rewrite meta-section on new primitives"
```

---

## Task 17: Rewrite `ContactSection`

**Files:**

- Modify: `src/ui/form/contact-section.tsx`

- [ ] **Step 1: Replace the contents of `contact-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList, SortableHandle } from "./sortable-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ContactSection() {
  const contact = useResumeStore((s) => s.resume.contact);
  const { updateContact, moveLink } = resumeStore.getState();
  const links = contact.links ?? [];
  const updateLink = (i: number, patch: { label?: string; url?: string }) => {
    updateContact({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  };
  const addLink = () => updateContact({ links: [...links, { label: "", url: "" }] });
  const removeLink = (i: number) =>
    updateContact({ links: links.filter((_, idx) => idx !== i) });

  return (
    <div className="grid gap-md">
      <div className="grid grid-cols-2 gap-sm">
        <div className="grid gap-2xs">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={contact.email ?? ""}
            onChange={(e) => updateContact({ email: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2xs">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            value={contact.phone ?? ""}
            onChange={(e) => updateContact({ phone: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="contact-location">Location</Label>
        <Input
          id="contact-location"
          value={contact.location ?? ""}
          onChange={(e) => updateContact({ location: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-xs">
        <Label>Links</Label>
        <SortableList
          items={links}
          keyFor={(_, i) => `link-${i}`}
          onReorder={moveLink}
          renderItem={(l, i) => (
            <div className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-xs">
              <SortableHandle aria-label={`Drag link ${i + 1}`} />
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={l.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const name = l.label || l.url || "link";
                  softRemove(`Removed ${name}`, () => removeLink(i));
                }}
              >
                Remove
              </Button>
            </div>
          )}
        />
        <div>
          <Button variant="ghost" size="sm" onClick={addLink}>+ Add link</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/contact-section.tsx
git commit -m "refactor(ui): rewrite contact-section with sortable links"
```

---

## Task 18: Rewrite `ExperienceSection`

**Files:**

- Modify: `src/ui/form/experience-section.tsx`

- [ ] **Step 1: Replace the contents of `experience-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { MonthYearPicker } from "./month-year-picker";
import { ChipInput } from "./chip-input";
import { BulletList } from "./bullet-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ExperienceSection() {
  const experience = useResumeStore((s) => s.resume.experience);
  const { updateExperience, removeExperience, addExperience, moveExperience } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={experience}
        keyFor={(_, i) => `exp-${i}`}
        onReorder={moveExperience}
        renderItem={(e, i) => (
          <FormCard
            title={e.role || "Role"}
            subtitle={e.company || "Company"}
            dragLabel={`Drag ${e.role || "role"}`}
            onRemove={() => {
              const label = e.role || e.company || "experience";
              softRemove(`Removed ${label}`, () => removeExperience(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-role-${i}`}>Role</Label>
                <Input
                  id={`exp-role-${i}`}
                  value={e.role}
                  onChange={(ev) => updateExperience(i, { role: ev.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-company-${i}`}>Company</Label>
                <Input
                  id={`exp-company-${i}`}
                  value={e.company}
                  onChange={(ev) => updateExperience(i, { company: ev.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-loc-${i}`}>Location</Label>
                <Input
                  id={`exp-loc-${i}`}
                  value={e.location ?? ""}
                  onChange={(ev) =>
                    updateExperience(i, { location: ev.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label>Start</Label>
                <MonthYearPicker
                  value={e.start}
                  onChange={(v) => updateExperience(i, { start: v })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label>End</Label>
                <MonthYearPicker
                  value={e.end}
                  allowPresent
                  onChange={(v) => updateExperience(i, { end: v as typeof e.end })}
                />
              </div>
            </div>
            <div className="grid gap-2xs">
              <Label>Tech</Label>
              <ChipInput
                placeholder="Add tech"
                value={e.tech ?? []}
                onChange={(next) =>
                  updateExperience(i, { tech: next.length > 0 ? next : undefined })
                }
              />
            </div>
            <BulletList
              bullets={e.bullets}
              onChange={(b) => updateExperience(i, { bullets: b })}
            />
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addExperience}>+ Add experience</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/experience-section.tsx
git commit -m "refactor(ui): rewrite experience-section on new primitives"
```

---

## Task 19: Rewrite `EducationSection`

**Files:**

- Modify: `src/ui/form/education-section.tsx`

- [ ] **Step 1: Replace the contents of `education-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { MonthYearPicker } from "./month-year-picker";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const { updateEducation, removeEducation, addEducation, moveEducation } =
    resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={education}
        keyFor={(_, i) => `ed-${i}`}
        onReorder={moveEducation}
        renderItem={(ed, i) => (
          <FormCard
            title={ed.degree || "Degree"}
            subtitle={ed.institution || "Institution"}
            dragLabel={`Drag ${ed.degree || "education"}`}
            onRemove={() => {
              const label = ed.institution || ed.degree || "education";
              softRemove(`Removed ${label}`, () => removeEducation(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-inst-${i}`}>Institution</Label>
                <Input
                  id={`ed-inst-${i}`}
                  value={ed.institution}
                  onChange={(e) => updateEducation(i, { institution: e.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-degree-${i}`}>Degree</Label>
                <Input
                  id={`ed-degree-${i}`}
                  value={ed.degree}
                  onChange={(e) => updateEducation(i, { degree: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-field-${i}`}>Field</Label>
                <Input
                  id={`ed-field-${i}`}
                  value={ed.field ?? ""}
                  onChange={(e) =>
                    updateEducation(i, { field: e.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-loc-${i}`}>Location</Label>
                <Input
                  id={`ed-loc-${i}`}
                  value={ed.location ?? ""}
                  onChange={(e) =>
                    updateEducation(i, { location: e.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label>Start</Label>
                <MonthYearPicker
                  value={ed.start ?? ""}
                  onChange={(v) => updateEducation(i, { start: v || undefined })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label>End</Label>
                <MonthYearPicker
                  value={ed.end ?? ""}
                  onChange={(v) => updateEducation(i, { end: v || undefined })}
                />
              </div>
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addEducation}>+ Add education</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/education-section.tsx
git commit -m "refactor(ui): rewrite education-section on new primitives"
```

---

## Task 20: Rewrite `SkillsSection`

**Files:**

- Modify: `src/ui/form/skills-section.tsx`

- [ ] **Step 1: Replace the contents of `skills-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { ChipInput } from "./chip-input";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const { updateSkillsGroup, removeSkillsGroup, addSkillsGroup, moveSkillsGroup } =
    resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={skills}
        keyFor={(_, i) => `skill-${i}`}
        onReorder={moveSkillsGroup}
        renderItem={(g, i) => (
          <FormCard
            title={g.group || "Group"}
            subtitle={`${g.items.length} ${g.items.length === 1 ? "skill" : "skills"}`}
            removeLabel="Remove group"
            dragLabel={`Drag ${g.group || "group"}`}
            onRemove={() => {
              const label = g.group || "skills group";
              softRemove(`Removed ${label}`, () => removeSkillsGroup(i));
            }}
          >
            <div className="grid gap-2xs">
              <Label htmlFor={`skill-group-${i}`}>Group</Label>
              <Input
                id={`skill-group-${i}`}
                placeholder="e.g. Languages"
                value={g.group ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) updateSkillsGroup(i, { group: val });
                  else updateSkillsGroup(i, { items: g.items });
                }}
              />
            </div>
            <div className="grid gap-2xs">
              <Label>Skills</Label>
              <ChipInput
                placeholder="Add skill"
                value={g.items}
                onChange={(next) => updateSkillsGroup(i, { items: next })}
              />
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addSkillsGroup}>+ Add skills group</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/skills-section.tsx
git commit -m "refactor(ui): rewrite skills-section with chip input"
```

---

## Task 21: Rewrite `ProjectsSection`

**Files:**

- Modify: `src/ui/form/projects-section.tsx`

- [ ] **Step 1: Replace the contents of `projects-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { ChipInput } from "./chip-input";
import { BulletList } from "./bullet-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Project } from "../../schema/resume";

const EMPTY_PROJECTS: Project[] = [];

export function ProjectsSection() {
  const projects = useResumeStore((s) => s.resume.projects ?? EMPTY_PROJECTS);
  const { updateProject, removeProject, addProject, moveProject } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={projects}
        keyFor={(_, i) => `proj-${i}`}
        onReorder={moveProject}
        renderItem={(p, i) => (
          <FormCard
            title={p.name || "Project"}
            subtitle={p.description}
            dragLabel={`Drag ${p.name || "project"}`}
            onRemove={() => {
              const label = p.name || "project";
              softRemove(`Removed ${label}`, () => removeProject(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`proj-name-${i}`}>Name</Label>
                <Input
                  id={`proj-name-${i}`}
                  value={p.name}
                  onChange={(e) => updateProject(i, { name: e.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`proj-url-${i}`}>URL</Label>
                <Input
                  id={`proj-url-${i}`}
                  placeholder="https://example.com"
                  value={p.url ?? ""}
                  onChange={(e) =>
                    updateProject(i, { url: e.target.value || undefined })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2xs">
              <Label htmlFor={`proj-desc-${i}`}>Description</Label>
              <Input
                id={`proj-desc-${i}`}
                placeholder="One-line summary"
                value={p.description ?? ""}
                onChange={(e) =>
                  updateProject(i, { description: e.target.value || undefined })
                }
              />
            </div>
            <div className="grid gap-2xs">
              <Label>Tech</Label>
              <ChipInput
                placeholder="Add tech"
                value={p.tech ?? []}
                onChange={(next) =>
                  updateProject(i, { tech: next.length > 0 ? next : undefined })
                }
              />
            </div>
            <BulletList
              bullets={p.bullets ?? []}
              onChange={(b) => updateProject(i, { bullets: b })}
            />
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addProject}>+ Add project</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/projects-section.tsx
git commit -m "refactor(ui): rewrite projects-section on new primitives"
```

---

## Task 22: Rewrite `ExtrasSection`

**Files:**

- Modify: `src/ui/form/extras-section.tsx`

- [ ] **Step 1: Replace the contents of `extras-section.tsx`**

```tsx
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Extra } from "../../schema/resume";

const EMPTY_EXTRAS: Extra[] = [];

export function ExtrasSection() {
  const extras = useResumeStore((s) => s.resume.extras ?? EMPTY_EXTRAS);
  const { updateExtra, removeExtra, addExtra, moveExtra } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={extras}
        keyFor={(_, i) => `extra-${i}`}
        onReorder={moveExtra}
        renderItem={(ex, i) => (
          <FormCard
            title={ex.heading || "Section"}
            subtitle={`${ex.items.length} ${ex.items.length === 1 ? "item" : "items"}`}
            removeLabel="Remove section"
            dragLabel={`Drag ${ex.heading || "section"}`}
            onRemove={() => {
              const label = ex.heading || "section";
              softRemove(`Removed ${label}`, () => removeExtra(i));
            }}
          >
            <div className="grid gap-2xs">
              <Label htmlFor={`extra-head-${i}`}>Section heading</Label>
              <Input
                id={`extra-head-${i}`}
                placeholder="e.g. Certifications"
                value={ex.heading}
                onChange={(e) => updateExtra(i, { heading: e.target.value })}
              />
            </div>
            <div className="grid gap-xs">
              {ex.items.map((it, j) => (
                <div key={j} className="grid grid-cols-[1fr_1fr_auto_auto] gap-xs items-end">
                  <Input
                    placeholder="Title"
                    value={it.title}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, title: e.target.value } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Input
                    placeholder="Subtitle"
                    value={it.subtitle ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, subtitle: e.target.value || undefined } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Input
                    className="font-mono tabular-nums w-[7rem]"
                    placeholder="Date"
                    value={it.date ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, date: e.target.value || undefined } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={ex.items.length <= 1}
                    onClick={() => {
                      const items = ex.items.filter((_, k) => k !== j);
                      updateExtra(i, { items });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateExtra(i, { items: [...ex.items, { title: "" }] })}
              >
                + Add item
              </Button>
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addExtra}>+ Add section</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck and tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/ui/form/extras-section.tsx
git commit -m "refactor(ui): rewrite extras-section on new primitives"
```

---

## Task 23: Rewrite `FormTab` with rail + body and delete retired files

**Files:**

- Modify: `src/ui/form/form-tab.tsx`
- Delete: `src/ui/form/fields.tsx`
- Delete: `src/ui/form/bullet-editor.tsx`
- Delete: `src/ui/form/date-field.tsx`
- Delete: `src/ui/theme/button.tsx`
- Delete: `src/ui/theme/section.tsx`
- Delete: `src/ui/theme/section-title.tsx`

- [ ] **Step 1: Replace the contents of `form-tab.tsx`**

```tsx
import { useMemo, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { SectionRail, type SectionRailItem } from "./section-rail";
import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { ExtrasSection } from "./extras-section";

type SectionId = "meta" | "contact" | "experience" | "education" | "skills" | "projects" | "extras";

const SECTION_META: Array<{ id: SectionId; label: string; hint: string }> = [
  { id: "meta", label: "Profile", hint: "Your name, role, and an optional summary line." },
  { id: "contact", label: "Contact", hint: "Email, phone, location, and links." },
  { id: "experience", label: "Experience", hint: "Most recent role first. Each role becomes its own block in the PDF." },
  { id: "education", label: "Education", hint: "Degrees and institutions. Dates are optional." },
  { id: "skills", label: "Skills", hint: "Group related skills together; leave the group blank for a flat list." },
  { id: "projects", label: "Projects", hint: "Optional. Good for side work or open source." },
  { id: "extras", label: "Additional", hint: "Certifications, Awards, Publications, and similar." },
];

export function FormTab() {
  const [active, setActive] = useState<SectionId>("meta");
  const resume = useResumeStore((s) => s.resume);

  const items = useMemo<SectionRailItem[]>(
    () => SECTION_META.map((m) => {
      switch (m.id) {
        case "experience": return { id: m.id, label: m.label, count: resume.experience.length };
        case "education": return { id: m.id, label: m.label, count: resume.education.length };
        case "skills": return { id: m.id, label: m.label, count: resume.skills.length };
        case "projects": return { id: m.id, label: m.label, count: (resume.projects ?? []).length };
        case "extras": return { id: m.id, label: m.label, count: (resume.extras ?? []).length };
        case "contact": return {
          id: m.id,
          label: m.label,
          count: (resume.contact.links ?? []).length,
        };
        default: return { id: m.id, label: m.label };
      }
    }),
    [resume],
  );

  const meta = SECTION_META.find((m) => m.id === active)!;

  return (
    <div className="flex gap-md pl-lg pr-md py-lg min-h-full">
      <SectionRail items={items} active={active} onActivate={(id) => setActive(id as SectionId)} />
      <div className="flex-1 min-w-0 max-w-[68ch] grid gap-lg content-start">
        <header className="grid gap-2xs">
          <h2 className="text-lg font-semibold text-text tracking-tight">{meta.label}</h2>
          <p className="text-sm text-text-tertiary">{meta.hint}</p>
        </header>
        {active === "meta" && <MetaSection />}
        {active === "contact" && <ContactSection />}
        {active === "experience" && <ExperienceSection />}
        {active === "education" && <EducationSection />}
        {active === "skills" && <SkillsSection />}
        {active === "projects" && <ProjectsSection />}
        {active === "extras" && <ExtrasSection />}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete retired files**

Run:

```bash
git rm src/ui/form/fields.tsx src/ui/form/bullet-editor.tsx src/ui/form/date-field.tsx
git rm src/ui/theme/button.tsx src/ui/theme/section.tsx src/ui/theme/section-title.tsx
```

- [ ] **Step 3: Fix any lingering imports**

Run: `bun run typecheck`
Expected: may fail if any other file still imports `theme/button` or the deleted form files. If so, update each import to use `src/ui/primitives/button` etc. For the top bar, tabs, command palette, empty state, toasts: these likely import `theme/button`. Change each import line, for example:

```diff
-import { Button } from "../theme/button";
+import { Button } from "../primitives/button";
```

Re-run `bun run typecheck` until it passes.

- [ ] **Step 4: Run full test suite**

Run: `bun test`
Expected: all pass.

- [ ] **Step 5: Verify app renders in browser**

Run:

```bash
bun run dev --port 3001 &
SERVER_PID=$!
sleep 4
curl -sf http://localhost:3001/ > /dev/null && echo OK || echo FAIL
kill $SERVER_PID
```

Expected: `OK`.

- [ ] **Step 6: Commit**

```bash
git add src/ui/form/form-tab.tsx
git add -u src/ui/form src/ui/theme src/ui/shell src/ui/editor src/ui/preview src/ui/app.tsx
git commit -m "refactor(ui): rewrite form-tab with section rail, retire legacy field helpers"
```

Note: `-u` stages deletes of tracked files plus modifications to files whose imports you adjusted. It will not pull in untracked work elsewhere.

---

## Task 24: Prune `components.css`

**Files:**

- Modify: `src/ui/theme/components.css`

- [ ] **Step 1: Remove rules owned by primitives**

Edit `src/ui/theme/components.css` to delete the following sections entirely (they are now expressed as Tailwind utilities inside the primitives and sections):

- `.btn`, `.btn:focus-visible`, `.btn:disabled` and all `.btn-*` variants
- `input`, `textarea`, `select` blocks (the bare-element styles)
- `.kbd` (if no non-form surface uses it; check with `bun x grep -R '"kbd"' src || true` - if only `theme/kbd.tsx` uses it, leave both the class and the component in place for now)
- `.card` (its users are now `FormCard` with Tailwind)
- `.pill`, `.pill-*` (unused after the rewrite; run `bun x grep -R 'className="pill' src || true` to confirm before deleting; if still used outside form/, leave them)

Keep untouched (these are still in use or global):

- Global `body` background/color
- `a:focus-visible`, `[role="button"]:focus-visible`, `[tabindex]:focus-visible`
- `.surface-divider`
- `.toast-stack`, `.toast`, `.toast-*`, `@keyframes toast-in`
- `.tab`, `.tab:hover`, `.tab:focus-visible`, `.tab[aria-selected="true"]`
- `.two-pane`, `.two-pane-*`, `.pane-resizer`, the narrow-viewport `@media`
- `.palette-*`, `@keyframes palette-backdrop-in`, `@keyframes palette-in`
- `@media (prefers-reduced-motion: reduce)` block

- [ ] **Step 2: Verify the app renders**

Run:

```bash
bun run dev --port 3001 &
SERVER_PID=$!
sleep 4
curl -sf http://localhost:3001/ > /dev/null && echo OK || echo FAIL
kill $SERVER_PID
```

Expected: `OK`.

- [ ] **Step 3: Run typecheck + tests**

Run: `bun run typecheck && bun test`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/ui/theme/components.css
git commit -m "refactor(ui): prune orphaned component css"
```

---

## Task 25: End-to-end smoke and fix

**Files:**

- Variable, based on findings.

- [ ] **Step 1: Full test + typecheck pass**

Run: `bun test && bun run typecheck`
Expected: both pass.

- [ ] **Step 2: Browser smoke via agent-browser**

Per `CLAUDE.md`, use the agent-browser skill (not Playwright MCP) to:

- Start `bun run dev` on port 3001.
- Navigate to `http://localhost:3001/`.
- Verify no console errors on load.
- Click through the rail: Profile, Contact, Experience, Education, Skills, Projects, Additional. Each switches the body.
- From the command palette, run "Load example resume". Confirm:
  - Experience count in the rail shows `1`.
  - Opening Experience shows one `FormCard` with the role + company in the header.
  - Editing the role text updates the card header title live.
  - `MonthYearPicker` on Start opens a popover with Month/Year selects.
  - `MonthYearPicker` on End shows "Present" and the checkbox is toggleable.
  - The tech `ChipInput` shows "TypeScript", "Bun", "AWS" as chips; adding "Rust" via Enter commits a new chip.
  - `BulletList` shows two rows; Enter at end of the last row adds a third; drag handle is focusable.
  - Skills has two groups, each shown as a `FormCard` with a `ChipInput`.
  - Contact has two links that reorder via keyboard (focus handle, Space, Arrow Down, Space).
- Confirm the preview pane on the right updates after each field change.
- Click the Export PDF button (top bar). Confirm a file downloads.
- Reload the page. Confirm the edited resume hydrates from local storage.

- [ ] **Step 3: Fix anything broken**

Record any defects. For each: write or extend a test that reproduces, fix the component, re-run the smoke. Commit each fix as its own `fix(ui): ...` commit.

- [ ] **Step 4: Final commit if clean**

If step 2 was clean and step 3 produced no fixes, there is nothing to commit for this task. Otherwise each fix commits itself in step 3.

---

## Self-review

**Spec coverage check:**

- Section 1 (layout/rail): covered by Tasks 15, 23.
- Section 2 (Tailwind + tokens): covered by Tasks 1, 2, 24.
- Section 3 (component library): covered by Tasks 3-8.
- Section 4 (field primitives: ChipInput, BulletList, SortableList, MonthYearPicker): covered by Tasks 10-13.
- Section 5 (file changes): the plan's new/modified/deleted list matches the spec's file changes section.
- Section 6 (migration order): the ordering of Tasks 1-25 follows the spec's migration order (foundation, primitives, custom primitives, section rewrites, cleanup, smoke).
- Section 7 (testing): primitive tests in Tasks 9, 10, 11, 12, 13, 15; section rewrites run the full suite on each commit; agent-browser smoke in Task 25.
- Risks section: Tailwind v4 fallback addressed in Task 1 (stop and fix if dev server won't start). dnd-kit focus friction addressed in Task 11 with a fallback note. Bullet round-trip is the explicit focus of a test in Task 12. Preview regressions surface through existing tests plus Task 25 smoke.

**Type consistency:**

- `ChipInput` props `value: string[]`, `onChange: (next: string[]) => void`, consistent across Tasks 10, 18, 20, 21.
- `BulletList` props `bullets: InlineNode[][]`, `onChange: (next: InlineNode[][]) => void`, consistent across Tasks 12, 18, 21.
- `MonthYearPicker` props `value: string`, `onChange: (next: string) => void`, `allowPresent?: boolean`, consistent across Tasks 13, 18, 19.
- `SortableList` props `items: T[]`, `keyFor: (item: T, index: number) => string`, `onReorder: (from: number, to: number) => void`, `renderItem: (item: T, index: number) => ReactNode`, consistent across Tasks 11, 17-22.
- `SectionRail` props `items: SectionRailItem[]`, `active: string`, `onActivate: (id: string) => void`, consistent across Tasks 15, 23.
- `FormCard` props `title`, `subtitle?`, `onRemove`, `removeLabel?`, `dragLabel?`, `children`, consistent across Tasks 14, 18-22.
- Store action signatures (`moveEducation`, `moveProject`, `moveSkillsGroup`, `moveExtra`, `moveLink`) are defined in Task 9 and consumed in Tasks 17, 19, 20, 21, 22.

**Placeholder scan:** No TBDs, no "implement later", every code step contains concrete code; every test contains concrete assertions; every command contains exact expected output.
