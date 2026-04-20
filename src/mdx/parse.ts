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
  if (!parsed.success) throw new Error(formatValidationError(parsed.error.issues));
  return parsed.data;
}

function formatValidationError(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>): string {
  if (issues.length === 0) return "Import failed: the MDX does not match the resume schema.";
  const lines = issues.map((issue) => {
    const fieldPath = issue.path.length > 0 ? issue.path.join(".") : "document";
    return `- ${fieldPath}: ${issue.message}`;
  });
  const header = issues.length === 1
    ? "Import failed. Please fix the following issue:"
    : `Import failed. Please fix the following ${issues.length} issues:`;
  return `${header}\n${lines.join("\n")}`;
}
