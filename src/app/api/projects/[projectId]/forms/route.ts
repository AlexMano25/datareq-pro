import { createServerSupabase } from '@/lib/supabase/server';
import { requireTenant } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const tenantData = await requireTenant();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', tenantData.tenant_id)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const tenantData = await requireTenant();
    const body = await req.json();
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('forms')
      .insert({
        tenant_id: tenantData.tenant_id,
        project_id: projectId,
        name: body.name,
        description: body.description,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
