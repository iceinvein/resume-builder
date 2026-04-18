import { Row, Grid, Label, TextField } from "./fields";
import { BulletEditor } from "./bullet-editor";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function ExperienceSection() {
  const experience = useResumeStore((s) => s.resume.experience);
  const { updateExperience, removeExperience, addExperience, moveExperience } = resumeStore.getState();

  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Experience</h2>
      {experience.map((e, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Role</Label><TextField value={e.role} onChange={(ev) => updateExperience(i, { role: ev.target.value })} /></div>
            <div><Label>Company</Label><TextField value={e.company} onChange={(ev) => updateExperience(i, { company: ev.target.value })} /></div>
          </Grid>
          <Grid columns={3}>
            <div><Label>Location</Label><TextField value={e.location ?? ""} onChange={(ev) => updateExperience(i, { location: ev.target.value || undefined })} /></div>
            <div><Label>Start (YYYY-MM)</Label><TextField value={e.start} onChange={(ev) => updateExperience(i, { start: ev.target.value })} /></div>
            <div><Label>End</Label><TextField value={e.end} onChange={(ev) => updateExperience(i, { end: ev.target.value })} /></div>
          </Grid>
          <Row>
            <Label>Tech (comma-separated)</Label>
            <TextField
              value={(e.tech ?? []).join(", ")}
              onChange={(ev) => updateExperience(i, { tech: ev.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </Row>
          <BulletEditor bullets={e.bullets} onChange={(b) => updateExperience(i, { bullets: b })} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button disabled={i === 0} onClick={() => moveExperience(i, i - 1)}>Up</button>
            <button disabled={i === experience.length - 1} onClick={() => moveExperience(i, i + 1)}>Down</button>
            <button onClick={() => removeExperience(i)}>Remove</button>
          </div>
        </div>
      ))}
      <button onClick={addExperience}>+ Add experience</button>
    </section>
  );
}
