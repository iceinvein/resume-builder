import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { inputBase } from "./input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputBase, "min-h-[72px] resize-y", className)}
        {...rest}
      />
    );
  },
);
