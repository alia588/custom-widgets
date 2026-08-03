'use client';

import { useState } from 'react';
import type { Review } from '@/lib/reviews-data';
import type { WidgetConfig } from '@/lib/widget-config';
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

export interface BusinessOption {
  id: string;
  name: string;
  address: string;
}

export interface TabProps {
  config: WidgetConfig;
  update: <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => void;
  businessName?: string;
  businessAddress?: string;
  reviews?: Review[];
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
  businessName,
  businessAddress,
  reviews = [],
  businesses = [],
  selectedBusinessId,
  onSelectBusiness,
}: TabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <Section title="Google Business">
        <Card>
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/50 text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <div>
                <div className="text-sm font-semibold text-neutral-100">{businessName ?? 'Business'}</div>
                <div className="max-w-[180px] truncate text-xs text-neutral-500">{businessAddress ?? ''}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="text-sm text-neutral-400 hover:text-neutral-200"
            >
              Change
            </button>

            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-neutral-800">
                  <div className="border-b border-neutral-800 px-3 py-2 text-xs font-medium text-neutral-500">
                    Select a managed business
                  </div>
                  <div className="editor-scroll max-h-64 overflow-y-auto p-1.5">
                    {businesses.length === 0 && (
                      <div className="p-4 text-center text-sm text-neutral-500">
                        No businesses found in Supabase.
                      </div>
                    )}
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          onSelectBusiness?.(b.id);
                          setPickerOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg p-3 text-left transition-colors hover:bg-neutral-800 ${
                          b.id === selectedBusinessId ? 'bg-neutral-800' : ''
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

      <Section title="Custom Business Name" description="Override the name from Google">
        <Card>
          <Toggle
            checked={config.customBusinessNameEnabled}
            onChange={(v) => update('customBusinessNameEnabled', v)}
            label="Custom Business Name"
          />
          {config.customBusinessNameEnabled && (
            <div className="mt-3">
              <TextInput
                value={config.customBusinessName}
                onChange={(v) => update('customBusinessName', v)}
                placeholder="Enter custom business name"
              />
            </div>
          )}
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Style tab
// ---------------------------------------------------------------------------
export function StyleTab({ config, update }: TabProps) {
  return (
    <>
      <Section title="">
        <Card>
          <Toggle
            checked={config.useSiteTheme}
            onChange={(v) => update('useSiteTheme', v)}
            label="Use Site Theme"
            description="Apply your website's theme colors"
          />
        </Card>
      </Section>

      <Section title="Badge Colors">
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
          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Badge Background"
              value={config.badgeBackgroundColor}
              onChange={(v) => update('badgeBackgroundColor', v)}
            />
            <ColorField
              label="Badge Border"
              value={config.badgeBorderColor}
              onChange={(v) => update('badgeBorderColor', v)}
            />
            <ColorField label="Star Color" value={config.starColor} onChange={(v) => update('starColor', v)} />
            <ColorField label="Text Color" value={config.textColor} onChange={(v) => update('textColor', v)} />
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
          <Slider label="Border Radius" value={config.borderRadius} min={0} max={40} onChange={(v) => update('borderRadius', v)} />
          <Slider label="Padding" value={config.padding} min={0} max={40} onChange={(v) => update('padding', v)} />
        </Card>
      </Section>

      <Section title="Sizing">
        <Card>
          <Slider label="Star Size" value={config.starSize} min={12} max={48} onChange={(v) => update('starSize', v)} />
          <Slider label="Google Icon" value={config.googleIconSize} min={12} max={48} onChange={(v) => update('googleIconSize', v)} />
        </Card>
      </Section>

      <Section title="Call to Action">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Background" value={config.ctaBackgroundColor} onChange={(v) => update('ctaBackgroundColor', v)} />
            <ColorField label="Text Color" value={config.ctaTextColor} onChange={(v) => update('ctaTextColor', v)} />
          </div>
        </Card>
      </Section>

      <Section title="Drawer">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Background" value={config.drawerBackgroundColor} onChange={(v) => update('drawerBackgroundColor', v)} />
            <ColorField label="Text Color" value={config.drawerTextColor} onChange={(v) => update('drawerTextColor', v)} />
            <ColorField label="Card Background" value={config.drawerCardBackgroundColor} onChange={(v) => update('drawerCardBackgroundColor', v)} />
            <ColorField label="Card Border" value={config.drawerCardBorderColor} onChange={(v) => update('drawerCardBorderColor', v)} />
          </div>
          <div className="mt-4">
            <Slider label="Card Radius" value={config.drawerCardRadius} min={0} max={32} onChange={(v) => update('drawerCardRadius', v)} />
          </div>
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout tab
// ---------------------------------------------------------------------------
export function LayoutTab({ config, update }: TabProps) {
  return (
    <>
      <Section title="Position">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Layout">
              <Select
                value={config.layout}
                onChange={(v) => update('layout', v as WidgetConfig['layout'])}
                options={[
                  { value: 'centered', label: 'Centered' },
                  { value: 'horizontal', label: 'Horizontal' },
                ]}
              />
            </Field>
            <Field label="Position">
              <Select
                value={config.position}
                onChange={(v) => update('position', v as WidgetConfig['position'])}
                options={[
                  { value: 'inline', label: 'Inline' },
                  { value: 'fixed', label: 'Fixed' },
                  { value: 'absolute', label: 'Absolute' },
                ]}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Alignment">
              <Select
                value={config.alignment}
                onChange={(v) => update('alignment', v as WidgetConfig['alignment'])}
                options={[
                  { value: 'center', label: 'Center' },
                  { value: 'left', label: 'Left' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </Field>
          </div>
          <Toggle checked={config.fullWidth} onChange={(v) => update('fullWidth', v)} label="Full Width" />
        </Card>
      </Section>

      <Section title="Call to Action">
        <Card>
          <Toggle checked={config.ctaEnabled} onChange={(v) => update('ctaEnabled', v)} label="Enable CTA" />
          {config.ctaEnabled && (
            <div className="mt-3">
              <Field label="Text">
                <TextInput value={config.ctaText} onChange={(v) => update('ctaText', v)} />
              </Field>
            </div>
          )}
        </Card>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings tab
// ---------------------------------------------------------------------------
export function SettingsTab({ config, update }: TabProps) {
  return (
    <>
      <Section title="Badge Display">
        <Card>
          <Toggle checked={config.badgeShowBusinessName} onChange={(v) => update('badgeShowBusinessName', v)} label="Business Name" />
          <Toggle checked={config.badgeShowReviewCount} onChange={(v) => update('badgeShowReviewCount', v)} label="Review Count" />
          <Toggle checked={config.badgeCompactMode} onChange={(v) => update('badgeCompactMode', v)} label="Compact Mode" />
        </Card>
      </Section>

      <Section title="Drawer Display">
        <Card>
          <Toggle checked={config.drawerShowBusinessInfo} onChange={(v) => update('drawerShowBusinessInfo', v)} label="Business Info" />
          <Toggle checked={config.drawerShowStarRatings} onChange={(v) => update('drawerShowStarRatings', v)} label="Star Ratings" />
          <Toggle checked={config.drawerShowDates} onChange={(v) => update('drawerShowDates', v)} label="Dates" />
          <Toggle checked={config.drawerShowAuthorPhotos} onChange={(v) => update('drawerShowAuthorPhotos', v)} label="Author Photos" />
          <Toggle checked={config.drawerShowReviewImages} onChange={(v) => update('drawerShowReviewImages', v)} label="Review Images" />
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

      <Section title="Drawer Settings">
        <Card>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Reviews Per Page">
              <NumberInput value={config.drawerReviewsPerPage} min={1} max={50} onChange={(v) => update('drawerReviewsPerPage', v)} />
            </Field>
            <Field label="Width (px)">
              <NumberInput value={config.drawerWidth} min={280} max={800} onChange={(v) => update('drawerWidth', v)} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Mobile Mode">
              <Select
                value={config.drawerMobileMode}
                onChange={(v) => update('drawerMobileMode', v as WidgetConfig['drawerMobileMode'])}
                options={[
                  { value: 'peek', label: 'Peek Mode' },
                  { value: 'fullscreen', label: 'Full Screen' },
                ]}
              />
            </Field>
          </div>
        </Card>
      </Section>
    </>
  );
}
