import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const base =
  "inline-flex items-center justify-center gap-2xs rounded-sm border border-transparent " +
  "font-medium leading-none transition-colors transition-shadow " +
  "focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] " +
  "disabled:cursor-not-allowed disabled:text-text-disabled";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent border-accent font-semibold " +
    "hover:not-disabled:bg-accent-hover hover:not-disabled:border-accent-hover " +
    "active:not-disabled:bg-accent-active active:not-disabled:border-accent-active " +
    "disabled:bg-surface-muted disabled:text-text-disabled disabled:border-border",
  secondary:
    "bg-surface-raised text-text border-border " +
    "hover:not-disabled:bg-surface-muted hover:not-disabled:border-border-strong " +
    "active:not-disabled:bg-surface",
  ghost:
    "bg-transparent text-text-secondary border-transparent " +
    "hover:not-disabled:bg-surface-muted hover:not-disabled:text-text " +
    "active:not-disabled:bg-surface",
  danger:
    "bg-transparent text-danger-soft-text border-border " +
    "hover:not-disabled:bg-danger-soft hover:not-disabled:border-danger",
};

const sizes: Record<Size, string> = {
  md: "px-md py-xs text-sm",
  sm: "px-sm py-2xs text-xs",
  icon: "p-0 w-7 h-7",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    />
  );
});
