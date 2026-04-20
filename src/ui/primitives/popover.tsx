import { Popover as BasePopover } from "@base-ui-components/react/popover";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

type PopoverContentProps = ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
  sideOffset?: number;
  children: ReactNode;
};

export function PopoverContent({ className, sideOffset = 6, children, ...rest }: PopoverContentProps) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner sideOffset={sideOffset}>
        <BasePopover.Popup
          className={cn(
            "bg-surface-raised text-text border border-border rounded-md shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]",
            "p-sm min-w-[200px] outline-none",
            className,
          )}
          {...rest}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}
