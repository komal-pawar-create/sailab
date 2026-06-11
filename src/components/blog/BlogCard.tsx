import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/lib/blogData';

const BlogCard = ({ slug, title, excerpt, category, readTime, datePublished }: BlogPost) => {
  return (
    <article className="group rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:border-primary/30 flex flex-col h-full">
      <Link to={`/blog/${slug}`} className="flex flex-col h-full p-6">
        <div className="flex items-center gap-3 mb-3">
          <Badge variant="secondary" className="text-xs">{category}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {readTime}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">{excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <time className="text-xs text-muted-foreground" dateTime={datePublished}>
            {new Date(datePublished).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
          </time>
          <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all" aria-label={`Read more about ${title}`}>
            Read article <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
