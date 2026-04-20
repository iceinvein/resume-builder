import { Grid, Label, TextField } from "./fields";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Extra } from "../../schema/resume";

const EMPTY_EXTRAS: Extra[] = [];

export function ExtrasSection() {
  const extras = useResumeStore((s) => s.resume.extras ?? EMPTY_EXTRAS);
  const { updateExtra, removeExtra, addExtra } = resumeStore.getState();
  return (
    <Section
      title="Additional"
      hint="Custom sections for things that don't fit the standard fields: Certifications, Awards, Publications, Volunteering."
    >
      {extras.map((ex, i) => (
        <div key={i} className="card">
          <div style={{ display: "grid", gap: "var(--space-sm)" }}>
            <div>
              <Label>Section heading</Label>
              <TextField
                placeholder="e.g. Certifications"
                value={ex.heading}
                onChange={(e) => updateExtra(i, { heading: e.target.value })}
              />
            </div>
            <div style={{ display: "grid", gap: "var(--space-xs)" }}>
              {ex.items.map((it, j) => (
                <Grid columns={3} key={j}>
                  <TextField
                    placeholder="Title"
                    value={it.title}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) => (k === j ? { ...x, title: e.target.value } : x));
                      updateExtra(i, { items });
                    }}
                  />
                  <TextField
                    placeholder="Subtitle"
                    value={it.subtitle ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) => (k === j ? { ...x, subtitle: e.target.value || undefined } : x));
                      updateExtra(i, { items });
                    }}
                  />
                  <TextField
                    className="tabular-nums"
                    placeholder="Date"
                    value={it.date ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) => (k === j ? { ...x, date: e.target.value || undefined } : x));
                      updateExtra(i, { items });
                    }}
                  />
                </Grid>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "var(--space-xs)",
                borderTop: "var(--border-hairline) solid var(--color-border-subtle)",
              }}
            >
              <Button variant="ghost" size="sm" onClick={() => updateExtra(i, { items: [...ex.items, { title: "" }] })}>
                + Add item
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  const label = ex.heading || "section";
                  softRemove(`Removed ${label}`, () => removeExtra(i));
                }}
              >
                Remove section
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <Button variant="ghost" size="sm" onClick={addExtra}>+ Add section</Button>
      </div>
    </Section>
  );
}
