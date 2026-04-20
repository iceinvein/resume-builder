import { Row, Label, TextField, TextArea } from "./fields";
import { Section } from "../theme/section";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

export function MetaSection() {
  const meta = useResumeStore((s) => s.resume.meta);
  const update = resumeStore.getState().updateMeta;
  const summaryMd = meta.summary ? inlineNodesToMd(meta.summary) : "";
  return (
    <Section title="Profile" hint="Your name, role, and an optional summary line. Summary supports markdown.">
      <Row>
        <Label>Full name</Label>
        <TextField value={meta.name} onChange={(e) => update({ name: e.target.value })} />
      </Row>
      <Row>
        <Label>Title</Label>
        <TextField
          placeholder="e.g. Senior Software Engineer"
          value={meta.title ?? ""}
          onChange={(e) => update({ title: e.target.value || undefined })}
        />
      </Row>
      <Row>
        <Label>Summary</Label>
        <TextArea
          placeholder="A short paragraph that goes at the top of your resume. Markdown works."
          value={summaryMd}
          onChange={(e) => {
            const text = e.target.value;
            update({ summary: text ? mdToInlineNodes(text) : undefined });
          }}
        />
      </Row>
    </Section>
  );
}
