'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  /** Square control for a single icon — keeps height, equalizes width */
  iconOnly?: boolean;
  /** Leading icon slot (before children) */
  iconLeft?: React.ReactNode;
  /** Trailing icon slot (after children) — nudges right on hover */
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      iconOnly = false,
      iconLeft,
      iconRight,
      className,
      disabled,
      children,
      href,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--color-accent)] text-white border-transparent hover:bg-[var(--color-accent-hover)] ui-focus-ring shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_0_rgba(0,0,0,0.04)] hover:-translate-y-px hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_-6px_color-mix(in_srgb,var(--color-accent)_50%,transparent)] active:translate-y-0 active:scale-[0.97]',
      secondary:
        'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] ui-focus-ring',
      outline:
        'bg-white text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] ui-focus-ring',
      ghost:
        'bg-transparent text-[var(--color-text-primary)] border-transparent hover:bg-black/[0.04] ui-focus-ring',
      danger:
        'bg-[var(--color-danger)] text-white border-transparent hover:bg-[var(--color-danger-hover)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-glow-danger)]',
    };

    const sizeClass =
      size === 'sm' ? 'ui-btn-sm' : size === 'lg' ? 'ui-btn-lg' : 'ui-btn-md';

    const combinedClassName = cn(
      'ui-control ui-btn',
      sizeClass,
      iconOnly && 'ui-btn-icon',
      variantStyles[variant],
      'transition-[transform,box-shadow,background-color,border-color,color] duration-[var(--duration-base)] ease-[var(--ease-out)]',
      iconOnly &&
        'hover:scale-[1.04] active:scale-[0.95] transition-transform! duration-[var(--duration-fast)]! ease-[var(--ease-spring)]!',
      iconRight ? 'group' : '',
      'disabled:opacity-45 disabled:cursor-not-allowed',
      fullWidth && 'w-full',
      className
    );

    const content = isLoading ? (
      <>
        <svg
          className={cn(
            'animate-spin shrink-0 transition-opacity',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading...</span>
      </>
    ) : (
      <span className="inline-flex items-center gap-2">
        {iconLeft}
        {children}
        {iconRight && (
          <span className="transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:translate-x-0.5">
            {iconRight}
          </span>
        )}
      </span>
    );

    if (href && !isDisabled) {
      return (
        <Link href={href} className={combinedClassName}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClassName}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
