/** Shared Supabase env resolution for auth (anon) vs data (service role). */

export function getSupabaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!url) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }
  return url;
}

/** Publishable/anon key — safe for session/auth clients. Never use for data writes. */
export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    '';
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY'
    );
  }
  return key;
}
