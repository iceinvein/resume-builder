import { Row, Grid, Label, TextField } from "./fields";
import { Section } from "../theme/section";
import { Button } from "../theme/button";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ContactSection() {
  const contact = useResumeStore((s) => s.resume.contact);
  const update = resumeStore.getState().updateContact;
  const links = contact.links ?? [];
  const updateLink = (i: number, patch: { label?: string; url?: string }) => {
    update({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  };
  const addLink = () => update({ links: [...links, { label: "", url: "" }] });
  const removeLink = (i: number) => update({ links: links.filter((_, idx) => idx !== i) });

  return (
    <Section title="Contact" hint="Email and phone are optional. Links render as a row under your name.">
      <Grid columns={2}>
        <div>
          <Label>Email</Label>
          <TextField value={contact.email ?? ""} onChange={(e) => update({ email: e.target.value || undefined })} />
        </div>
        <div>
          <Label>Phone</Label>
          <TextField value={contact.phone ?? ""} onChange={(e) => update({ phone: e.target.value || undefined })} />
        </div>
      </Grid>
      <Row>
        <Label>Location</Label>
        <TextField value={contact.location ?? ""} onChange={(e) => update({ location: e.target.value || undefined })} />
      </Row>
      <div style={{ display: "grid", gap: "var(--space-xs)" }}>
        <Label>Links</Label>
        {links.map((l, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr auto",
              gap: "var(--space-xs)",
              alignItems: "center",
            }}
          >
            <TextField placeholder="Label" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
            <TextField placeholder="URL" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const name = l.label || l.url || "link";
                softRemove(`Removed ${name}`, () => removeLink(i));
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <div>
          <Button variant="ghost" size="sm" onClick={addLink}>+ Add link</Button>
        </div>
      </div>
    </Section>
  );
}
