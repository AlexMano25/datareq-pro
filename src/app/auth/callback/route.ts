import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const setup = searchParams.get('setup');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'datareq' },
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has a tenant, if not create one (for Google OAuth signups)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (!tenantUser) {
          // First-time Google OAuth user — create their tenant
          const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Mon organisation';
          await supabase.rpc('register_tenant', {
            p_user_id: user.id,
            p_tenant_name: `${displayName}'s Organization`,
          });
        }
      }

      return NextResponse.redirect(`${origin}/dashboard/projects`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
