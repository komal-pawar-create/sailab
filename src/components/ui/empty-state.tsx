import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { 
  Users, FileText, TestTube, Calendar, CreditCard,
  MessageSquare, FolderOpen, Bell, Search, Plus
} from 'lucide-react';

type EmptyStateType = 
  | 'patients' 
  | 'bills' 
  | 'reports' 
  | 'documents' 
  | 'followups' 
  | 'feedback'
  | 'search'
  | 'notifications'
  | 'default';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
}> = {
  patients: {
    icon: Users,
    title: 'No patients yet',
    description: 'Start by adding your first patient to begin tracking their health journey.',
    actionLabel: 'Add First Patient',
  },
  bills: {
    icon: CreditCard,
    title: 'No bills found',
    description: 'Create bills to manage payments and track revenue for your lab.',
    actionLabel: 'Create Bill',
  },
  reports: {
    icon: TestTube,
    title: 'No test reports',
    description: 'Upload or create test reports to share results with patients.',
    actionLabel: 'Add Report',
  },
  documents: {
    icon: FolderOpen,
    title: 'No documents uploaded',
    description: 'Upload prescriptions, reports, or other medical documents.',
    actionLabel: 'Upload Document',
  },
  followups: {
    icon: Calendar,
    title: 'No follow-ups scheduled',
    description: 'Schedule follow-ups to stay connected with your patients.',
    actionLabel: 'Schedule Follow-up',
  },
  feedback: {
    icon: MessageSquare,
    title: 'No feedback received',
    description: 'Patient feedback will appear here once they share their experience.',
    actionLabel: 'Request Feedback',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
    actionLabel: 'Clear Search',
  },
  notifications: {
    icon: Bell,
    title: 'All caught up!',
    description: 'You have no new notifications at the moment.',
    actionLabel: 'View History',
  },
  default: {
    icon: FileText,
    title: 'Nothing here yet',
    description: 'This section is empty. Start adding content to see it here.',
    actionLabel: 'Get Started',
  },
};

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {/* Animated illustration container */}
      <div className="relative mb-6">
        {/* Background circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/5 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse delay-100" />
        </div>
        
        {/* Main icon */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
          <Icon className="w-8 h-8 text-primary" />
        </div>

        {/* Floating plus icon */}
        <div className="absolute -right-2 -top-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md animate-bounce-subtle">
          <Plus className="w-4 h-4" />
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {title || config.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description || config.description}
      </p>

      {/* Action button */}
      {onAction && (
        <Button onClick={onAction} className="gap-2">
          <Plus className="w-4 h-4" />
          {actionLabel || config.actionLabel}
        </Button>
      )}
    </div>
  );
}
