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
