import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, tenantName } = await req.json();
    const supabase = await createServerSupabase();

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

    const userId = authData.user?.id;
    if (!userId) return NextResponse.json({ error: 'Registration failed' }, { status: 500 });

    // 2. Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: tenantName || `${name}'s Organization` })
      .select()
      .single();
    if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 });

    // 3. Link user to tenant as admin
    await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: userId,
      role: 'admin',
    });

    return NextResponse.json({ user: authData.user, tenant }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
