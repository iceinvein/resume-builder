import { Select as BaseSelect } from "@base-ui-components/react/select";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export const Select = BaseSelect.Root;

type TriggerProps = ComponentPropsWithoutRef<typeof BaseSelect.Trigger>;
export function SelectTrigger({ className, ...rest }: TriggerProps) {
  return (
    <BaseSelect.Trigger
      className={cn(
        "inline-flex items-center justify-between gap-xs px-sm py-xs text-sm",
        "bg-surface-raised text-text border border-border rounded-sm",
        "hover:border-border-strong",
        "focus-visible:outline-none focus-visible:border-accent",
        "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)]",
        className,
      )}
      {...rest}
    />
  );
}

export const SelectValue = BaseSelect.Value;

type ContentProps = ComponentPropsWithoutRef<typeof BaseSelect.Popup> & {
  children: ReactNode;
};
export function SelectContent({ className, children, ...rest }: ContentProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner sideOffset={4}>
        <BaseSelect.Popup
          className={cn(
            "bg-surface-raised text-text border border-border rounded-md",
            "shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
            "max-h-[280px] overflow-auto p-2xs outline-none",
            className,
          )}
          {...rest}
        >
          {children}
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

type ItemProps = ComponentPropsWithoutRef<typeof BaseSelect.Item>;
export function SelectItem({ className, ...rest }: ItemProps) {
  return (
    <BaseSelect.Item
      className={cn(
        "flex items-center px-sm py-xs text-sm rounded-xs cursor-pointer",
        "data-[highlighted]:bg-surface-muted data-[selected]:font-semibold",
        className,
      )}
      {...rest}
    />
  );
}
