import { supabase } from '@/lib/db';
import { SettingsPage } from '@/components/SettingsPage';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const { data: domains } = await supabase
    .from('allowed_domains')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="min-h-screen p-10">
      <SettingsPage initialDomains={domains ?? []} />
    </div>
  );
}
