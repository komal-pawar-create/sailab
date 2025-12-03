import { useState, useEffect } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode[];
  defaultLayout: Layout[];
  storageKey: string;
  role: string;
}

export function DashboardLayout({ children, defaultLayout, storageKey, role }: DashboardLayoutProps) {
  const { toast } = useToast();
  const [layout, setLayout] = useState<Layout[]>(() => {
    const saved = localStorage.getItem(`${storageKey}_${role}`);
    return saved ? JSON.parse(saved) : defaultLayout;
  });
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_${role}`, JSON.stringify(layout));
  }, [layout, storageKey, role]);

  // Listen for custom events from sidebar/command palette
  useEffect(() => {
    const handleEditMode = () => {
      setIsLocked(false);
      toast({
        title: "Edit Mode",
        description: "Drag and resize widgets to customize your dashboard",
      });
    };

    const handleResetLayout = () => {
      setLayout(defaultLayout);
      localStorage.removeItem(`${storageKey}_${role}`);
      toast({
        title: "Layout Reset",
        description: "Dashboard layout has been reset to default",
      });
    };

    window.addEventListener('dashboard-edit-mode', handleEditMode);
    window.addEventListener('dashboard-reset-layout', handleResetLayout);

    return () => {
      window.removeEventListener('dashboard-edit-mode', handleEditMode);
      window.removeEventListener('dashboard-reset-layout', handleResetLayout);
    };
  }, [defaultLayout, storageKey, role, toast]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!isLocked) {
      setLayout(newLayout);
    }
  };

  const handleDoneEditing = () => {
    setIsLocked(true);
    toast({
      title: "Layout Saved",
      description: "Your dashboard layout has been saved",
    });
  };

  const handleCancelEditing = () => {
    const saved = localStorage.getItem(`${storageKey}_${role}`);
    if (saved) {
      setLayout(JSON.parse(saved));
    }
    setIsLocked(true);
  };

  return (
    <div className="space-y-4">
      {/* Edit mode indicator and controls */}
      {!isLocked && (
        <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm border border-primary/20 flex items-center justify-between">
          <span>Drag and resize widgets to customize your dashboard</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEditing}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDoneEditing}
            >
              <Check className="h-4 w-4 mr-1" />
              Done
            </Button>
          </div>
        </div>
      )}

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        isDraggable={!isLocked}
        isResizable={!isLocked}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
      >
        {children.map((child, index) => (
          <div key={layout[index].i} className={!isLocked ? "border-2 border-dashed border-primary/50 rounded-lg" : ""}>
            {!isLocked && (
              <div className="drag-handle cursor-move bg-primary/10 p-2 rounded-t-lg text-xs font-medium text-center">
                Drag to move
              </div>
            )}
            {child}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
