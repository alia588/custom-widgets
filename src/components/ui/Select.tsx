'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      error = false,
      errorMessage,
      fullWidth = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<SelectSize, string> = {
      sm: 'h-8 text-xs',
      md: 'h-10 text-sm',
      lg: 'h-11 text-base',
    };

    const baseStyles =
      'ui-control w-full border rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-[border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer caret-[var(--color-accent)]';

    const stateStyles = error
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[var(--shadow-glow-danger)] focus:ring-0'
      : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] focus:ring-0';

    const pad =
      size === 'sm' ? '0 32px 0 10px' : size === 'lg' ? '0 36px 0 16px' : '0 36px 0 14px';

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block', 'group relative')}>
        <select
          ref={ref}
          className={cn(baseStyles, sizeStyles[size], stateStyles, className)}
          style={{ padding: pad }}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
          <svg
            className={cn(
              'text-[var(--color-text-secondary)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-focus-within:rotate-180',
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
