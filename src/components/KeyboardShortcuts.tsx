import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'P'], description: 'Go to Patient History', category: 'Navigation' },
  { keys: ['G', 'A'], description: 'Go to Analytics', category: 'Navigation' },
  { keys: ['Alt', '1'], description: 'Go to Patients', category: 'Data Tabs' },
  { keys: ['Alt', '2'], description: 'Go to Test Reports', category: 'Data Tabs' },
  { keys: ['Alt', '3'], description: 'Go to Documents', category: 'Data Tabs' },
  { keys: ['Alt', '4'], description: 'Go to Bills', category: 'Data Tabs' },
  { keys: ['Alt', '5'], description: 'Go to Feedback', category: 'Data Tabs' },
  { keys: ['Alt', '6'], description: 'Go to Ledger', category: 'Data Tabs' },
  { keys: ['Esc'], description: 'Close dialogs and menus', category: 'General' },
  { keys: ['⌘', 'B'], description: 'Toggle sidebar', category: 'General' },
];

const dataTabRoutes: Record<string, string> = {
  '1': '/dashboard?tab=patients',
  '2': '/dashboard?tab=reports',
  '3': '/dashboard?tab=documents',
  '4': '/dashboard?tab=bills',
  '5': '/dashboard?tab=feedback',
  '6': '/dashboard?tab=ledger',
};

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Alt + number for data tabs (works even when typing)
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const route = dataTabRoutes[e.key];
        if (route) {
          e.preventDefault();
          navigate(route);
          return;
        }
      }

      // Don't trigger other shortcuts if typing in an input
      if (isTyping) return;

      // Show shortcuts dialog with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }

      // Close dialog with Esc
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [navigate]);

  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="font-mono text-xs px-2 py-0.5"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              {category !== categories[categories.length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4">
          Press <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">Esc</Badge> to close
        </div>
      </DialogContent>
    </Dialog>
  );
}
