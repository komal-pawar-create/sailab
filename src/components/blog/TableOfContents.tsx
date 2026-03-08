import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  label: string;
}

const TableOfContents = ({ items }: { items: TocItem[] }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile collapsible TOC */}
      <nav className="lg:hidden mb-6 rounded-xl border border-border bg-card" aria-label="Table of contents">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold text-foreground uppercase tracking-wider min-h-[48px]"
          aria-expanded={mobileOpen}
        >
          Contents
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
        </button>
        {mobileOpen && (
          <ul className="px-4 pb-4 space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors block py-2 min-h-[44px] flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Desktop sticky TOC */}
      <nav className="hidden lg:block sticky top-24 p-5 rounded-xl border border-border bg-card" aria-label="Table of contents">
        <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Contents</h4>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block py-1"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

export default TableOfContents;
