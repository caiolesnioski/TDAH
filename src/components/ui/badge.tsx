import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary/15 text-primary',
        primary:
          'bg-primary/15 text-primary',
        secondary:
          'bg-text-muted/15 text-text-secondary',
        muted:
          'bg-text-muted/15 text-text-muted',
        success:
          'bg-success/15 text-success',
        warning:
          'bg-warning/15 text-warning',
        danger:
          'bg-danger/15 text-danger',
        destructive:
          'bg-danger/15 text-danger',
        outline:
          'border border-border text-text-primary bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
