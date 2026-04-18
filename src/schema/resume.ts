import { z } from "zod";
import { InlineNodesSchema } from "./inline";

const LinkSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
});

const EntryEndSchema = z.union([z.string().min(1), z.literal("present")]);

export const ExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  start: z.string().min(1),
  end: EntryEndSchema,
  bullets: z.array(InlineNodesSchema).default([]),
  tech: z.array(z.string()).optional(),
});

export const EducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const SkillsGroupSchema = z.object({
  group: z.string().optional(),
  items: z.array(z.string().min(1)).min(1),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.url().optional(),
  tech: z.array(z.string()).optional(),
  bullets: z.array(InlineNodesSchema).optional(),
});

export const ExtraItemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  details: z.array(z.string()).optional(),
});

export const ExtraSchema = z.object({
  heading: z.string().min(1),
  items: z.array(ExtraItemSchema).min(1),
});

export const ResumeSchema = z.object({
  meta: z.object({
    name: z.string().min(1),
    title: z.string().optional(),
    summary: InlineNodesSchema.optional(),
  }),
  contact: z.object({
    email: z.email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(LinkSchema).optional(),
  }),
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillsGroupSchema).default([]),
  projects: z.array(ProjectSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Extra = z.infer<typeof ExtraSchema>;
export type Link = z.infer<typeof LinkSchema>;
