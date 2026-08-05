'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BeforeAfterConfig } from '@/lib/before-after-config';
import { beforeAfterToDbRow, defaultBeforeAfterConfig } from '@/lib/before-after-config';
import type { WidgetConfig } from '@/lib/widget-config';
import { configToDbRow, defaultWidgetConfig } from '@/lib/widget-config';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { BeforeAfterWidget } from './BeforeAfterWidget';
import { GoogleReviewsWidget } from './GoogleReviewsWidget';
import { GoogleReviewsCarousel } from './GoogleReviewsCarousel';

export interface BeforeAfterItem {
  id: string;
  name: string;
  config: BeforeAfterConfig;
}

export interface GoogleReviewsItem {
  id: string;
  businessId: string;
  widgetType: 'google_reviews' | 'google_reviews_carousel';
  name: string;
  config: WidgetConfig;
  business?: BusinessInfo;
  reviews?: Review[];
}

type WidgetTypeKey = 'before-after' | 'google-reviews' | 'google-reviews-carousel';

const widgetTypeMeta: Record<
  WidgetTypeKey,
  { name: string; modalTitle: string; typeLabel: string; description: string }
> = {
  'before-after': {
    name: 'Before/After Slider',
    modalTitle: 'Before/After Sliders',
    typeLabel: 'Before/After Slider',
    description:
      'Showcase stunning before and after transformations with interactive drag sliders',
  },
  'google-reviews': {
    name: 'Google Reviews',
    modalTitle: 'Google Reviews Badges',
    typeLabel: 'Google Reviews Badge',
    description: 'Build customer trust by displaying your latest Google reviews in real-time',
  },
  'google-reviews-carousel': {
    name: 'Google Reviews Carousel',
    modalTitle: 'Google Reviews Carousels',
    typeLabel: 'Google Reviews Carousel',
    description: 'Paginated carousel of your latest Google review cards',
  },
};

function buildEmbedCode(id: string) {
  return [
    '<!-- Design Detail Embed -->',
    `<div data-designdetail-embed="${id}"></div>`,
    `<script src="${window.location.origin}/api/embeds/widget.js"></script>`,
    '<!-- End Design Detail Embed -->',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Small icons
// ---------------------------------------------------------------------------

function DuplicateIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Embed code popup (Copy Code / How to Use)
// ---------------------------------------------------------------------------

function EmbedCodeModal({
  id,
  name,
  typeLabel,
  onClose,
}: {
  id: string;
  name: string;
  typeLabel: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'code' | 'howto'>('code');
  const [copied, setCopied] = useState(false);
  const code = buildEmbedCode(id);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Copy failed — clipboard is not available.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold break-words">{name}</h2>
            <span className="mt-1.5 inline-block rounded-md bg-[#ffffff0a] px-2 py-0.5 text-xs font-medium text-neutral-300 ring-1 ring-neutral-800">
              {typeLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 px-6 pb-4">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              tab === 'code'
                ? 'bg-[#ffffff14] text-white'
                : 'bg-[#ffffff06] text-neutral-400 hover:bg-[#ffffff0a] hover:text-neutral-200'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            Copy Code
          </button>
          <button
            type="button"
            onClick={() => setTab('howto')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              tab === 'howto'
                ? 'bg-[#ffffff14] text-white'
                : 'bg-[#ffffff06] text-neutral-400 hover:bg-[#ffffff0a] hover:text-neutral-200'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            How to Use
          </button>
        </div>

        {/* Body */}
        <div className="editor-scroll flex-1 overflow-y-auto px-6 pb-6">
          {tab === 'code' ? (
            <>
              <h3 className="text-sm font-semibold text-neutral-100">Your Embed Code</h3>
              <p className="mt-0.5 mb-3 text-xs text-neutral-500">
                Copy this code to add the embed to your website
              </p>
              <div className="flex items-start gap-3 rounded-xl bg-[#ffffff06] p-4 ring-1 ring-neutral-800">
                <pre className="min-w-0 flex-1 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-neutral-300">
                  {code}
                </pre>
                <button
                  type="button"
                  onClick={copy}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-black transition-colors hover:bg-neutral-200"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="12" height="12" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-neutral-100">How to Add This Embed</h3>
              <p className="mt-0.5 mb-4 text-xs text-neutral-500">
                Follow these steps to add the embed to your website
              </p>

              {[
                {
                  title: 'Find your code block or custom HTML section',
                  body: 'Go to the page on your website where you want the embed to appear. Look for a code block, custom HTML, or embed component in your website builder or CMS.',
                },
                {
                  title: 'Paste the embed code',
                  body: 'Copy the code from the "Copy Code" tab and paste it into the code block or custom HTML section where you want the embed to display.',
                },
                {
                  title: 'Save and publish',
                  body: 'Save your changes and publish the page. The embed should appear immediately. If not, try clearing your browser cache or checking the troubleshooting tips below.',
                },
              ].map((step, i) => (
                <div key={i} className="mb-4 flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-neutral-100">{step.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{step.body}</p>
                  </div>
                </div>
              ))}

              <div className="mt-5 rounded-xl bg-[#ffffff06] p-4 ring-1 ring-neutral-800">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
                  </svg>
                  Common Platforms
                </div>
                <ul className="space-y-1.5 text-xs text-neutral-400">
                  <li><span className="font-semibold text-neutral-200">WordPress:</span> Add a “Custom HTML” block</li>
                  <li><span className="font-semibold text-neutral-200">Squarespace:</span> Add a “Code” block</li>
                  <li><span className="font-semibold text-neutral-200">Wix:</span> Add an “Embed Code” element</li>
                  <li><span className="font-semibold text-neutral-200">Webflow:</span> Add an “Embed” element</li>
                  <li><span className="font-semibold text-neutral-200">Shopify:</span> Edit theme and add to a custom liquid section</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delete confirmation popup
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-neutral-950 p-6 ring-1 ring-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-500">
            <TrashIcon />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">Delete this embed?</h2>
            <p className="mt-1 text-sm break-words text-neutral-500">
              “{name}” will be permanently deleted. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-lg bg-[#ffffff0a] py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-[#ffffff14] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Widget card (inside a type modal)
// ---------------------------------------------------------------------------

function WidgetCard({
  name,
  editHref,
  onCopyCode,
  onDuplicate,
  onDelete,
  children,
}: {
  name: string;
  editHref: string;
  onCopyCode: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="group rounded-xl bg-neutral-900 p-3 ring-1 ring-neutral-800">
      {/* Preview with hover actions */}
      <div className="relative">
        <div className="pointer-events-none h-44 overflow-hidden rounded-lg bg-neutral-800">
          {children}
        </div>
        <div className="absolute top-3 right-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onDuplicate}
            title="Duplicate"
            className="rounded-md bg-black/70 p-1.5 text-neutral-300 transition-colors hover:bg-black hover:text-white"
          >
            <DuplicateIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            className="rounded-md bg-black/70 p-1.5 text-neutral-300 transition-colors hover:bg-red-600 hover:text-white"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="mt-3 truncate text-sm font-semibold text-neutral-100" title={name}>
        {name}
      </div>

      {/* Actions */}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCopyCode}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ffffff0a] py-2 text-xs font-medium text-neutral-200 transition-colors hover:bg-[#ffffff14]"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          Copy Code
        </button>
        <button
          type="button"
          onClick={() => router.push(editHref)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ffffff0a] py-2 text-xs font-medium text-neutral-200 transition-colors hover:bg-[#ffffff14]"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Edit
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home-page type card preview mocks (stylized skeletons)
// ---------------------------------------------------------------------------

function MockBar({ className }: { className: string }) {
  return <div className={`rounded-full bg-neutral-600/70 ${className}`} />;
}

function BeforeAfterMock() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-1/2 bg-neutral-700/60" />
      <div className="absolute inset-y-0 right-0 w-1/2 bg-neutral-600/40" />
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-300/80" />
      <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800 ring-1 ring-neutral-500">
        <svg className="h-4 w-4 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
        </svg>
      </div>
      <div className="absolute top-3 left-3 h-4 w-12 rounded-full bg-neutral-500/70" />
      <div className="absolute top-3 right-3 h-4 w-12 rounded-full bg-neutral-500/70" />
    </div>
  );
}

function MiniReviewCard() {
  return (
    <div className="w-16 flex-shrink-0 rounded-md bg-neutral-700/50 p-1.5">
      <div className="mb-1 flex items-center gap-1">
        <div className="h-2.5 w-2.5 rounded-full bg-neutral-500" />
        <MockBar className="h-1 w-7" />
      </div>
      <div className="mb-1 flex gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-1 w-1 rounded-full bg-amber-400/70" />
        ))}
      </div>
      <MockBar className="mb-0.5 h-1 w-full" />
      <MockBar className="mb-0.5 h-1 w-full" />
      <MockBar className="h-1 w-2/3" />
      <div className="mt-1 text-[6px] font-bold text-neutral-400">G</div>
    </div>
  );
}

function GoogleReviewsMock() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="h-3 w-3 text-amber-400/80" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
        <span className="text-xs font-semibold text-neutral-300">4.9</span>
      </div>
      <div className="flex gap-2">
        <MiniReviewCard />
        <MiniReviewCard />
        <MiniReviewCard />
        <MiniReviewCard />
      </div>
    </div>
  );
}

function CarouselMock() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
      <div className="flex gap-2">
        <MiniReviewCard />
        <MiniReviewCard />
        <MiniReviewCard />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 ring-1 ring-neutral-600">
          <svg className="h-2 w-2 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-neutral-600'}`}
            />
          ))}
        </div>
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-700 ring-1 ring-neutral-600">
          <svg className="h-2 w-2 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PricingMock() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 p-4">
      {['$50', '$150', '$300'].map((price, i) => (
        <div key={price} className={`w-16 rounded-md bg-neutral-700/50 p-2 ${i === 2 ? 'opacity-60' : ''}`}>
          <MockBar className="mb-1 h-1.5 w-8" />
          <MockBar className="mb-0.5 h-1 w-full" />
          <MockBar className="mb-0.5 h-1 w-full" />
          <MockBar className="mb-1.5 h-1 w-2/3" />
          <div className="text-[10px] font-bold text-neutral-300">{price}</div>
          <MockBar className="mt-1 h-2 w-full" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home + modal
// ---------------------------------------------------------------------------

interface EmbedTarget {
  id: string;
  name: string;
  typeLabel: string;
}

interface DeleteTarget {
  type: WidgetTypeKey;
  id: string;
  name: string;
}

export function WidgetsHome({
  beforeAfterItems: initialBeforeAfter,
  googleReviewsItems: initialGoogleReviews,
  carouselItems: initialCarousel,
}: {
  beforeAfterItems: BeforeAfterItem[];
  googleReviewsItems: GoogleReviewsItem[];
  carouselItems: GoogleReviewsItem[];
}) {
  const router = useRouter();
  const [openType, setOpenType] = useState<WidgetTypeKey | null>(null);
  const [embedTarget, setEmbedTarget] = useState<EmbedTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [search, setSearch] = useState('');
  const [beforeAfterItems, setBeforeAfterItems] = useState(initialBeforeAfter);
  const [googleReviewsItems, setGoogleReviewsItems] = useState(initialGoogleReviews);
  const [carouselItems, setCarouselItems] = useState(initialCarousel);
  const [busy, setBusy] = useState(false);

  // Escape closes the topmost popup first, then the list modal.
  useEffect(() => {
    if (!openType && !embedTarget && !deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else if (embedTarget) setEmbedTarget(null);
      else setOpenType(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openType, embedTarget, deleteTarget]);

  const close = () => {
    setOpenType(null);
    setSearch('');
    setEmbedTarget(null);
    setDeleteTarget(null);
  };

  // --- Before/After mutations ------------------------------------------------

  const duplicateBeforeAfter = async (item: BeforeAfterItem) => {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/before-after-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${item.name} (Copy)`,
          ...beforeAfterToDbRow(item.config),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      // Add the copy as the first item (top-left of the grid).
      setBeforeAfterItems((list) => [
        { id: row.id, name: row.name, config: item.config },
        ...list,
      ]);
      // Refresh server props so a remount (close/reopen the modal) doesn't
      // re-initialize the list from the stale pre-duplicate payload.
      router.refresh();
    } catch (err) {
      alert(`Duplicate failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  // Performs the delete once the user confirms in the popup.
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const url =
        deleteTarget.type === 'before-after'
          ? `/api/v1/before-after-widgets/${deleteTarget.id}`
          : `/api/v1/widgets/${deleteTarget.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      if (deleteTarget.type === 'before-after') {
        setBeforeAfterItems((list) => list.filter((x) => x.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'google-reviews-carousel') {
        setCarouselItems((list) => list.filter((x) => x.id !== deleteTarget.id));
      } else {
        setGoogleReviewsItems((list) => list.filter((x) => x.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  const createBeforeAfter = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/before-after-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Before/After Slider',
          ...beforeAfterToDbRow(defaultBeforeAfterConfig),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      close();
      router.push(`/widgets/before-after?id=${row.id}`);
    } catch (err) {
      alert(`Create failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      setBusy(false);
    }
  };

  // --- Google Reviews (badge + carousel) mutations -----------------------------

  const createGoogleReviews = async (type: 'google-reviews' | 'google-reviews-carousel') => {
    // A widget needs a business — reuse the one from any existing widget.
    const source = googleReviewsItems[0] ?? carouselItems[0];
    if (!source) {
      alert('No business found. Add a business in Supabase first.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/v1/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: source.businessId,
          widget_type:
            type === 'google-reviews-carousel' ? 'google_reviews_carousel' : 'google_reviews',
          name: widgetTypeMeta[type].typeLabel,
          ...configToDbRow(defaultWidgetConfig),
          cached_reviews: source.reviews ?? [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      close();
      router.push(`/widgets/${type}?id=${row.id}`);
    } catch (err) {
      alert(`Create failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      setBusy(false);
    }
  };

  const duplicateGoogleReviewsItem = async (
    item: GoogleReviewsItem,
    setList: React.Dispatch<React.SetStateAction<GoogleReviewsItem[]>>
  ) => {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: item.businessId,
          widget_type: item.widgetType,
          name: `${item.name} (Copy)`,
          ...configToDbRow(item.config),
          cached_reviews: item.reviews ?? [],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      // Add the copy as the first item (top-left of the grid).
      setList((list) => [{ ...item, id: row.id, name: row.name }, ...list]);
      // Refresh server props so a remount doesn't re-initialize from stale data.
      router.refresh();
    } catch (err) {
      alert(`Duplicate failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setBusy(false);
    }
  };

  // --- Modal content -----------------------------------------------------------

  const query = search.trim().toLowerCase();
  const matches = (id: string, name: string) =>
    !query || name.toLowerCase().includes(query) || id.toLowerCase().includes(query);

  const renderGoogleReviewsCard = (
    item: GoogleReviewsItem,
    type: 'google-reviews' | 'google-reviews-carousel'
  ) => {
    const isCarousel = type === 'google-reviews-carousel';
    return (
      <WidgetCard
        key={item.id}
        name={item.name}
        editHref={`/widgets/${type}?id=${item.id}`}
        onCopyCode={() =>
          setEmbedTarget({ id: item.id, name: item.name, typeLabel: widgetTypeMeta[type].typeLabel })
        }
        onDuplicate={() =>
          duplicateGoogleReviewsItem(item, isCarousel ? setCarouselItems : setGoogleReviewsItems)
        }
        onDelete={() => setDeleteTarget({ type, id: item.id, name: item.name })}
      >
        <div className="bg-white p-3">
          {isCarousel ? (
            <GoogleReviewsCarousel
              config={{ ...item.config, carouselReviewsPerSlide: 3 }}
              business={item.business}
              reviews={item.reviews}
            />
          ) : (
            <GoogleReviewsWidget
              widgetId={item.id}
              config={item.config}
              business={item.business}
              reviews={item.reviews}
              preview
            />
          )}
        </div>
      </WidgetCard>
    );
  };

  const renderModalBody = () => {
    if (openType === 'before-after') {
      const items = beforeAfterItems.filter((i) => matches(i.id, i.name));
      return items.map((item) => (
        <WidgetCard
          key={item.id}
          name={item.name}
          editHref={`/widgets/before-after?id=${item.id}`}
          onCopyCode={() =>
            setEmbedTarget({ id: item.id, name: item.name, typeLabel: widgetTypeMeta['before-after'].typeLabel })
          }
          onDuplicate={() => duplicateBeforeAfter(item)}
          onDelete={() => setDeleteTarget({ type: 'before-after', id: item.id, name: item.name })}
        >
          <BeforeAfterWidget config={item.config} compact />
        </WidgetCard>
      ));
    }
    if (openType === 'google-reviews') {
      return googleReviewsItems
        .filter((i) => matches(i.id, i.name))
        .map((item) => renderGoogleReviewsCard(item, 'google-reviews'));
    }
    if (openType === 'google-reviews-carousel') {
      return carouselItems
        .filter((i) => matches(i.id, i.name))
        .map((item) => renderGoogleReviewsCard(item, 'google-reviews-carousel'));
    }
    return null;
  };

  const openCount =
    openType === 'before-after'
      ? beforeAfterItems.length
      : openType === 'google-reviews'
        ? googleReviewsItems.length
        : openType === 'google-reviews-carousel'
          ? carouselItems.length
          : 0;

  const typeCards: {
    key: WidgetTypeKey | 'pricing-table';
    name: string;
    description: string;
    icon: ReactNode;
    mock: ReactNode;
    disabled?: boolean;
  }[] = [
    {
      key: 'before-after',
      name: widgetTypeMeta['before-after'].name,
      description: widgetTypeMeta['before-after'].description,
      icon: (
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </span>
      ),
      mock: <BeforeAfterMock />,
    },
    {
      key: 'pricing-table',
      name: 'Pricing Table',
      description: 'Display dynamic pricing tables with car size filtering and package comparisons',
      icon: (
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 ring-1 ring-purple-500/30">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="4" width="5" height="16" rx="1" />
            <rect x="10" y="4" width="5" height="16" rx="1" />
            <rect x="17" y="4" width="5" height="16" rx="1" />
          </svg>
        </span>
      ),
      mock: <PricingMock />,
      disabled: true,
    },
    {
      key: 'google-reviews',
      name: widgetTypeMeta['google-reviews'].name,
      description: widgetTypeMeta['google-reviews'].description,
      icon: (
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600/20 text-amber-500 ring-1 ring-amber-500/30">
          <span className="text-lg font-bold">G</span>
        </span>
      ),
      mock: <GoogleReviewsMock />,
    },
    {
      key: 'google-reviews-carousel',
      name: widgetTypeMeta['google-reviews-carousel'].name,
      description: widgetTypeMeta['google-reviews-carousel'].description,
      icon: (
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600/20 text-amber-500 ring-1 ring-amber-500/30">
          <span className="text-lg font-bold">G</span>
        </span>
      ),
      mock: <CarouselMock />,
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {typeCards.map((card) =>
          card.disabled ? (
            <div
              key={card.key}
              className="overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-neutral-800 opacity-50"
            >
              <div className="h-44 bg-neutral-800/60">{card.mock}</div>
              <div className="flex items-start gap-3 p-4">
                {card.icon}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{card.name}</h2>
                    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{card.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              key={card.key}
              type="button"
              onClick={() => setOpenType(card.key as WidgetTypeKey)}
              className="group overflow-hidden rounded-xl bg-neutral-900 text-left ring-1 ring-neutral-800 transition-colors hover:ring-neutral-600"
            >
              <div className="h-44 bg-neutral-800/60">{card.mock}</div>
              <div className="flex items-start gap-3 p-4">
                {card.icon}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{card.name}</h2>
                    <span className="text-neutral-600 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{card.description}</p>
                </div>
              </div>
            </button>
          )
        )}
      </div>

      {openType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={close}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-neutral-950 ring-1 ring-neutral-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-bold">{widgetTypeMeta[openType].modalTitle}</h2>
                  <p className="text-xs text-neutral-500">{openCount} embeds found</p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search + create */}
            <div className="flex items-center gap-3 px-5 pb-4">
              <div className="relative flex-1">
                <svg
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full rounded-lg bg-[#ffffff0a] py-2.5 pr-3 pl-9 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  openType === 'before-after' ? createBeforeAfter() : createGoogleReviews(openType)
                }
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create New
              </button>
            </div>

            {/* Grid */}
            <div className="editor-scroll flex-1 overflow-y-auto p-5 pt-1">
              {openCount === 0 ? (
                <div className="py-16 text-center text-sm text-neutral-500">
                  No embeds yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {renderModalBody()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {embedTarget && (
        <EmbedCodeModal
          id={embedTarget.id}
          name={embedTarget.name}
          typeLabel={embedTarget.typeLabel}
          onClose={() => setEmbedTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          busy={busy}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
