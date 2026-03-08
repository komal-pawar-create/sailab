import React from 'react';
import { Share2, Linkedin, Twitter, Facebook, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SocialShareProps {
  url: string;
  title: string;
}

const SocialShare = ({ url, title }: SocialShareProps) => {
  const [copied, setCopied] = React.useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const links = [
    { icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, label: 'Share on X', color: 'hover:text-foreground' },
    { icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, label: 'Share on LinkedIn', color: 'hover:text-[#0077B5]' },
    { icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, label: 'Share on Facebook', color: 'hover:text-[#1877F2]' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Share2 className="h-3.5 w-3.5" />
        Share
      </span>
      {links.map(({ icon: Icon, href, label, color }) => (
        <Button
          key={label}
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground ${color} transition-colors`}
          asChild
          aria-label={label}
        >
          <a href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
        onClick={copyLink}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default SocialShare;
