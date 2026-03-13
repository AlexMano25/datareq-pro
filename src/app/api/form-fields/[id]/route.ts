import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTenant();
    const { id } = await params;
    const body = await req.json();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('form_fields')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireTenant();
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { error } = await supabase.from('form_fields').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
