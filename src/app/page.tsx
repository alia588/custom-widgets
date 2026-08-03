import Link from 'next/link';

const widgetTypes = [
  {
    slug: 'google-reviews',
    name: 'Google Reviews Badge',
    description: 'Rating badge with a slide-out reviews drawer.',
    available: true,
  },
  {
    slug: 'carousel',
    name: 'Reviews Carousel',
    description: 'Auto-scrolling row of review cards.',
    available: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 p-10 text-neutral-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Widgets</h1>
        <p className="mt-1 mb-8 text-neutral-500">
          Select a widget type to configure it for a managed business.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {widgetTypes.map((w) =>
            w.available ? (
              <Link
                key={w.slug}
                href={`/widgets/${w.slug}`}
                className="group rounded-xl bg-neutral-900 p-5 ring-1 ring-neutral-800 transition-colors hover:ring-neutral-600"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{w.name}</h2>
                  <span className="text-neutral-600 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{w.description}</p>
              </Link>
            ) : (
              <div
                key={w.slug}
                className="rounded-xl bg-neutral-900 p-5 opacity-50 ring-1 ring-neutral-800"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{w.name}</h2>
                  <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                    Coming soon
                  </span>
                </div>
                <p className="text-sm text-neutral-500">{w.description}</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
