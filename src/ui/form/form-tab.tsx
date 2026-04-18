import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";
import { ExperienceSection } from "./experience-section";
import { EducationSection } from "./education-section";
import { SkillsSection } from "./skills-section";
import { ProjectsSection } from "./projects-section";
import { ExtrasSection } from "./extras-section";

export function FormTab() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 28 }}>
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
