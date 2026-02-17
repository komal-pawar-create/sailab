import React from 'react';

interface TocItem {
  id: string;
  label: string;
}

const TableOfContents = ({ items }: { items: TocItem[] }) => {
  return (
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
  );
};

export default TableOfContents;
