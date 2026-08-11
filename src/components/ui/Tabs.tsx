'use client';

import React, { createContext, useContext, useId, useState } from 'react';
import { motion, useReducedMotion, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  indicatorId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const setValue = (v: string) => {
    setInternal(v);
    onValueChange?.(v);
  };

  // Unique per-instance so multiple Tabs never share a framer-motion layoutId
  const indicatorId = useId();

  return (
    <TabsContext.Provider value={{ value: current, setValue, indicatorId }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="tablist" className={cn('ui-tabs-list', className)} {...props}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: current, setValue, indicatorId } = useTabs();
  const shouldReduceMotion = useReducedMotion();
  const active = current === value;

  const indicatorTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 400, damping: 32 };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-active={active ? 'true' : 'false'}
      data-motion-indicator="true"
      className={cn('ui-control ui-tabs-trigger relative isolate', className)}
      onClick={() => setValue(value)}
      {...props}
    >
      {active && (
        <motion.div
          layoutId={indicatorId}
          className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.04)]"
          transition={indicatorTransition}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: current } = useTabs();
  const shouldReduceMotion = useReducedMotion();

  if (current !== value) return null;
  return (
    <div role="tabpanel" className={cn('mt-5', className)} {...props}>
      <motion.div
        key={value}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}

export default Tabs;
