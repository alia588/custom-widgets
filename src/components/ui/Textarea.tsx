'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: TextareaSize;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  resize?: TextareaResize;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      error = false,
      errorMessage,
      fullWidth = true,
      resize = 'vertical',
      className,
      ...props
    },
    ref
  ) => {
    const sizeStyles: Record<TextareaSize, string> = {
      sm: 'text-xs min-h-[60px]',
      md: 'text-sm min-h-[100px]',
      lg: 'text-base min-h-[120px]',
    };

    const resizeStyles: Record<TextareaResize, string> = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const baseStyles =
      'ui-control w-full border rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-[border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed caret-[var(--color-accent)]';

    const stateStyles = error
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[var(--shadow-glow-danger)] focus:ring-0'
      : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] focus:ring-0';

    const pad =
      size === 'sm' ? '8px 10px' : size === 'lg' ? '12px 16px' : '10px 14px';

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block')}>
        <textarea
          ref={ref}
          className={cn(
            baseStyles,
            sizeStyles[size],
            resizeStyles[resize],
            stateStyles,
            className
          )}
          style={{ padding: pad }}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
