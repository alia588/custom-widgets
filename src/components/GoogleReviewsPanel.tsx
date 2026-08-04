'use client';

import { CSSProperties, useEffect, useState } from 'react';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { reviews as hardcodedReviews } from '@/lib/reviews-data';
import type { WidgetConfig } from '@/lib/widget-config';
import { defaultWidgetConfig, resolveFontFamily, thumbnailSizePx } from '@/lib/widget-config';
import { Star, GoogleLogo } from './GoogleReviewsWidget';

function Avatar({
  name,
  photoUrl,
  size,
  show,
}: {
  name: string;
  photoUrl?: string;
  size: number;
  show: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!show) return null;
  const initial = name.charAt(0).toUpperCase();

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        background: '#d1d5db',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size / 2.5,
      }}
    >
      {initial}
    </div>
  );
}

interface GoogleReviewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config?: WidgetConfig;
  business?: BusinessInfo;
  reviews?: Review[];
}

export function GoogleReviewsPanel({
  isOpen,
  onClose,
  config = defaultWidgetConfig,
  business,
  reviews = hardcodedReviews,
}: GoogleReviewsPanelProps) {
  const [visibleCount, setVisibleCount] = useState(config.drawerReviewsPerPage);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setVisibleCount(config.drawerReviewsPerPage);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, config.drawerReviewsPerPage]);

  const businessInfo: BusinessInfo = business ?? {
    name: 'SSR Diesel Repairs',
    address: '',
    totalReviews: 126,
    averageRating: 4.0,
  };

  const displayName =
    config.customBusinessNameEnabled && config.customBusinessName
      ? config.customBusinessName
      : businessInfo.name;

  const fullStars = Math.floor(businessInfo.averageRating);
  const hasHalfStar = businessInfo.averageRating % 1 >= 0.5;

  const filtered = reviews
    .filter((r) => r.rating >= config.minRating)
    .filter((r) => !config.excludedReviewIds.includes(r.id))
    .filter((r) => {
      if (config.imageFiltering === 'images_only') return (r.images?.length ?? 0) > 0;
      if (config.imageFiltering === 'no_images') return (r.images?.length ?? 0) === 0;
      return true;
    })
    .sort((a, b) => {
      if (config.imageFiltering === 'images_first') {
        const imgDiff = (b.images?.length ?? 0) - (a.images?.length ?? 0);
        if (imgDiff !== 0) return imgDiff;
      }
      if (config.sortBy === 'highest_rating') return b.rating - a.rating;
      if (config.sortBy === 'lowest_rating') return a.rating - b.rating;
      return 0;
    })
    .slice(0, config.maxReviews);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const drawerStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 99999,
    height: '100%',
    width: `min(${config.drawerWidth}px, 100vw)`,
    background: config.drawerBackgroundColor,
    color: config.drawerTextColor,
    boxShadow: '4px 0 30px rgba(0,0,0,0.15)',
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    fontFamily: resolveFontFamily(config.fontFamily),
    display: 'flex',
    flexDirection: 'column',
  };

  const cardStyle: CSSProperties = {
    borderRadius: `${config.drawerCardRadius}px`,
    border: `1px solid ${config.drawerCardBorderColor}`,
    background: config.drawerCardBackgroundColor,
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };

  const avatarSize = thumbnailSizePx[config.thumbnailSize];

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99998,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        style={drawerStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`${displayName} reviews`}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px',
            borderBottom: `1px solid ${config.drawerCardBorderColor}`,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
                color: config.drawerTextColor,
              }}
            >
              {displayName}
            </h2>
            {config.drawerShowBusinessInfo && (
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '30px', fontWeight: 700, color: config.drawerTextColor }}>
                  {businessInfo.averageRating.toFixed(1)}
                </span>
                {config.drawerShowStarRatings && (
                  <div style={{ display: 'flex' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        color={config.starColor}
                        filled={i < fullStars || (i === fullStars && hasHalfStar)}
                      />
                    ))}
                  </div>
                )}
                <span style={{ fontSize: '14px', opacity: 0.55 }}>
                  ({businessInfo.totalReviews} reviews)
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: '28px',
              lineHeight: 1,
              color: config.drawerTextColor,
              opacity: 0.5,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            aria-label="Close reviews panel"
          >
            ×
          </button>
        </div>

        {/* Reviews list */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {visible.map((review) => (
            <div key={review.id} style={cardStyle}>
              <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar
                  name={review.authorName}
                  photoUrl={review.authorPhotoUrl}
                  size={avatarSize}
                  show={config.drawerShowAuthorPhotos}
                />
                <div>
                  <div style={{ fontWeight: 600, color: config.drawerTextColor }}>
                    {review.authorName}
                  </div>
                  {config.drawerShowDates && (
                    <div style={{ fontSize: '14px', opacity: 0.55 }}>{review.relativeTime}</div>
                  )}
                </div>
              </div>

              {config.drawerShowStarRatings && (
                <div style={{ marginBottom: '8px', display: 'flex' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} color={config.starColor} filled={i < review.rating} />
                  ))}
                </div>
              )}

              <p style={{ fontSize: '14px', lineHeight: 1.6, margin: 0, color: config.drawerTextColor }}>
                {review.text}
              </p>

              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: config.drawerTextColor,
                }}
              >
                <span>Posted on</span>
                <GoogleLogo size={16} />
                <span style={{ fontWeight: 600 }}>Google</span>
              </div>
            </div>
          ))}

          {/* Load more — inline at the end of the list, visible only at the bottom */}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((c) => c + config.drawerReviewsPerPage)}
              style={{
                width: '100%',
                flexShrink: 0,
                borderRadius: '10px',
                background: '#DC2626',
                color: '#000000',
                border: 'none',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </>
  );
}
