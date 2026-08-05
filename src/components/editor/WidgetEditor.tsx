'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import type { WidgetConfig } from '@/lib/widget-config';
import { configToDbRow } from '@/lib/widget-config';
import type { BusinessInfo, Review } from '@/lib/reviews-data';
import { GoogleReviewsWidget } from '@/components/GoogleReviewsWidget';
import { ContentTab, LayoutTab, SettingsTab, StyleTab } from './tabs';

export interface EditorWidget {
  widgetId: string;
  widgetName: string;
  initialConfig: WidgetConfig;
  business: BusinessInfo;
  reviews: Review[];
}

type EditorTab = 'content' | 'style' | 'layout' | 'settings';

const tabs: { id: EditorTab; label: string; icon: ReactNode }[] = [
  {
    id: 'content',
    label: 'Content',
    icon: <span className="font-serif text-xl font-bold">T</span>,
  },
  {
    id: 'style',
    label: 'Style',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 22a10 10 0 110-20c5.5 0 10 4.5 10 9 0 2.5-2 4.5-4.5 4.5h-2.5a2.5 2.5 0 00-2 4c.6.8.4 2.5-1 2.5zm-5-10a1 1 0 100-2 1 1 0 000 2zm4-4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-4 4a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
  },
  {
    id: 'layout',
    label: 'Layout',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h.01a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

const tabMeta: Record<EditorTab, { title: string; subtitle: string }> = {
  content: { title: 'Content', subtitle: 'Configure your content and basic settings' },
  style: { title: 'Style', subtitle: 'Customize colors, themes, and visual appearance' },
  layout: { title: 'Layout', subtitle: 'Adjust spacing, sizing, and layout options' },
  settings: { title: 'Settings', subtitle: 'Advanced configuration and integration options' },
};

export function WidgetEditor({
  items,
  initialSelectedId,
}: {
  items: EditorWidget[];
  initialSelectedId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(() =>
    initialSelectedId && items.some((i) => i.widgetId === initialSelectedId)
      ? initialSelectedId
      : (items[0]?.widgetId ?? '')
  );
  const [configs, setConfigs] = useState<Record<string, WidgetConfig>>(() =>
    Object.fromEntries(items.map((i) => [i.widgetId, i.initialConfig]))
  );
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = items.find((i) => i.widgetId === selectedId);

  if (!selected) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-neutral-400">
        No Google Reviews Badge widgets found. Add a business in Supabase first.
      </div>
    );
  }

  const config = configs[selectedId] ?? selected.initialConfig;

  const update = <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfigs((c) => ({ ...c, [selectedId]: { ...config, [key]: value } }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/widgets/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configToDbRow(config)),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const tabProps = {
    config,
    update,
    businessName: selected.business.name,
    businessAddress: selected.business.address,
    reviews: selected.reviews,
    businesses: items.map((i) => ({
      id: i.widgetId,
      name: i.business.name,
      address: i.business.address,
    })),
    selectedBusinessId: selectedId,
    onSelectBusiness: (id: string) => {
      setSelectedId(id);
      setSaved(false);
    },
  };

  return (
    <div className="flex h-screen flex-col bg-black text-neutral-100">
      {/* Header */}
      <div className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-neutral-900 px-4">
        <Link
          href="/"
          title="Back to Widgets"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold">Edit Google Reviews Badge</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
      {/* Icon rail */}
      <div className="flex w-[72px] flex-shrink-0 flex-col gap-1 bg-white/[0.03] px-2 py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),inset_0_-1px_0_0_rgba(0,0,0,0.3),inset_0_2px_4px_0_rgba(0,0,0,0.2)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-1 rounded-lg px-1 py-3 text-[11px] transition-colors ${
              activeTab === t.id
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Settings panel */}
      <div className="flex w-[420px] flex-shrink-0 flex-col bg-white/[0.01]">
        <div className="p-5">
          <h2 className="text-lg font-bold">{tabMeta[activeTab].title}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">{tabMeta[activeTab].subtitle}</p>
        </div>

        <div className="editor-scroll flex-1 overflow-y-auto p-5">
          <div key={activeTab} className="editor-tab-enter">
            {activeTab === 'content' && <ContentTab {...tabProps} />}
            {activeTab === 'style' && <StyleTab {...tabProps} />}
            {activeTab === 'layout' && <LayoutTab {...tabProps} />}
            {activeTab === 'settings' && <SettingsTab {...tabProps} />}
          </div>
        </div>

        <div className="p-4 pb-7">
          <button
            onClick={save}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 text-sm font-semibold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <path d="M17 21v-8H7v8M7 3v5h8" />
            </svg>
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="relative flex-1 overflow-hidden bg-neutral-950">
        <div className="absolute top-4 left-5 text-sm text-neutral-500">
          {selected.widgetName} <span className="text-neutral-700">· live preview</span>
        </div>
        <div className="flex h-full items-center justify-center p-10">
          <GoogleReviewsWidget
            key={selectedId}
            widgetId={selectedId}
            config={config}
            business={selected.business}
            reviews={selected.reviews}
            preview={config.position !== 'inline'}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
