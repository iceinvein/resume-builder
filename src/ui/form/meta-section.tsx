import { Row, Label, TextField, TextArea } from "./fields";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";

export function MetaSection() {
  const meta = useResumeStore((s) => s.resume.meta);
  const update = resumeStore.getState().updateMeta;
  const summaryMd = meta.summary ? inlineNodesToMd(meta.summary) : "";
  return (
    <section>
      <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}>Header</h2>
      <Row>
        <Label>Full name</Label>
        <TextField value={meta.name} onChange={(e) => update({ name: e.target.value })} />
      </Row>
      <Row>
        <Label>Title</Label>
        <TextField value={meta.title ?? ""} onChange={(e) => update({ title: e.target.value || undefined })} />
      </Row>
      <Row>
        <Label>Summary (markdown)</Label>
        <TextArea
          value={summaryMd}
          onChange={(e) => {
            const text = e.target.value;
            update({ summary: text ? mdToInlineNodes(text) : undefined });
          }}
        />
      </Row>
    </section>
  );
}
