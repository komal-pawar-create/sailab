import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { X, Lightbulb } from 'lucide-react';
import { useFeatureTooltip } from '@/hooks/useFeatureTooltip';
import { cn } from '@/lib/utils';

interface FeatureTooltipProps {
  featureKey: string;
  title: string;
  description: string;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const FeatureTooltip = ({
  featureKey,
  title,
  description,
  children,
  side = 'bottom',
  align = 'center',
}: FeatureTooltipProps) => {
  const { showTooltip, dismissTooltip, markAsSeen } = useFeatureTooltip(featureKey);

  // Mark as seen when user interacts with the wrapped element
  const handleInteraction = () => {
    markAsSeen();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild onClick={handleInteraction}>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "max-w-[280px] p-0 overflow-hidden",
            "bg-primary text-primary-foreground border-primary",
            "animate-in fade-in-0 zoom-in-95"
          )}
          sideOffset={8}
        >
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-primary-foreground/80" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{title}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissTooltip();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-primary-foreground/80 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/70 text-center border-t border-primary-foreground/10">
            Click to dismiss • Won't show again
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
