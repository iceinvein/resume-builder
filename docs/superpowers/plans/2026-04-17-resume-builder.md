# Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side web app that converts MDX resumes to professionally typeset PDFs via Typst (WASM), with a form-driven editor, MDX escape hatch, BYO import, live SVG preview, and IndexedDB persistence.

**Architecture:** Single-page React app running entirely in the browser. Zod schema is the source of truth; MDX is a serialization format; the Typst template reads the schema JSON and owns all visual decisions. Bullets and summary are structured inline node trees, rendered by a Typst helper function (no string injection into markup). `typst.ts` compiles in a Web Worker. SVG previews are rendered inside data-URI `<img>` sandboxes (no script execution, no cross-origin fetches). State lives in Zustand, persisted to IndexedDB via `idb-keyval`. No backend.

**Tech Stack:** Bun, React 18+, TypeScript, Zod, `@mdx-js/mdx`, `remark-mdx`, `@myriaddreamin/typst.ts`, CodeMirror 6, Zustand, `idb-keyval`, `json5`, happy-dom.

**Spec:** `docs/superpowers/specs/2026-04-17-resume-builder-design.md`

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `bunfig.toml`
- Create: `src/index.html`, `src/index.tsx`, `src/ui/app.tsx`
- Create: `tests/setup.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize Bun project**

Run: `cd /Users/dikrana/Documents/workspace/resume-builder && bun init -y`

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "resume-builder",
  "version": "0.0.1",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun --hot src/index.tsx",
    "build": "bun build src/index.html --outdir dist --splitting",
    "test": "bun test",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "happy-dom": "^15.0.0",
    "@happy-dom/global-registrator": "^15.0.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "types": ["bun-types"],
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "tests", "scripts"]
}
```

- [ ] **Step 4: Write `bunfig.toml`**

```toml
[test]
preload = ["./tests/setup.ts"]
```

- [ ] **Step 5: Write `tests/setup.ts`**

```ts
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
```

- [ ] **Step 6: Write `src/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Resume Builder</title>
    <link rel="icon" href="data:," />
    <style>
      html, body, #root { height: 100%; margin: 0; }
      body { font-family: Inter, system-ui, sans-serif; background: #fafaf7; color: #1a1a1a; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write `src/index.tsx`**

```tsx
import { createRoot } from "react-dom/client";
import { App } from "./ui/app";

const root = document.getElementById("root");
if (!root) throw new Error("root element missing");
createRoot(root).render(<App />);
```

- [ ] **Step 8: Write `src/ui/app.tsx`**

```tsx
export function App() {
  return <div style={{ padding: 24 }}>Resume Builder</div>;
}
```

- [ ] **Step 9: Write `.gitignore`**

```
node_modules/
dist/
bun.lock
.DS_Store
```

- [ ] **Step 10: Install and verify**

Run: `bun install`
Run: `bun run dev` (verify the URL loads, then stop)

- [ ] **Step 11: Commit**

Note: the repo is already initialized. The spec and plan live on the initial commit.

```bash
git add .
git commit -m "chore: scaffold bun+react+ts project"
```

---

## Task 2: Schema

**Files:**
- Create: `src/schema/inline.ts`, `src/schema/resume.ts`, `src/schema/defaults.ts`
- Create: `tests/schema.test.ts`

- [ ] **Step 1: Install Zod**

Run: `bun add zod`

- [ ] **Step 2: Write `src/schema/inline.ts`**

```ts
import { z } from "zod";

export type InlineNode =
  | { t: "text"; v: string }
  | { t: "strong"; c: InlineNode[] }
  | { t: "em"; c: InlineNode[] }
  | { t: "code"; v: string }
  | { t: "link"; u: string; c: InlineNode[] };

export const InlineNodeSchema: z.ZodType<InlineNode> = z.lazy(() =>
  z.union([
    z.object({ t: z.literal("text"), v: z.string() }),
    z.object({ t: z.literal("strong"), c: z.array(InlineNodeSchema) }),
    z.object({ t: z.literal("em"), c: z.array(InlineNodeSchema) }),
    z.object({ t: z.literal("code"), v: z.string() }),
    z.object({ t: z.literal("link"), u: z.string(), c: z.array(InlineNodeSchema) }),
  ]),
);

export const InlineNodesSchema = z.array(InlineNodeSchema);
```

- [ ] **Step 3: Write failing schema test**

```ts
import { test, expect } from "bun:test";
import { ResumeSchema, type Resume } from "../src/schema/resume";
import { emptyResume, exampleResume } from "../src/schema/defaults";

test("empty resume validates", () => {
  expect(ResumeSchema.safeParse(emptyResume).success).toBe(true);
});

test("example resume validates", () => {
  expect(ResumeSchema.safeParse(exampleResume).success).toBe(true);
});

test("rejects missing name", () => {
  const bad = { ...emptyResume, meta: { name: "" } };
  expect(ResumeSchema.safeParse(bad).success).toBe(false);
});

test("experience requires company and role", () => {
  const bad: Resume = {
    ...exampleResume,
    experience: [{ company: "", role: "X", start: "2024-01", end: "present", bullets: [] }],
  };
  expect(ResumeSchema.safeParse(bad).success).toBe(false);
});
```

- [ ] **Step 4: Run, confirm fail**

Run: `bun test tests/schema.test.ts`
Expected: FAIL.

- [ ] **Step 5: Write `src/schema/resume.ts`**

```ts
import { z } from "zod";
import { InlineNodesSchema } from "./inline";

const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const EntryEndSchema = z.union([z.string().min(1), z.literal("present")]);

export const ExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  start: z.string().min(1),
  end: EntryEndSchema,
  bullets: z.array(InlineNodesSchema).default([]),
  tech: z.array(z.string()).optional(),
});

export const EducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const SkillsGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  tech: z.array(z.string()).optional(),
  bullets: z.array(InlineNodesSchema).optional(),
});

export const ExtraItemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const ExtraSchema = z.object({
  heading: z.string().min(1),
  items: z.array(ExtraItemSchema).min(1),
});

export const ResumeSchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    title: z.string().optional(),
    summary: InlineNodesSchema.optional(),
  }),
  contact: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(LinkSchema).optional(),
  }),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillsGroupSchema).default([]),
  projects: z.array(ProjectSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Extra = z.infer<typeof ExtraSchema>;
export type Link = z.infer<typeof LinkSchema>;
```

- [ ] **Step 6: Write `src/schema/defaults.ts`**

```ts
import type { Resume } from "./resume";

export const emptyResume: Resume = {
  meta: { name: "Your Name" },
  contact: {},
  experience: [],
  education: [],
  skills: [],
};

export const exampleResume: Resume = {
  meta: {
    name: "Dik Rana",
    title: "Senior Software Engineer",
    summary: [{ t: "text", v: "Backend-leaning full-stack engineer focused on developer tooling." }],
  },
  contact: {
    email: "dik@example.com",
    phone: "+61 400 000 000",
    location: "Perth, AU",
    links: [
      { label: "GitHub", url: "https://github.com/dikrana" },
      { label: "LinkedIn", url: "https://linkedin.com/in/dikrana" },
    ],
  },
  experience: [
    {
      company: "Mechanical Rock",
      role: "Senior Software Engineer",
      location: "Perth, AU",
      start: "2024-01",
      end: "present",
      bullets: [
        [
          { t: "text", v: "Shipped " },
          { t: "strong", c: [{ t: "text", v: "X" }] },
          { t: "text", v: " that reduced latency by 40%." },
        ],
        [
          { t: "text", v: "Led a team of 4 on " },
          { t: "link", u: "https://example.com", c: [{ t: "text", v: "Project Y" }] },
          { t: "text", v: "." },
        ],
      ],
      tech: ["TypeScript", "Bun", "AWS"],
    },
  ],
  education: [
    { institution: "University of Western Australia", degree: "BSc", field: "Computer Science", start: "2018", end: "2021" },
  ],
  skills: [
    { group: "Languages", items: ["TypeScript", "Rust", "Python"] },
    { group: "Infra", items: ["AWS", "Docker", "Kubernetes"] },
  ],
};
```

- [ ] **Step 7: Run tests, confirm pass**

Run: `bun test tests/schema.test.ts`
Expected: 4 passing tests.

- [ ] **Step 8: Commit**

```bash
git add src/schema tests/schema.test.ts package.json bun.lock
git commit -m "feat(schema): add zod resume schema with inline node trees"
```

---

## Task 3: Markdown <-> InlineNode converters

**Files:**
- Create: `src/mdx/inline.ts`
- Create: `tests/inline.test.ts`

- [ ] **Step 1: Install remark**

Run: `bun add remark-parse unified`
Run: `bun add -d @types/mdast`

- [ ] **Step 2: Write failing test**

```ts
import { test, expect } from "bun:test";
import { mdToInlineNodes, inlineNodesToMd } from "../src/mdx/inline";
import type { InlineNode } from "../src/schema/inline";

test("plain text", () => {
  expect(mdToInlineNodes("hello world"))
    .toEqual([{ t: "text", v: "hello world" }]);
});

test("bold", () => {
  expect(mdToInlineNodes("**hi**"))
    .toEqual([{ t: "strong", c: [{ t: "text", v: "hi" }] }]);
});

test("italic", () => {
  expect(mdToInlineNodes("*emphasis*"))
    .toEqual([{ t: "em", c: [{ t: "text", v: "emphasis" }] }]);
});

test("inline code", () => {
  expect(mdToInlineNodes("`bun test`"))
    .toEqual([{ t: "code", v: "bun test" }]);
});

test("link", () => {
  expect(mdToInlineNodes("[docs](https://example.com)"))
    .toEqual([{ t: "link", u: "https://example.com", c: [{ t: "text", v: "docs" }] }]);
});

test("mixed", () => {
  const nodes = mdToInlineNodes("Led **team** on [proj](https://x.io).");
  expect(nodes).toEqual([
    { t: "text", v: "Led " },
    { t: "strong", c: [{ t: "text", v: "team" }] },
    { t: "text", v: " on " },
    { t: "link", u: "https://x.io", c: [{ t: "text", v: "proj" }] },
    { t: "text", v: "." },
  ]);
});

test("roundtrip via markdown", () => {
  const source = "Led **team** on [proj](https://x.io) with `code`.";
  const nodes = mdToInlineNodes(source);
  const regenerated = inlineNodesToMd(nodes);
  expect(mdToInlineNodes(regenerated)).toEqual(nodes);
});

test("serializer output for bold", () => {
  const nodes: InlineNode[] = [{ t: "strong", c: [{ t: "text", v: "hi" }] }];
  expect(inlineNodesToMd(nodes)).toBe("**hi**");
});
```

- [ ] **Step 3: Run, confirm fail**

Run: `bun test tests/inline.test.ts`
Expected: FAIL.

- [ ] **Step 4: Write `src/mdx/inline.ts`**

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, PhrasingContent } from "mdast";
import type { InlineNode } from "../schema/inline";

function fromMdast(nodes: PhrasingContent[]): InlineNode[] {
  return nodes.flatMap((n): InlineNode[] => {
    switch (n.type) {
      case "text": return [{ t: "text", v: n.value }];
      case "strong": return [{ t: "strong", c: fromMdast(n.children) }];
      case "emphasis": return [{ t: "em", c: fromMdast(n.children) }];
      case "inlineCode": return [{ t: "code", v: n.value }];
      case "link": return [{ t: "link", u: n.url, c: fromMdast(n.children) }];
      case "break": return [{ t: "text", v: "\n" }];
      default: return [];
    }
  });
}

export function mdToInlineNodes(markdown: string): InlineNode[] {
  const tree = unified().use(remarkParse).parse(markdown) as Root;
  const first = tree.children[0];
  if (!first || first.type !== "paragraph") return [{ t: "text", v: markdown }];
  return fromMdast(first.children);
}

export function inlineNodesToMd(nodes: InlineNode[]): string {
  return nodes.map((n) => {
    switch (n.t) {
      case "text": return n.v;
      case "strong": return `**${inlineNodesToMd(n.c)}**`;
      case "em": return `*${inlineNodesToMd(n.c)}*`;
      case "code": return `\`${n.v}\``;
      case "link": return `[${inlineNodesToMd(n.c)}](${n.u})`;
    }
  }).join("");
}
```

- [ ] **Step 5: Run, confirm pass**

Run: `bun test tests/inline.test.ts`
Expected: 8 passing tests.

- [ ] **Step 6: Commit**

```bash
git add src/mdx/inline.ts tests/inline.test.ts package.json bun.lock
git commit -m "feat(mdx): add markdown-to-inline-node converters"
```

---

## Task 4: MDX parser (MDX → schema)

**Files:**
- Create: `src/mdx/components.ts`, `src/mdx/expr.ts`, `src/mdx/parse.ts`
- Create: `tests/parse.test.ts`
- Create: `fixtures/minimal.mdx`, `fixtures/maximal.mdx`

- [ ] **Step 1: Install MDX deps**

Run: `bun add @mdx-js/mdx remark-mdx remark-frontmatter yaml json5 mdast-util-mdx-jsx`

- [ ] **Step 2: Write `fixtures/minimal.mdx`**

```mdx
---
name: Min Resume
---

<Contact email="min@example.com" />

## Experience

<Experience company="Acme" role="Engineer" start="2023-01" end="present">
- Did work
</Experience>
```

- [ ] **Step 3: Write `fixtures/maximal.mdx`**

```mdx
---
name: Max Resume
title: Principal Engineer
summary: Full summary paragraph.
---

<Contact
  email="max@example.com"
  phone="+1 555 0100"
  location="San Francisco, CA"
  links={[
    { label: "GitHub", url: "https://github.com/max" },
    { label: "Site", url: "https://max.dev" }
  ]}
/>

## Experience

<Experience
  company="BigCorp"
  role="Principal Engineer"
  location="Remote"
  start="2022-06"
  end="present"
  tech={["Go", "Kubernetes"]}
>
- Led **migration** to [K8s](https://kubernetes.io).
- Reduced cost by 30%.
</Experience>

<Experience company="SmallCo" role="Staff Engineer" start="2020-01" end="2022-05">
- Built the thing.
</Experience>

## Education

<Education institution="MIT" degree="BS" field="EECS" start="2016" end="2020" />

## Skills

<Skills group="Languages" items={["Go", "Rust", "TypeScript"]} />
<Skills group="Tools" items={["Kubernetes", "AWS"]} />

## Projects

<Project name="OSS Thing" url="https://github.com/max/oss" tech={["Rust"]}>
- Open source library for X.
</Project>

## Certifications

<Extra heading="Certifications">
  <Item title="AWS Solutions Architect" date="2023" />
  <Item title="CKA" date="2022" />
</Extra>
```

- [ ] **Step 4: Write `src/mdx/components.ts`**

```ts
export const RESUME_COMPONENTS = ["Contact","Experience","Education","Skills","Project","Extra","Item"] as const;
export type ResumeComponentName = (typeof RESUME_COMPONENTS)[number];
export function isResumeComponent(name: string): name is ResumeComponentName {
  return (RESUME_COMPONENTS as readonly string[]).includes(name);
}
```

- [ ] **Step 5: Write `src/mdx/expr.ts` (safe literal-only parser)**

JSON5 parses object, array, and primitive literals only. No code execution.

```ts
import JSON5 from "json5";

// Parses MDX JSX attribute-expression literals (objects, arrays, primitives).
// Safe: data-only; JSON5 does not execute code.
export function parseAttributeExpression(source: string): unknown {
  return JSON5.parse(source);
}
```

- [ ] **Step 6: Write failing parse tests**

```ts
import { test, expect } from "bun:test";
import { readFile } from "node:fs/promises";
import { parseMdxToResume } from "../src/mdx/parse";

test("parses minimal.mdx", async () => {
  const resume = await parseMdxToResume(await readFile("fixtures/minimal.mdx", "utf8"));
  expect(resume.meta.name).toBe("Min Resume");
  expect(resume.contact.email).toBe("min@example.com");
  expect(resume.experience).toHaveLength(1);
  expect(resume.experience[0]?.company).toBe("Acme");
  expect(resume.experience[0]?.bullets[0]).toEqual([{ t: "text", v: "Did work" }]);
});

test("parses maximal.mdx", async () => {
  const resume = await parseMdxToResume(await readFile("fixtures/maximal.mdx", "utf8"));
  expect(resume.meta.name).toBe("Max Resume");
  expect(resume.meta.title).toBe("Principal Engineer");
  expect(resume.contact.links).toHaveLength(2);
  expect(resume.experience).toHaveLength(2);
  expect(resume.experience[0]?.tech).toEqual(["Go", "Kubernetes"]);
  expect(resume.experience[0]?.bullets[0]).toEqual([
    { t: "text", v: "Led " },
    { t: "strong", c: [{ t: "text", v: "migration" }] },
    { t: "text", v: " to " },
    { t: "link", u: "https://kubernetes.io", c: [{ t: "text", v: "K8s" }] },
    { t: "text", v: "." },
  ]);
  expect(resume.education).toHaveLength(1);
  expect(resume.skills).toHaveLength(2);
  expect(resume.projects).toHaveLength(1);
  expect(resume.extras?.[0]?.heading).toBe("Certifications");
  expect(resume.extras?.[0]?.items).toHaveLength(2);
});

test("throws on unknown component", async () => {
  const bad = "---\nname: x\n---\n\n<Foo />\n";
  await expect(parseMdxToResume(bad)).rejects.toThrow(/Unknown component: Foo/);
});
```

- [ ] **Step 7: Run, confirm fail**

Run: `bun test tests/parse.test.ts`
Expected: FAIL.

- [ ] **Step 8: Write `src/mdx/parse.ts`**

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";
import { parse as parseYaml } from "yaml";
import type { Root, RootContent, Paragraph, PhrasingContent } from "mdast";
import type { MdxJsxFlowElement, MdxJsxAttribute } from "mdast-util-mdx-jsx";
import type { Resume } from "../schema/resume";
import { ResumeSchema } from "../schema/resume";
import type { InlineNode } from "../schema/inline";
import { isResumeComponent } from "./components";
import { mdToInlineNodes } from "./inline";
import { parseAttributeExpression } from "./expr";

type JsxEl = MdxJsxFlowElement;

function getAttr(el: JsxEl, name: string): string | undefined {
  const attr = el.attributes.find(
    (a): a is MdxJsxAttribute => a.type === "mdxJsxAttribute" && a.name === name,
  );
  if (!attr) return undefined;
  const value = attr.value;
  if (typeof value === "string") return value;
  if (value && value.type === "mdxJsxAttributeValueExpression") {
    const parsed = parseAttributeExpression(value.value);
    return typeof parsed === "string" ? parsed : undefined;
  }
  return undefined;
}

function getAttrExpr<T>(el: JsxEl, name: string): T | undefined {
  const attr = el.attributes.find(
    (a): a is MdxJsxAttribute => a.type === "mdxJsxAttribute" && a.name === name,
  );
  if (!attr) return undefined;
  const value = attr.value;
  if (typeof value === "string") return value as unknown as T;
  if (value && value.type === "mdxJsxAttributeValueExpression") {
    return parseAttributeExpression(value.value) as T;
  }
  return undefined;
}

function phrasingToInline(nodes: PhrasingContent[]): InlineNode[] {
  return nodes.flatMap((n): InlineNode[] => {
    switch (n.type) {
      case "text": return [{ t: "text", v: n.value }];
      case "strong": return [{ t: "strong", c: phrasingToInline(n.children) }];
      case "emphasis": return [{ t: "em", c: phrasingToInline(n.children) }];
      case "inlineCode": return [{ t: "code", v: n.value }];
      case "link": return [{ t: "link", u: n.url, c: phrasingToInline(n.children) }];
      default: return [];
    }
  });
}

function bulletsFromChildren(children: RootContent[]): InlineNode[][] {
  const list = children.find((c) => c.type === "list");
  if (!list || list.type !== "list") return [];
  return list.children.flatMap((item) => {
    if (item.type !== "listItem") return [];
    const first = item.children[0];
    if (!first || first.type !== "paragraph") return [[]];
    return [phrasingToInline((first as Paragraph).children)];
  });
}

function findJsxChildren(el: JsxEl, tagName: string): JsxEl[] {
  return el.children.filter(
    (c): c is JsxEl => c.type === "mdxJsxFlowElement" && c.name === tagName,
  );
}

export async function parseMdxToResume(source: string): Promise<Resume> {
  const tree = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkMdx)
    .parse(source) as Root;

  const yaml = tree.children.find((c) => c.type === "yaml");
  const meta = yaml && yaml.type === "yaml"
    ? (parseYaml(yaml.value) as Record<string, string>)
    : {};

  const resume: Resume = {
    meta: {
      name: meta.name ?? "",
      title: meta.title,
      summary: meta.summary ? mdToInlineNodes(meta.summary) : undefined,
    },
    contact: {},
    experience: [],
    education: [],
    skills: [],
  };

  const jsxFlow = tree.children.filter(
    (c): c is JsxEl => c.type === "mdxJsxFlowElement",
  );

  for (const el of jsxFlow) {
    const name = el.name ?? "";
    if (!isResumeComponent(name)) throw new Error(`Unknown component: ${name}`);
    switch (name) {
      case "Contact":
        resume.contact = {
          email: getAttr(el, "email"),
          phone: getAttr(el, "phone"),
          location: getAttr(el, "location"),
          links: getAttrExpr<Resume["contact"]["links"]>(el, "links"),
        };
        break;
      case "Experience":
        resume.experience.push({
          company: getAttr(el, "company") ?? "",
          role: getAttr(el, "role") ?? "",
          location: getAttr(el, "location"),
          start: getAttr(el, "start") ?? "",
          end: getAttr(el, "end") ?? "present",
          bullets: bulletsFromChildren(el.children as RootContent[]),
          tech: getAttrExpr<string[]>(el, "tech"),
        });
        break;
      case "Education":
        resume.education.push({
          institution: getAttr(el, "institution") ?? "",
          degree: getAttr(el, "degree") ?? "",
          field: getAttr(el, "field"),
          location: getAttr(el, "location"),
          start: getAttr(el, "start"),
          end: getAttr(el, "end"),
        });
        break;
      case "Skills":
        resume.skills.push({
          group: getAttr(el, "group"),
          items: getAttrExpr<string[]>(el, "items") ?? [],
        });
        break;
      case "Project":
        resume.projects = resume.projects ?? [];
        resume.projects.push({
          name: getAttr(el, "name") ?? "",
          description: getAttr(el, "description"),
          url: getAttr(el, "url"),
          tech: getAttrExpr<string[]>(el, "tech"),
          bullets: bulletsFromChildren(el.children as RootContent[]),
        });
        break;
      case "Extra":
        resume.extras = resume.extras ?? [];
        resume.extras.push({
          heading: getAttr(el, "heading") ?? "",
          items: findJsxChildren(el, "Item").map((item) => ({
            title: getAttr(item, "title") ?? "",
            subtitle: getAttr(item, "subtitle"),
            date: getAttr(item, "date"),
          })),
        });
        break;
      case "Item":
        break;
    }
  }

  const parsed = ResumeSchema.safeParse(resume);
  if (!parsed.success) throw new Error(`Schema validation failed: ${parsed.error.message}`);
  return parsed.data;
}
```

- [ ] **Step 9: Run tests, confirm pass**

Run: `bun test tests/parse.test.ts`
Expected: 3 passing tests.

- [ ] **Step 10: Commit**

```bash
git add src/mdx fixtures tests/parse.test.ts package.json bun.lock
git commit -m "feat(mdx): parse mdx resumes into schema with inline nodes"
```

---

## Task 5: MDX serializer (schema → MDX)

**Files:**
- Create: `src/mdx/serialize.ts`
- Create: `tests/serialize.test.ts`

- [ ] **Step 1: Write failing round-trip tests**

```ts
import { test, expect } from "bun:test";
import { readFile } from "node:fs/promises";
import { parseMdxToResume } from "../src/mdx/parse";
import { serializeResumeToMdx } from "../src/mdx/serialize";

async function roundtrip(path: string) {
  const source = await readFile(path, "utf8");
  const resume = await parseMdxToResume(source);
  const regenerated = serializeResumeToMdx(resume);
  const again = await parseMdxToResume(regenerated);
  expect(again).toEqual(resume);
}

test("roundtrip minimal.mdx", () => roundtrip("fixtures/minimal.mdx"));
test("roundtrip maximal.mdx", () => roundtrip("fixtures/maximal.mdx"));

test("serializer output looks valid", async () => {
  const source = await readFile("fixtures/maximal.mdx", "utf8");
  const resume = await parseMdxToResume(source);
  const out = serializeResumeToMdx(resume);
  expect(out).toContain("---\nname: Max Resume");
  expect(out).toContain("<Experience");
  expect(out).toContain("<Education");
});
```

- [ ] **Step 2: Run, confirm fail**

Run: `bun test tests/serialize.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `src/mdx/serialize.ts`**

```ts
import { stringify as yamlStringify } from "yaml";
import type { Resume } from "../schema/resume";
import type { InlineNode } from "../schema/inline";
import { inlineNodesToMd } from "./inline";

function attrString(name: string, value: string | undefined): string {
  if (value == null) return "";
  return ` ${name}="${value.replace(/"/g, "&quot;")}"`;
}

function attrExpr(name: string, value: unknown): string {
  if (value == null) return "";
  return ` ${name}={${JSON.stringify(value)}}`;
}

function bulletsToLines(bullets: InlineNode[][]): string[] {
  return bullets.map((b) => `- ${inlineNodesToMd(b)}`);
}

export function serializeResumeToMdx(resume: Resume): string {
  const lines: string[] = [];

  const fm: Record<string, string> = { name: resume.meta.name };
  if (resume.meta.title) fm.title = resume.meta.title;
  if (resume.meta.summary) fm.summary = inlineNodesToMd(resume.meta.summary);
  lines.push("---", yamlStringify(fm).trimEnd(), "---", "");

  const c = resume.contact;
  const contactAttrs =
    attrString("email", c.email) +
    attrString("phone", c.phone) +
    attrString("location", c.location) +
    (c.links ? attrExpr("links", c.links) : "");
  lines.push(`<Contact${contactAttrs} />`, "");

  if (resume.experience.length > 0) {
    lines.push("## Experience", "");
    for (const e of resume.experience) {
      const attrs =
        attrString("company", e.company) +
        attrString("role", e.role) +
        attrString("location", e.location) +
        attrString("start", e.start) +
        attrString("end", e.end) +
        (e.tech ? attrExpr("tech", e.tech) : "");
      lines.push(`<Experience${attrs}>`);
      lines.push(...bulletsToLines(e.bullets));
      lines.push(`</Experience>`, "");
    }
  }

  if (resume.education.length > 0) {
    lines.push("## Education", "");
    for (const ed of resume.education) {
      const attrs =
        attrString("institution", ed.institution) +
        attrString("degree", ed.degree) +
        attrString("field", ed.field) +
        attrString("location", ed.location) +
        attrString("start", ed.start) +
        attrString("end", ed.end);
      lines.push(`<Education${attrs} />`);
    }
    lines.push("");
  }

  if (resume.skills.length > 0) {
    lines.push("## Skills", "");
    for (const s of resume.skills) {
      lines.push(`<Skills${attrString("group", s.group)}${attrExpr("items", s.items)} />`);
    }
    lines.push("");
  }

  if (resume.projects && resume.projects.length > 0) {
    lines.push("## Projects", "");
    for (const p of resume.projects) {
      const attrs =
        attrString("name", p.name) +
        attrString("description", p.description) +
        attrString("url", p.url) +
        (p.tech ? attrExpr("tech", p.tech) : "");
      lines.push(`<Project${attrs}>`);
      if (p.bullets) lines.push(...bulletsToLines(p.bullets));
      lines.push(`</Project>`, "");
    }
  }

  if (resume.extras && resume.extras.length > 0) {
    for (const ex of resume.extras) {
      lines.push(`## ${ex.heading}`, "", `<Extra heading="${ex.heading}">`);
      for (const it of ex.items) {
        const attrs =
          attrString("title", it.title) +
          attrString("subtitle", it.subtitle) +
          attrString("date", it.date);
        lines.push(`  <Item${attrs} />`);
      }
      lines.push(`</Extra>`, "");
    }
  }

  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests, confirm pass**

Run: `bun test tests/serialize.test.ts`
Expected: 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/mdx/serialize.ts tests/serialize.test.ts
git commit -m "feat(mdx): serialize schema back to mdx with round-trip fidelity"
```

---

## Task 6: Typst worker + client + SvgPage component

**Files:**
- Create: `src/typst/types.ts`, `src/typst/worker.ts`, `src/typst/client.ts`
- Create: `src/ui/preview/svg-page.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Install typst.ts**

Run: `bun add @myriaddreamin/typst.ts @myriaddreamin/typst-ts-web-compiler @myriaddreamin/typst-ts-renderer`

- [ ] **Step 2: Write `src/typst/types.ts`**

```ts
export type CompileRequest = {
  kind: "compile";
  id: number;
  mainSource: string;
  resumeJson: string;
};

export type CompileSuccess = {
  kind: "compiled";
  id: number;
  svgPages: string[];
  durationMs: number;
};

export type ExportPdfRequest = {
  kind: "exportPdf";
  id: number;
  mainSource: string;
  resumeJson: string;
};

export type ExportPdfSuccess = {
  kind: "pdfReady";
  id: number;
  pdf: Uint8Array;
};

export type WorkerError = { kind: "error"; id: number; message: string };

export type WorkerRequest = CompileRequest | ExportPdfRequest;
export type WorkerResponse = CompileSuccess | ExportPdfSuccess | WorkerError;
```

- [ ] **Step 3: Write `src/typst/worker.ts`**

The installed `typst.ts` version may differ slightly. Consult the package README and adjust the internal calls if the method names differ. The `WorkerRequest`/`WorkerResponse` contract stays fixed so the client does not change.

```ts
/// <reference lib="webworker" />
import { createTypstCompiler } from "@myriaddreamin/typst.ts/dist/esm/compiler.mjs";
import { createTypstRenderer } from "@myriaddreamin/typst.ts/dist/esm/renderer.mjs";
import type { WorkerRequest, WorkerResponse } from "./types";

const compiler = createTypstCompiler();
const renderer = createTypstRenderer();

const RESUME_JSON_PATH = "/resume.json";
const MAIN_PATH = "/main.typ";

let ready: Promise<void> | null = null;

async function init(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await compiler.init();
      await renderer.init();
      const fontFiles = [
        "/fonts/Inter-Regular.woff2",
        "/fonts/Inter-Medium.woff2",
        "/fonts/Inter-SemiBold.woff2",
        "/fonts/Inter-Light.woff2",
      ];
      for (const url of fontFiles) {
        const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
        // Method name may vary by typst.ts version (e.g. addWebFontData, addSource).
        await (compiler as unknown as { addWebFontData: (b: Uint8Array) => Promise<void> }).addWebFontData(buf);
      }
    })();
  }
  await ready;
}

async function handle(msg: WorkerRequest): Promise<WorkerResponse> {
  try {
    await init();
    compiler.mapShadow(RESUME_JSON_PATH, new TextEncoder().encode(msg.resumeJson));
    compiler.mapShadow(MAIN_PATH, new TextEncoder().encode(msg.mainSource));
    if (msg.kind === "compile") {
      const start = performance.now();
      const doc = await compiler.compile({ mainFilePath: MAIN_PATH });
      const svgPages: string[] = [];
      for (let i = 0; i < doc.pages.length; i++) {
        const svg = await renderer.renderSvg({ artifactContent: doc.artifact, pageIndex: i });
        svgPages.push(svg);
      }
      return { kind: "compiled", id: msg.id, svgPages, durationMs: performance.now() - start };
    }
    const doc = await compiler.compile({ mainFilePath: MAIN_PATH, format: "pdf" });
    return { kind: "pdfReady", id: msg.id, pdf: doc.pdf };
  } catch (err) {
    return { kind: "error", id: msg.id, message: (err as Error).message };
  }
}

self.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const res = await handle(ev.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res);
};
```

- [ ] **Step 4: Write `src/typst/client.ts`**

```ts
import type { WorkerRequest, WorkerResponse, CompileSuccess, ExportPdfSuccess } from "./types";

export class TypstClient {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, (r: WorkerResponse) => void>();

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const cb = this.pending.get(ev.data.id);
      if (cb) { this.pending.delete(ev.data.id); cb(ev.data); }
    };
  }

  compile(mainSource: string, resumeJson: string): Promise<CompileSuccess> {
    return this.request({ kind: "compile", id: this.nextId++, mainSource, resumeJson }) as Promise<CompileSuccess>;
  }

  exportPdf(mainSource: string, resumeJson: string): Promise<ExportPdfSuccess> {
    return this.request({ kind: "exportPdf", id: this.nextId++, mainSource, resumeJson }) as Promise<ExportPdfSuccess>;
  }

  private request(req: WorkerRequest): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      this.pending.set(req.id, (res) => {
        if (res.kind === "error") reject(new Error(res.message));
        else resolve(res);
      });
      this.worker.postMessage(req);
    });
  }

  terminate(): void { this.worker.terminate(); }
}
```

- [ ] **Step 5: Write `src/ui/preview/svg-page.tsx`**

We render SVG pages inside an `<img>` with a data-URI `src`. Browsers treat SVG-in-image as a sandbox: no script execution, no external network fetches, no access to parent document. This is the standard safe-embedding pattern and also avoids directly injecting arbitrary markup into the DOM.

```tsx
import { useMemo } from "react";

export function SvgPage({ svg, zoom }: { svg: string; zoom: number }) {
  const src = useMemo(() => {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, [svg]);
  return (
    <img
      src={src}
      alt="resume page"
      draggable={false}
      style={{
        display: "block",
        transform: `scale(${zoom})`,
        transformOrigin: "top center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        background: "#fff",
        maxWidth: "none",
      }}
    />
  );
}
```

- [ ] **Step 6: Smoke-test**

Modify `src/ui/app.tsx`:

```tsx
import { useEffect, useState } from "react";
import { TypstClient } from "../typst/client";
import { SvgPage } from "./preview/svg-page";

const HELLO = `#set page(width: 4in, height: 2in)\n= Hello Typst`;

export function App() {
  const [svg, setSvg] = useState<string>("");
  const [err, setErr] = useState<string>("");
  useEffect(() => {
    const c = new TypstClient();
    c.compile(HELLO, "{}")
      .then((r) => setSvg(r.svgPages[0] ?? ""))
      .catch((e) => setErr((e as Error).message));
    return () => c.terminate();
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h1>Resume Builder</h1>
      {err && <pre style={{ color: "crimson" }}>{err}</pre>}
      {svg && <SvgPage svg={svg} zoom={1} />}
    </div>
  );
}
```

Run: `bun run dev`
Expected: "Hello Typst" rendered as an SVG. Adjust worker imports/method names if the installed typst.ts version differs.

- [ ] **Step 7: Commit**

```bash
git add src/typst src/ui/preview src/ui/app.tsx package.json bun.lock
git commit -m "feat(typst): wire typst.ts worker, client, and sandboxed svg page"
```

---

## Task 7: Inter fonts + default Typst template

**Files:**
- Create: `public/fonts/Inter-*.woff2` (downloaded)
- Create: `src/templates/default.ts`
- Create: `tests/template.test.ts`

- [ ] **Step 1: Download Inter fonts**

```bash
mkdir -p public/fonts
cd public/fonts
curl -L -o Inter-Regular.woff2 https://rsms.me/inter/font-files/Inter-Regular.woff2
curl -L -o Inter-Medium.woff2 https://rsms.me/inter/font-files/Inter-Medium.woff2
curl -L -o Inter-SemiBold.woff2 https://rsms.me/inter/font-files/Inter-SemiBold.woff2
curl -L -o Inter-Light.woff2 https://rsms.me/inter/font-files/Inter-Light.woff2
cd -
```

Verify each file is >10 KB.

- [ ] **Step 2: Write `src/templates/default.ts`**

The template walks `InlineNode` trees via a `render-inline` helper. No string-to-markup evaluation; all content is passed as typed data.

```ts
export const DEFAULT_TEMPLATE_SOURCE = String.raw`
#let resume = json("/resume.json")

#set document(title: resume.meta.name)
#set page(paper: "us-letter", margin: (x: 0.95in, y: 0.7in))
#set text(font: "Inter", size: 10.5pt, fill: rgb("#1a1a1a"))
#set par(leading: 0.55em, justify: false)

#let meta-color = rgb("#4a4a4a")

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
  v(0.8em)
  text(size: 9.5pt, weight: 600, tracking: 0.10em, upper(body))
  v(-0.15em)
  line(length: 100%, stroke: 0.5pt + rgb("#1a1a1a"))
  v(0.3em)
}

#let entry-header(left-content, right-content) = grid(
  columns: (1fr, auto),
  align(left)[#left-content],
  align(right)[#text(fill: meta-color)[#right-content]],
)

#let daterange(start, end) = {
  let e = if end == "present" { "Present" } else { end }
  start + " - " + e
}

#let contact-line(c) = {
  let parts = ()
  if "email" in c { parts.push(c.email) }
  if "phone" in c { parts.push(c.phone) }
  if "location" in c { parts.push(c.location) }
  if "links" in c {
    for l in c.links { parts.push(link(l.url)[#l.label]) }
  }
  align(center, text(size: 9.5pt, fill: meta-color, parts.join("  ·  ")))
}

// Header
#align(center, text(size: 22pt, weight: 600)[#resume.meta.name])
#if "title" in resume.meta {
  v(-0.4em)
  align(center, text(size: 11pt, weight: 300, fill: meta-color)[#resume.meta.title])
}
#v(0.1em)
#contact-line(resume.contact)

// Summary
#if "summary" in resume.meta {
  section-heading("Summary")
  render-inline(resume.meta.summary)
}

// Experience
#if resume.experience.len() > 0 {
  section-heading("Experience")
  for job in resume.experience {
    block(breakable: false, width: 100%)[
      #entry-header(
        [#text(weight: 500)[#job.role], #job.company#if "location" in job [ · #job.location]],
        [#daterange(job.start, job.end)],
      )
    ]
    for b in job.bullets {
      list.item(render-inline(b))
    }
    if "tech" in job {
      v(0.2em)
      text(size: 9pt, fill: meta-color, job.tech.join(" · "))
    }
    v(0.5em)
  }
}

// Education
#if resume.education.len() > 0 {
  section-heading("Education")
  for ed in resume.education {
    let right = if "start" in ed and "end" in ed { ed.start + " - " + ed.end } else { "" }
    entry-header(
      [#text(weight: 500)[#ed.institution], #ed.degree#if "field" in ed [, #ed.field]],
      [#right],
    )
    v(0.3em)
  }
}

// Skills
#if resume.skills.len() > 0 {
  section-heading("Skills")
  for s in resume.skills {
    if "group" in s {
      [#text(weight: 500)[#s.group:] #s.items.join(", ")]
    } else {
      [#s.items.join(", ")]
    }
    v(0.2em)
  }
}

// Projects
#if "projects" in resume and resume.projects.len() > 0 {
  section-heading("Projects")
  for p in resume.projects {
    let right = if "tech" in p { p.tech.join(" · ") } else { "" }
    entry-header(
      [#text(weight: 500)[#if "url" in p [#link(p.url)[#p.name]] else [#p.name]]#if "description" in p [ - #p.description]],
      [#right],
    )
    if "bullets" in p {
      for b in p.bullets { list.item(render-inline(b)) }
    }
    v(0.4em)
  }
}

// Extras
#if "extras" in resume {
  for ex in resume.extras {
    section-heading(ex.heading)
    for it in ex.items {
      let right = if "date" in it { it.date } else { "" }
      entry-header(
        [#text(weight: 500)[#it.title]#if "subtitle" in it [ - #it.subtitle]],
        [#right],
      )
      v(0.2em)
    }
  }
}
`;
```

- [ ] **Step 3: Write `tests/template.test.ts`**

```ts
import { test, expect } from "bun:test";
import { DEFAULT_TEMPLATE_SOURCE } from "../src/templates/default";
import { emptyResume, exampleResume } from "../src/schema/defaults";

test("template contains render-inline helper", () => {
  expect(DEFAULT_TEMPLATE_SOURCE).toContain("render-inline(nodes)");
});

test("example resume has structured bullets", () => {
  expect(exampleResume.experience[0]?.bullets[0]?.[0]).toMatchObject({ t: "text" });
});

test("empty resume starts with default name", () => {
  expect(emptyResume.meta.name).toBe("Your Name");
});
```

PDF-byte snapshots are covered by the E2E harness in Task 19 (requires the browser Typst runtime).

- [ ] **Step 4: Verify example renders**

Modify `src/ui/app.tsx` to pass `DEFAULT_TEMPLATE_SOURCE` + `JSON.stringify(exampleResume)` to `compile()`. Fix any Typst syntax errors inline.

Run: `bun run dev`
Expected: the example resume renders on-screen via `<SvgPage>`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts src/templates tests/template.test.ts src/ui/app.tsx
git commit -m "feat(templates): add default inter-weight-hierarchy resume template"
```

---

## Task 8: Zustand store and persistence

**Files:**
- Create: `src/state/store.ts`, `src/state/persist.ts`
- Create: `tests/store.test.ts`

- [ ] **Step 1: Install deps**

Run: `bun add zustand idb-keyval`

- [ ] **Step 2: Write failing tests**

```ts
import { test, expect } from "bun:test";
import { createResumeStore } from "../src/state/store";
import { emptyResume } from "../src/schema/defaults";

test("initial state is empty resume", () => {
  const store = createResumeStore();
  expect(store.getState().resume.meta.name).toBe(emptyResume.meta.name);
});

test("setResume updates state", () => {
  const store = createResumeStore();
  store.getState().setResume({ ...emptyResume, meta: { name: "X" } });
  expect(store.getState().resume.meta.name).toBe("X");
});

test("updateExperience mutates entry", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    experience: [{ company: "A", role: "Dev", start: "2024-01", end: "present", bullets: [] }],
  });
  store.getState().updateExperience(0, { role: "SWE" });
  expect(store.getState().resume.experience[0]?.role).toBe("SWE");
});
```

- [ ] **Step 3: Run, confirm fail**

Run: `bun test tests/store.test.ts`
Expected: FAIL.

- [ ] **Step 4: Write `src/state/store.ts`**

```ts
import { createStore } from "zustand/vanilla";
import { emptyResume } from "../schema/defaults";
import type { Resume, Experience, Education, Project, Extra } from "../schema/resume";

export type Tab = "form" | "mdx" | "import";

export type ResumeStore = {
  resume: Resume;
  tab: Tab;
  name: string;
  setTab: (t: Tab) => void;
  setName: (n: string) => void;
  setResume: (r: Resume) => void;
  updateMeta: (patch: Partial<Resume["meta"]>) => void;
  updateContact: (patch: Partial<Resume["contact"]>) => void;
  addExperience: () => void;
  updateExperience: (i: number, patch: Partial<Experience>) => void;
  removeExperience: (i: number) => void;
  moveExperience: (from: number, to: number) => void;
  addEducation: () => void;
  updateEducation: (i: number, patch: Partial<Education>) => void;
  removeEducation: (i: number) => void;
  addSkillsGroup: () => void;
  updateSkillsGroup: (i: number, patch: Partial<{ group?: string; items: string[] }>) => void;
  removeSkillsGroup: (i: number) => void;
  addProject: () => void;
  updateProject: (i: number, patch: Partial<Project>) => void;
  removeProject: (i: number) => void;
  addExtra: () => void;
  updateExtra: (i: number, patch: Partial<Extra>) => void;
  removeExtra: (i: number) => void;
};

export function createResumeStore() {
  return createStore<ResumeStore>((set) => ({
    resume: emptyResume,
    tab: "form",
    name: "Untitled Resume",
    setTab: (tab) => set({ tab }),
    setName: (name) => set({ name }),
    setResume: (resume) => set({ resume }),
    updateMeta: (patch) =>
      set((s) => ({ resume: { ...s.resume, meta: { ...s.resume.meta, ...patch } } })),
    updateContact: (patch) =>
      set((s) => ({ resume: { ...s.resume, contact: { ...s.resume.contact, ...patch } } })),
    addExperience: () =>
      set((s) => ({
        resume: {
          ...s.resume,
          experience: [
            ...s.resume.experience,
            { company: "", role: "", start: "", end: "present", bullets: [] },
          ],
        },
      })),
    updateExperience: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          experience: s.resume.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
        },
      })),
    removeExperience: (i) =>
      set((s) => ({
        resume: { ...s.resume, experience: s.resume.experience.filter((_, idx) => idx !== i) },
      })),
    moveExperience: (from, to) =>
      set((s) => {
        const exp = [...s.resume.experience];
        const [item] = exp.splice(from, 1);
        if (item) exp.splice(to, 0, item);
        return { resume: { ...s.resume, experience: exp } };
      }),
    addEducation: () =>
      set((s) => ({
        resume: { ...s.resume, education: [...s.resume.education, { institution: "", degree: "" }] },
      })),
    updateEducation: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          education: s.resume.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
        },
      })),
    removeEducation: (i) =>
      set((s) => ({
        resume: { ...s.resume, education: s.resume.education.filter((_, idx) => idx !== i) },
      })),
    addSkillsGroup: () =>
      set((s) => ({ resume: { ...s.resume, skills: [...s.resume.skills, { items: [""] }] } })),
    updateSkillsGroup: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          skills: s.resume.skills.map((g, idx) => (idx === i ? { ...g, ...patch } : g)),
        },
      })),
    removeSkillsGroup: (i) =>
      set((s) => ({
        resume: { ...s.resume, skills: s.resume.skills.filter((_, idx) => idx !== i) },
      })),
    addProject: () =>
      set((s) => ({
        resume: { ...s.resume, projects: [...(s.resume.projects ?? []), { name: "" }] },
      })),
    updateProject: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          projects: (s.resume.projects ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
        },
      })),
    removeProject: (i) =>
      set((s) => ({
        resume: { ...s.resume, projects: (s.resume.projects ?? []).filter((_, idx) => idx !== i) },
      })),
    addExtra: () =>
      set((s) => ({
        resume: {
          ...s.resume,
          extras: [...(s.resume.extras ?? []), { heading: "", items: [{ title: "" }] }],
        },
      })),
    updateExtra: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          extras: (s.resume.extras ?? []).map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
        },
      })),
    removeExtra: (i) =>
      set((s) => ({
        resume: { ...s.resume, extras: (s.resume.extras ?? []).filter((_, idx) => idx !== i) },
      })),
  }));
}

export const resumeStore = createResumeStore();
```

- [ ] **Step 5: Write `src/state/persist.ts`**

```ts
import { get, set } from "idb-keyval";
import type { StoreApi } from "zustand/vanilla";
import type { ResumeStore } from "./store";

const KEY = "current-resume";

export type PersistedState = Pick<ResumeStore, "resume" | "name">;

export async function hydrate(store: StoreApi<ResumeStore>): Promise<void> {
  try {
    const saved = await get<PersistedState>(KEY);
    if (saved) store.setState({ resume: saved.resume, name: saved.name });
  } catch {
    // IDB unavailable; proceed with defaults.
  }
}

export function bindAutosave(store: StoreApi<ResumeStore>, debounceMs = 1000): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const unsub = store.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      set(KEY, { resume: state.resume, name: state.name }).catch(() => {});
    }, debounceMs);
  });
  return () => { unsub(); if (timer) clearTimeout(timer); };
}
```

- [ ] **Step 6: Run tests, confirm pass**

Run: `bun test tests/store.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/state tests/store.test.ts package.json bun.lock
git commit -m "feat(state): add zustand store with idb-keyval persistence"
```

---

## Task 9: UI shell (top bar, two-pane layout, tabs)

**Files:**
- Create: `src/ui/shell/use-store.ts`, `src/ui/shell/top-bar.tsx`, `src/ui/shell/tabs.tsx`, `src/ui/shell/layout.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/shell/use-store.ts`**

```ts
import { useSyncExternalStore } from "react";
import { resumeStore, type ResumeStore } from "../../state/store";

export function useResumeStore<T>(selector: (s: ResumeStore) => T): T {
  return useSyncExternalStore(
    resumeStore.subscribe,
    () => selector(resumeStore.getState()),
    () => selector(resumeStore.getState()),
  );
}
```

- [ ] **Step 2: Write `src/ui/shell/top-bar.tsx`**

```tsx
import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";

export type TopBarProps = {
  onExport: () => void;
  lastSavedAt: number | null;
};

export function TopBar({ onExport, lastSavedAt }: TopBarProps) {
  const name = useResumeStore((s) => s.name);
  const saveLabel = lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : "Unsaved";
  return (
    <div style={{
      display: "flex", gap: 16, alignItems: "center", padding: "10px 18px",
      borderBottom: "1px solid #e6e3dd", background: "#fafaf7",
    }}>
      <strong style={{ letterSpacing: "0.04em" }}>Resume Builder</strong>
      <input
        value={name}
        onChange={(e) => resumeStore.setState({ name: e.target.value })}
        style={{ flex: 1, fontSize: 14, padding: "6px 8px", border: "1px solid #d9d6ce", borderRadius: 4 }}
      />
      <span style={{ fontSize: 12, color: "#6a6a6a" }}>{saveLabel}</span>
      <button onClick={onExport} style={{ padding: "6px 12px", fontSize: 13 }}>Export PDF</button>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/ui/shell/tabs.tsx`**

```tsx
import type { Tab } from "../../state/store";
import { useResumeStore } from "./use-store";
import { resumeStore } from "../../state/store";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "form", label: "Form" },
  { id: "mdx", label: "MDX" },
  { id: "import", label: "Import" },
];

export function Tabs() {
  const tab = useResumeStore((s) => s.tab);
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #e6e3dd" }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => resumeStore.setState({ tab: t.id })}
          style={{
            padding: "10px 16px",
            border: "none",
            background: tab === t.id ? "#fff" : "transparent",
            borderBottom: tab === t.id ? "2px solid #1a1a1a" : "2px solid transparent",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/ui/shell/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export function TwoPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, height: "calc(100vh - 90px)" }}>
      <div style={{ overflow: "auto", borderRight: "1px solid #e6e3dd" }}>{left}</div>
      <div style={{ overflow: "auto", background: "#f3f1ea" }}>{right}</div>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `src/ui/app.tsx`**

```tsx
import { useEffect, useState } from "react";
import { TopBar } from "./shell/top-bar";
import { Tabs } from "./shell/tabs";
import { TwoPane } from "./shell/layout";
import { useResumeStore } from "./shell/use-store";
import { bindAutosave, hydrate } from "../state/persist";
import { resumeStore } from "../state/store";

export function App() {
  const tab = useResumeStore((s) => s.tab);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    hydrate(resumeStore).then(() => setLastSavedAt(Date.now()));
    const unsub = resumeStore.subscribe(() => setLastSavedAt(Date.now()));
    const stop = bindAutosave(resumeStore);
    return () => { unsub(); stop(); };
  }, []);

  return (
    <>
      <TopBar onExport={() => {}} lastSavedAt={lastSavedAt} />
      <Tabs />
      <TwoPane
        left={<div style={{ padding: 24 }}>Tab: {tab}</div>}
        right={<div style={{ padding: 24 }}>Preview goes here</div>}
      />
    </>
  );
}
```

- [ ] **Step 6: Verify**

Run: `bun run dev`
Expected: top bar, three tabs, two-pane layout.

- [ ] **Step 7: Commit**

```bash
git add src/ui
git commit -m "feat(ui): add shell layout, tabs, and top bar"
```

---

## Task 10: Form tab (meta + contact)

**Files:**
- Create: `src/ui/form/fields.tsx`, `src/ui/form/meta-section.tsx`, `src/ui/form/contact-section.tsx`, `src/ui/form/form-tab.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/form/fields.tsx`**

```tsx
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

const baseField = {
  display: "block" as const,
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d9d6ce",
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "inherit",
};

export function Label({ children }: { children: ReactNode }) {
  return <label style={{ fontSize: 12, color: "#4a4a4a", letterSpacing: "0.04em", textTransform: "uppercase" }}>{children}</label>;
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseField, ...props.style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...baseField, minHeight: 72, resize: "vertical", ...props.style }} />;
}

export function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>{children}</div>;
}

export function Grid({ columns, children }: { columns: number; children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 12, marginBottom: 12 }}>{children}</div>;
}
```

- [ ] **Step 2: Write `src/ui/form/meta-section.tsx`**

```tsx
import { Row, Label, TextField, TextArea } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

export function MetaSection() {
  const meta = useResumeStore((s) => s.resume.meta);
  const update = resumeStore.getState().updateMeta;
  const summaryMd = meta.summary ? inlineNodesToMd(meta.summary) : "";
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Header</h2>
      <Row>
        <Label>Full name</Label>
        <TextField value={meta.name} onChange={(e) => update({ name: e.target.value })} />
      </Row>
      <Row>
        <Label>Title</Label>
        <TextField value={meta.title ?? ""} onChange={(e) => update({ title: e.target.value || undefined })} />
      </Row>
      <Row>
        <Label>Summary (markdown)</Label>
        <TextArea
          value={summaryMd}
          onChange={(e) => {
            const text = e.target.value;
            update({ summary: text ? mdToInlineNodes(text) : undefined });
          }}
        />
      </Row>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/ui/form/contact-section.tsx`**

```tsx
import { Row, Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function ContactSection() {
  const contact = useResumeStore((s) => s.resume.contact);
  const update = resumeStore.getState().updateContact;
  const links = contact.links ?? [];
  const updateLink = (i: number, patch: { label?: string; url?: string }) => {
    update({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  };
  const addLink = () => update({ links: [...links, { label: "", url: "" }] });
  const removeLink = (i: number) => update({ links: links.filter((_, idx) => idx !== i) });

  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contact</h2>
      <Grid columns={2}>
        <div><Label>Email</Label><TextField value={contact.email ?? ""} onChange={(e) => update({ email: e.target.value || undefined })} /></div>
        <div><Label>Phone</Label><TextField value={contact.phone ?? ""} onChange={(e) => update({ phone: e.target.value || undefined })} /></div>
      </Grid>
      <Row>
        <Label>Location</Label>
        <TextField value={contact.location ?? ""} onChange={(e) => update({ location: e.target.value || undefined })} />
      </Row>
      <div>
        <Label>Links</Label>
        {links.map((l, i) => (
          <Grid columns={3} key={i}>
            <TextField placeholder="Label" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
            <TextField placeholder="URL" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
            <button onClick={() => removeLink(i)}>Remove</button>
          </Grid>
        ))}
        <button onClick={addLink}>+ Add link</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write `src/ui/form/form-tab.tsx`**

```tsx
import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";

export function FormTab() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 28 }}>
      <MetaSection />
      <ContactSection />
    </div>
  );
}
```

- [ ] **Step 5: Wire into `src/ui/app.tsx`**

Replace the `left` prop on `<TwoPane>`:

```tsx
import { FormTab } from "./form/form-tab";
...
left={tab === "form" ? <FormTab /> : <div style={{ padding: 24 }}>Tab: {tab}</div>}
```

- [ ] **Step 6: Verify**

Run: `bun run dev`
Fill Header and Contact; refresh page; values persist.

- [ ] **Step 7: Commit**

```bash
git add src/ui/form src/ui/app.tsx
git commit -m "feat(form): add meta and contact sections"
```

---

## Task 11: Form tab (experience + bullet editor)

**Files:**
- Create: `src/ui/form/bullet-editor.tsx`, `src/ui/form/experience-section.tsx`
- Modify: `src/ui/form/form-tab.tsx`

- [ ] **Step 1: Write `src/ui/form/bullet-editor.tsx`**

```tsx
import { TextArea, Label } from "./fields";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";
import type { InlineNode } from "../../schema/inline";

export function BulletEditor({
  bullets, onChange,
}: { bullets: InlineNode[][]; onChange: (next: InlineNode[][]) => void }) {
  const displayed = bullets.map(inlineNodesToMd).join("\n");
  return (
    <div>
      <Label>Bullets (one per line, markdown supported)</Label>
      <TextArea
        value={displayed}
        onChange={(e) => {
          const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0);
          onChange(lines.map(mdToInlineNodes));
        }}
        rows={5}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `src/ui/form/experience-section.tsx`**

```tsx
import { Row, Grid, Label, TextField } from "./fields";
import { BulletEditor } from "./bullet-editor";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function ExperienceSection() {
  const experience = useResumeStore((s) => s.resume.experience);
  const { updateExperience, removeExperience, addExperience, moveExperience } = resumeStore.getState();

  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Experience</h2>
      {experience.map((e, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Role</Label><TextField value={e.role} onChange={(ev) => updateExperience(i, { role: ev.target.value })} /></div>
            <div><Label>Company</Label><TextField value={e.company} onChange={(ev) => updateExperience(i, { company: ev.target.value })} /></div>
          </Grid>
          <Grid columns={3}>
            <div><Label>Location</Label><TextField value={e.location ?? ""} onChange={(ev) => updateExperience(i, { location: ev.target.value || undefined })} /></div>
            <div><Label>Start (YYYY-MM)</Label><TextField value={e.start} onChange={(ev) => updateExperience(i, { start: ev.target.value })} /></div>
            <div><Label>End</Label><TextField value={e.end} onChange={(ev) => updateExperience(i, { end: ev.target.value })} /></div>
          </Grid>
          <Row>
            <Label>Tech (comma-separated)</Label>
            <TextField
              value={(e.tech ?? []).join(", ")}
              onChange={(ev) => updateExperience(i, { tech: ev.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </Row>
          <BulletEditor bullets={e.bullets} onChange={(b) => updateExperience(i, { bullets: b })} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button disabled={i === 0} onClick={() => moveExperience(i, i - 1)}>↑ Up</button>
            <button disabled={i === experience.length - 1} onClick={() => moveExperience(i, i + 1)}>↓ Down</button>
            <button onClick={() => removeExperience(i)}>Remove</button>
          </div>
        </div>
      ))}
      <button onClick={addExperience}>+ Add experience</button>
    </section>
  );
}
```

- [ ] **Step 3: Modify `src/ui/form/form-tab.tsx`**

```tsx
import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";

export function FormTab() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 28 }}>
      <MetaSection />
      <ContactSection />
      <ExperienceSection />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `bun run dev`
Add, reorder, remove experience entries; type bullets with markdown.

- [ ] **Step 5: Commit**

```bash
git add src/ui/form
git commit -m "feat(form): add experience section and bullet editor"
```

---

## Task 12: Form tab (education, skills, projects, extras)

**Files:**
- Create: `src/ui/form/education-section.tsx`, `src/ui/form/skills-section.tsx`, `src/ui/form/projects-section.tsx`, `src/ui/form/extras-section.tsx`
- Modify: `src/ui/form/form-tab.tsx`

- [ ] **Step 1: Write `src/ui/form/education-section.tsx`**

```tsx
import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const { updateEducation, removeEducation, addEducation } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Education</h2>
      {education.map((ed, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Institution</Label><TextField value={ed.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} /></div>
            <div><Label>Degree</Label><TextField value={ed.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} /></div>
          </Grid>
          <Grid columns={4}>
            <div><Label>Field</Label><TextField value={ed.field ?? ""} onChange={(e) => updateEducation(i, { field: e.target.value || undefined })} /></div>
            <div><Label>Location</Label><TextField value={ed.location ?? ""} onChange={(e) => updateEducation(i, { location: e.target.value || undefined })} /></div>
            <div><Label>Start</Label><TextField value={ed.start ?? ""} onChange={(e) => updateEducation(i, { start: e.target.value || undefined })} /></div>
            <div><Label>End</Label><TextField value={ed.end ?? ""} onChange={(e) => updateEducation(i, { end: e.target.value || undefined })} /></div>
          </Grid>
          <button onClick={() => removeEducation(i)}>Remove</button>
        </div>
      ))}
      <button onClick={addEducation}>+ Add education</button>
    </section>
  );
}
```

- [ ] **Step 2: Write `src/ui/form/skills-section.tsx`**

```tsx
import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const { updateSkillsGroup, removeSkillsGroup, addSkillsGroup } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</h2>
      {skills.map((g, i) => (
        <Grid columns={2} key={i}>
          <div><Label>Group</Label><TextField value={g.group ?? ""} onChange={(e) => updateSkillsGroup(i, { group: e.target.value || undefined })} /></div>
          <div><Label>Items (comma-separated)</Label>
            <TextField
              value={g.items.join(", ")}
              onChange={(e) => updateSkillsGroup(i, { items: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
          <button onClick={() => removeSkillsGroup(i)} style={{ gridColumn: "1 / -1", justifySelf: "start" }}>Remove</button>
        </Grid>
      ))}
      <button onClick={addSkillsGroup}>+ Add skills group</button>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/ui/form/projects-section.tsx`**

```tsx
import { Grid, Label, TextField } from "./fields";
import { BulletEditor } from "./bullet-editor";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function ProjectsSection() {
  const projects = useResumeStore((s) => s.resume.projects ?? []);
  const { updateProject, removeProject, addProject } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Projects</h2>
      {projects.map((p, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Name</Label><TextField value={p.name} onChange={(e) => updateProject(i, { name: e.target.value })} /></div>
            <div><Label>URL</Label><TextField value={p.url ?? ""} onChange={(e) => updateProject(i, { url: e.target.value || undefined })} /></div>
          </Grid>
          <Grid columns={2}>
            <div><Label>Description</Label><TextField value={p.description ?? ""} onChange={(e) => updateProject(i, { description: e.target.value || undefined })} /></div>
            <div><Label>Tech</Label>
              <TextField
                value={(p.tech ?? []).join(", ")}
                onChange={(e) => updateProject(i, { tech: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              />
            </div>
          </Grid>
          <BulletEditor bullets={p.bullets ?? []} onChange={(b) => updateProject(i, { bullets: b })} />
          <button onClick={() => removeProject(i)}>Remove</button>
        </div>
      ))}
      <button onClick={addProject}>+ Add project</button>
    </section>
  );
}
```

- [ ] **Step 4: Write `src/ui/form/extras-section.tsx`**

```tsx
import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function ExtrasSection() {
  const extras = useResumeStore((s) => s.resume.extras ?? []);
  const { updateExtra, removeExtra, addExtra } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Extras</h2>
      {extras.map((ex, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={1}>
            <div><Label>Section heading</Label><TextField value={ex.heading} onChange={(e) => updateExtra(i, { heading: e.target.value })} /></div>
          </Grid>
          {ex.items.map((it, j) => (
            <Grid columns={3} key={j}>
              <TextField placeholder="Title" value={it.title} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, title: e.target.value } : x));
                updateExtra(i, { items });
              }} />
              <TextField placeholder="Subtitle" value={it.subtitle ?? ""} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, subtitle: e.target.value || undefined } : x));
                updateExtra(i, { items });
              }} />
              <TextField placeholder="Date" value={it.date ?? ""} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, date: e.target.value || undefined } : x));
                updateExtra(i, { items });
              }} />
            </Grid>
          ))}
          <button onClick={() => updateExtra(i, { items: [...ex.items, { title: "" }] })}>+ Add item</button>
          <button onClick={() => removeExtra(i)} style={{ marginLeft: 8 }}>Remove section</button>
        </div>
      ))}
      <button onClick={addExtra}>+ Add section (Certifications, Awards, etc.)</button>
    </section>
  );
}
```

- [ ] **Step 5: Modify `src/ui/form/form-tab.tsx`**

```tsx
import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { ExtrasSection } from "./extras-section";

export function FormTab() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 28 }}>
      <MetaSection />
      <ContactSection />
      <ExperienceSection />
      <EducationSection />
      <SkillsSection />
      <ProjectsSection />
      <ExtrasSection />
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `bun run dev`
Exercise every section; confirm persistence.

- [ ] **Step 7: Commit**

```bash
git add src/ui/form
git commit -m "feat(form): add education, skills, projects, extras sections"
```

---

## Task 13: MDX editor tab (CodeMirror)

**Files:**
- Create: `src/ui/editor/use-mdx-bridge.ts`, `src/ui/editor/mdx-tab.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Install CodeMirror**

Run: `bun add @codemirror/state @codemirror/view @codemirror/language @codemirror/lang-markdown @codemirror/commands @codemirror/search codemirror`

- [ ] **Step 2: Write `src/ui/editor/use-mdx-bridge.ts`**

```ts
import { useEffect, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { parseMdxToResume } from "../../mdx/parse";
import { serializeResumeToMdx } from "../../mdx/serialize";

export type MdxBridge = { text: string; setText: (t: string) => void; error: string | null };

export function useMdxBridge(): MdxBridge {
  const resume = useResumeStore((s) => s.resume);
  const [text, setText] = useState(() => serializeResumeToMdx(resume));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setText(serializeResumeToMdx(resume)); }, [resume]);

  const update = (t: string) => {
    setText(t);
    parseMdxToResume(t)
      .then((r) => { setError(null); resumeStore.setState({ resume: r }); })
      .catch((e: Error) => setError(e.message));
  };

  return { text, setText: update, error };
}
```

- [ ] **Step 3: Write `src/ui/editor/mdx-tab.tsx`**

```tsx
import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { useMdxBridge } from "./use-mdx-bridge";

export function MdxTab() {
  const { text, setText, error } = useMdxBridge();
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current || viewRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: text,
        extensions: [
          history(),
          lineNumbers(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          markdown(),
          EditorView.updateListener.of((v) => {
            if (v.docChanged) setText(v.state.doc.toString());
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, []);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    const current = v.state.doc.toString();
    if (current === text) return;
    v.dispatch({ changes: { from: 0, to: current.length, insert: text } });
  }, [text]);

  return (
    <div style={{ padding: 0, height: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
      {error && (
        <div style={{ background: "#fce5e5", color: "#8a1f1f", padding: "8px 16px", fontSize: 12 }}>
          {error}
        </div>
      )}
      <div ref={hostRef} style={{ height: "100%", fontSize: 13 }} />
    </div>
  );
}
```

- [ ] **Step 4: Wire into `src/ui/app.tsx`**

```tsx
import { MdxTab } from "./editor/mdx-tab";
...
left={tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <div style={{ padding: 24 }}>Import tab</div>}
```

- [ ] **Step 5: Verify**

Run: `bun run dev`
Form ↔ MDX tab round-trip works; parse errors surface in a red banner.

- [ ] **Step 6: Commit**

```bash
git add src/ui/editor src/ui/app.tsx package.json bun.lock
git commit -m "feat(editor): add mdx tab with codemirror and schema bridge"
```

---

## Task 14: Import tab

**Files:**
- Create: `src/ui/editor/import-tab.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/editor/import-tab.tsx`**

```tsx
import { useState } from "react";
import { parseMdxToResume } from "../../mdx/parse";
import { resumeStore } from "../../state/store";

export function ImportTab() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOk] = useState<string | null>(null);

  const handleImport = async (source: string) => {
    try {
      const resume = await parseMdxToResume(source);
      resumeStore.setState({ resume, tab: "form" });
      setOk("Imported. Switched to Form tab.");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOk(null);
    }
  };

  const onFile = async (f: File) => {
    const src = await f.text();
    setText(src);
    await handleImport(src);
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 12 }}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) onFile(f);
        }}
        style={{ border: "2px dashed #d9d6ce", padding: 32, textAlign: "center", borderRadius: 6 }}
      >
        Drop an .mdx file here
        <div>
          <input type="file" accept=".mdx,.md,text/markdown" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        </div>
      </div>
      <div>or paste MDX below:</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", minHeight: 240, fontFamily: "ui-monospace, monospace", fontSize: 13 }}
      />
      <div><button onClick={() => handleImport(text)}>Import pasted MDX</button></div>
      {error && <div style={{ color: "crimson" }}>{error}</div>}
      {okMessage && <div style={{ color: "green" }}>{okMessage}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/ui/app.tsx`**

```tsx
import { ImportTab } from "./editor/import-tab";
...
left={tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <ImportTab />}
```

- [ ] **Step 3: Verify**

Run: `bun run dev`
Drop `fixtures/maximal.mdx`; form populates.

- [ ] **Step 4: Commit**

```bash
git add src/ui/editor/import-tab.tsx src/ui/app.tsx
git commit -m "feat(editor): add import tab with drop and paste"
```

---

## Task 15: Preview pane (live render + zoom + export)

**Files:**
- Create: `src/ui/preview/use-typst-render.ts`, `src/ui/preview/preview-pane.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/preview/use-typst-render.ts`**

```ts
import { useEffect, useRef, useState } from "react";
import { TypstClient } from "../../typst/client";
import { DEFAULT_TEMPLATE_SOURCE } from "../../templates/default";
import type { Resume } from "../../schema/resume";

const DEBOUNCE_MS = 150;

export type RenderState = {
  pages: string[];
  error: string | null;
  compileMs: number | null;
  booting: boolean;
};

export function useTypstRender(resume: Resume): RenderState & { exportPdf: () => Promise<Uint8Array> } {
  const clientRef = useRef<TypstClient | null>(null);
  const [state, setState] = useState<RenderState>({ pages: [], error: null, compileMs: null, booting: true });

  useEffect(() => {
    clientRef.current = new TypstClient();
    return () => clientRef.current?.terminate();
  }, []);

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    const timer = setTimeout(async () => {
      try {
        const res = await client.compile(DEFAULT_TEMPLATE_SOURCE, JSON.stringify(resume));
        setState({ pages: res.svgPages, error: null, compileMs: res.durationMs, booting: false });
      } catch (e) {
        setState((s) => ({ ...s, error: (e as Error).message, booting: false }));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [resume]);

  const exportPdf = async () => {
    const client = clientRef.current;
    if (!client) throw new Error("renderer not ready");
    const res = await client.exportPdf(DEFAULT_TEMPLATE_SOURCE, JSON.stringify(resume));
    return res.pdf;
  };

  return { ...state, exportPdf };
}
```

- [ ] **Step 2: Write `src/ui/preview/preview-pane.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { useTypstRender } from "./use-typst-render";
import { SvgPage } from "./svg-page";

export function PreviewPane({ onExportReady }: { onExportReady: (fn: () => Promise<Uint8Array>) => void }) {
  const resume = useResumeStore((s) => s.resume);
  const { pages, error, compileMs, booting, exportPdf } = useTypstRender(resume);
  const [zoom, setZoom] = useState(1);

  useEffect(() => { onExportReady(exportPdf); }, [exportPdf, onExportReady]);

  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto 1fr", padding: 16, gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 12, color: "#4a4a4a" }}>
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>+</button>
        {booting && <span>Preparing renderer…</span>}
        {!booting && compileMs != null && <span>Rendered in {Math.round(compileMs)}ms</span>}
        {error && <span style={{ color: "crimson" }}>{error}</span>}
      </div>
      <div style={{ overflow: "auto", display: "grid", gap: 16, justifyContent: "center" }}>
        {pages.map((svg, i) => <SvgPage key={i} svg={svg} zoom={zoom} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire into `src/ui/app.tsx`**

```tsx
import { useRef } from "react";
import { PreviewPane } from "./preview/preview-pane";
import { resumeStore } from "../state/store";
...
const exportRef = useRef<() => Promise<Uint8Array>>(async () => new Uint8Array());

<TopBar onExport={async () => {
  const pdf = await exportRef.current();
  const blob = new Blob([pdf], { type: "application/pdf" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${resumeStore.getState().name}.pdf`;
  a.click();
  URL.revokeObjectURL(a.href);
}} lastSavedAt={lastSavedAt} />
...
<TwoPane
  left={...}
  right={<PreviewPane onExportReady={(fn) => { exportRef.current = fn; }} />}
/>
```

- [ ] **Step 4: Verify**

Run: `bun run dev`
Form edits reflect in preview within ~150ms. Zoom works. Export PDF downloads a file.

- [ ] **Step 5: Commit**

```bash
git add src/ui/preview src/ui/app.tsx
git commit -m "feat(preview): add live preview with zoom and pdf export"
```

---

## Task 16: Empty state

**Files:**
- Create: `src/ui/shell/empty-state.tsx`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/shell/empty-state.tsx`**

```tsx
import { resumeStore } from "../../state/store";
import { exampleResume, emptyResume } from "../../schema/defaults";

export function EmptyState() {
  return (
    <div style={{ padding: 40, textAlign: "center", display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Start your resume</h2>
      <p style={{ color: "#4a4a4a" }}>Fill the form, paste MDX, or load the example.</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        <button onClick={() => resumeStore.setState({ resume: emptyResume, tab: "form" })}>Fill the form</button>
        <button onClick={() => resumeStore.setState({ tab: "import" })}>Paste MDX</button>
        <button onClick={() => resumeStore.setState({ resume: exampleResume, tab: "form" })}>See example</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Show EmptyState when resume is at defaults**

In `src/ui/app.tsx`:

```tsx
import { EmptyState } from "./shell/empty-state";
import { emptyResume } from "../schema/defaults";
...
const resume = useResumeStore((s) => s.resume);
const isFirstRun = resume.meta.name === emptyResume.meta.name && resume.experience.length === 0;
...
left={isFirstRun ? <EmptyState /> : (tab === "form" ? <FormTab /> : tab === "mdx" ? <MdxTab /> : <ImportTab />)}
```

- [ ] **Step 3: Verify**

Run: `bun run dev`
Clear IDB or use a private window. Empty state appears; "See example" populates.

- [ ] **Step 4: Commit**

```bash
git add src/ui
git commit -m "feat(ui): add empty state onboarding"
```

---

## Task 17: Keyboard shortcuts

**Files:**
- Create: `src/ui/shell/shortcuts.ts`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/shell/shortcuts.ts`**

```ts
import { useEffect } from "react";

export function useShortcuts(handlers: { onSave?: () => void; onCommandPalette?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "s") { e.preventDefault(); handlers.onSave?.(); }
      if (cmd && e.key.toLowerCase() === "k") { e.preventDefault(); handlers.onCommandPalette?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers.onSave, handlers.onCommandPalette]);
}
```

- [ ] **Step 2: Wire in `src/ui/app.tsx`**

```tsx
import { useShortcuts } from "./shell/shortcuts";
...
useShortcuts({ onSave: () => setLastSavedAt(Date.now()) });
```

- [ ] **Step 3: Verify**

Run: `bun run dev`
Cmd/Ctrl+S updates the save indicator.

- [ ] **Step 4: Commit**

```bash
git add src/ui/shell/shortcuts.ts src/ui/app.tsx
git commit -m "feat(ui): add save keyboard shortcut"
```

---

## Task 18: Environment banners

**Files:**
- Create: `src/ui/shell/env-check.ts`
- Modify: `src/ui/app.tsx`

- [ ] **Step 1: Write `src/ui/shell/env-check.ts`**

```ts
export type EnvStatus = { wasm: boolean; idb: boolean };

export async function probeEnv(): Promise<EnvStatus> {
  const wasm = typeof WebAssembly === "object" && typeof Worker === "function";
  let idb = true;
  try {
    const { set, get, del } = await import("idb-keyval");
    const key = "__probe__";
    await set(key, 1);
    await get(key);
    await del(key);
  } catch {
    idb = false;
  }
  return { wasm, idb };
}
```

- [ ] **Step 2: Surface in `src/ui/app.tsx`**

```tsx
import { probeEnv, type EnvStatus } from "./shell/env-check";
...
const [env, setEnv] = useState<EnvStatus | null>(null);
useEffect(() => { probeEnv().then(setEnv); }, []);
...
{env && !env.idb && (
  <div style={{ background: "#fff4d6", padding: "8px 16px", fontSize: 13 }}>
    Your browser is blocking local storage. Your resume will not be saved.
  </div>
)}
{env && !env.wasm && (
  <div style={{ background: "#fce5e5", padding: "8px 16px", fontSize: 13, color: "#8a1f1f" }}>
    Your browser can't run the renderer. Please use Chrome, Firefox, or Safari 16+.
  </div>
)}
```

- [ ] **Step 3: Verify**

Run: `bun run dev`
Open in a private window. Amber banner appears.

- [ ] **Step 4: Commit**

```bash
git add src/ui/shell/env-check.ts src/ui/app.tsx
git commit -m "feat(ui): probe browser env and surface wasm/idb warnings"
```

---

## Task 19: E2E smoke harness

**Files:**
- Create: `scripts/e2e.ts`, `tests/e2e/smoke.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write `scripts/e2e.ts`**

```ts
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const server = spawn("bun", ["run", "dev"], { stdio: ["ignore", "pipe", "pipe"] });
let url: string | null = null;

server.stdout.on("data", (chunk: Buffer) => {
  const s = chunk.toString();
  process.stdout.write(s);
  const match = s.match(/http:\/\/localhost:(\d+)/);
  if (match && !url) url = match[0];
});

await sleep(3000);
if (!url) { server.kill(); throw new Error("dev server did not print URL"); }
console.log(`E2E target: ${url}`);
console.log(`::set-e2e-url::${url}`);

process.on("exit", () => server.kill());
```

- [ ] **Step 2: Write `tests/e2e/smoke.test.ts`**

```ts
import { test, expect } from "bun:test";

test.skip("e2e smoke: run via agent-browser skill", () => {
  // Execution runs via the agent-browser skill:
  //   1. bun run scripts/e2e.ts (keeps server alive)
  //   2. agent-browser skill:
  //      - navigate to URL
  //      - click "See example"
  //      - assert the preview <img> has non-empty src
  //      - click Export PDF; assert a download is triggered
  //      - switch to MDX tab; assert frontmatter is present
  //      - switch to Import tab; paste fixtures/maximal.mdx; confirm Form tab repopulates
  //   3. Assert no console errors.
  expect(true).toBe(true);
});
```

- [ ] **Step 3: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "bun --hot src/index.tsx",
    "build": "bun build src/index.html --outdir dist --splitting",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "e2e:serve": "bun run scripts/e2e.ts"
  }
}
```

- [ ] **Step 4: Verify**

Run: `bun run typecheck` (no errors)
Run: `bun test` (unit tests pass; E2E skipped)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e scripts/e2e.ts package.json
git commit -m "chore(e2e): scaffold e2e smoke harness for agent-browser"
```

---

## Task 20: Final pass

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
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
```

- [ ] **Step 2: Full verification**

Run: `bun run typecheck`
Run: `bun test`
Run: `bun run dev` and exercise: empty state → example → form edits → MDX round trip → import fixture → export PDF. Verify no console errors.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add readme"
```

---

## Self-review notes

**Spec coverage:**
- Architecture & stack → Tasks 1, 6, 8, 9, 15
- Data model (incl. InlineNode) → Task 2
- MDX parse/serialize → Tasks 3, 4, 5
- Typst template (render-inline helper; no eval-style markup) → Task 7
- Editor UX → Tasks 10, 11, 12, 13, 14
- Preview + export → Tasks 6 (SvgPage), 15 (pane + wiring)
- Empty state, shortcuts, env banners → Tasks 16, 17, 18
- Error handling → Tasks 13 (MDX parse), 14 (import), 15 (compile), 18 (env)
- Testing → Tasks 2, 3, 4, 5, 7, 8, 19
- Project structure → established cumulatively across tasks; matches spec layout.

**Adaptations expected at implementation time:**
- `typst.ts` API surface may vary by installed version. The worker's internal calls (`compile`, `renderSvg`, font-registration method name) may need adjustment; the `TypstClient` and `SvgPage` contracts are fixed so callers are not affected (Tasks 6 and 7).
- Markdown-to-inline conversion in Task 3 handles the documented subset (bold, italic, inline code, links). Paste of raw Typst markup via BYO falls outside that subset and will be preserved as plain text.
- Attribute-expression parsing uses `JSON5.parse`, which supports object/array/primitive literals only. Non-literal JSX expressions are out of scope for v1.
- SVG previews are embedded via `<img src="data:image/svg+xml,...">`. This sandbox prevents script execution and cross-origin fetches inside the SVG, which is the standard safe-embedding technique for dynamically generated SVG content.
