import { Users, TestTube, FileText, Receipt, DollarSign, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsRowProps {
  stats: {
    patients: number;
    tests: number;
    documents: number;
    bills: number;
    revenue: number;
    pending: number;
  };
}

export function StatsRow({ stats }: StatsRowProps) {
  const statItems = [
    { label: "Total Patients", value: stats.patients, icon: Users, color: "text-blue-500" },
    { label: "Test Reports", value: stats.tests, icon: TestTube, color: "text-green-500" },
    { label: "Documents", value: stats.documents, icon: FileText, color: "text-purple-500" },
    { label: "Total Bills", value: stats.bills, icon: Receipt, color: "text-orange-500" },
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
    { label: "Pending Amount", value: `₹${stats.pending.toLocaleString()}`, icon: CreditCard, color: "text-destructive", highlight: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className={cn("transition-shadow hover:shadow-md", item.highlight && "border-destructive/50")}>
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
}
