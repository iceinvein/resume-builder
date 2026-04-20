import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Textarea } from "../primitives/textarea";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

export function MetaSection() {
  const meta = useResumeStore((s) => s.resume.meta);
  const update = resumeStore.getState().updateMeta;
  const summaryMd = meta.summary ? inlineNodesToMd(meta.summary) : "";

  return (
    <div className="grid gap-md">
      <div className="grid gap-2xs">
        <Label htmlFor="meta-name">Full name</Label>
        <Input
          id="meta-name"
          value={meta.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="meta-title">Title</Label>
        <Input
          id="meta-title"
          placeholder="e.g. Senior Software Engineer"
          value={meta.title ?? ""}
          onChange={(e) => update({ title: e.target.value || undefined })}
        />
      </div>
      <div className="grid gap-2xs">
        <Label htmlFor="meta-summary">Summary</Label>
        <Textarea
          id="meta-summary"
          placeholder="A short paragraph for the top of your resume. Markdown works."
          value={summaryMd}
          onChange={(e) => {
            const text = e.target.value;
            update({ summary: text ? mdToInlineNodes(text) : undefined });
          }}
        />
      </div>
    </div>
  );
}
