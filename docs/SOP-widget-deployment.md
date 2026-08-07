# SOP — Widget Deployment (BuiltByShah Custom Widgets)

**Owner:** Hassan
**Last updated:** 2026-08-07
**Repo:** `custom-widgets` (Next.js + Supabase + esbuild embed bundle)

This is the standard operating procedure for deploying review widgets to a new
client site (typically a GoHighLevel page). Follow the steps in order. Do not
skip the verification steps — they are the only thing standing between you and
a broken widget on a live client site.

---

## 0. Prerequisites (one-time setup)

Before your first deployment, make sure you have:

- [ ] Repo cloned and `npm install` completed
- [ ] A `.env.local` file in the repo root with:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - scrape.do API key (used by the review sync)
- [ ] Login credentials for the widgets admin app (ask Ali to create one with
  `node scripts/create-admin-user.mjs` if you don't have one)
- [ ] The client's **Google Place ID** (from Google Maps / Places API — you can
  verify it with `node scripts/test-places-api.mjs`)
- [ ] Access to the client's GHL site (or wherever the embed will be pasted)

---

## 1. Onboard the business

Register the business and create its default reviews widget:

```bash
node scripts/add-business.mjs "Business Name" PLACE_ID "Full Address"
```

This prints a **widget ID** (UUID). Save it — you will need it for the embed
code and for testing.

If the business already exists, the script reuses it and tells you the existing
widget ID. Do not create duplicates.

---

## 2. Sync the reviews

Pull reviews from Google (via scrape.do) into Supabase:

```bash
npx tsx scripts/sync-reviews.ts PLACE_ID
```

Expected output: business name, average rating, total reviews, pages fetched,
reviews stored, widgets updated. If reviews stored is **0**, stop here and
check the Place ID — embedding a widget with no reviews will render an empty
widget on the client site.

To re-sync **all** businesses later (e.g. weekly refresh):

```bash
npx tsx scripts/sync-all-reviews.ts
# or, skipping already-synced ones:
npx tsx scripts/sync-all-reviews.ts --skip-file synced.json
```

> **Quota warning:** every sync consumes scrape.do credits (roughly one credit
> per page fetched; the sync fetches up to 40 reviews = ~4 pages per business).
> Do NOT run `sync-all-reviews.ts` more than once a day, and check remaining
> quota on the scrape.do dashboard before a large batch. Report usage to Ali
> after bulk syncs.

---

## 3. Configure the widget in the editor

1. Log in to the admin app (production URL or `http://localhost:3000` with
  `npm run dev` running).
2. Open the widget from the **Widgets** page.
3. Configure in the settings tabs:
   - Title/subtitle, star color, layout
   - **Review image size**: Small / Medium / Large / XL (100×100) — XL applies
     to review images only; author avatars cap at Large
   - Popup width, drawer mobile mode (`peek` is the default — keep it)
   - Carousel max-width is **opt-in** — only enable it if the client's page
     layout needs it
4. Set the **allowed domain(s)** for the embed (the client's site domain).
   The widget will refuse to render on unlisted domains.
5. Save.

---

## 4. Test locally

Run the automated end-to-end embed test (simulates an external GHL page):

```bash
npm run dev   # in one terminal
node scripts/test-embed.mjs WIDGET_ID http://localhost:3000
```

Expected: `RESULT: PASS — widget rendered live business data`.

Also do a **visual check** by opening `public/test-embed.html` in the browser
(add the new widget's embed div) and confirm:

- [ ] Reviews render with correct business name, rating, and reviewer photos
- [ ] No pricing chart or other leftover mock elements
- [ ] Mobile: narrow the browser below 768px — carousel shows 1 card,
      drawer peeks correctly
- [ ] Desktop: layout matches what the client approved

---

## 5. Deploy

```bash
npm run lint
npm run build
```

Then deploy the app (Vercel: push/merge to `main` triggers deployment;
production URL: `https://custom-widgets-phi.vercel.app`). The build produces
`public/widget.js`, which is served from the app's own domain — no separate
CDN upload is needed unless the CDN setup changes.

After deployment, re-run the embed test against production:

```bash
node scripts/test-embed.mjs WIDGET_ID https://custom-widgets-phi.vercel.app
```

---

## 6. Embed on the client site

Paste this into the GHL page (Custom HTML element), using the widget ID from
step 1:

```html
<!-- BuiltByShah Widget Embed -->
<div data-bbs-embed="WIDGET_ID_HERE"></div>
<script src="https://custom-widgets-phi.vercel.app/widget.js" defer></script>
<!-- End BuiltByShah Widget Embed -->
```

For the faster instant-loading variant (recommended for new embeds), follow the
pattern in `embed-site/index.html`: a blocking `data.js` bootstrap script tag
before the async `widget.js` tag.

Notes:
- One `widget.js` script tag per page is enough, even with multiple embed divs.
- `data-designdetail-embed` and `data-custom-widget` attributes also work
  (legacy support) — always use `data-bbs-embed` for new embeds.
- The widget renders inside Shadow DOM; GHL page styles cannot break it, and
  it cannot break the page.

---

## 7. Post-deployment verification

On the **live client page** (not just the test harness):

- [ ] Widget renders with live reviews (correct business name and rating)
- [ ] Check on a phone or mobile emulator (below 768px)
- [ ] No console errors in browser DevTools
- [ ] Popup/drawer opens and closes correctly
- [ ] Confirm with the client / Ali and record sign-off in WhatsApp

---

## 8. Ongoing maintenance

| Task | Frequency | Command / action |
|------|-----------|------------------|
| Refresh reviews | Weekly | `npx tsx scripts/sync-all-reviews.ts` |
| Check scrape.do quota | Before every bulk sync | scrape.do dashboard |
| Report quota usage to Ali | After every bulk sync | WhatsApp |
| Re-verify embeds | After any `widget.js` redeploy | `node scripts/test-embed.mjs <id> <prod-url>` |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Widget renders nothing on client site | Domain not in allowed list | Add the domain in the widget editor settings (step 3.4) |
| Widget empty / no reviews | Sync never ran or bad Place ID | Re-run step 2; verify Place ID with `scripts/test-places-api.mjs` |
| `test-embed.mjs` fails | App not deployed or widget ID wrong | Re-run `npm run build` + deploy; double-check the UUID |
| Old widget version still showing | CDN/browser cache | Cache TTL is ~60s + 5min stale-while-revalidate; hard-refresh or wait |
| Sync fails for one business | scrape.do error or delisted business | Re-run just that one: `npx tsx scripts/sync-reviews.ts PLACE_ID` |

## Escalation

If anything above doesn't resolve the issue, message **Ali** on WhatsApp with:
the widget ID, the client site URL, a screenshot, and any console errors.
