import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { MonthYearPicker } from "./month-year-picker";
import { ChipInput } from "./chip-input";
import { BulletList } from "./bullet-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ExperienceSection() {
  const experience = useResumeStore((s) => s.resume.experience);
  const { updateExperience, removeExperience, addExperience, moveExperience } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={experience}
        keyFor={(_, i) => `exp-${i}`}
        onReorder={moveExperience}
        renderItem={(e, i) => (
          <FormCard
            title={e.role || "Role"}
            subtitle={e.company || "Company"}
            dragLabel={`Drag ${e.role || "role"}`}
            onRemove={() => {
              const label = e.role || e.company || "experience";
              softRemove(`Removed ${label}`, () => removeExperience(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-role-${i}`}>Role</Label>
                <Input
                  id={`exp-role-${i}`}
                  value={e.role}
                  onChange={(ev) => updateExperience(i, { role: ev.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-company-${i}`}>Company</Label>
                <Input
                  id={`exp-company-${i}`}
                  value={e.company}
                  onChange={(ev) => updateExperience(i, { company: ev.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`exp-loc-${i}`}>Location</Label>
                <Input
                  id={`exp-loc-${i}`}
                  value={e.location ?? ""}
                  onChange={(ev) =>
                    updateExperience(i, { location: ev.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label>Start</Label>
                <MonthYearPicker
                  value={e.start}
                  onChange={(v) => updateExperience(i, { start: v })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label>End</Label>
                <MonthYearPicker
                  value={e.end}
                  allowPresent
                  onChange={(v) => updateExperience(i, { end: v as typeof e.end })}
                />
              </div>
            </div>
            <div className="grid gap-2xs">
              <Label>Tech</Label>
              <ChipInput
                placeholder="Add tech"
                value={e.tech ?? []}
                onChange={(next) =>
                  updateExperience(i, { tech: next.length > 0 ? next : undefined })
                }
              />
            </div>
            <BulletList
              bullets={e.bullets}
              onChange={(b) => updateExperience(i, { bullets: b })}
            />
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addExperience}>+ Add experience</Button>
      </div>
    </div>
  );
}
