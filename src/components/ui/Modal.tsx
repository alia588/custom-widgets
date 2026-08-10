'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Button from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showClose?: boolean;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const EASE_OUT: Transition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  showClose = true,
}: ModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const transition: Transition = shouldReduceMotion ? { duration: 0 } : EASE_OUT;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'modal-content relative w-full bg-[var(--color-bg-primary)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] border border-[var(--color-border)] max-h-[90vh] flex flex-col',
              sizeStyles[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={transition}
          >
            {(title || showClose) && (
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[var(--color-border-light)]">
                <div className="min-w-0">
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)] truncate">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
                  )}
                </div>
                {showClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    aria-label="Close"
                    className="!px-2 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border-light)]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
