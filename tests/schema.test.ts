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
