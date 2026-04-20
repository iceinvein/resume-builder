import { useMemo, useState } from "react";
import { useResumeStore } from "../shell/use-store";
import { SectionRail, type SectionRailItem } from "./section-rail";
import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { ExtrasSection } from "./extras-section";

type SectionId = "meta" | "contact" | "experience" | "education" | "skills" | "projects" | "extras";

const SECTION_META: Array<{ id: SectionId; label: string; hint: string }> = [
  { id: "meta", label: "Profile", hint: "Your name, role, and an optional summary line." },
  { id: "contact", label: "Contact", hint: "Email, phone, location, and links." },
  { id: "experience", label: "Experience", hint: "Most recent role first. Each role becomes its own block in the PDF." },
  { id: "education", label: "Education", hint: "Degrees and institutions. Dates are optional." },
  { id: "skills", label: "Skills", hint: "Group related skills together; leave the group blank for a flat list." },
  { id: "projects", label: "Projects", hint: "Optional. Good for side work or open source." },
  { id: "extras", label: "Additional", hint: "Certifications, Awards, Publications, and similar." },
];

export function FormTab() {
  const [active, setActive] = useState<SectionId>("meta");
  const resume = useResumeStore((s) => s.resume);

  const items = useMemo<SectionRailItem[]>(
    () => SECTION_META.map((m) => {
      switch (m.id) {
        case "experience": return { id: m.id, label: m.label, count: resume.experience.length };
        case "education": return { id: m.id, label: m.label, count: resume.education.length };
        case "skills": return { id: m.id, label: m.label, count: resume.skills.length };
        case "projects": return { id: m.id, label: m.label, count: (resume.projects ?? []).length };
        case "extras": return { id: m.id, label: m.label, count: (resume.extras ?? []).length };
        case "contact": return {
          id: m.id,
          label: m.label,
          count: (resume.contact.links ?? []).length,
        };
        default: return { id: m.id, label: m.label };
      }
    }),
    [resume],
  );

  const meta = SECTION_META.find((m) => m.id === active)!;

  return (
    <div className="flex gap-md pl-lg pr-md py-lg min-h-full">
      <SectionRail items={items} active={active} onActivate={(id) => setActive(id as SectionId)} />
      <div className="flex-1 min-w-0 max-w-[68ch] grid gap-lg content-start">
        <header className="grid gap-2xs">
          <h2 className="text-lg font-semibold text-text tracking-tight">{meta.label}</h2>
          <p className="text-sm text-text-tertiary">{meta.hint}</p>
        </header>
        {active === "meta" && <MetaSection />}
        {active === "contact" && <ContactSection />}
        {active === "experience" && <ExperienceSection />}
        {active === "education" && <EducationSection />}
        {active === "skills" && <SkillsSection />}
        {active === "projects" && <ProjectsSection />}
        {active === "extras" && <ExtrasSection />}
      </div>
    </div>
  );
}
