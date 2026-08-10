'use client';

import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import Button from './Button';

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog() {
  const [dialog, setDialog] = useState<ConfirmDialogData | null>(null);

  useEffect(() => {
    const handleConfirm = (event: CustomEvent<ConfirmDialogData>) => {
      setDialog(event.detail);
    };

    window.addEventListener('show-confirm' as any, handleConfirm as EventListener);
    return () => {
      window.removeEventListener('show-confirm' as any, handleConfirm as EventListener);
    };
  }, []);

  const handleConfirm = () => {
    if (dialog) {
      dialog.onConfirm();
      setDialog(null);
    }
  };

  const handleCancel = () => {
    if (dialog) {
      dialog.onCancel?.();
      setDialog(null);
    }
  };

  return (
    <Modal
      open={!!dialog}
      onClose={handleCancel}
      title={dialog?.title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleCancel}>
            {dialog?.cancelText || 'Cancel'}
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {dialog?.confirmText || 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
        {dialog?.message}
      </p>
    </Modal>
  );
}

export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: {
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
  }
) {
  if (typeof window === 'undefined') {
    onConfirm();
    return;
  }

  const event = new CustomEvent('show-confirm', {
    detail: {
      title,
      message,
      onConfirm,
      ...options,
    },
  });
  window.dispatchEvent(event);
}
