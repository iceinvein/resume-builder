import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";
import type { Extra } from "../../schema/resume";

const EMPTY_EXTRAS: Extra[] = [];

export function ExtrasSection() {
  const extras = useResumeStore((s) => s.resume.extras ?? EMPTY_EXTRAS);
  const { updateExtra, removeExtra, addExtra, moveExtra } = resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={extras}
        keyFor={(_, i) => `extra-${i}`}
        onReorder={moveExtra}
        renderItem={(ex, i) => (
          <FormCard
            title={ex.heading || "Section"}
            subtitle={`${ex.items.length} ${ex.items.length === 1 ? "item" : "items"}`}
            removeLabel="Remove section"
            dragLabel={`Drag ${ex.heading || "section"}`}
            onRemove={() => {
              const label = ex.heading || "section";
              softRemove(`Removed ${label}`, () => removeExtra(i));
            }}
          >
            <div className="grid gap-2xs">
              <Label htmlFor={`extra-head-${i}`}>Section heading</Label>
              <Input
                id={`extra-head-${i}`}
                placeholder="e.g. Certifications"
                value={ex.heading}
                onChange={(e) => updateExtra(i, { heading: e.target.value })}
              />
            </div>
            <div className="grid gap-xs">
              {ex.items.map((it, j) => (
                <div key={j} className="grid grid-cols-[1fr_1fr_auto_auto] gap-xs items-end">
                  <Input
                    placeholder="Title"
                    value={it.title}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, title: e.target.value } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Input
                    placeholder="Subtitle"
                    value={it.subtitle ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, subtitle: e.target.value || undefined } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Input
                    className="font-mono tabular-nums w-[7rem]"
                    placeholder="Date"
                    value={it.date ?? ""}
                    onChange={(e) => {
                      const items = ex.items.map((x, k) =>
                        k === j ? { ...x, date: e.target.value || undefined } : x,
                      );
                      updateExtra(i, { items });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={ex.items.length <= 1}
                    onClick={() => {
                      const items = ex.items.filter((_, k) => k !== j);
                      updateExtra(i, { items });
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateExtra(i, { items: [...ex.items, { title: "" }] })}
              >
                + Add item
              </Button>
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addExtra}>+ Add section</Button>
      </div>
    </div>
  );
}
