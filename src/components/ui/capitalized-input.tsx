import * as React from "react"
import { cn } from "@/lib/utils"

interface CapitalizedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  capitalize?: boolean;
}

const CapitalizedInput = React.forwardRef<HTMLInputElement, CapitalizedInputProps>(
  ({ className, type, onChange, capitalize = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (capitalize && type !== "email" && type !== "password" && type !== "number") {
        e.target.value = e.target.value.toUpperCase();
      }
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          capitalize && type !== "email" && type !== "password" && type !== "number" && "uppercase",
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
CapitalizedInput.displayName = "CapitalizedInput";

export { CapitalizedInput };