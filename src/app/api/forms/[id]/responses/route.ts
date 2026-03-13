import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireTenant();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('responses')
      .select('*, response_items(*, form_fields:form_field_id(label, field_type, is_pii))')
      .eq('form_id', id)
      .order('submitted_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
