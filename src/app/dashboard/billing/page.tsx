'use client';
import { useEffect, useState } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useTenant } from '@/lib/hooks/useTenant';

export default function BillingPage() {
  const { subscription, plan, limits, loading, daysRemaining, isLocked, lockReason } = useSubscription();
  const { tenant, supabase } = useTenant();
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (tenant) {
      fetchPlans();
      fetchInvoices();
    }
  }, [tenant]);

  async function fetchPlans() {
    const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
    if (data) setPlans(data);
  }

  async function fetchInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenant!.tenant_id)
      .order('created_at', { ascending: false });
    if (data) setInvoices(data);
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  const statusLabels: Record<string, { label: string; color: string }> = {
    trialing: { label: 'Essai gratuit', color: 'bg-blue-100 text-blue-700' },
    active: { label: 'Actif', color: 'bg-green-100 text-green-700' },
    past_due: { label: 'Paiement en retard', color: 'bg-red-100 text-red-700' },
    canceled: { label: 'Annulé', color: 'bg-gray-100 text-gray-700' },
    expired: { label: 'Expiré', color: 'bg-red-100 text-red-700' },
    suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-700' },
  };

  const currentStatus = subscription ? statusLabels[subscription.status] || { label: subscription.status, color: 'bg-gray-100 text-gray-700' } : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Facturation & Abonnement</h1>

      {/* Current Plan */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Plan actuel</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold text-blue-600">{plan?.display_name || 'Aucun'}</span>
              {currentStatus && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
                  {currentStatus.label}
                </span>
              )}
            </div>
            {plan && plan.price_monthly > 0 && (
              <p className="text-gray-500 mt-1">{(plan.price_monthly / 100).toFixed(0)} €/mois HT</p>
            )}
            {subscription?.status === 'trialing' && (
              <p className="text-sm text-yellow-600 mt-2">
                Essai gratuit : {daysRemaining()} jour{daysRemaining() > 1 ? 's' : ''} restant{daysRemaining() > 1 ? 's' : ''}
                {subscription.trial_end && (
                  <span className="text-gray-400"> (expire le {new Date(subscription.trial_end).toLocaleDateString('fr-FR')})</span>
                )}
              </p>
            )}
            {subscription?.status === 'active' && subscription.current_period_end && (
              <p className="text-sm text-gray-400 mt-2">
                Prochain renouvellement : {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
          <button onClick={() => setShowUpgrade(!showUpgrade)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            {isLocked ? 'Choisir un plan' : 'Changer de plan'}
          </button>
        </div>

        {/* Usage limits */}
        {limits && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            <UsageBar label="Projets" used={limits.projects.used} max={limits.projects.max} />
            <UsageBar label="Formulaires" used={limits.forms.used} max={limits.forms.max} />
            <UsageBar label="Utilisateurs" used={limits.users.used} max={limits.users.max} />
          </div>
        )}
      </div>

      {/* Plan selection */}
      {showUpgrade && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {plans.filter(p => p.name !== 'enterprise').map(p => (
            <div key={p.id} className={`bg-white rounded-xl shadow p-6 border-2 ${plan?.id === p.id ? 'border-blue-500' : 'border-transparent'}`}>
              <h3 className="font-semibold text-lg text-gray-900">{p.display_name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} €` : 'Sur devis'}
                {p.price_monthly > 0 && <span className="text-sm text-gray-400 font-normal">/mois</span>}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>✓ {p.max_projects === -1 ? 'Projets illimités' : `${p.max_projects} projets`}</li>
                <li>✓ {p.max_forms_per_project === -1 ? 'Formulaires illimités' : `${p.max_forms_per_project} formulaires/projet`}</li>
                <li>✓ {p.max_responses_per_month === -1 ? 'Réponses illimitées' : `${p.max_responses_per_month} réponses/mois`}</li>
                <li>✓ {p.max_users === -1 ? 'Utilisateurs illimités' : `${p.max_users} utilisateur${p.max_users > 1 ? 's' : ''}`}</li>
              </ul>
              {plan?.id === p.id ? (
                <div className="mt-4 text-center text-sm text-blue-600 font-medium py-2">Plan actuel</div>
              ) : (
                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  {p.price_monthly > (plan?.price_monthly || 0) ? 'Passer au plan ' + p.display_name : 'Rétrograder'}
                </button>
              )}
            </div>
          ))}
          <div className="bg-white rounded-xl shadow p-6 border-2 border-transparent">
            <h3 className="font-semibold text-lg text-gray-900">Enterprise</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">Sur devis</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>✓ Tout du plan Pro</li>
              <li>✓ SSO / SAML 2.0</li>
              <li>✓ Support dédié & SLA</li>
              <li>✓ Déploiement on-premise</li>
            </ul>
            <a href="mailto:contact@manovende.com" className="mt-4 block w-full text-center border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium">
              Contactez-nous
            </a>
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique de facturation</h2>
        {invoices.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucune facture pour le moment.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">N° Facture</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Montant</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-3 font-mono text-gray-900">{inv.invoice_number}</td>
                  <td className="py-3 text-gray-500">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3 font-medium">{(inv.amount / 100).toFixed(2)} €</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'open' ? 'En attente' : inv.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {inv.invoice_pdf_url && (
                      <a href={inv.invoice_pdf_url} target="_blank" rel="noopener" className="text-blue-600 hover:underline">PDF</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 10 : Math.min(100, (used / max) * 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{used} / {isUnlimited ? '∞' : max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
