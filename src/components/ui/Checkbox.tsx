'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  error?: boolean;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (typeof label === 'string' ? `cb-${label}` : undefined);

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex items-center gap-2 cursor-pointer select-none text-sm text-[var(--color-text-primary)]',
          props.disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <span className="relative inline-flex shrink-0">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-[var(--radius-sm)] border bg-[var(--color-bg-primary)] transition-[border-color,box-shadow,background-color] duration-[var(--duration-base)] ease-[var(--ease-out)] peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)] peer-checked:shadow-[var(--shadow-glow)] peer-focus-visible:shadow-[var(--shadow-glow)] peer-checked:[&>svg]:opacity-100 peer-checked:[&>svg]:animate-[ui-pop_var(--duration-base)_var(--ease-spring)_both]',
              error
                ? 'border-[var(--color-danger)] peer-checked:border-[var(--color-accent)]'
                : 'border-[var(--color-border)]'
            )}
          >
            <svg
              className="h-3 w-3 text-[var(--color-bg-primary)] opacity-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
