import React, { memo } from "react";
import { Users, TestTube, FileText, Receipt, FileImage, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatsRowProps {
  stats: {
    patients: number;
    tests: number;
    documents: number;
    bills: number;
    jpegImages: number;
    pending: number;
  };
}

export const StatsRow = memo(function StatsRow({ stats }: StatsRowProps) {
  const navigate = useNavigate();

  const statItems = [
    { label: "Total Patients", value: stats.patients, icon: Users, color: "text-blue-500" },
    { label: "Test Reports", value: stats.tests, icon: TestTube, color: "text-green-500" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-purple-500" },
    { label: "Total Bills", value: stats.bills, icon: Receipt, color: "text-orange-500" },
    { label: "Total JPG Images", value: stats.jpegImages, icon: FileImage, color: "text-emerald-500" },
    { label: "Pending Amount", value: `₹${stats.pending.toLocaleString()}`, icon: CreditCard, color: "text-destructive", highlight: true, clickable: true },
  ];

  const handleCardClick = (item: typeof statItems[0]) => {
    if (item.clickable && item.label === "Pending Amount") {
      navigate('/outstanding-report');
    }
  };

  return (
    <div data-tour="stats-row" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <Card 
          key={item.label} 
          className={cn(
            "transition-shadow hover:shadow-md", 
            item.highlight && "border-destructive/50",
            item.clickable && "cursor-pointer hover:scale-[1.02] transition-transform"
          )}
          onClick={() => handleCardClick(item)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-muted", item.color)}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className={cn("text-lg font-bold truncate", item.highlight && "text-destructive")}>
                  {item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
