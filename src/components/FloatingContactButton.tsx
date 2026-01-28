import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingContactButtonProps {
  onClick: () => void;
}

const FloatingContactButton = ({ onClick }: FloatingContactButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 100px
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            size="lg"
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in"
            aria-label="Contact Us"
          >
            <MessageCircle className="h-6 w-6" />
            {/* Pulse ring animation */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Contact Us</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FloatingContactButton;
