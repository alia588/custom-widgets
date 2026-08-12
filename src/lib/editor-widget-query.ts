import { supabase } from '@/lib/db';

const SELECT = '*, businesses(name, place_id, address, total_reviews, average_rating)';

/** Newly inserted rows can take a moment to become visible to a subsequent read. */
export async function getEditorWidget(id: string, widgetType: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await supabase
      .from('widgets')
      .select(SELECT)
      .eq('id', id)
      .eq('widget_type', widgetType)
      .maybeSingle();

    if (result.data || result.error) return result;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return { data: null, error: null };
}
