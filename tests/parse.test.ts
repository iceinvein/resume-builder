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
