import { supabase } from '@/lib/db';
import { formFromDbRow } from '@/lib/form-config';
import {
  FormEditor,
  type FormEditorWidget,
} from '@/components/editor/FormEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Multi-Step Form — Editor',
};

export default async function FormWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const { data: widgets } = await supabase
    .from('form_widgets')
    .select('*')
    .order('created_at', { ascending: true });

  const items: FormEditorWidget[] = (widgets ?? []).map((w) => ({
    widgetId: w.id,
    widgetName: w.name,
    initialConfig: formFromDbRow(w),
  }));

  return <FormEditor items={items} initialSelectedId={id} />;
}