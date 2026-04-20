import { Collapsible as BaseCollapsible } from "@base-ui-components/react/collapsible";
import { cn } from "../lib/cn";
import type { ComponentPropsWithoutRef } from "react";

export const Collapsible = BaseCollapsible.Root;
export const CollapsibleTrigger = BaseCollapsible.Trigger;

type CollapsiblePanelProps = ComponentPropsWithoutRef<typeof BaseCollapsible.Panel>;

export function CollapsiblePanel({ className, ...rest }: CollapsiblePanelProps) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "data-[closed]:hidden",
        className,
      )}
      {...rest}
    />
  );
}
