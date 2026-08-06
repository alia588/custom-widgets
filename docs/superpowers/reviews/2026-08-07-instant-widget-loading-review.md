# Review: Instant-Loading Widgets Spec

Date: 2026-08-07
Spec: `docs/superpowers/specs/2026-08-07-instant-widget-loading.md`
Reviewer: Build Orchestrator

## Executive Summary

The spec correctly identifies the skeleton waterfall and proposes a sensible
three-pronged fix (edge caching + prefetch + inline bootstrap). However, it
understates or omits several issues that will break the implementation or
introduce security/correctness regressions:

1. **Security:** the proposed `data.js` route intentionally bypasses the
   existing `allowed_domains` allowlist. This is not "same exposure as today";
   it is a strict expansion of who can read widget data.
2. **Correctness:** the bootstrap payload shape omits `business`, which reviews
   embeds require.
3. **Serialization safety:** U+2028/U+2029 escaping is necessary but not
   sufficient; `</script>` must also be escaped.
4. **Caching:** the stated "~60s" stale window is actually up to 360s, and
   repeat visitors may still hit the network because `max-age` is not set.
5. **Race conditions:** the two-async-script snippet cannot guarantee bootstrap
   data is present at mount time, so the "no skeleton" benchmark is not
   guaranteed for new snippets.

The spec should be revised before implementation.

---

## Critical Issues

### 1. `data.js` route bypasses the domain allowlist (security regression)

**Spec claim:** "Domain allowlist: script tags are not CORS-bound; the data is
public-facing widget content already rendered on customer sites. Serve
regardless of origin (same exposure as today via the public API from an allowed
domain)."

**Reality:** Today every JSON endpoint (`/api/v1/widgets/[id]`,
`/api/v1/widgets/[id]/reviews`, `/api/v1/before-after-widgets/[id]`) calls
`getWidgetCorsHeaders()`, which checks `Origin` (or `Referer`) against
`allowed_domains` and returns `403` for unknown origins. A hostile or
unauthorized site cannot simply `fetch()` widget data.

A `<script src=".../data.js">` tag does not enforce CORS, so any site on the
internet can include it and execute the response, gaining the widget's config,
reviews, and business info. This is **not** the same exposure; it removes the
only access control the platform has.

**Recommendation:**
- Check `Referer` (and `Origin` if present) in `data.js` and reject with `403`
  for unauthorized domains.
- Be aware that some browsers/extensions suppress `Referer`; document that
  widgets may fail in those environments.
- If the product decision is truly to make data public, update the spec's
  security rationale and remove the claim of equivalence.

### 2. Bootstrap payload shape is incomplete for reviews widgets

**Spec shape:**

```js
window.__BBS_WIDGET_DATA__["<id>"] = {
  kind: "reviews" | "before-after",
  config: {...},
  reviews: [...]
};
```

**Reality:** `GoogleReviewsEmbed` and `GoogleReviewsCarouselEmbed` maintain
three pieces of state:

- `config` (from `configFromDbRow(row)`)
- `business` (derived from `row.businesses`)
- `reviews`

The spec only lists `config` and `reviews`. Without `business`, the badge and
carousel will render without the business name, address, review count, and
average rating.

**Recommendation:** Add `business` to the reviews-kind payload, populated from
the same joined `businesses(...)` select used by `/api/v1/widgets/[id]/route.ts`.
The shape should be:

```js
{
  kind: "reviews",
  config: {...},
  business: {name, address, totalReviews, averageRating},
  reviews: [...]
}
```

### 3. JSON-in-`<script>` serialization must escape `</script>`, not just U+2028/U+2029

**Spec claim:** "Safe serialization: `JSON.stringify`, then escape
U+2028/U+2029. No user-controlled string is concatenated outside the
serialized JSON."

**Reality:** U+2028/U+2029 escaping prevents JSON syntax breakage in old
JavaScript parsers, but it does **not** prevent HTML parser breakage. A review
containing `</script><script>alert(1)</script>` will be emitted as a literal
`</script>` inside the `<script>` block, closing the script element and
executing attacker-controlled markup.

**Recommendation:** After `JSON.stringify`, escape at least:
- `<` → `\u003c` (or `\u003c/\u0073cript>` style)
- U+2028 and U+2029 (already noted)

Better yet, use a proven serializer such as `serialize-javascript` or a small
trusted helper. Update the verification `curl` step to assert that
`</script>`-like payloads are escaped, not merely "valid".

### 4. Stale window is 360 seconds, not ~60 seconds

**Spec claim:** "Stale config after admin edits: up to ~60s (+SWR window)."

**Reality:** The proposed header is:

```
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

A shared cache may serve the response stale for the full 300s SWR window after
the 60s `s-maxage` expires, for a worst-case staleness of **360 seconds**. The
risk section understates this by 6×.

**Recommendation:** Either revise the risk text to "up to ~6 minutes", or tighten
the header (e.g., `s-maxage=15, stale-while-revalidate=45` if the goal is
near-instant edits).

---

## Major Issues

### 5. Browser cache is ignored; repeat visitors still hit the network

**Spec claim:** "Repeat/edge-warm loads: real widget content in first paint
after bundle execution, no skeleton flash."

**Reality:** `s-maxage=60` governs shared/CDN caches only. Browsers use
`max-age` to decide whether a cached response can be reused locally. Without
`max-age`, the browser applies a heuristic cache that may still issue a
conditional request. On repeat visits the user may wait for a 304 or fresh 200,
so "first paint after bundle execution" is not guaranteed.

**Recommendation:** Add `max-age=60` (or similar) alongside `s-maxage=60` on
`data.js` and the JSON endpoints. Because the CORS headers include
`Access-Control-Allow-Origin: <specific origin>` and `Vary: Origin`, the
browser cache will be correctly scoped per origin.

### 6. `embed.tsx` cannot derive widget kind from the registry

**Spec claim:** "Phase 1 (script-eval time): scan placeholders already in DOM,
kick off the correct prefetch per widget (registry lookup tells us the
component type; before/after widgets prefetch the before-after endpoint)."

**Reality:** `getWidgetComponent(widgetId)` returns a React component
(`GoogleReviewsEmbed`, `GoogleReviewsCarouselEmbed`, or `BeforeAfterEmbed`).
Comparing component references inside `embed.tsx` to decide which endpoint to
prefetch is fragile and will likely break tree-shaking/minification. There is
no existing `getWidgetKind(widgetId)` helper.

**Recommendation:** Introduce an explicit kind map (e.g.,
`src/lib/widget-kinds.ts`) or extend the registry to return `{kind,
component}`. The prefetch logic should consume that kind directly.

### 7. Wasted work when `widget.js` wins the async race against `data.js`

**Spec claim:** "Async race (widget.js before data.js): bootstrap absent at
mount → components fall back to prefetch/fetch path. No breakage."

**Reality:** If `widget.js` downloads first, `embed.tsx` will start prefetching
the JSON endpoints. Moments later `data.js` arrives with the same data. The
component may initialize from bootstrap, but the API requests are already in
flight. On a slow connection this wastes bandwidth and battery, and the
component may still show a skeleton until the redundant fetch finishes.

**Recommendation:** Define a clear priority:
- If `window.__BBS_WIDGET_DATA__[id]` exists at component-mount time, render
  from it and skip the initial fetch.
- If it does not exist, start the fetch but also consider a short timeout or a
  one-time check when `data.js` loads (e.g., a lightweight global callback or
  a microtask poll) so a slightly-late bootstrap can still cancel the network
  request.

### 8. Background revalidation changes existing behavior and may cause UI flicker

**Spec claim:** "Always still run the existing (now prefetch-deduped) fetch in
the background to revalidate and update state if data changed. Bootstrap is a
warm start, not the source of truth."

**Reality:** The current embeds fetch once and never update. Adding a
background revalidation fetch means state can change after the first real paint.
For example, a carousel could suddenly swap reviews or change dimensions once
the network response arrives. This is new behavior that can cause layout shift
and visual instability, especially if the admin changed the widget between
`data.js` cache generation and the live API response.

**Recommendation:** Either:
- Revalidate only reviews (not config/layout), so the widget skeleton size stays
  stable, or
- Accept that the first paint from bootstrap is the source of truth for that
  page view and do not revalidate at all during the session, or
- Revalidate silently but throttle/debounce UI updates and preserve layout
  dimensions.

### 9. 4xx/5xx responses need explicit no-cache headers

**Spec claim:** "Do NOT cache 4xx/5xx responses (only add header on success)."

**Reality:** Omitting `Cache-Control` does not reliably prevent caching. Many
CDNs and browsers will cache 404/403 responses heuristically, especially when
no explicit directive is present. Also, the existing 403 responses do not
include `Vary: Origin`, so a CDN could cache a 403 for one origin and serve it
to another.

**Recommendation:** Add `Cache-Control: no-store, must-revalidate` to all error
responses, and include `Vary: Origin` on 403s from the JSON endpoints.

### 10. `data.js` route queries `widgets` then `before_after_widgets` sequentially

**Spec claim:** "Fetch widget row from `widgets`; if not found, fetch from
`before_after_widgets`. 404 if neither."

**Reality:** This is two sequential Supabase round-trips in the worst case,
adding latency to the "instant" path. Because the snippet does not carry a kind
hint, the route cannot know which table to query first.

**Recommendation:** Query both tables in parallel with `Promise.all` and use
the first non-empty result. This roughly halves latency without changing the URL.

---

## Minor Issues / Notes

### 11. "Cold-start fix" title overstates the change

Raising `ALLOWED_DOMAINS_CACHE_TTL_MS` from 60s to 300s only helps warm
serverless instances. The first request to each fresh instance still calls
`getAllowedDomains()` and hits Supabase. This is a reasonable mitigation but
not a fix for cold starts.

### 12. New snippet cannot guarantee "no skeleton" on first visit

Because both `data.js` and `widget.js` are `async`, their execution order is
not guaranteed by the HTML parser. If `widget.js` executes first, the widget
mounts before bootstrap data exists and the skeleton is shown until the
prefetch/fetch completes. The benchmark "New snippet: no skeleton flash" is a
best-case outcome, not a guarantee.

To make it deterministic, either:
- Load a single blocking bootstrap script that then injects `widget.js`, or
- Make `widget.js` poll briefly for `window.__BBS_WIDGET_DATA__` before falling
  back to fetch.

### 13. Legacy snippet "brief or no skeleton" depends on CDN warmth

The spec says legacy snippets will show a skeleton only for "one edge-cached
API round trip." If the CDN edge does not have the response cached, the
request goes to the origin, which may still call `getAllowedDomains()` and
Supabase. The skeleton duration is unbounded in the cold path.

### 14. `WidgetSkeleton` `minHeight` is a partial CLS mitigation

If the real widget renders taller than the skeleton's `minHeight`, there will
still be layout shift when it replaces the skeleton. The spec frames this as
"rare fallback reserves realistic space," but realistic heights for carousels
and before/after sliders can vary significantly. Consider also matching the
configured `widthType`/`widthValue` or aspect ratio when known.

### 15. `curl -I` in verification sends `HEAD`

The verification step says `curl -I data.js`. Next.js route handlers should
handle `HEAD` automatically when `GET` is defined, but this should be verified
or the test changed to `curl -i` (GET with response headers).

### 16. Runtime validation for bootstrap data

The spec says the global will be "type-validated." TypeScript declarations
are compile-time only; the component should validate the runtime shape (e.g.,
check `typeof config === 'object'`, `Array.isArray(reviews)`) before trusting
bootstrap data. Malformed cache payloads or partial loads should fall back to
fetch, not crash.

### 17. `data.js` route folder name is valid but unusual

`src/app/api/embeds/widget/[id]/data.js/route.ts` creates the URL path
`/api/embeds/widget/<id>/data.js`. This is legal in the App Router, but the
`.js` folder name is easy to confuse with a static file. The team should ensure
no future `public/api/embeds/widget/.../data.js` file is added, which would
shadow the route.

---

## Required Spec Revisions Before Implementation

1. **Security:** Decide whether `data.js` will enforce `Referer`-based
   allowlist checks. Document the decision and its trade-offs explicitly.
2. **Payload shape:** Add `business` to the reviews-kind bootstrap object and
   specify the exact mapping (same as the existing widget API).
3. **Serialization:** Require escaping of `<`/`</script>` in addition to
   U+2028/U+2029.
4. **Caching:** Correct the stale-window claim to ~360s, or tighten the header.
   Add `max-age` for browser caching if repeat-visit instant loads are required.
5. **Race handling:** Clarify the async-script race behavior and whether
   components will skip the initial fetch when bootstrap is present at mount.
6. **Kind lookup:** Add a concrete plan for deriving widget kind in
   `embed.tsx` prefetch logic.
7. **Revalidation:** Specify whether/when background revalidation runs and how
   the UI will avoid flicker/layout shift.
8. **Error caching:** Add `Cache-Control: no-store` to all 4xx/5xx responses and
   `Vary: Origin` to 403s.

---

## Questions for the Author

- Is the `data.js` route intentionally public, or should it enforce the same
  `allowed_domains` policy via `Referer`?
- Should the first paint from bootstrap be treated as authoritative for the page
  view, or do we always revalidate and potentially repaint?
- Is a 6-minute worst-case staleness acceptable for admin edits, or should we
  invest in on-demand cache invalidation now?
- Do we want to guarantee "no skeleton" for new snippets, or accept it as a
  best-effort optimization?
