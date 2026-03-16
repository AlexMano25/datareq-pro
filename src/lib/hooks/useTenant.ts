'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TenantData {
  tenant_id: string;
  role: string;
  user_id: string;
}

export function useTenant() {
  // Create client inside hook to avoid SSR module-level issues
  const supabase = useMemo(() => createClient(), []);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTenant(userId: string) {
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, role')
        .eq('user_id', userId)
        .single();
      if (data && mounted) {
        setTenant({ ...data, user_id: userId });
      }
      if (mounted) setLoading(false);
    }

    // Try to get user immediately
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        loadTenant(user.id);
      } else {
        // User not ready yet — wait for auth state change
        if (mounted) setLoading(true);
      }
    });

    // Listen for auth state changes (session restored from cookies, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && mounted) {
          loadTenant(session.user.id);
        } else if (!session && mounted) {
          setTenant(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { tenant, loading, supabase };
}

