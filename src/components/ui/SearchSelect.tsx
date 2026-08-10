'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  DropdownPanel,
  OptionRow,
  controlPad,
  filterOptions,
  sizeStyles,
  useCombobox,
  type ComboboxOption,
} from './select-shared';

export type { ComboboxOption } from './select-shared';

export interface SearchSelectProps {
  options: ComboboxOption[];
  /** Controlled selected value (an option `value`), or ''/undefined when empty. */
  value?: string;
  onChange: (value: string) => void;
  /** Trigger label shown when nothing is selected. */
  placeholder?: string;
  /** Placeholder inside the combobox input while filtering. */
  searchPlaceholder?: string;
  /** Message shown when the filter matches nothing. */
  emptyMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  /** Rendered with aria-describedby wired to `{id}-error`. */
  errorMessage?: string;
  /** Show an X button that resets the selection to ''. */
  clearable?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  /** Form name — renders a hidden input carrying the selected value. */
  name?: string;
  required?: boolean;
  className?: string;
}

/**
 * Searchable single-select built on the APG editable-combobox pattern:
 * the visible field IS the combobox (role="combobox", aria-expanded,
 * aria-controls, aria-activedescendant). Closed it displays the selected
 * label; open/focused it filters via internal query state.
 */
export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results',
  size = 'md',
  error = false,
  errorMessage,
  clearable = false,
  disabled = false,
  fullWidth = true,
  id,
  name,
  required = false,
  className,
}: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = React.useId();
  const inputId = id ?? `${generatedId}-input`;
  const errorId = id ? `${id}-error` : `${generatedId}-error`;

  const selected = options.find((o) => o.value === value);
  const visibleOptions = useMemo(() => filterOptions(options, query), [options, query]);

  const {
    isOpen,
    open,
    close,
    activeIndex,
    activeOptionId,
    listboxId,
    containerRef,
    handleKeyDown,
  } = useCombobox({
    options: visibleOptions,
    selectedValue: value,
    closeOnSelect: true,
    onSelect: (option) => {
      onChange(option.value);
      setQuery('');
    },
    onClose: () => setQuery(''),
  });

  const handleOptionSelect = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setQuery('');
    close();
  };

  /* Closed → selected label; open with a typed filter → the query. */
  const displayValue = isOpen && query !== '' ? query : (selected?.label ?? '');

  const stateStyles = error
    ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[var(--shadow-glow-danger)] focus:ring-0'
    : 'border-[var(--color-border)] focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] focus:ring-0';

  return (
    <div ref={containerRef} className={cn(fullWidth ? 'w-full' : 'inline-block', className)}>
      <div className="relative">
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
          value={displayValue}
          placeholder={isOpen ? searchPlaceholder : placeholder}
          disabled={disabled}
          onFocus={() => {
            if (!isOpen) open();
            // Select the label so the first keystroke starts a fresh filter.
            inputRef.current?.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) open();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'ui-control w-full border rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-[border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed caret-[var(--color-accent)]',
            sizeStyles[size],
            stateStyles
          )}
          style={{ padding: controlPad(size, { iconRight: true }) }}
        />

        {/* Chevron — decorative, rotates while open */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5"
        >
          <ChevronDown
            className={cn(
              'text-[var(--color-text-secondary)] transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)]',
              isOpen && 'rotate-180',
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
            )}
          />
        </div>

        {/* Clearable X — absolutely-positioned sibling of the combobox input */}
        {clearable && value && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => {
              onChange('');
              setQuery('');
              inputRef.current?.focus();
            }}
            className={cn(
              'ui-control ui-focus-ring pointer-events-auto absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-0.5 text-[var(--color-text-muted)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
              size === 'sm' ? 'right-6' : 'right-7'
            )}
          >
            <X aria-hidden className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
          </button>
        )}

        <DropdownPanel isOpen={isOpen} listboxId={listboxId}>
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
                selected={option.value === value}
                onSelect={() => handleOptionSelect(option)}
              />
            ))
          )}
        </DropdownPanel>
      </div>

      {name && <input type="hidden" name={name} value={value ?? ''} />}
      {error && errorMessage && (
        <p id={errorId} className="mt-1.5 text-xs text-[var(--color-danger)]">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
