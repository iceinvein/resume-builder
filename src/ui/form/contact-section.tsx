import { Row, Grid, Label, TextField } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";

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
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Contact</h2>
      <Grid columns={2}>
        <div><Label>Email</Label><TextField value={contact.email ?? ""} onChange={(e) => update({ email: e.target.value || undefined })} /></div>
        <div><Label>Phone</Label><TextField value={contact.phone ?? ""} onChange={(e) => update({ phone: e.target.value || undefined })} /></div>
      </Grid>
      <Row>
        <Label>Location</Label>
        <TextField value={contact.location ?? ""} onChange={(e) => update({ location: e.target.value || undefined })} />
      </Row>
      <div>
        <Label>Links</Label>
        {links.map((l, i) => (
          <Grid columns={3} key={i}>
            <TextField placeholder="Label" value={l.label} onChange={(e) => updateLink(i, { label: e.target.value })} />
            <TextField placeholder="URL" value={l.url} onChange={(e) => updateLink(i, { url: e.target.value })} />
            <button onClick={() => removeLink(i)}>Remove</button>
          </Grid>
        ))}
        <button onClick={addLink}>+ Add link</button>
      </div>
    </section>
  );
}
