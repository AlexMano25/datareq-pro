import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantData = await requireTenant();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('forms')
      .select('*, form_fields(*)')
      .eq('id', id)
      .eq('tenant_id', tenantData.tenant_id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    // Sort fields by order
    if (data.form_fields) {
      data.form_fields.sort((a: any, b: any) => a.order_index - b.order_index);
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantData = await requireTenant();
    const body = await req.json();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('forms')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantData.tenant_id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
