# Google Reviews Widget — Migration Spec

## 1. Current State (DesignDetail)

### How it works today
- **Business connected:** SSR Diesel Repairs (Google Business Profile)
- **Identifier stored:** Google Place ID (`ChIJ...`) — not visible in UI but fetched during OAuth/selection
- **Data source:** Google Places API (New) or Google Business Profile API
- **Cache layer:** DesignDetail's cloud DB — "40 reviews loaded" means 40 rows cached on their servers
- **Sync:** Manual refresh icon + background cron (estimated 24–72h interval)
- **Widget delivery:** Embeddable script (`app.designdetail.io/embeds/{id}/badge.js`) fetches cached JSON from their CDN/API and injects DOM

### Current config (from screenshot)
| Setting | Value |
|---------|-------|
| Connected Business | SSR Diesel Repairs |
| Reviews Loaded | 40 |
| Total Google Reviews | 126 |
| Max Reviews | 40 |
| Min Rating | 5 Stars Only |
| Sort By | Highest Rating |
| Image Filtering | Images First |
| Exclude Reviews | 40 of 40 shown (dropdown UI) |

### Data flow (inferred)
```
User clicks "Change" → Google OAuth / Place Search
    → DesignDetail backend captures Place ID
    → Calls Google Places API (Place Details)
    → Stores up to Max Reviews in their DB
    → Filters applied (rating, sort, images)
    → Widget preview renders from cache
    → Live site loads embed script → hits their API → renders cached JSON
```

---

## 2. Migration — Required Credentials

### Must-Have

| Credential | Where to Get | Purpose |
|------------|-------------|---------|
| **Google Cloud Project** | [console.cloud.google.com](https://console.cloud.google.com) | Container for all Google APIs |
| **Places API (New) Key** | APIs & Services → Credentials → API Key | Fetch review data from Google |
| **Google Business Profile API access** | [Google Business Profile](https://business.google.com/) → API access (requires OAuth app) | Fetch >5 reviews, real-time sync |
| **OAuth 2.0 Client ID + Secret** | Google Cloud → Credentials → OAuth 2.0 | Let users connect their own GBP |
| **Supabase Project** | [supabase.com](https://supabase.com) | DB + Auth + Edge Functions |
| **Supabase Service Role Key** | Project Settings → API | Server-side DB access |
| **Supabase Anon Key** | Project Settings → API | Client-side DB access |

### Nice-to-Have

| Credential | Purpose |
|-----------|---------|
| **Vercel Account + Token** | Hosting + Cron jobs |
| **SerpAPI Key** | Fallback scraping if Google API limits hit |
| **Redis/Upstash** | Rate limiting + fast cache layer |

---

## 3. Proposed Next.js Architecture

### Repo Structure
```
app/
  (admin)/
    dashboard/
      page.tsx              # Admin UI: connect GBP, configure widget
    widgets/
      [id]/
        edit/
          page.tsx          # Widget editor (like DesignDetail)
  api/
    v1/
      sync/
        route.ts            # POST /api/v1/sync — cron trigger
      reviews/
        [placeId]/
          route.ts          # GET cached reviews JSON
      widget/
        [id]/
          script.ts         # Serves embeddable JS bundle
      auth/
        google/
          callback/
            route.ts        # OAuth callback
  lib/
    google-places.ts        # Places API wrapper
    db.ts                   # Supabase client
    widget-renderer.tsx     # React component for widget
  cron/
    sync-reviews.ts         # Edge function or Vercel cron
```

### Database Schema (Supabase)
```sql
-- Widgets table
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  place_id TEXT NOT NULL,
  business_name TEXT,
  total_google_reviews INT DEFAULT 0,
  max_reviews INT DEFAULT 40,
  min_rating INT DEFAULT 1,
  sort_by TEXT DEFAULT 'highest_rating',
  image_filtering TEXT DEFAULT 'images_first',
  excluded_review_ids TEXT[] DEFAULT '{}',
  cached_reviews JSONB DEFAULT '[]',
  last_synced_at TIMESTAMPTZ,
  sync_interval_hours INT DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table (normalized, optional)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  google_review_id TEXT UNIQUE NOT NULL,
  author_name TEXT,
  author_photo_url TEXT,
  rating INT NOT NULL,
  text TEXT,
  relative_time TEXT,
  time INT,
  images JSONB DEFAULT '[]',
  is_excluded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/sync` | Cron / Admin | Fetch fresh reviews from Google for all active widgets |
| `GET` | `/api/v1/reviews/{placeId}` | Public (rate-limited) | Serve cached review JSON to embed scripts |
| `GET` | `/api/v1/widget/{id}/script` | Public | Serve minified embed JS bundle |
| `GET` | `/api/auth/google` | User | Initiate OAuth flow |
| `GET` | `/api/auth/google/callback` | User | Handle OAuth callback, store tokens |

### Sync Logic (Cron)
```typescript
// app/api/v1/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch all widgets needing sync
  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .lt('last_synced_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  for (const widget of widgets || []) {
    // Call Google Places API (New)
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${widget.place_id}?fields=reviews,rating,userRatingCount`,
      { headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY! } }
    );
    const data = await res.json();

    // Google returns max 5 reviews per call — loop if using pagination or use GBP API for more
    const reviews = data.reviews || [];

    // Apply filters before storage
    const filtered = reviews
      .filter((r: any) => r.rating >= widget.min_rating)
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, widget.max_reviews);

    // Upsert to DB
    await supabase.from('widgets')
      .update({ 
        cached_reviews: filtered, 
        total_google_reviews: data.userRatingCount || 0,
        last_synced_at: new Date().toISOString() 
      })
      .eq('id', widget.id);
  }

  return NextResponse.json({ synced: widgets?.length || 0 });
}
```

### Embeddable Widget Script
```typescript
// app/api/v1/widget/[id]/script/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const widgetId = params.id;

  // Fetch widget config + cached reviews
  const { data: widget } = await supabase
    .from('widgets')
    .select('cached_reviews, business_name, total_google_reviews')
    .eq('id', widgetId)
    .single();

  const script = `
    (function() {
      const container = document.createElement('div');
      container.id = 'grw-${widgetId}';
      document.currentScript.parentNode.insertBefore(container, document.currentScript);

      const data = ${JSON.stringify(widget)};

      // Render React component or vanilla JS badge
      container.innerHTML = \`
        <div style="font-family:sans-serif;padding:16px;border:1px solid #eee;border-radius:8px;max-width:300px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <img src="https://www.google.com/favicon.ico" width="20" />
            <span style="font-weight:600;">Google Reviews</span>
          </div>
          <div style="font-size:24px;font-weight:700;">${widget.total_google_reviews > 0 ? (widget.cached_reviews.reduce((a,b) => a + b.rating, 0) / widget.cached_reviews.length).toFixed(1) : '0.0'} ★</div>
          <div style="color:#666;font-size:14px;">${widget.business_name} · ${widget.total_google_reviews} reviews</div>
        </div>
      \`;
    })();
  `;

  return new Response(script, { headers: { 'Content-Type': 'application/javascript' } });
}
```

---

## 4. Google API Details

### Places API (New) — Primary
```
GET https://places.googleapis.com/v1/places/{placeId}
Headers:
  X-Goog-Api-Key: YOUR_API_KEY
  X-Goog-FieldMask: reviews,rating,userRatingCount,displayName
```
- **Limit:** 5 reviews per request
- **Cost:** ~$5 per 1000 requests (check current pricing)
- **Best for:** Simple badge, low review volume

### Google Business Profile API — For >5 Reviews
- Requires OAuth 2.0 with `https://www.googleapis.com/auth/business.manage` scope
- Returns all reviews for authenticated accounts
- Must be owner/manager of the GBP
- **Best for:** Full review feeds, real estate clients with many reviews

### SerpAPI — Fallback/Scraping
```
GET https://serpapi.com/search.json?engine=google_maps_reviews&place_id=...&api_key=...
```
- Returns up to 10 reviews per call, paginated
- Paid tier required for production
- **Use case:** When Google API limits are too restrictive

---

## 5. Migration Checklist

- [ ] Create Google Cloud Project + enable Places API (New)
- [ ] Generate API Key + restrict to HTTP referrers
- [ ] Set up OAuth 2.0 credentials (if using GBP API)
- [ ] Create Supabase project + run schema SQL
- [ ] Store env vars: `GOOGLE_PLACES_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Build `/api/v1/sync` endpoint + test with SSR Diesel Repairs Place ID
- [ ] Build admin dashboard: connect GBP, set filters (max reviews, min rating, sort)
- [ ] Build embed script route (`/api/v1/widget/{id}/script`)
- [ ] Set up Vercel cron: `0 */6 * * *` (every 6 hours)
- [ ] Test embed on a staging page
- [ ] Migrate SSR Diesel Repairs widget from DesignDetail → self-hosted
- [ ] Update client sites to new embed URL
- [ ] Monitor Google API quota in Cloud Console

---

## 6. Env Vars Template

```bash
# .env.local
GOOGLE_PLACES_API_KEY=your_key_here
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

SERPAPI_KEY=optional_fallback_key
```

---

## 7. Known Limitations

| Issue | Workaround |
|-------|-----------|
| Google Places API returns max 5 reviews | Use GBP API (OAuth) or SerpAPI for more |
| GBP API requires account ownership | Client must grant OAuth consent |
| No webhook from Google for new reviews | Poll every 6–24h via cron |
| Review text may be truncated | Store full text, truncate in UI only |
| API quota limits | Cache aggressively; use service accounts for GBP API |
