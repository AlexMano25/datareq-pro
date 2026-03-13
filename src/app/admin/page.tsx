'use client';
import { useEffect, useState } from 'react';
import { useSuperAdmin } from '@/lib/hooks/useSuperAdmin';
import { useRouter } from 'next/navigation';

type Tab = 'tenants' | 'plans' | 'invoices' | 'audit';

export default function SuperAdminPage() {
  const router = useRouter();
  const { isSuperAdmin, loading, getAllTenants, changePlan, suspendTenant, reactivateTenant, deleteTenant, extendTrial, getAllInvoices, getAuditLog, getPlans } = useSuperAdmin();
  const [tab, setTab] = useState<Tab>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ type: string; tenant: any } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [extendDays, setExtendDays] = useState(14);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/dashboard/analytics');
    }
  }, [loading, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) loadData();
  }, [isSuperAdmin, tab]);

  async function loadData() {
    setDataLoading(true);
    if (tab === 'tenants') {
      const data = await getAllTenants();
      setTenants(data);
      const p = await getPlans();
      setPlans(p);
    } else if (tab === 'plans') {
      const p = await getPlans();
      setPlans(p);
    } else if (tab === 'invoices') {
      const inv = await getAllInvoices();
      setInvoices(inv);
    } else if (tab === 'audit') {
      const log = await getAuditLog();
      setAuditLog(log);
    }
    setDataLoading(false);
  }

  async function handleAction() {
    if (!actionModal) return;
    const { type, tenant } = actionModal;
    let result;
    if (type === 'suspend') result = await suspendTenant(tenant.id, 'Admin action');
    else if (type === 'reactivate') result = await reactivateTenant(tenant.id);
    else if (type === 'delete') result = await deleteTenant(tenant.id);
    else if (type === 'change_plan') result = await changePlan(tenant.id, selectedPlan);
    else if (type === 'extend_trial') result = await extendTrial(tenant.id, extendDays);
    setActionModal(null);
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Chargement...</div>;
  if (!isSuperAdmin) return null;

  const statusColors: Record<string, string> = {
    trialing: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-700',
    expired: 'bg-orange-100 text-orange-700',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-red-400 text-lg font-bold">â</span>
          <h1 className="text-lg font-bold">DataReq Pro â Super Admin</h1>
        </div>
        <a href="/dashboard/analytics" className="text-gray-400 hover:text-white text-sm">â Retour au dashboard</a>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-6">
          {([
            { key: 'tenants', label: 'Comptes clients', icon: 'ð¥' },
            { key: 'plans', label: 'Plans', icon: 'ð' },
            { key: 'invoices', label: 'Factures', icon: 'ð³' },
            { key: 'audit', label: 'Journal admin', icon: 'ð' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`py-3 px-2 border-b-2 text-sm font-medium transition ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Stats bar */}
        {tab === 'tenants' && !dataLoading && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Total comptes" value={tenants.length} color="blue" />
            <StatCard label="Actifs / Essai" value={tenants.filter(t => {
              const sub = t.subscriptions?.[0];
              return sub && ['active', 'trialing'].includes(sub.status);
            }).length} color="green" />
            <StatCard label="ExpirÃ©s / Suspendus" value={tenants.filter(t => {
              const sub = t.subscriptions?.[0];
              return sub && ['expired', 'suspended', 'past_due'].includes(sub.status);
            }).length} color="red" />
            <StatCard label="MRR estimÃ©" value={`${tenants.reduce((sum, t) => {
              const sub = t.subscriptions?.[0];
              if (sub && sub.status === 'active' && sub.plans) return sum + (sub.plans.price_monthly || 0);
              return sum;
            }, 0) / 100} â¬`} color="purple" />
          </div>
        )}

        {dataLoading ? (
          <div className="text-center py-12 text-gray-400">Chargement des donnÃ©es...</div>
        ) : tab === 'tenants' ? (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Utilisateurs</th>
                  <th className="px-4 py-3">ÃchÃ©ance</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const sub = t.subscriptions?.[0];
                  const plan = sub?.plans;
                  return (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-4 py-3 font-medium">{plan?.display_name || 'â'}</td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sub.status] || ''}`}>
                            {sub.status}
                          </span>
                        ) : 'â'}
                      </td>
                      <td className="px-4 py-3">{t.tenant_users?.length || 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('fr-FR') : 'â'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setSelectedPlan(plans[1]?.id || ''); setActionModal({ type: 'change_plan', tenant: t }); }}
                            className="text-blue-600 hover:underline text-xs">Plan</button>
                          {sub?.status === 'suspended' ? (
                            <button onClick={() => setActionModal({ type: 'reactivate', tenant: t })}
                              className="text-green-600 hover:underline text-xs">RÃ©activer</button>
                          ) : (
                            <button onClick={() => setActionModal({ type: 'suspend', tenant: t })}
                              className="text-orange-600 hover:underline text-xs">Suspendre</button>
                          )}
                          <button onClick={() => setActionModal({ type: 'extend_trial', tenant: t })}
                            className="text-purple-600 hover:underline text-xs">Essai+</button>
                          <button onClick={() => setActionModal({ type: 'delete', tenant: t })}
                            className="text-red-600 hover:underline text-xs">Suppr.</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : tab === 'plans' ? (
          <div className="grid grid-cols-3 gap-4">
            {plans.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-gray-900">{p.display_name}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} â¬/mois` : 'Sur devis'}
                </p>
                <div className="mt-4 space-y-1 text-sm text-gray-600">
                  <p>Projets : {p.max_projects === -1 ? 'IllimitÃ©s' : p.max_projects}</p>
                  <p>Formulaires : {p.max_forms_per_project === -1 ? 'IllimitÃ©s' : p.max_forms_per_project}</p>
                  <p>RÃ©ponses/mois : {p.max_responses_per_month === -1 ? 'IllimitÃ©es' : p.max_responses_per_month}</p>
                  <p>Utilisateurs : {p.max_users === -1 ? 'IllimitÃ©s' : p.max_users}</p>
                </div>
                <p className="text-xs text-gray-400 mt-3">Stripe ID : {p.stripe_price_id_monthly || 'Non configurÃ©'}</p>
              </div>
            ))}
          </div>
        ) : tab === 'invoices' ? (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {invoices.length === 0 ? (
              <p className="p-6 text-gray-400 text-center">Aucune facture</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">NÂ°</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-t">
                      <td className="px-4 py-3 font-mono">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.tenants?.name || 'â'}</td>
                      <td className="px-4 py-3 font-medium">{(inv.amount / 100).toFixed(2)} â¬</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {auditLog.length === 0 ? (
              <p className="p-6 text-gray-400 text-center">Aucune action enregistrÃ©e</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Cible</th>
                    <th className="px-4 py-3">DÃ©tails</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((log: any) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-4 py-3 text-gray-500">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                      <td className="px-4 py-3">{log.super_admins?.email || 'â'}</td>
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 font-mono text-xs">{log.target_id?.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {actionModal.type === 'suspend' && 'Suspendre le compte'}
              {actionModal.type === 'reactivate' && 'RÃ©activer le compte'}
              {actionModal.type === 'delete' && 'Supprimer le compte'}
              {actionModal.type === 'change_plan' && 'Changer le plan'}
              {actionModal.type === 'extend_trial' && 'Prolonger l\'essai'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Client : <strong>{actionModal.tenant.name}</strong></p>

            {actionModal.type === 'change_plan' && (
              <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4">
                {plans.map(p => <option key={p.id} value={p.id}>{p.display_name} â {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)}â¬/mois` : 'Sur devis'}</option>)}
              </select>
            )}

            {actionModal.type === 'extend_trial' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">Nombre de jours</label>
                <input type="number" value={extendDays} onChange={e => setExtendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg" min={1} max={365} />
              </div>
            )}

            {actionModal.type === 'delete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                Cette action est irrÃ©versible. Toutes les donnÃ©es du client seront dÃ©finitivement supprimÃ©es.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setActionModal(null)} className="px-4 py-2 text-gray-500">Annuler</button>
              <button onClick={handleAction}
                className={`px-4 py-2 rounded-lg text-white font-medium ${actionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600', green: 'text-green-600', red: 'text-red-600', purple: 'text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
