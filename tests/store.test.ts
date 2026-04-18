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
