import * as React from "react"
import { cn } from "@/lib/utils"

interface CapitalizedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  capitalize?: boolean;
}

const CapitalizedTextarea = React.forwardRef<HTMLTextAreaElement, CapitalizedTextareaProps>(
  ({ className, onChange, capitalize = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (capitalize) {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          capitalize && "uppercase",
          className
        )}
        ref={ref}
        onChange={handleChange}
        required
        {...props}
      />
    );
  }
);
CapitalizedTextarea.displayName = "CapitalizedTextarea";

export { CapitalizedTextarea };