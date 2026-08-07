import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Service-role client for all table/storage access.
 * Bypasses RLS — never import this into client components or expose the key.
 * Auth/session must use `@/lib/supabase/server` (anon key) instead.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
