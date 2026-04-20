import { Grid, Label, TextField } from "./fields";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const { updateEducation, removeEducation, addEducation } = resumeStore.getState();
  return (
    <Section title="Education" hint="Degrees and institutions. Dates are optional.">
      {education.map((ed, i) => (
        <div key={i} className="card">
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            <Grid columns={2}>
              <div><Label>Institution</Label><TextField value={ed.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} /></div>
              <div><Label>Degree</Label><TextField value={ed.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} /></div>
            </Grid>
            <Grid columns={4}>
              <div><Label>Field</Label><TextField value={ed.field ?? ""} onChange={(e) => updateEducation(i, { field: e.target.value || undefined })} /></div>
              <div><Label>Location</Label><TextField value={ed.location ?? ""} onChange={(e) => updateEducation(i, { location: e.target.value || undefined })} /></div>
              <div><Label>Start</Label><TextField className="tabular-nums" value={ed.start ?? ""} onChange={(e) => updateEducation(i, { start: e.target.value || undefined })} /></div>
              <div><Label>End</Label><TextField className="tabular-nums" value={ed.end ?? ""} onChange={(e) => updateEducation(i, { end: e.target.value || undefined })} /></div>
            </Grid>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: "var(--space-xs)",
                borderTop: "var(--border-hairline) solid var(--color-border-subtle)",
              }}
            >
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const label = ed.institution || ed.degree || "education";
                  softRemove(`Removed ${label}`, () => removeEducation(i));
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" onClick={addEducation}>+ Add education</Button>
      </div>
    </Section>
  );
}
