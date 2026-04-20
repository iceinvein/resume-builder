import { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";

type Props = {
  value: string;
  onChange: (next: string) => void;
  allowPresent?: boolean;
  placeholder?: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parse(value: string): { year: string; month: string } {
  if (value === "" || value === "present") return { year: "", month: "" };
  const [y, m] = value.split("-");
  return { year: y ?? "", month: m ?? "" };
}

function format(value: string, placeholder: string): string {
  if (value === "present") return "Present";
  if (value === "") return placeholder;
  const { year, month } = parse(value);
  if (!year) return placeholder;
  if (!month) return year;
  const idx = Number(month) - 1;
  const label = MONTHS[idx] ?? month;
  return `${label} ${year}`;
}

export function MonthYearPicker({ value, onChange, allowPresent, placeholder = "-" }: Props) {
  const parsed = parse(value);
  const [year, setYearState] = useState(parsed.year);
  const [month, setMonthState] = useState(parsed.month);

  useEffect(() => {
    const next = parse(value);
    setYearState(next.year);
    setMonthState(next.month);
  }, [value]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 52 }, (_, i) => String(now + 1 - i));
  }, []);
  const isPresent = value === "present";

  const pad = (m: string) => (m ? m.padStart(2, "0") : "");
  const emit = (y: string, m: string) => {
    if (!y && !m) return onChange("");
    if (y && m) return onChange(`${y}-${pad(m)}`);
    if (y) return onChange(y);
    return onChange("");
  };
  const setYear = (y: string) => {
    setYearState(y);
    emit(y, month);
  };
  const setMonth = (m: string) => {
    setMonthState(m);
    emit(year, m);
  };
  const togglePresent = () => onChange(isPresent ? "" : "present");
  const clear = () => {
    setYearState("");
    setMonthState("");
    onChange("");
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Pick date"
        className={cn(
          "w-full text-left bg-surface-raised text-text border border-border rounded-sm",
          "px-sm py-xs text-sm leading-none font-mono tabular-nums",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-accent",
          "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        )}
      >
        {format(value, placeholder)}
      </PopoverTrigger>
      <PopoverContent className="grid gap-sm min-w-[240px]">
        <div className="grid gap-2xs">
          <label className="text-xs text-text-secondary" htmlFor="month-select">Month</label>
          <select
            id="month-select"
            disabled={isPresent}
            value={month ? String(Number(month)) : ""}
            onChange={(e) => setMonth(e.target.value)}
            className={cn(
              "bg-surface-raised text-text border border-border rounded-sm px-sm py-xs text-sm",
              "disabled:opacity-50",
            )}
          >
            <option value="">-</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1)}>{m}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2xs">
          <label className="text-xs text-text-secondary" htmlFor="year-select">Year</label>
          <select
            id="year-select"
            disabled={isPresent}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={cn(
              "bg-surface-raised text-text border border-border rounded-sm px-sm py-xs text-sm",
              "disabled:opacity-50",
            )}
          >
            <option value="">-</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {allowPresent && (
          <label className="flex items-center gap-xs text-sm">
            <input type="checkbox" checked={isPresent} onChange={togglePresent} />
            Present
          </label>
        )}
        <button
          type="button"
          onClick={clear}
          className="text-xs text-text-secondary hover:text-text justify-self-start"
        >
          Clear
        </button>
      </PopoverContent>
    </Popover>
  );
}
