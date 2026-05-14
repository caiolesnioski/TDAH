import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ icon: Icon, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <Icon className="h-10 w-10 text-gray-300 dark:text-gray-600" />
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{message}</p>
      {ctaLabel && onCta && (
        <Button variant="outline" size="sm" onClick={onCta} className="mt-1">
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
