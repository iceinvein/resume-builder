import { Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import type { Extra } from "../../schema/resume";

const EMPTY_EXTRAS: Extra[] = [];

export function ExtrasSection() {
  const extras = useResumeStore((s) => s.resume.extras ?? EMPTY_EXTRAS);
  const { updateExtra, removeExtra, addExtra } = resumeStore.getState();
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Extras</h2>
      {extras.map((ex, i) => (
        <div key={i} style={{ border: "1px solid #e6e3dd", padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Grid columns={1}>
            <div><Label>Section heading</Label><TextField value={ex.heading} onChange={(e) => updateExtra(i, { heading: e.target.value })} /></div>
          </Grid>
          {ex.items.map((it, j) => (
            <Grid columns={3} key={j}>
              <TextField placeholder="Title" value={it.title} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, title: e.target.value } : x));
                updateExtra(i, { items });
              }} />
              <TextField placeholder="Subtitle" value={it.subtitle ?? ""} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, subtitle: e.target.value || undefined } : x));
                updateExtra(i, { items });
              }} />
              <TextField placeholder="Date" value={it.date ?? ""} onChange={(e) => {
                const items = ex.items.map((x, k) => (k === j ? { ...x, date: e.target.value || undefined } : x));
                updateExtra(i, { items });
              }} />
            </Grid>
          ))}
          <button onClick={() => updateExtra(i, { items: [...ex.items, { title: "" }] })}>+ Add item</button>
          <button onClick={() => removeExtra(i)} style={{ marginLeft: 8 }}>Remove section</button>
        </div>
      ))}
      <button onClick={addExtra}>+ Add section (Certifications, Awards, etc.)</button>
    </section>
  );
}
