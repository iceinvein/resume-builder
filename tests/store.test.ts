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

test("moveEducation reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    education: [
      { institution: "A", degree: "BSc" },
      { institution: "B", degree: "MSc" },
    ],
  });
  store.getState().moveEducation(0, 1);
  expect(store.getState().resume.education.map((e) => e.institution)).toEqual(["B", "A"]);
});

test("moveProject reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    projects: [{ name: "P1" }, { name: "P2" }],
  });
  store.getState().moveProject(1, 0);
  expect(store.getState().resume.projects?.map((p) => p.name)).toEqual(["P2", "P1"]);
});

test("moveSkillsGroup reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    skills: [
      { group: "A", items: ["x"] },
      { group: "B", items: ["y"] },
    ],
  });
  store.getState().moveSkillsGroup(0, 1);
  expect(store.getState().resume.skills.map((g) => g.group)).toEqual(["B", "A"]);
});

test("moveExtra reorders entries", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    extras: [
      { heading: "A", items: [{ title: "x" }] },
      { heading: "B", items: [{ title: "y" }] },
    ],
  });
  store.getState().moveExtra(1, 0);
  expect(store.getState().resume.extras?.map((e) => e.heading)).toEqual(["B", "A"]);
});

test("moveLink reorders contact links", () => {
  const store = createResumeStore();
  store.getState().setResume({
    ...emptyResume,
    contact: {
      links: [
        { label: "A", url: "https://a" },
        { label: "B", url: "https://b" },
      ],
    },
  });
  store.getState().moveLink(0, 1);
  expect(store.getState().resume.contact.links?.map((l) => l.label)).toEqual(["B", "A"]);
});
