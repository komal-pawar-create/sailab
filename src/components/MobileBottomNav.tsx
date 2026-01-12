import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Users, Plus, Menu, Receipt, TestTube, UserPlus, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface QuickActionItem {
  label: string;
  icon: React.ElementType;
  action: string;
}

interface MobileBottomNavProps {
  onQuickAction?: (action: string) => void;
}

export function MobileBottomNav({ onQuickAction }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const { setOpenMobile } = useSidebar();

  if (!isMobile) return null;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "reports", label: "Reports", icon: FileText, path: "/reports" },
    { id: "add", label: "Add", icon: Plus, isAction: true },
    { id: "patients", label: "History", icon: Users, path: "/patient" },
    { id: "menu", label: "More", icon: Menu, isMenu: true },
  ];

  const quickActions: QuickActionItem[] = [
    { label: "New Patient", icon: UserPlus, action: "add-patient" },
    { label: "New Bill", icon: Receipt, action: "add-bill" },
    { label: "New Test Report", icon: TestTube, action: "add-report" },
    { label: "Upload Document", icon: FileImage, action: "add-document" },
  ];

  const isActive = (path: string) => {
    if (path === "/patient") {
      return location.pathname.startsWith("/patient");
    }
    return location.pathname === path;
  };

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.isAction) {
      setQuickActionsOpen(true);
    } else if (item.isMenu) {
      setOpenMobile(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleQuickAction = (action: string) => {
    setQuickActionsOpen(false);
    onQuickAction?.(action);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-safe md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path ? isActive(item.path) : false;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-1 transition-colors touch-manipulation",
                  item.isAction && "relative",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.isAction ? (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6">
                    <Icon className="h-6 w-6" />
                  </div>
                ) : (
                  <>
                    <Icon className={cn("h-5 w-5", active && "text-primary")} />
                    <span className="text-[10px] font-medium truncate max-w-full">
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Quick Actions Drawer */}
      <Drawer open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
        <DrawerContent className="pb-safe">
          <DrawerHeader>
            <DrawerTitle>Quick Actions</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.action}
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
