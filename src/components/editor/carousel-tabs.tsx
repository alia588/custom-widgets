'use client';

import { useState } from 'react';
import type { WidgetConfig } from '@/lib/widget-config';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import {
  Card,
  ColorField,
  Field,
  NumberInput,
  Section,
  Select,
  Slider,
  TextInput,
  Toggle,
} from './controls';
import { ExcludeReviewsPicker } from './ExcludeReviewsPicker';
import type { BusinessOption } from './tabs';

export interface CarouselTabProps {
  config: WidgetConfig;
  update: <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => void;
  widgetName: string;
  onNameChange: (name: string) => void;
  business?: BusinessInfo;
  reviews: Review[];
  businesses?: BusinessOption[];
  selectedBusinessId?: string;
  onSelectBusiness?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Content tab
// ---------------------------------------------------------------------------

export function ContentTab({
  config,
  update,
  widgetName,
  onNameChange,
  business,
  reviews,
  businesses = [],
  selectedBusinessId,
  onSelectBusiness,
}: CarouselTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  const q = pickerQuery.trim().toLowerCase();
  const filteredBusinesses = q
    ? businesses.filter(
        (b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q)
      )
    : businesses;

  return (
    <>
      <Section title="Name">
        <Card>
          <TextInput value={widgetName} onChange={onNameChange} placeholder="Widget name" />
        </Card>
      </Section>

      <Section title="Google Business">
        <Card>
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold break-words text-neutral-100">
                  {business?.name ?? 'Business'}
                </div>
                <div className="truncate text-xs text-neutral-500">{business?.address ?? ''}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPickerOpen((o) => !o);
                setPickerQuery('');
              }}
              className="flex-shrink-0 self-start text-sm text-neutral-400 hover:text-neutral-200"
            >
              Change
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div
                  className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl bg-black shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-2.5">
                    <input
                      type="text"
                      value={pickerQuery}
                      onChange={(e) => setPickerQuery(e.target.value)}
                      placeholder="Search businesses..."
                      autoFocus
                      className="w-full rounded-lg bg-[#ffffff0a] px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
                    />
                  </div>
                  <div className="editor-scroll max-h-64 overflow-y-auto p-1.5">
                    {filteredBusinesses.length === 0 && (
                      <div className="p-4 text-center text-sm text-neutral-500">
                        {businesses.length === 0
                          ? 'No businesses found in Supabase.'
                          : 'No businesses match your search.'}
                      </div>
                    )}
                    {filteredBusinesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          onSelectBusiness?.(b.id);
                          setPickerOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg p-3 text-left transition-colors hover:bg-neutral-800 ${b.id === selectedBusinessId ? 'bg-neutral-800' : ''
                          }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-100">{b.name}</div>
                          <div className="truncate text-xs text-neutral-500">{b.address}</div>
                        </div>
                        {b.id === selectedBusinessId && (
                          <svg className="h-4 w-4 flex-shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </Section>

      <Section title="Filtering">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort By">
              <Select
                value={config.sortBy}
                onChange={(v) => update('sortBy', v as WidgetConfig['sortBy'])}
                options={[
                  { value: 'highest_rating', label: 'Highest Rating' },
                  { value: 'lowest_rating', label: 'Lowest Rating' },
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'most_relevant', label: 'Most Relevant' },
                ]}
              />
            </Field>
            <Field label="Min Rating">
              <Select
                value={String(config.minRating)}
                onChange={(v) => update('minRating', Number(v))}
                options={[
                  { value: '5', label: '5 Stars Only' },
                  { value: '4', label: '4 Stars & Up' },
                  { value: '3', label: '3 Stars & Up' },
                  { value: '2', label: '2 Stars & Up' },
                  { value: '1', label: 'All Ratings' },
                ]}
              />
            </Field>
            <Field label="Image Filtering">
              <Select
                value={config.imageFiltering}
                onChange={(v) => update('imageFiltering', v as WidgetConfig['imageFiltering'])}
                options={[
                  { value: 'images_first', label: 'Images First' },
                  { value: 'images_only', label: 'Images Only' },
                  { value: 'no_images', label: 'No Images' },
                  { value: 'all', label: 'All Reviews' },
                ]}
              />
            </Field>
            <Field label="Max Reviews">
              <NumberInput
                value={config.maxReviews}
                min={1}
                max={100}
                onChange={(v) => update('maxReviews', v)}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Exclude Reviews">
              <ExcludeReviewsPicker
                reviews={reviews}
                minRating={config.minRating}
                maxReviews={config.maxReviews}
                excludedIds={config.excludedReviewIds}
                onChange={(ids) => update('excludedReviewIds', ids)}
              />
            </Field>
          </div>
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Style tab
// ---------------------------------------------------------------------------

export function StyleTab({ config, update }: CarouselTabProps) {
  return (
    <>
      <Section title="Theme">
        <Card>
          <Toggle
            checked={config.useSiteTheme}
            onChange={(v) => update('useSiteTheme', v)}
            label="Use Site Theme"
            description="Apply your website's theme colors"
          />
        </Card>
      </Section>

      <Section title="Colors">
        <Card>
          <Field label="Background">
            <Select
              value={config.badgeBackgroundType}
              onChange={(v) => update('badgeBackgroundType', v as WidgetConfig['badgeBackgroundType'])}
              options={[
                { value: 'transparent', label: 'Transparent' },
                { value: 'solid', label: 'Solid' },
              ]}
            />
          </Field>
          {config.badgeBackgroundType === 'solid' && (
            <ColorField
              label="Background Color"
              value={config.badgeBackgroundColor}
              onChange={(v) => update('badgeBackgroundColor', v)}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Card Background"
              value={config.drawerCardBackgroundColor}
              onChange={(v) => update('drawerCardBackgroundColor', v)}
            />
            <ColorField
              label="Card Border"
              value={config.drawerCardBorderColor}
              onChange={(v) => update('drawerCardBorderColor', v)}
            />
            <ColorField
              label="Primary Color"
              value={config.starColor}
              onChange={(v) => update('starColor', v)}
            />
            <ColorField
              label="Text Color"
              value={config.textColor}
              onChange={(v) => update('textColor', v)}
            />
          </div>
        </Card>
      </Section>

      <Section title="Typography & Shape">
        <Card>
          <Field label="Font Family">
            <Select
              value={config.fontFamily}
              onChange={(v) => update('fontFamily', v)}
              options={[
                { value: 'inherit', label: 'Inherit from Website' },
                { value: 'system-ui', label: 'System Default' },
                { value: 'Poppins', label: 'Poppins' },
                { value: 'Inter', label: 'Inter' },
                { value: 'Roboto', label: 'Roboto' },
                { value: 'Open Sans', label: 'Open Sans' },
                { value: 'Lato', label: 'Lato' },
                { value: 'Montserrat', label: 'Montserrat' },
                { value: 'Arial', label: 'Arial' },
              ]}
            />
          </Field>
          <Slider
            label="Border Radius"
            value={config.drawerCardRadius}
            min={0}
            max={40}
            onChange={(v) => update('drawerCardRadius', v)}
          />
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout tab
// ---------------------------------------------------------------------------

export function LayoutTab({ config, update }: CarouselTabProps) {
  return (
    <>
      <Section title="Size">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Width Type">
              <Select
                value={config.carouselWidthType}
                onChange={(v) => update('carouselWidthType', v as WidgetConfig['carouselWidthType'])}
                options={[
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed (px)' },
                ]}
              />
            </Field>
            <Field label={config.carouselWidthType === 'fixed' ? 'Value (px)' : 'Value (%)'}>
              <NumberInput
                value={config.carouselWidthValue}
                min={1}
                max={config.carouselWidthType === 'fixed' ? undefined : 100}
                onChange={(v) => update('carouselWidthValue', v)}
              />
            </Field>
          </div>
          <Field label="Reviews Per Slide">
            <NumberInput
              value={config.carouselReviewsPerSlide}
              min={1}
              max={10}
              onChange={(v) => update('carouselReviewsPerSlide', v)}
            />
          </Field>
          <Slider
            label="Max Width"
            value={config.carouselMaxWidth}
            min={400}
            max={2000}
            onChange={(v) => update('carouselMaxWidth', v)}
          />
        </Card>
      </Section>

      <Section title="Spacing">
        <Card>
          <Slider
            label="Card Padding"
            value={config.carouselCardPadding}
            min={0}
            max={48}
            onChange={(v) => update('carouselCardPadding', v)}
          />
          <Slider
            label="Card Gap"
            value={config.carouselCardGap}
            min={0}
            max={48}
            onChange={(v) => update('carouselCardGap', v)}
          />
          <Slider
            label="Text Max Height"
            value={config.carouselTextMaxHeight}
            min={80}
            max={600}
            onChange={(v) => update('carouselTextMaxHeight', v)}
          />
        </Card>
      </Section>

      <Section title="Auto-Play">
        <Card>
          <Toggle
            checked={config.carouselAutoplay}
            onChange={(v) => update('carouselAutoplay', v)}
            label="Enable"
            description="Automatically advance slides every few seconds"
          />
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------

export function SettingsTab({ config, update }: CarouselTabProps) {
  return (
    <>
      <Section title="Display">
        <Card>
          <Toggle
            checked={config.drawerShowBusinessInfo}
            onChange={(v) => update('drawerShowBusinessInfo', v)}
            label="Business Info"
          />
          <Toggle
            checked={config.carouselShowOverallRating}
            onChange={(v) => update('carouselShowOverallRating', v)}
            label="Overall Rating"
          />
          <Toggle
            checked={config.drawerShowStarRatings}
            onChange={(v) => update('drawerShowStarRatings', v)}
            label="Star Ratings"
          />
          <Toggle
            checked={config.drawerShowDates}
            onChange={(v) => update('drawerShowDates', v)}
            label="Dates"
          />
          <Toggle
            checked={config.drawerShowAuthorPhotos}
            onChange={(v) => update('drawerShowAuthorPhotos', v)}
            label="Author Photos"
          />
          <Toggle
            checked={config.drawerShowReviewImages}
            onChange={(v) => update('drawerShowReviewImages', v)}
            label="Review Images"
          />
        </Card>
      </Section>

      <Section title="Thumbnail Size">
        <Card>
          <Select
            value={config.thumbnailSize}
            onChange={(v) => update('thumbnailSize', v as WidgetConfig['thumbnailSize'])}
            options={[
              { value: 'small', label: 'Small (40×40)' },
              { value: 'medium', label: 'Medium (60×60)' },
              { value: 'large', label: 'Large (80×80)' },
            ]}
          />
        </Card>
      </Section>
    </>
  );
}
