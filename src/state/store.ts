import { createStore } from "zustand/vanilla";
import { emptyResume } from "../schema/defaults";
import type { Resume, Experience, Education, Project, Extra } from "../schema/resume";

export type Tab = "form" | "mdx" | "import";

export type ResumeStore = {
  resume: Resume;
  tab: Tab;
  name: string;
  started: boolean;
  setTab: (t: Tab) => void;
  setName: (n: string) => void;
  setResume: (r: Resume) => void;
  updateMeta: (patch: Partial<Resume["meta"]>) => void;
  updateContact: (patch: Partial<Resume["contact"]>) => void;
  addExperience: () => void;
  updateExperience: (i: number, patch: Partial<Experience>) => void;
  removeExperience: (i: number) => void;
  moveExperience: (from: number, to: number) => void;
  addEducation: () => void;
  updateEducation: (i: number, patch: Partial<Education>) => void;
  removeEducation: (i: number) => void;
  moveEducation: (from: number, to: number) => void;
  addSkillsGroup: () => void;
  updateSkillsGroup: (i: number, patch: Partial<{ group?: string; items: string[] }>) => void;
  removeSkillsGroup: (i: number) => void;
  moveSkillsGroup: (from: number, to: number) => void;
  addProject: () => void;
  updateProject: (i: number, patch: Partial<Project>) => void;
  removeProject: (i: number) => void;
  moveProject: (from: number, to: number) => void;
  addExtra: () => void;
  updateExtra: (i: number, patch: Partial<Extra>) => void;
  removeExtra: (i: number) => void;
  moveExtra: (from: number, to: number) => void;
  moveLink: (from: number, to: number) => void;
};

export function createResumeStore() {
  return createStore<ResumeStore>((set) => ({
    resume: emptyResume,
    tab: "form",
    name: "Untitled Resume",
    started: false,
    setTab: (tab) => set({ tab }),
    setName: (name) => set({ name }),
    setResume: (resume) => set({ resume }),
    updateMeta: (patch) =>
      set((s) => ({ resume: { ...s.resume, meta: { ...s.resume.meta, ...patch } } })),
    updateContact: (patch) =>
      set((s) => ({ resume: { ...s.resume, contact: { ...s.resume.contact, ...patch } } })),
    addExperience: () =>
      set((s) => ({
        resume: {
          ...s.resume,
          experience: [
            ...s.resume.experience,
            { company: "", role: "", start: "", end: "present", bullets: [] },
          ],
        },
      })),
    updateExperience: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          experience: s.resume.experience.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
        },
      })),
    removeExperience: (i) =>
      set((s) => ({
        resume: { ...s.resume, experience: s.resume.experience.filter((_, idx) => idx !== i) },
      })),
    moveExperience: (from, to) =>
      set((s) => {
        const exp = [...s.resume.experience];
        const [item] = exp.splice(from, 1);
        if (item) exp.splice(to, 0, item);
        return { resume: { ...s.resume, experience: exp } };
      }),
    addEducation: () =>
      set((s) => ({
        resume: { ...s.resume, education: [...s.resume.education, { institution: "", degree: "" }] },
      })),
    updateEducation: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          education: s.resume.education.map((e, idx) => (idx === i ? { ...e, ...patch } : e)),
        },
      })),
    removeEducation: (i) =>
      set((s) => ({
        resume: { ...s.resume, education: s.resume.education.filter((_, idx) => idx !== i) },
      })),
    moveEducation: (from, to) =>
      set((s) => {
        const arr = [...s.resume.education];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, education: arr } };
      }),
    addSkillsGroup: () =>
      set((s) => ({ resume: { ...s.resume, skills: [...s.resume.skills, { items: [""] }] } })),
    updateSkillsGroup: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          skills: s.resume.skills.map((g, idx) => (idx === i ? { ...g, ...patch } : g)),
        },
      })),
    removeSkillsGroup: (i) =>
      set((s) => ({
        resume: { ...s.resume, skills: s.resume.skills.filter((_, idx) => idx !== i) },
      })),
    moveSkillsGroup: (from, to) =>
      set((s) => {
        const arr = [...s.resume.skills];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, skills: arr } };
      }),
    addProject: () =>
      set((s) => ({
        resume: { ...s.resume, projects: [...(s.resume.projects ?? []), { name: "" }] },
      })),
    updateProject: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          projects: (s.resume.projects ?? []).map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
        },
      })),
    removeProject: (i) =>
      set((s) => ({
        resume: { ...s.resume, projects: (s.resume.projects ?? []).filter((_, idx) => idx !== i) },
      })),
    moveProject: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.projects ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, projects: arr } };
      }),
    addExtra: () =>
      set((s) => ({
        resume: {
          ...s.resume,
          extras: [...(s.resume.extras ?? []), { heading: "", items: [{ title: "" }] }],
        },
      })),
    updateExtra: (i, patch) =>
      set((s) => ({
        resume: {
          ...s.resume,
          extras: (s.resume.extras ?? []).map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
        },
      })),
    removeExtra: (i) =>
      set((s) => ({
        resume: { ...s.resume, extras: (s.resume.extras ?? []).filter((_, idx) => idx !== i) },
      })),
    moveExtra: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.extras ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, extras: arr } };
      }),
    moveLink: (from, to) =>
      set((s) => {
        const arr = [...(s.resume.contact.links ?? [])];
        const [item] = arr.splice(from, 1);
        if (item) arr.splice(to, 0, item);
        return { resume: { ...s.resume, contact: { ...s.resume.contact, links: arr } } };
      }),
  }));
}

export const resumeStore = createResumeStore();

// `started` has to be tracked separately from the resume content: "Start blank"
// sets the resume to `emptyResume`, so a content-only check can never leave the
// first-run screen. Drafts saved before this flag existed have no `started`, so
// the content check still stands in for them.
export function isFirstRun(state: Pick<ResumeStore, "resume" | "started">): boolean {
  if (state.started) return false;
  return (
    state.resume.meta.name === emptyResume.meta.name &&
    state.resume.experience.length === 0
  );
}
