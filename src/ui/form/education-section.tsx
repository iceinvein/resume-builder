import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Button } from "../primitives/button";
import { SortableList } from "./sortable-list";
import { FormCard } from "./form-card";
import { MonthYearPicker } from "./month-year-picker";
import { useResumeStore } from "../shell/use-store";
import { resumeStore } from "../../state/store";
import { softRemove } from "../../state/undo";

export function EducationSection() {
  const education = useResumeStore((s) => s.resume.education);
  const { updateEducation, removeEducation, addEducation, moveEducation } =
    resumeStore.getState();

  return (
    <div className="grid gap-md">
      <SortableList
        items={education}
        keyFor={(_, i) => `ed-${i}`}
        onReorder={moveEducation}
        renderItem={(ed, i) => (
          <FormCard
            title={ed.degree || "Degree"}
            subtitle={ed.institution || "Institution"}
            dragLabel={`Drag ${ed.degree || "education"}`}
            onRemove={() => {
              const label = ed.institution || ed.degree || "education";
              softRemove(`Removed ${label}`, () => removeEducation(i));
            }}
          >
            <div className="grid grid-cols-2 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-inst-${i}`}>Institution</Label>
                <Input
                  id={`ed-inst-${i}`}
                  value={ed.institution}
                  onChange={(e) => updateEducation(i, { institution: e.target.value })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-degree-${i}`}>Degree</Label>
                <Input
                  id={`ed-degree-${i}`}
                  value={ed.degree}
                  onChange={(e) => updateEducation(i, { degree: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-sm">
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-field-${i}`}>Field</Label>
                <Input
                  id={`ed-field-${i}`}
                  value={ed.field ?? ""}
                  onChange={(e) =>
                    updateEducation(i, { field: e.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label htmlFor={`ed-loc-${i}`}>Location</Label>
                <Input
                  id={`ed-loc-${i}`}
                  value={ed.location ?? ""}
                  onChange={(e) =>
                    updateEducation(i, { location: e.target.value || undefined })
                  }
                />
              </div>
              <div className="grid gap-2xs">
                <Label>Start</Label>
                <MonthYearPicker
                  value={ed.start ?? ""}
                  onChange={(v) => updateEducation(i, { start: v || undefined })}
                />
              </div>
              <div className="grid gap-2xs">
                <Label>End</Label>
                <MonthYearPicker
                  value={ed.end ?? ""}
                  onChange={(v) => updateEducation(i, { end: v || undefined })}
                />
              </div>
            </div>
          </FormCard>
        )}
      />
      <div>
        <Button variant="ghost" size="sm" onClick={addEducation}>+ Add education</Button>
      </div>
    </div>
  );
}
