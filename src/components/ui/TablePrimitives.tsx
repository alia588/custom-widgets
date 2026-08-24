'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface TablePrimitivesProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Classes applied to the scroll container that wraps the table. */
  containerClassName?: string;
}

export function TablePrimitive({
  className,
  containerClassName,
  children,
  ...props
}: TablePrimitivesProps) {
  return (
    <div
      className={cn(
        'table-scroll-container w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]',
        containerClassName
      )}
    >
      <table
        className={cn('w-full border-collapse text-sm text-left', className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function Tbody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('bg-[var(--color-bg-primary)]', className)} {...props}>
      {children}
    </tbody>
  );
}

export function Tr({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-[var(--color-border-light)] last:border-0 hover:bg-[var(--color-bg-hover)]/60 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)] whitespace-nowrap',
        className
      )}
      style={{ padding: '12px 16px' }}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('text-sm text-[var(--color-text-primary)] align-middle', className)}
      style={{ padding: '14px 16px' }}
      {...props}
    >
      {children}
    </td>
  );
}

export default TablePrimitive;
