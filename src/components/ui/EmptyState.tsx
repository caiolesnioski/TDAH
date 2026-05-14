import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-10 px-6 text-center', className)}>
      <div className="w-12 h-12 text-text-muted flex items-center justify-center [&_svg]:w-12 [&_svg]:h-12">
        {icon}
      </div>
      <p className="font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      )}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
