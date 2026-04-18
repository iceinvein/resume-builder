import { TextArea, Label } from "./fields";
import { mdToInlineNodes, inlineNodesToMd } from "../../mdx/inline";
import type { InlineNode } from "../../schema/inline";

export function BulletEditor({
  bullets, onChange,
}: { bullets: InlineNode[][]; onChange: (next: InlineNode[][]) => void }) {
  const displayed = bullets.map(inlineNodesToMd).join("\n");
  return (
    <div>
      <Label>Bullets (one per line, markdown supported)</Label>
      <TextArea
        value={displayed}
        onChange={(e) => {
          const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0);
          onChange(lines.map(mdToInlineNodes));
        }}
        rows={5}
      />
    </div>
  );
}
