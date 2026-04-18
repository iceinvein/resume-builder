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
