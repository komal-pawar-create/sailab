import { useState, useEffect } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, RotateCcw } from "lucide-react";
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

  const handleLayoutChange = (newLayout: Layout[]) => {
    if (!isLocked) {
      setLayout(newLayout);
    }
  };

  const handleReset = () => {
    setLayout(defaultLayout);
    localStorage.removeItem(`${storageKey}_${role}`);
    toast({
      title: "Layout Reset",
      description: "Dashboard layout has been reset to default",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLocked(!isLocked)}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Unlock Layout
            </>
          ) : (
            <>
              <Unlock className="h-4 w-4 mr-2" />
              Lock Layout
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Layout
        </Button>
      </div>

      {!isLocked && (
        <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-3 rounded-lg text-sm border border-blue-500/20">
          Drag and resize widgets to customize your dashboard. Click "Lock Layout" when done.
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
