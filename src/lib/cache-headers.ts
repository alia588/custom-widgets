// Shared cache directives for the public widget APIs (spec amendments 4-5).
// Keep a five-minute fresh window and a long stale-while-revalidate window.
// After a client site has cached a widget once, this makes first paint
// immediate even after weeks away while the cache refreshes in the background.
// Error responses must never be cached so a transient 404/403 can't poison a
// shared cache.

export const WIDGET_CACHE_CONTROL =
  'public, max-age=300, s-maxage=300, stale-while-revalidate=5184000';

export const NO_STORE = 'no-store, must-revalidate';
