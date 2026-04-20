import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { ExtrasSection } from "./extras-section";

export function FormTab() {
  return (
    <div
      style={{
        padding: "var(--space-xl) var(--space-lg)",
        display: "grid",
        gap: "var(--space-2xl)",
        maxWidth: "68ch",
      }}
    >
      <MetaSection />
      <ContactSection />
      <ExperienceSection />
      <EducationSection />
      <SkillsSection />
      <ProjectsSection />
      <ExtrasSection />
    </div>
  );
}
