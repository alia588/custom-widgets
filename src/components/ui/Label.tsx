'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, error = false, className, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block mb-1.5 text-sm font-medium',
          error ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-primary)]',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;
