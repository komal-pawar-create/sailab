import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Beaker } from 'lucide-react';

interface AuthorCardProps {
  author: string;
  datePublished: string;
  readTime: string;
}

const AuthorCard = ({ author, datePublished, readTime }: AuthorCardProps) => {
  const formattedDate = new Date(datePublished).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 border border-primary/20">
        <AvatarFallback className="bg-primary/10 text-primary">
          <Beaker className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{author}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={datePublished}>{formattedDate}</time>
          <span>•</span>
          <span>{readTime}</span>
        </div>
      </div>
    </div>
  );
};

export default AuthorCard;
