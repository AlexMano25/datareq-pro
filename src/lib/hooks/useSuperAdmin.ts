'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: 'datareq' } }
);

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!error && data) {
      setIsSuperAdmin(true);
      setAdminData(data);
    }
    setLoading(false);
  }

  // Admin operations
  async function getAllTenants() {
    const { data } = await supabase.from('tenants').select('*, subscriptions(*, plans(*)), tenant_users(*)');
    return data || [];
  }

  async function changePlan(tenantId: string, planId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ plan_id: planId, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);
    if (!error && adminData) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminData.id, action: 'change_plan', target_type: 'subscription', target_id: tenantId,
        details: { new_plan_id: planId },
      });
    }
    return { error };
  }

  async function suspendTenant(tenantId: string, reason: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'suspended', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);
    if (!error && adminData) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminData.id, action: 'suspend_tenant', target_type: 'tenant', target_id: tenantId,
        details: { reason },
      });
    }
    return { error };
  }

  async function reactivateTenant(tenantId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'active', current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);
    if (!error && adminData) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminData.id, action: 'reactivate_tenant', target_type: 'tenant', target_id: tenantId,
        details: {},
      });
    }
    return { error };
  }

  async function deleteTenant(tenantId: string) {
    if (adminData) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminData.id, action: 'delete_tenant', target_type: 'tenant', target_id: tenantId,
        details: {},
      });
    }
    const { error } = await supabase.from('tenants').delete().eq('id', tenantId);
    return { error };
  }

  async function extendTrial(tenantId: string, days: number) {
    const newEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('subscriptions')
      .update({ trial_end: newEnd, current_period_end: newEnd, status: 'trialing', updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId);
    if (!error && adminData) {
      await supabase.from('admin_audit_log').insert({
        admin_id: adminData.id, action: 'extend_trial', target_type: 'subscription', target_id: tenantId,
        details: { days, new_end: newEnd },
      });
    }
    return { error };
  }

  async function getAllInvoices() {
    const { data } = await supabase.from('invoices').select('*, tenants(name)').order('created_at', { ascending: false });
    return data || [];
  }

  async function getAuditLog() {
    const { data } = await supabase.from('admin_audit_log').select('*, super_admins(email)').order('created_at', { ascending: false }).limit(100);
    return data || [];
  }

  async function getPlans() {
    const { data } = await supabase.from('plans').select('*').order('sort_order');
    return data || [];
  }

  return {
    isSuperAdmin, loading, adminData, supabase,
    getAllTenants, changePlan, suspendTenant, reactivateTenant, deleteTenant, extendTrial, getAllInvoices, getAuditLog, getPlans,
  };
}
