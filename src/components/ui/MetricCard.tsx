'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type MetricCardTone = 'default' | 'accent';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  /** Quiet supporting line under the value */
  hint?: React.ReactNode;
  /** Optional trailing glyph (keep muted — color is meaning, not decoration) */
  icon?: React.ReactNode;
  tone?: MetricCardTone;
}

/**
 * Overview KPI tile. One job: label + number + optional hint.
 * Prefer a 2–4 column grid of defaults; use tone="accent" sparingly for a single hero metric.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  className,
  ...props
}: MetricCardProps) {
  const accent = tone === 'accent';

  return (
    <div
      className={cn(
        'rounded-2xl border transition-shadow',
        accent
          ? 'border-transparent bg-[var(--color-accent)] text-white shadow-[var(--shadow-md)]'
          : 'border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
        className
      )}
      style={{ padding: accent ? '22px 24px' : '20px 22px' }}
      {...props}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              'text-[13px] font-medium tracking-[-0.01em]',
              accent ? 'text-white/85' : 'text-[var(--color-text-secondary)]'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-1.5 font-semibold tracking-[-0.03em] tabular-nums',
              accent ? 'text-[32px] leading-none text-white' : 'text-[28px] leading-none text-[var(--color-text-primary)]'
            )}
          >
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              'shrink-0 flex items-center justify-center rounded-lg',
              accent
                ? 'bg-white/15 text-white'
                : 'bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]'
            )}
            style={{ padding: 8 }}
            aria-hidden
          >
            {icon}
          </div>
        )}
      </div>
      {hint != null && hint !== false && (
        <div
          className={cn(
            'mt-4 text-[13px] leading-snug',
              accent ? 'text-white/80' : 'text-[var(--color-text-muted)]'
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
