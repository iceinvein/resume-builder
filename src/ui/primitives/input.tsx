import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const inputBase =
  "w-full bg-surface-raised text-text border border-border rounded-sm " +
  "px-sm py-xs text-sm leading-none transition-colors transition-shadow " +
  "placeholder:text-text-tertiary " +
  "hover:border-border-strong " +
  "focus-visible:outline-none focus-visible:border-accent " +
  "focus-visible:shadow-[0_0_0_3px_var(--focus-ring-color)] " +
  "disabled:bg-surface disabled:text-text-disabled";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type ?? "text"}
        className={cn(inputBase, className)}
        {...rest}
      />
    );
  },
);

export { inputBase };
