# Resume MDX format

This tool parses a small, fixed MDX dialect into a validated `Resume` object.
External generators (LLMs, scripts, other apps) can target this format to
produce files the Import tab accepts.

- **Machine-readable schema:** `public/resume.schema.json` (generated from
  `src/schema/resume.ts` via `bun run schema`; regenerated as part of
  `bun run build`). It describes the parsed data shape, not the MDX surface.
- **MDX surface (this doc):** the JSX dialect that produces that shape.

## File shape

```mdx
---
name: <string, required>
title: <string, optional>
summary: <markdown inline, optional>
---

<Contact ... />

## Experience
<Experience ...>- bullet</Experience>

## Education
<Education ... />

## Skills
<Skills group="..." items={[...]} />

## Projects
<Project ...>- bullet</Project>

## <any heading>
<Extra heading="..."><Item ... /></Extra>
```

The parser reads only the YAML frontmatter and the top-level JSX elements
named below. Markdown headings (`## ...`) are decorative; they don't affect
parsing. Any other JSX tag causes an import error.

### Frontmatter

The parser reads exactly three fields; everything else is ignored.

| Field     | Type                         | Notes                                                              |
|-----------|------------------------------|--------------------------------------------------------------------|
| `name`    | string (required)            | Must be non-empty.                                                 |
| `title`   | string                       | Role or headline. Plain text.                                      |
| `summary` | markdown inline (one paragraph) | Supports `**bold**`, `*italic*`, `` `code` ``, `[text](url)`, `<br>`. No block elements. |

YAML folded blocks (`>`) work for multi-line summaries; newlines collapse to
spaces.

### Attribute expressions

String attributes use quotes: `start="2022-06"`. Structured attributes use
JSON5 inside braces: `items={["Go","Rust"]}`, `links={[{ label: "GH", url: "..." }]}`.
JSON5 allows single quotes, trailing commas, and unquoted keys. No code is
executed; it's data-only.

### Bullets (children)

`Experience` and `Project` accept a Markdown bullet list as children. Each
list item becomes one bullet. The first paragraph of each item is parsed as
inline Markdown (`**bold**`, `*em*`, `` `code` ``, `[text](url)`). Nested
lists and blocks are dropped.

## Components

Exactly seven JSX elements are recognised. Anything else errors out.

### `<Contact />` (0 or 1)

| Attribute  | Type                                 | Required |
|------------|--------------------------------------|----------|
| `email`    | string (must validate as email)      | no       |
| `phone`    | string                               | no       |
| `location` | string                               | no       |
| `links`    | `[{ label: string, url: string }]`   | no       |

Link `url` must be a valid URL.

### `<Experience>...</Experience>` (0..n)

| Attribute  | Type                     | Required |
|------------|--------------------------|----------|
| `company`  | string                   | yes      |
| `role`     | string                   | yes      |
| `location` | string                   | no       |
| `start`    | string                   | yes      |
| `end`      | string or `"present"`    | yes      |
| `tech`     | `string[]`               | no       |

Children: Markdown bullet list. Each item becomes one entry in `bullets`.

### `<Education />` (0..n)

| Attribute    | Type    | Required |
|--------------|---------|----------|
| `institution`| string  | yes      |
| `degree`     | string  | yes      |
| `field`      | string  | no       |
| `location`   | string  | no       |
| `start`      | string  | no       |
| `end`        | string  | no       |

Self-closing; no children.

### `<Skills />` (0..n)

| Attribute | Type       | Required |
|-----------|------------|----------|
| `group`   | string     | no       |
| `items`   | `string[]` | yes (non-empty) |

### `<Project>...</Project>` (0..n)

| Attribute     | Type       | Required |
|---------------|------------|----------|
| `name`        | string     | yes      |
| `description` | string     | no       |
| `url`         | string (valid URL) | no |
| `tech`        | `string[]` | no       |

Children: optional Markdown bullet list.

### `<Extra>...</Extra>` (0..n)

| Attribute | Type   | Required |
|-----------|--------|----------|
| `heading` | string | yes      |

Children: one or more `<Item />` elements. Other children ignored.

### `<Item />` (only inside `<Extra>`)

| Attribute  | Type   | Required |
|------------|--------|----------|
| `title`    | string | yes      |
| `subtitle` | string | no       |
| `date`     | string | no       |

## Minimal example

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

## Full example

See `fixtures/maximal.mdx` in this repo for every component exercised together.

## Notes for generators

- Do not emit custom wrappers (`ContactLine`, `ProjectList`, etc.) or expression
  references to frontmatter (`{frontmatter.foo}`). The parser does not
  evaluate JSX expressions against frontmatter; only attribute expressions
  (JSON5 literals) are parsed.
- If a concept doesn't fit the schema (certifications, awards, selected
  outcomes), express it with `<Extra heading="..."><Item title="..." /></Extra>`.
- Validation is Zod (`ResumeSchema` in `src/schema/resume.ts`). URL and email
  fields must parse; empty strings fail `min(1)` checks on required fields.
- Autogenerate the JSON Schema with `bun run schema` after touching
  `src/schema/*`; the build script does this automatically.
