import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTenant();
    const { id } = await params;
    const body = await req.json();
    const supabase = await createServerSupabase();

    // Get max order_index
    const { data: existingFields } = await supabase
      .from('form_fields')
      .select('order_index')
      .eq('form_id', id)
      .order('order_index', { ascending: false })
      .limit(1);
    const nextOrder = existingFields && existingFields.length > 0 ? existingFields[0].order_index + 1 : 0;

    const { data, error } = await supabase
      .from('form_fields')
      .insert({
        form_id: id,
        label: body.label,
        field_type: body.field_type,
        required: body.required || false,
        is_pii: body.is_pii || false,
        order_index: body.order_index ?? nextOrder,
        metadata: body.metadata || {},
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTenant();
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id)
      .order('order_index');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
