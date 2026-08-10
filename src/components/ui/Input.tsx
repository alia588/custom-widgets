'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { controlPad, sizeStyles, type InputSize } from './select-shared';

export type { InputSize } from './select-shared';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  /** Leading icon slot — absolute inside the field, pointer-events-none */
  iconLeft?: React.ReactNode;
  /** Trailing icon slot — absolute inside the field, pointer-events-none (wrap in a button to make it interactive) */
  iconRight?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      errorMessage,
      fullWidth = true,
      iconLeft,
      iconRight,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'ui-control w-full border rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-[border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed caret-[var(--color-accent)]';

    const stateStyles = error
      ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[var(--shadow-glow-danger)] focus:ring-0'
      : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] focus:ring-0';

    const pad = controlPad(size, { iconLeft: !!iconLeft, iconRight: !!iconRight });

    const input = (
      <input
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], stateStyles, className)}
        style={{ padding: pad }}
        {...props}
      />
    );

    return (
      <div className={cn(fullWidth ? 'w-full' : 'inline-block')}>
        {iconLeft || iconRight ? (
          <div className="relative">
            {iconLeft && (
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                {iconLeft}
              </span>
            )}
            {input}
            {iconRight && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                {iconRight}
              </span>
            )}
          </div>
        ) : (
          input
        )}
        {error && errorMessage && (
          <p className="mt-1.5 text-xs text-[var(--color-danger)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
