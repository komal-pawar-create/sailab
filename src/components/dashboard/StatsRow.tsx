import React, { memo } from "react";
import { Users, TestTube, FileText, Receipt, FileImage, CreditCard, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface StatsRowProps {
  stats: {
    patients: number;
    tests: number;
    documents: number;
    bills: number;
    jpegImages: number;
    pending: number;
    pendingCommissions?: number;
  };
}

export const StatsRow = memo(function StatsRow({ stats }: StatsRowProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const statItems = [
    { label: "Patients", fullLabel: "Total Patients", value: stats.patients, icon: Users, color: "text-blue-500" },
    { label: "Reports", fullLabel: "Test Reports", value: stats.tests, icon: TestTube, color: "text-green-500" },
    { label: "Documents", fullLabel: "Documents", value: stats.documents, icon: FileText, color: "text-purple-500" },
    { label: "Bills", fullLabel: "Total Bills", value: stats.bills, icon: Receipt, color: "text-orange-500" },
    { label: "Images", fullLabel: "Total JPG Images", value: stats.jpegImages, icon: FileImage, color: "text-emerald-500" },
    { label: "Pending", fullLabel: "Pending Amount", value: `₹${stats.pending.toLocaleString()}`, icon: CreditCard, color: "text-destructive", highlight: true, clickable: true, route: '/outstanding-report' },
    { label: "Dr. Comm", fullLabel: "Pending Commissions", value: `₹${(stats.pendingCommissions || 0).toLocaleString()}`, icon: Stethoscope, color: "text-amber-500", highlight: (stats.pendingCommissions || 0) > 0, clickable: true, route: '/reports' },
  ];

  const handleCardClick = (item: typeof statItems[0]) => {
    if (item.clickable && item.route) {
      navigate(item.route);
    }
  };

  const StatCard = ({ item }: { item: typeof statItems[0] }) => (
    <Card 
      className={cn(
        "transition-shadow hover:shadow-md shrink-0", 
        item.highlight && "border-destructive/50",
        item.clickable && "cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]",
        isMobile && "min-w-[140px]"
      )}
      onClick={() => handleCardClick(item)}
    >
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-muted", item.color, isMobile && "p-1.5")}>
            <item.icon className={cn("h-4 w-4", isMobile && "h-3.5 w-3.5")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">
              {isMobile ? item.label : item.fullLabel}
            </p>
            <p className={cn(
              "font-bold truncate", 
              isMobile ? "text-base" : "text-lg",
              item.highlight && "text-destructive"
            )}>
              {item.value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Mobile: Horizontal scrollable stats
  if (isMobile) {
    return (
      <div data-tour="stats-row" className="-mx-4 px-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">
            {statItems.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1.5" />
        </ScrollArea>
      </div>
    );
  }

  // Desktop: Grid layout
  return (
    <div data-tour="stats-row" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {statItems.map((item) => (
        <StatCard key={item.label} item={item} />
      ))}
    </div>
  );
});
