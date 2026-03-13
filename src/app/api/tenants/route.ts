import { createServerSupabase } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, region } = await req.json();
    const supabase = await createServerSupabase();

    const { data: tenant, error } = await supabase
      .from('tenants')
      .insert({ name, region: region || 'eu-west-1' })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      role: 'admin',
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
