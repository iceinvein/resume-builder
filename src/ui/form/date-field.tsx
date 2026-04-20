import { useRef } from "react";
import { TextField } from "./fields";
import { Button } from "../theme/button";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  allowPresent?: boolean;
};

/**
 * Date input for `YYYY` / `YYYY-MM` / the literal "present". When
 * `allowPresent` is true (experience end dates), the user can toggle the
 * field into a locked "Present" state without losing their previous value.
 */
export function DateField({ value, onChange, placeholder, allowPresent }: Props) {
  const restoreRef = useRef("");
  const isPresent = value === "present";

  const togglePresent = () => {
    if (isPresent) {
      onChange(restoreRef.current);
    } else {
      restoreRef.current = value;
      onChange("present");
    }
  };

  return (
    <div style={{ display: "flex", gap: "var(--space-2xs)", alignItems: "stretch" }}>
      <TextField
        className="tabular-nums"
        value={isPresent ? "" : value}
        placeholder={isPresent ? "Present" : (placeholder ?? "YYYY-MM")}
        disabled={isPresent}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1 }}
      />
      {allowPresent && (
        <Button
          variant={isPresent ? "primary" : "ghost"}
          size="sm"
          onClick={togglePresent}
          aria-pressed={isPresent}
          title="Toggle Present"
        >
          Present
        </Button>
      )}
    </div>
  );
}
