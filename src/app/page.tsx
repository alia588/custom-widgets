import { WidgetsHome } from '@/components/WidgetsHome';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <div className="min-h-screen p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Widgets</h1>
        <p className="mt-1 mb-8 text-[var(--color-text-secondary)]">
          Select a widget type to manage its embeds.
        </p>

        <WidgetsHome />
      </div>
    </div>
  );
}
