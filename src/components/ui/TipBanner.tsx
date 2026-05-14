import * as React from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipBannerProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning';
  className?: string;
}

const variantStyles = {
  info:     { border: 'border-primary',  icon: 'text-primary'  },
  success:  { border: 'border-success',  icon: 'text-success'  },
  warning:  { border: 'border-warning',  icon: 'text-warning'  },
} satisfies Record<string, { border: string; icon: string }>;

export function TipBanner({ children, variant = 'info', className }: TipBannerProps) {
  const styles = variantStyles[variant];
  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-surface border-l-4 rounded-lg p-4',
        styles.border,
        className,
      )}
    >
      <Lightbulb className={cn('w-5 h-5 mt-0.5 shrink-0', styles.icon)} />
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}
