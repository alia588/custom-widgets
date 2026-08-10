'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Status dot rendered before children (uses currentColor) */
  dot?: boolean;
  /** Soft pulsing dot — status feel. Only meaningful together with `dot` */
  pulse?: boolean;
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]',
    accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]',
    success: 'bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]',
    warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
    muted: 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]',
    outline:
      'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)]',
  };

  return (
    <span
      className={cn(
        'ui-control ui-badge',
        size === 'sm' && 'ui-badge-sm',
        dot && 'gap-1.5',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current shrink-0',
            pulse && 'animate-[ui-pulse-soft_2s_ease-in-out_infinite]'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
