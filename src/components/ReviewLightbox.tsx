'use client';

import { useEffect } from 'react';

/**
 * Full-screen image lightbox with a dark backdrop. Inline styles only so it
 * works inside the Shadow DOM embed bundle. Rendered inside the widget root;
 * `position: fixed` still covers the whole viewport from a shadow root.
 */
export function ReviewLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-label="Review photo"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        cursor: 'zoom-out',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Review photo"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: '8px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          cursor: 'default',
          objectFit: 'contain',
        }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '36px',
          height: '36px',
          borderRadius: '9999px',
          border: 'none',
          background: 'rgba(255, 255, 255, 0.15)',
          color: '#fff',
          fontSize: '18px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}
