'use client';

import { useCallback, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { BeforeAfterConfig } from '@/lib/before-after-config';
import { aspectRatioPadding } from '@/lib/before-after-config';
import { resolveFontFamily } from '@/lib/widget-config';

const shadows: Record<BeforeAfterConfig['shadow'], string> = {
  none: 'none',
  default: '0 4px 12px rgba(0, 0, 0, 0.12)',
  soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
  strong: '0 12px 32px rgba(0, 0, 0, 0.24)',
};

function ImageOrPlaceholder({
  url,
  alt,
  static: isStatic = false,
}: {
  url: string;
  alt: string;
  /** Render in normal flow (aspect_ratio 'auto') so the image sets the height. */
  static?: boolean;
}) {
  if (!url) {
    return (
      <div
        style={
          isStatic
            ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              aspectRatio: '4 / 3',
              background: '#E5E7EB',
              color: '#9CA3AF',
              fontSize: '14px',
            }
            : {
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#E5E7EB',
              color: '#9CA3AF',
              fontSize: '14px',
            }
        }
      >
        {alt} image
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      style={
        isStatic
          ? { width: '100%', height: 'auto', display: 'block' }
          : {
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }
      }
    />
  );
}

/**
 * Interactive before/after comparison slider. Renders with inline styles only
 * so it works inside the Shadow DOM embed bundle without Tailwind.
 */
export function BeforeAfterWidget({
  config,
  compact = false,
}: {
  config: BeforeAfterConfig;
  /** Smaller labels/handle for thumbnail previews (e.g. the home-page modal). */
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(config.sliderPosition);
  const draggingRef = useRef(false);

  const clamp = (v: number) => Math.min(100, Math.max(0, v));

  const moveTo = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  const startDrag = useCallback(
    (clientX: number) => {
      draggingRef.current = true;
      moveTo(clientX);
    },
    [moveTo]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Tap/drag anywhere on the image moves the slider. With capture touch
    // mode off, vertical touch scrolling still works (touch-action: pan-y).
    startDrag(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) moveTo(e.clientX);
  };

  const endDrag = () => {
    draggingRef.current = false;
  };

  const fontFamily = resolveFontFamily(config.fontFamily);

  const widthStyle: CSSProperties =
    config.widthType === 'fixed'
      ? { width: `${config.widthValue}px`, maxWidth: '100%' }
      : { width: `${config.widthValue}%` };

  const aspectStyle: CSSProperties =
    config.aspectRatio === 'auto'
      ? {}
      : { paddingTop: `${aspectRatioPadding(config.aspectRatio)}%` };

  const labelStyle: CSSProperties = {
    position: 'absolute',
    top: compact ? '6px' : '12px',
    background: config.labelBackgroundColor,
    color: config.labelTextColor,
    fontSize: compact ? '11px' : '15px',
    fontWeight: 500,
    opacity: 0.8,
    padding: compact ? '3px 10px' : '5px 10px',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
    zIndex: 3,
    pointerEvents: 'none',
    userSelect: 'none',
  };

  return (
    <div
      style={{
        ...widthStyle,
        margin: '0 auto',
        fontFamily,
        boxSizing: 'border-box',
        background:
          config.backgroundType === 'solid' ? config.backgroundColor : 'transparent',
        borderRadius: `${config.borderRadius}px`,
        boxShadow: shadows[config.shadow],
      }}
    >
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          borderRadius: `${config.borderRadius}px`,
          cursor: 'ew-resize',
          userSelect: 'none',
          touchAction: config.captureTouchMode ? 'none' : 'pan-y',
          ...aspectStyle,
        }}
      >
        {/* After image (bottom layer) */}
        <ImageOrPlaceholder
          url={config.afterImageUrl}
          alt="After"
          static={config.aspectRatio === 'auto'}
        />

        {/* Before image, clipped to the slider position */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
            zIndex: 1,
          }}
        >
          <ImageOrPlaceholder url={config.beforeImageUrl} alt="Before" />
        </div>

        {/* Divider line + handle */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${position}%`,
            width: '3px',
            marginLeft: '-1.5px',
            background: '#FFFFFF',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${position}%`,
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2.5">
            <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
          </svg>
        </div>

        {/* Labels */}
        {config.showLabels && (
          <>
            <span style={{ ...labelStyle, left: compact ? '6px' : '12px' }}>{config.beforeLabel}</span>
            <span style={{ ...labelStyle, right: compact ? '6px' : '12px' }}>{config.afterLabel}</span>
          </>
        )}

        {/* Instruction text */}
        {config.showInstructionText && config.instructionText && (
          <span
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#FFFFFF',
              fontSize: `${config.instructionSize}px`,
              padding: '6px 14px',
              borderRadius: '8px',
              zIndex: 3,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {config.instructionText}
          </span>
        )}
      </div>
    </div>
  );
}
