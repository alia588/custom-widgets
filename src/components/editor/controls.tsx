'use client';

import { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Dark editor UI primitives matching the DesignDetail editor screenshots.
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
      <h3 className="mb-1 text-sm font-semibold text-neutral-200">{title}</h3>
      {description && <p className="mb-3 text-xs text-neutral-500">{description}</p>}
      <div className={description ? '' : 'mt-3'}>{children}</div>
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl bg-neutral-900 p-4 ring-1 ring-neutral-800">
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-xs font-medium text-neutral-400">{label}</label>
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg bg-neutral-800 px-3 py-2.5 pr-8 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-neutral-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-neutral-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
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
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 placeholder:text-neutral-600 focus:ring-2 focus:ring-neutral-500"
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
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100 outline-none ring-1 ring-neutral-700 focus:ring-2 focus:ring-neutral-500"
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
        <div className="text-sm font-medium text-neutral-200">{label}</div>
        {description && <div className="mt-0.5 text-xs text-neutral-500">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
          checked ? 'bg-white' : 'bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-neutral-900 shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
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
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1.5 text-xs font-medium text-neutral-400">
        {label}: {value}
        {unit}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
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
      <label className="mb-1.5 block text-xs font-medium text-neutral-400">{label}</label>
      <div className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 ring-1 ring-neutral-700">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded-full border-none bg-transparent p-0"
        />
        <span className="font-mono text-sm text-neutral-200 uppercase">{value}</span>
      </div>
    </div>
  );
}
