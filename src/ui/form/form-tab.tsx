import { MetaSection } from "./meta-section";
import { ContactSection } from "./contact-section";

export function FormTab() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 28 }}>
      <MetaSection />
      <ContactSection />
    </div>
  );
}
