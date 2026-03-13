import { createServerSupabase } from './supabase/server';

export async function getCurrentUser() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentTenant() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('tenant_users')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .single();
  return data;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireTenant() {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error('No tenant');
  return tenant;
}
