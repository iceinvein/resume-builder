import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList, SortableHandle } from "./sortable-list";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function ContactSection() {
  const contact = useResumeStore((s) => s.resume.contact);
  const { updateContact, moveLink } = resumeStore.getState();
  const links = contact.links ?? [];
  const updateLink = (i: number, patch: { label?: string; url?: string }) => {
    updateContact({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
  };
  const addLink = () => updateContact({ links: [...links, { label: "", url: "" }] });
  const removeLink = (i: number) =>
    updateContact({ links: links.filter((_, idx) => idx !== i) });

  return (
    <div className="grid gap-md">
      <div className="grid grid-cols-2 gap-sm">
        <div className="grid gap-2xs">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={contact.email ?? ""}
            onChange={(e) => updateContact({ email: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-2xs">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            value={contact.phone ?? ""}
            onChange={(e) => updateContact({ phone: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="contact-location">Location</Label>
        <Input
          id="contact-location"
          value={contact.location ?? ""}
          onChange={(e) => updateContact({ location: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-xs">
        <Label>Links</Label>
        <SortableList
          items={links}
          keyFor={(_, i) => `link-${i}`}
          onReorder={moveLink}
          renderItem={(l, i) => (
            <div className="grid grid-cols-[auto_1fr_2fr_auto] items-center gap-xs">
              <SortableHandle aria-label={`Drag link ${i + 1}`} />
              <Input
                placeholder="Label"
                value={l.label}
                onChange={(e) => updateLink(i, { label: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={l.url}
                onChange={(e) => updateLink(i, { url: e.target.value })}
              />
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
          )}
        />
        <div>
          <Button variant="ghost" size="sm" onClick={addLink}>+ Add link</Button>
        </div>
      </div>
    </div>
  );
}
