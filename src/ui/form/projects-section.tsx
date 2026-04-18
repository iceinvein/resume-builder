import { Grid, Label, TextField } from "./fields";
import { BulletEditor } from "./bullet-editor";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import type { Project } from "../../schema/resume";

const EMPTY_PROJECTS: Project[] = [];

export function ProjectsSection() {
  const projects = useResumeStore((s) => s.resume.projects ?? EMPTY_PROJECTS);
  const { updateProject, removeProject, addProject } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Projects</h2>
      {projects.map((p, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={2}>
            <div><Label>Name</Label><TextField value={p.name} onChange={(e) => updateProject(i, { name: e.target.value })} /></div>
            <div><Label>URL</Label><TextField value={p.url ?? ""} onChange={(e) => updateProject(i, { url: e.target.value || undefined })} /></div>
          </Grid>
          <Grid columns={2}>
            <div><Label>Description</Label><TextField value={p.description ?? ""} onChange={(e) => updateProject(i, { description: e.target.value || undefined })} /></div>
            <div><Label>Tech</Label>
              <TextField
                value={(p.tech ?? []).join(", ")}
                onChange={(e) => updateProject(i, { tech: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              />
            </div>
          </Grid>
          <BulletEditor bullets={p.bullets ?? []} onChange={(b) => updateProject(i, { bullets: b })} />
          <button onClick={() => removeProject(i)}>Remove</button>
        </div>
      ))}
      <button onClick={addProject}>+ Add project</button>
    </section>
  );
}
