import { Grid, Label, TextField } from "./fields";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const { updateSkillsGroup, removeSkillsGroup, addSkillsGroup } = resumeStore.getState();
  return (
    <Section title="Skills" hint="Group related skills together; leave the group blank for a flat list.">
      {skills.map((g, i) => (
        <div key={i} style={{ display: "grid", gap: "var(--space-xs)" }}>
          <Grid columns={2}>
            <div>
              <Label>Group</Label>
              <TextField
                placeholder="e.g. Languages"
                value={g.group ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) updateSkillsGroup(i, { group: val });
                  else updateSkillsGroup(i, { items: g.items });
                }}
              />
            </div>
            <div>
              <Label>Skills</Label>
              <TextField
                placeholder="TypeScript, Rust, Python"
                value={g.items.join(", ")}
                onChange={(e) => updateSkillsGroup(i, { items: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              />
            </div>
          </Grid>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const label = g.group || "skills group";
                softRemove(`Removed ${label}`, () => removeSkillsGroup(i));
              }}
            >
              Remove group
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" onClick={addSkillsGroup}>+ Add skills group</Button>
      </div>
    </Section>
  );
}
