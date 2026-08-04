import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const [name, placeId, address] = process.argv.slice(2);

if (!name || !placeId) {
  console.error('Usage: node scripts/add-business.mjs "Business Name" PLACE_ID "Address"');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. Upsert the managed business (place_id is unique)
const { data: business, error: businessError } = await supabase
  .from('businesses')
  .upsert(
    { name, place_id: placeId, address: address ?? null },
    { onConflict: 'place_id' }
  )
  .select('id, name, place_id')
  .single();

if (businessError) {
  console.error('Business upsert failed:', businessError.message);
  process.exit(1);
}

console.log('Business:', business.id, business.name);

// 2. Create its default Google Reviews widget (skip if one already exists)
const { data: existing } = await supabase
  .from('widgets')
  .select('id')
  .eq('business_id', business.id)
  .eq('widget_type', 'google_reviews');

if (existing && existing.length > 0) {
  console.log('Widget already exists:', existing[0].id);
} else {
  const { data: widget, error: widgetError } = await supabase
    .from('widgets')
    .insert({ business_id: business.id, name: `${name} — Google Reviews Badge` })
    .select('id, name')
    .single();

  if (widgetError) {
    console.error('Widget insert failed:', widgetError.message);
    process.exit(1);
  }
  console.log('Widget created:', widget.id, widget.name);
}

console.log('Done.');
