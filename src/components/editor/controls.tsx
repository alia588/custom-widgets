'use client';

import { ReactNode } from 'react';
import {
  Card as KitCard,
  Input as KitInput,
  Label as KitLabel,
  Select as KitSelect,
  Switch as KitSwitch,
} from '@/components/ui';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Light editor UI primitives for the widget editor — re-implemented over the
// agency-portal design kit. Every exported name + prop signature is kept
// identical to the pre-kit version so the *-tabs.tsx consumers compile
// unchanged. Kit imports are aliased (Kit*) to avoid name collisions with
// the exported primitives below.
// ---------------------------------------------------------------------------

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && (
        <p className="mb-3 text-xs text-[var(--color-text-secondary)]">{description}</p>
      )}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <KitCard padding="sm">{children}</KitCard>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <KitLabel>{label}</KitLabel>
      {children}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <KitSelect value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </KitSelect>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <KitInput
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <KitInput
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 last:mb-0">
      <div>
        <div className="text-sm font-medium text-[var(--color-text-primary)]">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{description}</div>
        )}
      </div>
      <KitSwitch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  label,
  unit = 'px',
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  label: string;
  unit?: string;
}) {
  const fillPct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
        {label}: {value}
        {unit}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="editor-slider w-full"
        style={{
          background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${fillPct}%, var(--color-border) ${fillPct}%, var(--color-border) 100%)`,
        }}
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-[var(--color-bg-primary)] px-3 py-2 transition-[border-color,box-shadow]',
          'duration-[var(--duration-base)] ease-[var(--ease-out)] focus-within:border-[var(--color-accent)] focus-within:shadow-[var(--shadow-glow)]'
        )}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded-full border-none bg-transparent p-0"
        />
        <span className="font-mono text-sm text-[var(--color-text-primary)] uppercase">{value}</span>
      </div>
    </div>
  );
}
