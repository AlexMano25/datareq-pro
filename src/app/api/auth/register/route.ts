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

    // 2. Create tenant and link user via SECURITY DEFINER function (bypasses RLS)
    const { data: tenant, error: tenantError } = await supabase.rpc('register_tenant', {
      p_user_id: userId,
      p_tenant_name: tenantName || `${name}'s Organization`,
    });
    if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 500 });

    // 3. Auto sign-in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      // Registration succeeded but auto-login failed - redirect to login page
      return NextResponse.json({ user: authData.user, tenant, needsLogin: true }, { status: 201 });
    }

    return NextResponse.json({ user: authData.user, tenant }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
