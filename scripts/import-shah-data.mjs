// Import legacy "built by Shah" widget export into this project's Supabase DB.
//
//   node scripts/import-shah-data.mjs            # full import (businesses, reviews, widgets, images)
//   node scripts/import-shah-data.mjs --verify   # only print post-import counts / spot checks
//
// Sources (repo root):
//   built_by_shah_widgets.csv  — 392 widget rows (all imported, no dedup)
//   google_reviews.csv         — cached Google reviews per place_id
//
// Idempotent: everything is upserted on its natural key (place_id / id /
// google_review_id), so re-runs overwrite instead of duplicating.

import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

try {
  const envConfig = config({ path: path.join(ROOT, '.env.local') });
  if (envConfig.error) throw envConfig.error;
} catch {
  config();
}

const VERIFY_ONLY = process.argv.includes('--verify');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Minimal CSV parser (handles quoted fields, embedded "" quotes, newlines)
// ---------------------------------------------------------------------------
function parseCsv(text) {
  const rows = [];
  let field = '', row = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter(r => r.length > 1 || r[0] !== '').map(r =>
    Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

// ---------------------------------------------------------------------------
// Business-name resolution rules (see task spec)
// ---------------------------------------------------------------------------
const NAME_VARIANTS = {
  '10x Auto Group Inc': '10x Auto Group Inc new',
  'Auto Motive 7': 'Automotive 7',
  "Bella's Auto": "Bella's Auto Body",
  'CarStar Denton': 'Car Star Denton',
  'CarVive Auto Collision': 'Carvive Auto Shop',
  'Elite Body Shop': 'Elite Auto Body',
  'LG AutoBody': 'LG Auto Body',
  'National Auto Collision': 'National Auto Collision Shop',
  'Pit Stop Auto Collision': 'Pit Stop Collision',
  'Santa Fe Collsion': 'Santa Fe Collision',
  'Steel Auotbody': 'Steel Autobody',
  'the Collision Shop of Miami Dade': 'Collision Shop of Miami Dade',
};
const PACIFIC_RIMS = { name: 'Pacific Rims Auto Body Shop', placeId: 'ChIJ44JbW5LJwoAROuNuJquMtKU' };
const WRONG_PLACE_ID = 'ChIJUc5GEU3CQIYR0o6D5dOLCqM'; // SSR Distributors — never resolve to this

function extractName(widgetName) {
  const m = /\(([^)]*)\)/.exec(widgetName || '');
  return m ? m[1].trim() : null;
}

// ---------------------------------------------------------------------------
// Config -> column mappers
// ---------------------------------------------------------------------------
function mapBadgeConfig(cfg) {
  return {
    widget_type: 'google_reviews',
    sort_by: cfg.sortBy,
    // filterByRating is '5' | '4' | 'all' ('all' = no filter -> min_rating 1)
    min_rating: cfg.filterByRating === 'all' ? 1 : parseInt(cfg.filterByRating, 10) || 5,
    image_filtering: cfg.filterByImages,
    max_reviews: cfg.maxReviews,
    excluded_review_ids: Array.isArray(cfg.excludedReviewIds) ? cfg.excludedReviewIds : [],
    custom_business_name_enabled: cfg.useCustomBusinessName ?? false,
    custom_business_name: cfg.customBusinessName ?? null,
    star_color: cfg.primaryColor,
    text_color: cfg.textColor,
    font_family: cfg.fontFamily,
    border_radius: cfg.borderRadius,
    padding: cfg.badgePadding,
    star_size: cfg.starSize,
    google_icon_size: cfg.googleIconSize,
    badge_background_type: cfg.backgroundType,
    badge_background_color: cfg.badgeBackgroundColor,
    badge_border_color: cfg.badgeBorderColor,
    cta_background_color: cfg.callToActionBackgroundColor,
    cta_text_color: cfg.callToActionTextColor,
    drawer_background_color: cfg.drawerBackgroundColor,
    drawer_text_color: cfg.drawerTextColor,
    drawer_card_background_color: cfg.drawerCardBackgroundColor,
    drawer_card_border_color: cfg.drawerCardBorderColor,
    drawer_card_radius: cfg.drawerCardBorderRadius,
    layout: cfg.badgeLayout,
    position: cfg.positionType,
    alignment: cfg.badgeAlignment,
    full_width: cfg.fullWidth,
    cta_enabled: cfg.showCallToAction,
    cta_text: cfg.callToActionText,
    badge_show_business_name: cfg.showBusinessName,
    badge_show_review_count: cfg.showReviewCount,
    badge_compact_mode: cfg.compactMode,
    drawer_show_business_info: cfg.showBusinessInfo,
    drawer_show_star_ratings: cfg.showRatings,
    drawer_show_dates: cfg.showDates,
    drawer_show_author_photos: cfg.showAuthorPhotos,
    drawer_show_review_images: cfg.showReviewImages,
    thumbnail_size: cfg.reviewImageThumbnailSize,
    drawer_reviews_per_page: cfg.reviewsPerPage,
    drawer_width: cfg.drawerWidth,
    // source uses 'full'; target convention is 'fullscreen'
    drawer_mobile_mode: cfg.mobileDrawerMode === 'full' ? 'fullscreen' : cfg.mobileDrawerMode,
  };
}

function mapCarouselConfig(cfg) {
  return {
    widget_type: 'google_reviews_carousel',
    sort_by: cfg.sortBy,
    min_rating: cfg.filterByRating === 'all' ? 1 : parseInt(cfg.filterByRating, 10) || 5,
    image_filtering: cfg.filterByImages,
    max_reviews: cfg.maxReviews,
    excluded_review_ids: Array.isArray(cfg.excludedReviewIds) ? cfg.excludedReviewIds : [],
    star_color: cfg.primaryColor,
    text_color: cfg.textColor,
    font_family: cfg.fontFamily,
    badge_background_type: cfg.backgroundType,
    badge_background_color: cfg.backgroundColor,
    // carousel card styling lives in the shared drawer_card_* columns
    drawer_card_background_color: cfg.cardBackgroundColor,
    drawer_card_border_color: cfg.cardBorderColor,
    drawer_card_radius: cfg.borderRadius,
    drawer_show_business_info: cfg.showBusinessInfo,
    drawer_show_star_ratings: cfg.showRatings,
    drawer_show_dates: cfg.showDates,
    drawer_show_author_photos: cfg.showAuthorPhotos,
    drawer_show_review_images: cfg.showReviewImages,
    thumbnail_size: cfg.reviewImageThumbnailSize,
    // source uses 'pixels'; target convention is 'fixed'
    carousel_width_type: cfg.widthType === 'pixels' ? 'fixed' : cfg.widthType,
    carousel_width_value: cfg.widthValue,
    carousel_reviews_per_slide: cfg.reviewsPerSlide,
    carousel_max_width: cfg.containerMaxWidth,
    carousel_card_padding: cfg.cardPadding,
    carousel_card_gap: cfg.cardGap,
    carousel_text_max_height: cfg.reviewTextMaxHeight,
    carousel_autoplay: cfg.autoPlay,
    carousel_show_overall_rating: cfg.showBusinessRating,
  };
}

function mapGoogleReviewsConfig(cfg, widgetType) {
  const row = widgetType === 'GOOGLE_REVIEWS_CAROUSEL' ? mapCarouselConfig(cfg) : mapBadgeConfig(cfg);
  // strip undefined so upserts only touch provided columns
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
}

function mapBeforeAfterConfig(cfg, imageUrlMap) {
  const s = cfg.styles || {};
  const rewrite = (url) => (url && imageUrlMap.get(url)) || url || '';
  let aspectRatio = s.aspectRatio;
  if (aspectRatio === 'custom' && s.customAspectWidth && s.customAspectHeight) {
    aspectRatio = `${s.customAspectWidth}:${s.customAspectHeight}`;
  }
  return Object.fromEntries(Object.entries({
    before_image_url: rewrite(cfg.beforeImage),
    after_image_url: rewrite(cfg.afterImage),
    background_type: s.backgroundType,
    background_color: s.backgroundColor,
    label_background_color: s.labelBackgroundColor,
    label_text_color: s.textColor,
    font_family: s.fontFamily,
    shadow: s.shadowStyle,
    border_radius: s.borderRadius,
    before_label: s.beforeLabel,
    after_label: s.afterLabel,
    width_type: s.widthType,
    width_value: s.widthValue,
    aspect_ratio: aspectRatio,
    slider_position: s.startingPosition,
    show_labels: s.showLabels,
    show_instruction_text: s.showInstructions,
    instruction_text: s.instructionText,
    instruction_size: s.instructionFontSize,
    // preventScrollHijacking=true means the slider captures touch drags -> capture_touch_mode
    capture_touch_mode: s.preventScrollHijacking,
  }).filter(([, v]) => v !== undefined));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsertBatches(table, rows, onConflict, batchSize = 200) {
  // PostgREST pads missing keys with NULL across a batch (breaking NOT NULL
  // columns), so group rows by their exact key set before batching.
  const groups = new Map();
  for (const row of rows) {
    const sig = Object.keys(row).sort().join(',');
    (groups.get(sig) ?? groups.set(sig, []).get(sig)).push(row);
  }
  let done = 0;
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += batchSize) {
      const batch = group.slice(i, i + batchSize);
      const { error } = await supabase.from(table).upsert(batch, { onConflict });
      if (error) throw new Error(`${table} upsert failed at row ${i}: ${error.message}`);
      done += batch.length;
    }
    console.log(`  ${table}: upserted ${done}/${rows.length}`);
  }
  return done;
}

async function getTableColumns(tables) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ANY($1)`, [tables]);
  await client.end();
  const map = {};
  for (const r of res.rows) (map[r.table_name] ??= new Set()).add(r.column_name);
  return map;
}

function filterToColumns(table, row, columns, droppedKeys) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (columns[table].has(k)) out[k] = v;
    else droppedKeys[table].add(k);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Image re-upload: old project's storage -> this project's widget-images bucket
// ---------------------------------------------------------------------------
const OLD_STORAGE_HOST = 'xyfxwlkyzpqydzqcszeu.supabase.co';
const BUCKET = 'widget-images';

async function migrateImages(urls) {
  const map = new Map(); // old url -> new url
  let moved = 0, failed = 0;
  const unique = [...new Set(urls.filter(Boolean))];
  console.log(`  ${unique.length} unique images to migrate`);
  for (const url of unique) {
    if (!url.includes(OLD_STORAGE_HOST)) { map.set(url, url); continue; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = (url.split('?')[0].match(/\.[a-z0-9]+$/i)?.[0]) || '.webp';
      const filename = url.split('?')[0].split('/').pop();
      const storagePath = `shah-import/${filename}`;
      const contentType = res.headers.get('content-type') || `image/${ext.slice(1)}`;
      const { error } = await supabase.storage.from(BUCKET)
        .upload(storagePath, buf, { contentType, upsert: true });
      if (error) throw new Error(error.message);
      const newUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
      map.set(url, newUrl);
      moved++;
    } catch (err) {
      console.warn(`  WARN image download/upload failed, keeping original URL: ${url} (${err.message})`);
      map.set(url, url);
      failed++;
    }
  }
  console.log(`  images migrated: ${moved}, failed (kept original): ${failed}`);
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const widgetRows = parseCsv(readFileSync(path.join(ROOT, 'built_by_shah_widgets.csv'), 'utf8'));
  const reviewRows = parseCsv(readFileSync(path.join(ROOT, 'google_reviews.csv'), 'utf8'));
  console.log(`Loaded ${widgetRows.length} widget rows, ${reviewRows.length} review-cache rows`);

  const reviewsByPlace = new Map();
  for (const r of reviewRows) {
    let reviews;
    try { reviews = JSON.parse(r.reviews || '[]'); } catch { reviews = []; }
    let placeInfo = {};
    try { placeInfo = JSON.parse(r.place_info || '{}'); } catch { /* ignore */ }
    reviewsByPlace.set(r.place_id, { reviews, placeInfo, cachedAt: r.cached_at });
  }

  // --- name -> placeId from GOOGLE_REVIEWS_* configs -------------------------
  const nameToPlace = new Map();
  for (const w of widgetRows) {
    if (!w.widget_type.startsWith('GOOGLE_REVIEWS')) continue;
    const name = extractName(w.widget_name);
    if (!name) continue;
    if (name === PACIFIC_RIMS.name) { nameToPlace.set(name, PACIFIC_RIMS.placeId); continue; }
    let cfg = {};
    try { cfg = JSON.parse(w.config_json); } catch { /* ignore */ }
    if (cfg.placeId) nameToPlace.set(name, cfg.placeId);
  }
  for (const [variant, canonical] of Object.entries(NAME_VARIANTS)) {
    if (nameToPlace.has(canonical)) nameToPlace.set(variant, nameToPlace.get(canonical));
  }

  // --- resolve every widget to a placeId -------------------------------------
  const unresolved = [];
  const placeIdOf = (w, cfg) => {
    const name = extractName(w.widget_name);
    if (name && nameToPlace.has(name)) return nameToPlace.get(name);
    if (w.widget_type.startsWith('GOOGLE_REVIEWS') && cfg.placeId && cfg.placeId !== WRONG_PLACE_ID) {
      return cfg.placeId; // widgets without "(Name)" in the title (e.g. SSR PERFORMANCE)
    }
    return null;
  };

  const parsed = widgetRows.map(w => {
    let cfg = {};
    try { cfg = JSON.parse(w.config_json); } catch (e) { console.warn(`  WARN bad config_json for ${w.widget_id}: ${e.message}`); }
    return { w, cfg, placeId: placeIdOf(w, cfg) };
  });

  const businessPlaceIds = new Set();
  for (const p of parsed) {
    if (p.placeId) {
      if (!reviewsByPlace.has(p.placeId)) { unresolved.push(`${p.w.widget_name} (${p.placeId} not in google_reviews.csv)`); p.placeId = null; }
      else businessPlaceIds.add(p.placeId);
    } else if (p.w.widget_type.startsWith('GOOGLE_REVIEWS') || p.w.widget_type === 'BEFORE_AFTER_SLIDER' || p.w.widget_type === 'PROMO_BANNER') {
      unresolved.push(p.w.widget_name);
    }
  }
  if (unresolved.length) console.warn(`  WARN ${unresolved.length} widgets without a resolvable business:`, unresolved.slice(0, 10));
  console.log(`Resolved ${businessPlaceIds.size} distinct businesses`);

  if (VERIFY_ONLY) return verify();

  // --- actual columns (avoid writing to non-existent columns) ----------------
  const columns = await getTableColumns(['businesses', 'reviews', 'widgets', 'before_after_widgets', 'generic_widgets']);
  const droppedKeys = { widgets: new Set(), before_after_widgets: new Set(), generic_widgets: new Set(), businesses: new Set(), reviews: new Set() };

  // --- 1. businesses ----------------------------------------------------------
  console.log('\n[1/5] businesses');
  const businessRows = [...businessPlaceIds].map(pid => {
    const { placeInfo } = reviewsByPlace.get(pid);
    return filterToColumns('businesses', {
      name: placeInfo.title || pid,
      place_id: pid,
      address: placeInfo.address ?? null,
      average_rating: placeInfo.rating ?? 0,
      total_reviews: placeInfo.reviews ?? 0,
    }, columns, droppedKeys);
  });
  await upsertBatches('businesses', businessRows, 'place_id');

  const { data: bizRows, error: bizErr } = await supabase.from('businesses').select('id, place_id');
  if (bizErr) throw new Error(`fetch businesses: ${bizErr.message}`);
  const businessIdByPlace = new Map(bizRows.map(b => [b.place_id, b.id]));

  // --- 2. reviews -------------------------------------------------------------
  console.log('\n[2/5] reviews');
  const reviewRowsOut = [];
  let noGoogleId = 0;
  for (const pid of businessPlaceIds) {
    const businessId = businessIdByPlace.get(pid);
    const { reviews } = reviewsByPlace.get(pid);
    const seen = new Set();
    for (const rv of reviews) {
      const gid = rv.review_id || null;
      if (!gid) noGoogleId++;
      if (gid) {
        if (seen.has(gid)) continue; // dup within same place
        seen.add(gid);
      }
      reviewRowsOut.push({
        business_id: businessId,
        google_review_id: gid,
        author_name: rv.user?.name ?? null,
        author_photo_url: rv.user?.thumbnail ?? null,
        rating: rv.rating ?? 0,
        text: rv.snippet ?? rv.extracted_snippet ?? null,
        relative_time: rv.date ?? null,
        images: Array.isArray(rv.images) ? rv.images : [],
      });
    }
  }
  // reviews without a google_review_id would duplicate on re-run (NULL never
  // conflicts) -> remove existing null-id rows for these businesses first
  const bizIds = [...businessPlaceIds].map(p => businessIdByPlace.get(p));
  const { error: delErr } = await supabase.from('reviews').delete()
    .is('google_review_id', null).in('business_id', bizIds);
  if (delErr) throw new Error(`reviews cleanup: ${delErr.message}`);
  await upsertBatches('reviews',
    reviewRowsOut.map(r => filterToColumns('reviews', r, columns, droppedKeys)),
    'google_review_id', 200);
  if (noGoogleId) console.log(`  (${noGoogleId} reviews had no review_id; imported with google_review_id = NULL)`);

  // --- 3. images (before after sliders) --------------------------------------
  console.log('\n[3/5] before/after image migration');
  const baWidgets = parsed.filter(p => p.w.widget_type === 'BEFORE_AFTER_SLIDER');
  const imageUrls = baWidgets.flatMap(p => [p.cfg.beforeImage, p.cfg.afterImage]);
  const imageUrlMap = await migrateImages(imageUrls);

  // --- 4. widgets -------------------------------------------------------------
  console.log('\n[4/5] widgets');
  const grWidgets = parsed.filter(p => p.w.widget_type.startsWith('GOOGLE_REVIEWS') && p.placeId);
  const skippedGr = parsed.filter(p => p.w.widget_type.startsWith('GOOGLE_REVIEWS') && !p.placeId);
  if (skippedGr.length) console.warn(`  WARN skipping ${skippedGr.length} GOOGLE_REVIEWS widgets with no business`);
  const widgetRowsDb = grWidgets.map(({ w, cfg, placeId }) => {
    const cached = reviewsByPlace.get(placeId);
    return filterToColumns('widgets', {
      id: w.widget_id,
      business_id: businessIdByPlace.get(placeId),
      name: w.widget_name,
      ...mapGoogleReviewsConfig(cfg, w.widget_type),
      cached_reviews: cached.reviews,
      last_synced_at: cached.cachedAt || null,
      created_at: w.created_at || undefined,
      updated_at: w.updated_at || undefined,
    }, columns, droppedKeys);
  });
  await upsertBatches('widgets', widgetRowsDb, 'id');

  // --- 5. before_after_widgets + generic_widgets ------------------------------
  console.log('\n[5/5] before_after_widgets + generic_widgets');
  const baRowsDb = baWidgets.map(({ w, cfg }) => filterToColumns('before_after_widgets', {
    id: w.widget_id,
    name: w.widget_name,
    ...mapBeforeAfterConfig(cfg, imageUrlMap),
    created_at: w.created_at || undefined,
    updated_at: w.updated_at || undefined,
  }, columns, droppedKeys));
  await upsertBatches('before_after_widgets', baRowsDb, 'id');

  const generic = parsed.filter(p => ['CONTACT_FORM', 'PRICING_TABLE', 'PROMO_BANNER'].includes(p.w.widget_type));
  const genericRowsDb = generic.map(({ w, cfg, placeId }) => filterToColumns('generic_widgets', {
    id: w.widget_id,
    business_id: placeId ? businessIdByPlace.get(placeId) : null,
    widget_type: w.widget_type,
    name: w.widget_name,
    config: cfg,
    is_active: w.is_active === 'True',
    created_at: w.created_at || undefined,
    updated_at: w.updated_at || undefined,
  }, columns, droppedKeys));
  await upsertBatches('generic_widgets', genericRowsDb, 'id');

  for (const [table, keys] of Object.entries(droppedKeys)) {
    if (keys.size) console.log(`\nDropped mapped keys with no column on ${table}:`, [...keys]);
  }

  await verify();
}

// ---------------------------------------------------------------------------
async function verify() {
  console.log('\n=== verification ===');
  const count = async (table, filter) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) q = filter(q);
    const { count: c, error } = await q;
    if (error) throw new Error(`${table} count: ${error.message}`);
    return c;
  };
  console.log('businesses:', await count('businesses'));
  console.log('reviews:', await count('reviews'));
  console.log('widgets total:', await count('widgets'));
  for (const t of ['google_reviews', 'google_reviews_carousel']) {
    console.log(`  widget_type=${t}:`, await count('widgets', q => q.eq('widget_type', t)));
  }
  console.log('before_after_widgets:', await count('before_after_widgets'));
  for (const t of ['CONTACT_FORM', 'PRICING_TABLE', 'PROMO_BANNER']) {
    console.log(`  generic ${t}:`, await count('generic_widgets', q => q.eq('widget_type', t)));
  }

  // spot check: Gary's Auto Collision Center
  const GARY = 'ChIJcUMQcWSGwoARvkzrWYmBXB0';
  const { data: gary } = await supabase.from('businesses').select('*').eq('place_id', GARY).single();
  console.log("\nGary's business:", gary && { name: gary.name, rating: gary.average_rating, total: gary.total_reviews });
  const { data: gWidgets } = await supabase.from('widgets').select('id, widget_type, name, star_color, min_rating').eq('business_id', gary.id);
  console.log("Gary's widgets:", gWidgets);
  const { data: gReviews } = await supabase.from('reviews').select('author_name, rating, relative_time').eq('business_id', gary.id).limit(3);
  console.log("Gary's sample reviews:", gReviews);
  const { data: gBa } = await supabase.from('before_after_widgets').select('id, name, before_image_url').eq('id', 'a4462581-5eff-453d-9509-b00ce07fb6aa').single();
  console.log("Gary's before/after:", gBa);
}

main().catch(err => { console.error('IMPORT FAILED:', err); process.exit(1); });
