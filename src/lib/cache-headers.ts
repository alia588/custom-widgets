// Shared cache directives for the public widget APIs (spec amendments 4-5).
// Success responses are edge-cacheable for 60s with a 300s
// stale-while-revalidate window; error responses must never be cached so a
// transient 404/403 can't poison a shared cache.

export const WIDGET_CACHE_CONTROL =
  'public, max-age=60, s-maxage=60, stale-while-revalidate=300';

export const NO_STORE = 'no-store, must-revalidate';
