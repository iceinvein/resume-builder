import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

export function SkillsSection() {
  const skills = useResumeStore((s) => s.resume.skills);
  const { updateSkillsGroup, removeSkillsGroup, addSkillsGroup } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Skills</h2>
      {skills.map((g, i) => (
        <Grid columns={2} key={i}>
          <div><Label>Group</Label><TextField value={g.group ?? ""} onChange={(e) => {
            const val = e.target.value;
            if (val) updateSkillsGroup(i, { group: val });
            else updateSkillsGroup(i, { items: g.items });
          }} /></div>
          <div><Label>Items (comma-separated)</Label>
            <TextField
              value={g.items.join(", ")}
              onChange={(e) => updateSkillsGroup(i, { items: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>
          <button onClick={() => removeSkillsGroup(i)} style={{ gridColumn: "1 / -1", justifySelf: "start" }}>Remove</button>
        </Grid>
      ))}
      <button onClick={addSkillsGroup}>+ Add skills group</button>
    </section>
  );
}
