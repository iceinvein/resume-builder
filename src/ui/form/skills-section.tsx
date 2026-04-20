import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { ChipInput } from "./chip-input";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const { updateSkillsGroup, removeSkillsGroup, addSkillsGroup, moveSkillsGroup } =
    resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={skills}
        keyFor={(_, i) => `skill-${i}`}
        onReorder={moveSkillsGroup}
        renderItem={(g, i) => (
          <FormCard
            title={g.group || "Group"}
            subtitle={`${g.items.length} ${g.items.length === 1 ? "skill" : "skills"}`}
            removeLabel="Remove group"
            dragLabel={`Drag ${g.group || "group"}`}
            onRemove={() => {
              const label = g.group || "skills group";
              softRemove(`Removed ${label}`, () => removeSkillsGroup(i));
            }}
          >
            <div className="grid gap-2xs">
              <Label htmlFor={`skill-group-${i}`}>Group</Label>
              <Input
                id={`skill-group-${i}`}
                placeholder="e.g. Languages"
                value={g.group ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) updateSkillsGroup(i, { group: val });
                  else updateSkillsGroup(i, { items: g.items });
                }}
              />
            </div>
            <div className="grid gap-2xs">
              <Label>Skills</Label>
              <ChipInput
                placeholder="Add skill"
                value={g.items}
                onChange={(next) => updateSkillsGroup(i, { items: next })}
              />
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addSkillsGroup}>+ Add skills group</Button>
      </div>
    </div>
  );
}
