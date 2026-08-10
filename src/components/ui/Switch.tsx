'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
}

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  className,
  disabled,
  id,
  ...props
}: SwitchProps) {
  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          'ui-control relative inline-flex h-[28px] w-[46px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-[background-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          checked
            ? 'bg-[var(--color-accent)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-accent)_45%,transparent)]'
            : 'bg-[#d1d1d6]'
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-[24px] w-[24px] transform rounded-full bg-white transition-transform duration-[var(--duration-base)] ease-[var(--ease-spring)]',
            checked
              ? 'translate-x-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_1px_rgba(0,0,0,0.06),0_0_8px_rgba(0,0,0,0.15)]'
              : 'translate-x-0 shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_1px_rgba(0,0,0,0.06)]'
          )}
        />
      </button>
      {label && (
        <label
          htmlFor={id}
          className="text-sm text-[var(--color-text-primary)] cursor-pointer select-none"
          onClick={() => !disabled && onCheckedChange?.(!checked)}
        >
          {label}
        </label>
      )}
    </div>
  );
}

export default Switch;
