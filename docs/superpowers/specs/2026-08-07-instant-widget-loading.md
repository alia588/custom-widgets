# Spec: Instant-Loading Widgets (Eliminate Skeleton Waterfall)

Date: 2026-08-07
Status: Approved for implementation

## Intent

Widgets currently render a skeleton on every page load because they are 100%
client-rendered with a fetch-in-`useEffect` waterfall and zero HTTP caching.
A widget platform must feel instant. This spec eliminates the skeleton from
the critical path for new embeds and makes it effectively invisible for
legacy embeds.

## Problem

Loading chain today (per page view on a host site):

1. Host page loads `widget.js` (example snippet lacks `async`).
2. `embed.tsx` waits for `DOMContentLoaded`.
3. Preact mounts into Shadow DOM.
4. `useEffect` fires **after first paint** and only then fetches config.
5. Config/reviews API routes have **no `Cache-Control`** → every visitor hits
   live Supabase. On cold serverless instances `getAllowedDomains()` adds a
   second sequential DB round-trip (60s in-memory TTL only).
6. Until config resolves: `if (!config) return <WidgetSkeleton />` in all
   three embed components. The skeleton is a fixed 60px bar → layout shift.

## Goal

- New embed snippets: first React paint IS the real widget. No skeleton, no
  fetch on the critical path.
- Legacy pasted snippets (unchanged, `widget.js` only): skeleton window
  reduced to near-zero via edge caching + script-eval-time prefetch.
- Zero breaking changes for already-pasted embed codes.

## Benchmark

- Repeat/edge-warm loads: real widget content in first paint after bundle
  execution, no skeleton flash.
- Cold loads with new snippet: no skeleton; config+reviews arrive inline in
  `data.js` (edge-cached, ~one CDN round trip, parallel with bundle).
- Cold loads with legacy snippet: skeleton only for the duration of one
  edge-cached API round trip that starts before React mounts.

## Proposed Changes

### 1. Edge-cache data APIs (legacy path speed)

Files: `src/app/api/v1/widgets/[id]/route.ts`,
`src/app/api/v1/widgets/[id]/reviews/route.ts`,
`src/app/api/v1/before-after-widgets/[id]/route.ts`

- Add to GET JSON responses:
  `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`
- `Vary: Origin` already present via `getWidgetCorsHeaders`; keep it.
- Do NOT cache 4xx/5xx responses (only add header on success).

### 2. Prefetch module + two-phase scan

New file: `src/lib/prefetch.ts`
- `getConfig(widgetId, apiOrigin)`, `getReviews(widgetId, apiOrigin)`,
  `getBeforeAfter(widgetId, apiOrigin)` — deduped promise cache keyed by
  `origin + path`.
- Handles non-OK responses by rejecting (components keep existing error
  behavior).

File: `src/embed.tsx`
- Phase 1 (script-eval time): scan placeholders already in DOM, kick off the
  correct prefetch per widget (registry lookup tells us the component type;
  before/after widgets prefetch the before-after endpoint).
- Phase 2 (DOMContentLoaded / existing mount pass): prefetch any placeholders
  missed in phase 1 (below the script tag with `async`), then mount.
- Embed components consume the shared promises instead of raw `fetch`.

### 3. Bootstrap data route (new snippet, true instant)

New file: `src/app/api/embeds/widget/[id]/data.js/route.ts`

- Validate `id` against a strict UUID regex; 400 otherwise.
- Fetch widget row from `widgets`; if not found, fetch from
  `before_after_widgets`. 404 if neither.
- Emit `application/javascript; charset=utf-8`:
  ```js
  window.__BBS_WIDGET_DATA__=window.__BBS_WIDGET_DATA__||{};
  window.__BBS_WIDGET_DATA__["<id>"]={kind:"reviews"|"before-after",config:{...},reviews:[...]};
  ```
  (`reviews` included for reviews-kind widgets from `cached_reviews`.)
- Safe serialization: `JSON.stringify`, then escape U+2028/U+2029. No
  user-controlled string is concatenated outside the serialized JSON.
- Headers: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`,
  `X-Content-Type-Options: nosniff`, `Access-Control-Allow-Origin: *`.
- Domain allowlist: script tags are not CORS-bound; the data is public-facing
  widget content already rendered on customer sites. Serve regardless of
  origin (same exposure as today via the public API from an allowed domain).
- Global type declared in a shared `.d.ts` or `src/lib/bootstrap.ts` helper
  that reads and type-validates the global.

### 4. Components consume bootstrap, then revalidate

Files: `src/components/GoogleReviewsEmbed.tsx`,
`src/components/GoogleReviewsCarouselEmbed.tsx`,
`src/components/BeforeAfterEmbed.tsx`

- On init: read `getBootstrappedData(widgetId)`. If present and shape-valid,
  initialize `config`/`business`/`reviews` state synchronously → first render
  is the real widget.
- Always still run the existing (now prefetch-deduped) fetch in the
  background to revalidate and update state if data changed. Bootstrap is a
  warm start, not the source of truth.
- `failed` behavior unchanged (render nothing).

### 5. Snippet generator + example

File: `src/components/WidgetsHome.tsx` (lines ~79-80), `embed-site/index.html`

New snippet shape:
```html
<div data-bbs-embed="WIDGET_ID"></div>
<script async src="ORIGIN/api/embeds/widget/WIDGET_ID/data.js"></script>
<script async src="ORIGIN/api/embeds/widget.js"></script>
```
Legacy single-script snippets keep working (Tier-1 speed).

### 6. CLS-safe fallback

File: `src/components/WidgetSkeleton.tsx`
- Accept optional `minHeight` (and optional `maxWidth`) props.
- Each embed component passes a widget-type-appropriate value (badge ~60px,
  carousel ~220px, before/after ~320px) so the rare fallback reserves
  realistic space.

### 7. Cold-start fix

File: `src/lib/domain-utils.ts`
- `ALLOWED_DOMAINS_CACHE_TTL_MS`: 60_000 → 300_000.

## Integration Points

- `embed.tsx` ↔ `prefetch.ts` ↔ embed components (shared promise cache).
- `data.js` route reuses `src/lib/db` supabase client (service role, same as
  existing public API routes).
- Snippet generator is the only user-facing contract change; old snippets
  work unchanged.

## Risks & Mitigations

- **Stale config after admin edits**: up to ~60s (+SWR window). Acceptable;
  background revalidation self-corrects on each load. Follow-up option:
  on-demand CDN purge in PATCH handlers.
- **Async race (widget.js before data.js)**: bootstrap absent at mount →
  components fall back to prefetch/fetch path. No breakage.
- **Cache-poisoning across origins**: `Vary: Origin` on all CORS JSON
  responses; data.js is origin-agnostic public content.
- **JS injection via DB content**: strict UUID param validation,
  JSON.stringify + U+2028/2029 escaping, `nosniff`.

## Verification

- `npm run build` (must pass: esbuild bundle + `next build`).
- Serve `embed-site/` locally against dev server:
  - New snippet: no skeleton flash, widget content on first paint.
  - Legacy snippet: works, brief or no skeleton.
  - Bogus widget id: renders nothing, no console crash.
- `curl -I` data.js and API routes: correct cache headers, content types.
- `curl` data.js with review text containing `</script>`-like payloads and
  unicode line separators: output remains valid, escaped JS.

## Rollback

- Single revert; snippet generator revert is independent. Legacy `widget.js`
  URL and behavior untouched.

## Open Questions

- Should PATCH handlers trigger on-demand CDN revalidation for the widget's
  data.js/API cache? (Deferred; platform-dependent.)

## Amendments (post-review, 2026-08-07)

Incorporating `docs/superpowers/reviews/2026-08-07-instant-widget-loading-review.md`:

1. **data.js access control**: enforce the `allowed_domains` allowlist via
   `Origin`/`Referer` headers **when present** (403 otherwise); serve when the
   headers are absent (privacy tools strip Referer; hard-failing would break
   legitimate widgets; data is non-sensitive public reviews + styling config,
   already obtainable server-side where CORS does not apply). This is a
   documented, deliberate trade-off — not equivalent to today's exposure.
2. **Payload shape**: reviews-kind bootstrap includes `business`
   (`{name, address, totalReviews, averageRating}` from the joined
   `businesses(...)` select) alongside `config` and `reviews`.
3. **Serialization**: escape `<` as `<`, plus U+2028/U+2029, after
   `JSON.stringify`. Verification asserts `</script>` payloads are escaped.
4. **Cache headers**: `Cache-Control: public, max-age=60, s-maxage=60,
   stale-while-revalidate=300` on success responses (data.js + JSON APIs).
   Worst-case staleness for admin edits is **~6 minutes** (60s + 300s SWR).
   Accepted as trade-off; on-demand invalidation is the documented follow-up.
5. **Error responses**: all 4xx/5xx from these routes get
   `Cache-Control: no-store, must-revalidate`; 403s include `Vary: Origin`.
6. **Deterministic no-skeleton**: new snippet loads `data.js` as a **classic
   blocking script** (tiny, edge-cached, executes during parse) and
   `widget.js` with `async`. Blocking parse-order guarantees bootstrap data
   exists before the bundle executes. No race, no polling.
7. **Widget kind lookup**: `src/widget-registry.ts` extended to map each ID
   to `{ kind: 'reviews' | 'carousel' | 'before-after', component }`;
   `embed.tsx` prefetch consumes `kind` directly (no component-reference
   comparison).
8. **Revalidation without flicker**: components always background-revalidate
   via the deduped fetch, but only update state when the serialized payload
   differs from the bootstrap/current data. No spurious repaints; genuine
   admin edits propagate within the cache window.
9. **data.js table lookup**: query `widgets` and `before_after_widgets` in
   parallel (`Promise.all`), use the first hit.
10. **Runtime validation**: `getBootstrappedData()` validates shape
    (`config` object, `reviews` array, etc.) before trusting the global;
    malformed payloads fall back to fetch.
