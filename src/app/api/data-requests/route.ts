import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const tenantData = await requireTenant();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('data_subject_requests')
      .select('*')
      .eq('tenant_id', tenantData.tenant_id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantData = await requireTenant();
    const body = await req.json();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('data_subject_requests')
      .insert({
        tenant_id: tenantData.tenant_id,
        requester_email: body.requester_email,
        request_type: body.request_type,
        notes: body.notes,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
