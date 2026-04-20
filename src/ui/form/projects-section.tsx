import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { ChipInput } from "./chip-input";
import { BulletList } from "./bullet-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Project } from "../../schema/resume";

const EMPTY_PROJECTS: Project[] = [];

export function ProjectsSection() {
  const projects = useResumeStore((s) => s.resume.projects ?? EMPTY_PROJECTS);
  const { updateProject, removeProject, addProject, moveProject } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={projects}
        keyFor={(_, i) => `proj-${i}`}
        onReorder={moveProject}
        renderItem={(p, i) => (
          <FormCard
            title={p.name || "Project"}
            subtitle={p.description}
            dragLabel={`Drag ${p.name || "project"}`}
            onRemove={() => {
              const label = p.name || "project";
              softRemove(`Removed ${label}`, () => removeProject(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`proj-name-${i}`}>Name</Label>
                <Input
                  id={`proj-name-${i}`}
                  value={p.name}
                  onChange={(e) => updateProject(i, { name: e.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`proj-url-${i}`}>URL</Label>
                <Input
                  id={`proj-url-${i}`}
                  placeholder="https://example.com"
                  value={p.url ?? ""}
                  onChange={(e) =>
                    updateProject(i, { url: e.target.value || undefined })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2xs">
              <Label htmlFor={`proj-desc-${i}`}>Description</Label>
              <Input
                id={`proj-desc-${i}`}
                placeholder="One-line summary"
                value={p.description ?? ""}
                onChange={(e) =>
                  updateProject(i, { description: e.target.value || undefined })
                }
              />
            </div>
            <div className="grid gap-2xs">
              <Label>Tech</Label>
              <ChipInput
                placeholder="Add tech"
                value={p.tech ?? []}
                onChange={(next) =>
                  updateProject(i, { tech: next.length > 0 ? next : undefined })
                }
              />
            </div>
            <BulletList
              bullets={p.bullets ?? []}
              onChange={(b) => updateProject(i, { bullets: b })}
            />
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addProject}>+ Add project</Button>
      </div>
    </div>
  );
}
