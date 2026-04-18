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
