import { supabase } from '@/lib/db';
import { beforeAfterFromDbRow } from '@/lib/before-after-config';
import {
  BeforeAfterEditor,
  type BeforeAfterEditorWidget,
} from '@/components/editor/BeforeAfterEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Before/After Slider — Editor',
};

export default async function BeforeAfterWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const { data: widgets } = await supabase
    .from('before_after_widgets')
    .select('*')
    .order('created_at', { ascending: true });

  const items: BeforeAfterEditorWidget[] = (widgets ?? []).map((w) => ({
    widgetId: w.id,
    widgetName: w.name,
    initialConfig: beforeAfterFromDbRow(w),
  }));

  return <BeforeAfterEditor items={items} initialSelectedId={id} />;
}
