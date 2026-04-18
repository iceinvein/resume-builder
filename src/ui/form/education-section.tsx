import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const { updateEducation, removeEducation, addEducation } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Education</h2>
      {education.map((ed, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Institution</Label><TextField value={ed.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} /></div>
            <div><Label>Degree</Label><TextField value={ed.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} /></div>
          </Grid>
          <Grid columns={4}>
            <div><Label>Field</Label><TextField value={ed.field ?? ""} onChange={(e) => updateEducation(i, { field: e.target.value || undefined })} /></div>
            <div><Label>Location</Label><TextField value={ed.location ?? ""} onChange={(e) => updateEducation(i, { location: e.target.value || undefined })} /></div>
            <div><Label>Start</Label><TextField value={ed.start ?? ""} onChange={(e) => updateEducation(i, { start: e.target.value || undefined })} /></div>
            <div><Label>End</Label><TextField value={ed.end ?? ""} onChange={(e) => updateEducation(i, { end: e.target.value || undefined })} /></div>
          </Grid>
          <button onClick={() => removeEducation(i)}>Remove</button>
        </div>
      ))}
      <button onClick={addEducation}>+ Add education</button>
    </section>
  );
}
