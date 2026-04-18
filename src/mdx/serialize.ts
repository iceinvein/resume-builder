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
