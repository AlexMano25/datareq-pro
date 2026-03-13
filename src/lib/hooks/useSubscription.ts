'use client';
import { useEffect, useState } from 'react';
import { useTenant } from './useTenant';

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  max_projects: number;
  max_forms_per_project: number;
  max_responses_per_month: number;
  max_users: number;
  features: Record<string, boolean>;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'suspended';
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  plans: Plan;
}

interface SubscriptionLimits {
  projects: { used: number; max: number };
  forms: { used: number; max: number };
  users: { used: number; max: number };
  responses: { used: number; max: number };
}

export function useSubscription() {
  const { tenant, supabase } = useTenant();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  useEffect(() => {
    if (tenant) fetchSubscription();
  }, [tenant]);

  async function fetchSubscription() {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, plans(*)')
      .eq('tenant_id', tenant!.tenant_id)
      .single();

    if (!error && data) {
      setSubscription(data as any);
      const plan = (data as any).plans;
      const now = new Date();
      const periodEnd = new Date(data.current_period_end);
      const trialEnd = data.trial_end ? new Date(data.trial_end) : null;

      // Check lock status
      if (data.status === 'expired' || data.status === 'suspended') {
        setIsLocked(true);
        setLockReason(data.status === 'expired' ? 'Votre période d\'essai est terminée.' : 'Votre compte est suspendu.');
      } else if (data.status === 'past_due') {
        setIsLocked(true);
        setLockReason('Votre paiement est en retard. Veuillez mettre à jour votre moyen de paiement.');
      } else if (data.status === 'canceled' && periodEnd < now) {
        setIsLocked(true);
        setLockReason('Votre abonnement a été annulé.');
      } else if (data.status === 'trialing' && trialEnd && trialEnd < now) {
        setIsLocked(true);
        setLockReason('Votre période d\'essai de 14 jours est terminée. Choisissez un plan pour continuer.');
      } else {
        setIsLocked(false);
        setLockReason(null);
      }

      // Fetch usage counts
      const [projectsRes, formsRes, usersRes, responsesRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant!.tenant_id),
        supabase.from('forms').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant!.tenant_id),
        supabase.from('tenant_users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant!.tenant_id),
        supabase.from('responses').select('id', { count: 'exact', head: true }).eq('form_id', tenant!.tenant_id), // approximate
      ]);

      setLimits({
        projects: { used: projectsRes.count || 0, max: plan.max_projects },
        forms: { used: formsRes.count || 0, max: plan.max_forms_per_project },
        users: { used: usersRes.count || 0, max: plan.max_users },
        responses: { used: responsesRes.count || 0, max: plan.max_responses_per_month },
      });
    }
    setLoading(false);
  }

  function canCreate(resource: 'projects' | 'forms' | 'users'): boolean {
    if (!limits || !subscription) return false;
    const limit = limits[resource];
    if (limit.max === -1) return true; // unlimited
    return limit.used < limit.max;
  }

  function daysRemaining(): number {
    if (!subscription) return 0;
    const end = subscription.status === 'trialing' && subscription.trial_end
      ? new Date(subscription.trial_end)
      : new Date(subscription.current_period_end);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return {
    subscription,
    limits,
    loading,
    isLocked,
    lockReason,
    canCreate,
    daysRemaining,
    refresh: fetchSubscription,
    plan: subscription?.plans || null,
  };
}
