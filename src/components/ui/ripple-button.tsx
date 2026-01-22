import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

const rippleButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof rippleButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
}

interface RippleStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ className, variant, size, asChild = false, loading, success, children, onClick, disabled, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<RippleStyle[]>([]);
    const [showSuccess, setShowSuccess] = React.useState(false);

    // Handle success state
    React.useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [success]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const newRipple: RippleStyle = {
        left: x,
        top: y,
        width: size,
        height: size,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 600);

      onClick?.(e);
    };

    if (asChild) {
      return (
        <Slot
          className={cn(rippleButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(
          rippleButtonVariants({ variant, size, className }),
          "active:scale-[0.98] transition-transform"
        )}
        ref={ref}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple, index) => (
          <span
            key={index}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.left,
              top: ripple.top,
              width: ripple.width,
              height: ripple.height,
            }}
          />
        ))}

        {/* Content with loading/success states */}
        <span className={cn(
          "flex items-center gap-2 transition-all duration-200",
          (loading || showSuccess) && "opacity-0"
        )}>
          {children}
        </span>

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}

        {/* Success checkmark */}
        {showSuccess && !loading && (
          <span className="absolute inset-0 flex items-center justify-center animate-success-pop">
            <Check className="h-5 w-5" />
          </span>
        )}
      </button>
    );
  }
);

RippleButton.displayName = "RippleButton";

export { RippleButton, rippleButtonVariants };
