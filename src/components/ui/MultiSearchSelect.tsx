'use client';

import React, { useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from './Badge';
import {
  DropdownPanel,
  OptionRow,
  filterOptions,
  useCombobox,
  type ComboboxOption,
} from './select-shared';

export interface MultiSearchSelectProps {
  options: ComboboxOption[];
  /** Controlled selected values. */
  values: string[];
  onChange: (values: string[]) => void;
  /** Shown in the inline input while nothing is selected. */
  placeholder?: string;
  /** Shown in the inline input once chips exist. */
  searchPlaceholder?: string;
  /** Message shown when the filter matches nothing. */
  emptyMessage?: string;
  /** At max: unselected options are disabled and a "Max N selected" hint appears. */
  maxSelected?: number;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  /** Rendered with aria-describedby wired to `{id}-error`. */
  errorMessage?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  /** Form name — renders one hidden input per selected value. */
  name?: string;
  required?: boolean;
  className?: string;
}

/**
 * Searchable multi-select. The trigger is a styled div (chips and the
 * inline combobox input are interactive children, so a <button> would be
 * illegal); role="combobox" lives on the inline input. Backspace with an
 * empty query removes the last chip. Options show a checkbox-style square
 * indicator that pops in when selected.
 */
export default function MultiSearchSelect({
  options,
  values,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results',
  maxSelected,
  size = 'md',
  error = false,
  errorMessage,
  disabled = false,
  fullWidth = true,
  id,
  name,
  required = false,
  className,
}: MultiSearchSelectProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? `${generatedId}-input`;
  const errorId = id ? `${id}-error` : `${generatedId}-error`;

  const atMax = maxSelected !== undefined && values.length >= maxSelected;

  /* At max: lock unselected options so the list can't grow further. */
  const optionsWithMax = useMemo(() => {
    if (!atMax) return options;
    return options.map((option) =>
      values.includes(option.value) ? option : { ...option, disabled: true }
    );
  }, [options, atMax, values]);

  const visibleOptions = useMemo(
    () => filterOptions(optionsWithMax, query),
    [optionsWithMax, query]
  );

  const toggleValue = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange(
      values.includes(option.value)
        ? values.filter((v) => v !== option.value)
        : [...values, option.value]
    );
    setQuery('');
    inputRef.current?.focus();
  };

  const {
    isOpen,
    open,
    activeIndex,
    activeOptionId,
    listboxId,
    containerRef,
    handleKeyDown,
  } = useCombobox({
    options: visibleOptions,
    selectedValue: values[values.length - 1],
    closeOnSelect: false,
    onSelect: toggleValue,
    onClose: () => setQuery(''),
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    /* Backspace with an empty query removes the last chip. */
    if (e.key === 'Backspace' && query === '' && values.length > 0) {
      e.preventDefault();
      onChange(values.slice(0, -1));
      return;
    }
    handleKeyDown(e);
  };

  const removeValue = (valueToRemove: string) => {
    onChange(values.filter((v) => v !== valueToRemove));
  };

  return (
    <div ref={containerRef} className={cn(fullWidth ? 'w-full' : 'inline-block', className)}>
      <div className="relative">
        {/* Trigger — a styled div, never a button (interactive children). */}
        <div
          className={cn(
            'ui-control flex w-full flex-wrap items-center gap-1.5 border rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] transition-[border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)]',
            size === 'sm'
              ? 'min-h-8 px-2.5 py-1 text-xs'
              : size === 'lg'
                ? 'min-h-11 px-4 py-1.5 text-base'
                : 'min-h-10 px-3.5 py-1.5 text-sm',
            error
              ? 'border-[var(--color-danger)] focus-within:border-[var(--color-danger)] focus-within:shadow-[var(--shadow-glow-danger)]'
              : 'border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:shadow-[var(--shadow-glow)]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={(e) => {
            /* Clicking the field background focuses the inline input. */
            if (e.target === e.currentTarget) inputRef.current?.focus();
          }}
        >
          {values.map((v) => {
            const option = options.find((o) => o.value === v);
            const label = option?.label ?? v;
            return (
              <Badge key={v} size="sm" variant="muted" className="max-w-full">
                <span className="min-w-0 truncate">{label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  disabled={disabled}
                  onClick={() => removeValue(v)}
                  className="ui-control ui-focus-ring ml-0.5 -mr-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed"
                >
                  <X aria-hidden className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-invalid={error || undefined}
            aria-describedby={error && errorMessage ? errorId : undefined}
            aria-required={required || undefined}
            value={query}
            placeholder={values.length === 0 ? placeholder : searchPlaceholder}
            disabled={disabled}
            onFocus={() => {
              if (!isOpen) open();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) open();
            }}
            onKeyDown={handleInputKeyDown}
            className="min-w-[72px] flex-1 border-none bg-transparent p-0 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none focus:outline-none disabled:cursor-not-allowed caret-[var(--color-accent)]"
          />
        </div>

        <DropdownPanel
          isOpen={isOpen}
          listboxId={listboxId}
          multiselectable
          footer={
            atMax ? (
              <div className="mt-1 border-t border-[var(--color-border-light)] px-2.5 pb-1 pt-1.5 text-xs text-[var(--color-text-muted)]">
                Max {maxSelected} selected
              </div>
            ) : undefined
          }
        >
          {visibleOptions.length === 0 ? (
            <div className="px-2.5 py-2 text-sm text-[var(--color-text-muted)]">
              {emptyMessage}
            </div>
          ) : (
            visibleOptions.map((option, index) => (
              <OptionRow
                key={option.value}
                id={`${listboxId}-option-${index}`}
                option={option}
                active={index === activeIndex}
                selected={values.includes(option.value)}
                onSelect={() => toggleValue(option)}
                selection="checkbox"
              />
            ))
          )}
        </DropdownPanel>
      </div>

      {name &&
        values.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
      {error && errorMessage && (
        <p id={errorId} className="mt-1.5 text-xs text-[var(--color-danger)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
