import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardWidgetProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function DashboardWidget({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className,
  headerAction 
}: DashboardWidgetProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
    </Card>
  );
}
