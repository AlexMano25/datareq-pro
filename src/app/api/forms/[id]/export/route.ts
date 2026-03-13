import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireTenant();
    const supabase = await createServerSupabase();

    // Get form fields
    const { data: fields } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id)
      .order('order_index');
    if (!fields) return NextResponse.json({ error: 'No fields' }, { status: 404 });

    // Get responses with items
    const { data: responses } = await supabase
      .from('responses')
      .select('*, response_items(*)')
      .eq('form_id', id)
      .order('submitted_at', { ascending: false });
    if (!responses) return NextResponse.json({ error: 'No responses' }, { status: 404 });

    // Build CSV
    const headers = ['Response ID', 'Submitted At', ...fields.map(f => f.label)];
    const rows = responses.map(r => {
      const itemsMap = new Map(r.response_items.map((i: any) => [i.form_field_id, i]));
      return [
        r.id,
        r.submitted_at,
        ...fields.map(f => {
          const item = itemsMap.get(f.id) as any;
          if (!item) return '';
          // Use anonymized value for PII fields
          return f.is_pii && item.anonymized_value ? item.anonymized_value : (item.raw_value || '');
        }),
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="export-${id}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
