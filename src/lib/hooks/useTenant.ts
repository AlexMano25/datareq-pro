'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TenantData {
  tenant_id: string;
  role: string;
  user_id: string;
}

const supabase = createClient();

export function useTenant() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, role')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setTenant({ ...data, user_id: user.id });
      }
      setLoading(false);
    }
    loadTenant();
  }, []);

  return { tenant, loading, supabase };
}
