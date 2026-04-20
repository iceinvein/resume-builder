import { Row, Grid, Label, TextField } from "./fields";
import { DateField } from "./date-field";
import { BulletEditor } from "./bullet-editor";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ExperienceSection() {
  const experience = useResumeStore((s) => s.resume.experience);
  const { updateExperience, removeExperience, addExperience, moveExperience } = resumeStore.getState();

  return (
    <Section title="Experience" hint="Most recent role first. Each role becomes its own block in the PDF.">
      {experience.map((e, i) => (
        <div key={i} className="card">
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            <Grid columns={2}>
              <div><Label>Role</Label><TextField value={e.role} onChange={(ev) => updateExperience(i, { role: ev.target.value })} /></div>
              <div><Label>Company</Label><TextField value={e.company} onChange={(ev) => updateExperience(i, { company: ev.target.value })} /></div>
            </Grid>
            <Grid columns={3}>
              <div><Label>Location</Label><TextField value={e.location ?? ""} onChange={(ev) => updateExperience(i, { location: ev.target.value || undefined })} /></div>
              <div>
                <Label>Start</Label>
                <DateField value={e.start} onChange={(v) => updateExperience(i, { start: v })} />
              </div>
              <div>
                <Label>End</Label>
                <DateField
                  value={e.end}
                  allowPresent
                  onChange={(v) => updateExperience(i, { end: v as typeof e.end })}
                />
              </div>
            </Grid>
            <Row>
              <Label>Tech</Label>
              <TextField
                placeholder="TypeScript, AWS, Kubernetes"
                value={(e.tech ?? []).join(", ")}
                onChange={(ev) => updateExperience(i, { tech: ev.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              />
            </Row>
            <BulletEditor bullets={e.bullets} onChange={(b) => updateExperience(i, { bullets: b })} />
            <div
              style={{
                display: "flex",
                gap: "var(--space-xs)",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "var(--space-xs)",
                borderTop: "var(--border-hairline) solid var(--color-border-subtle)",
              }}
            >
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={i === 0}
                  onClick={() => moveExperience(i, i - 1)}
                  aria-label="Move experience up"
                  title="Move up"
                >
                  Up
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={i === experience.length - 1}
                  onClick={() => moveExperience(i, i + 1)}
                  aria-label="Move experience down"
                  title="Move down"
                >
                  Down
                </Button>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const label = e.role || e.company || "experience";
                  softRemove(`Removed ${label}`, () => removeExperience(i));
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" onClick={addExperience}>+ Add experience</Button>
      </div>
    </Section>
  );
}
