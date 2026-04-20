import { Grid, Label, TextField } from "./fields";
import { BulletEditor } from "./bullet-editor";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Project } from "../../schema/resume";

const EMPTY_PROJECTS: Project[] = [];

export function ProjectsSection() {
  const projects = useResumeStore((s) => s.resume.projects ?? EMPTY_PROJECTS);
  const { updateProject, removeProject, addProject } = resumeStore.getState();
  return (
    <Section title="Projects" hint="Optional. Good for highlighting side work or open-source contributions.">
      {projects.map((p, i) => (
        <div key={i} className="card">
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            <Grid columns={2}>
              <div>
                <Label>Name</Label>
                <TextField value={p.name} onChange={(e) => updateProject(i, { name: e.target.value })} />
              </div>
              <div>
                <Label>URL</Label>
                <TextField
                  placeholder="https://example.com"
                  value={p.url ?? ""}
                  onChange={(e) => updateProject(i, { url: e.target.value || undefined })}
                />
              </div>
            </Grid>
            <Grid columns={2}>
              <div>
                <Label>Description</Label>
                <TextField
                  placeholder="One-line summary"
                  value={p.description ?? ""}
                  onChange={(e) => updateProject(i, { description: e.target.value || undefined })}
                />
              </div>
              <div>
                <Label>Tech</Label>
                <TextField
                  placeholder="TypeScript, Rust"
                  value={(p.tech ?? []).join(", ")}
                  onChange={(e) => updateProject(i, { tech: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                />
              </div>
            </Grid>
            <BulletEditor bullets={p.bullets ?? []} onChange={(b) => updateProject(i, { bullets: b })} />
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
                  const label = p.name || "project";
                  softRemove(`Removed ${label}`, () => removeProject(i));
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" onClick={addProject}>+ Add project</Button>
      </div>
    </Section>
  );
}
