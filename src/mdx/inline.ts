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
