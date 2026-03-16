'use client';
import { useEffect, useState } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useTenant } from '@/lib/hooks/useTenant';
import { usePayment } from '@/lib/hooks/usePayment';

const EUR_XAF = 655.957;

export default function BillingPage() {
  const { subscription, plan, limits, loading, daysRemaining, isLocked, lockReason, refresh } = useSubscription();
  const { tenant, supabase } = useTenant();
  const payment = usePayment();
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Payment modal state
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'card'>('orange_money');
  const [phone, setPhone] = useState('');
  const [cardInfo, setCardInfo] = useState({ first_name: '', last_name: '', email: '' });

  useEffect(() => {
    if (tenant) {
      Promise.all([fetchPlans(), fetchInvoices()]).then(() => setDataLoaded(true));
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

  function handleSelectPlan(p: any) {
    setSelectedPlan(p);
    setShowPaymentModal(true);
  }

  async function handlePay() {
    if (!selectedPlan || !subscription || !tenant) return;
    const params: any = {
      tenant_id: tenant.tenant_id,
      subscription_id: subscription.id,
      plan_id: selectedPlan.id,
      payment_method: paymentMethod,
      amount_eur: selectedPlan.price_monthly / 100,
    };
    if (paymentMethod === 'orange_money') {
      if (!phone) return;
      params.phone_number = phone;
    } else {
      if (!cardInfo.first_name || !cardInfo.last_name || !cardInfo.email) return;
      params.first_name = cardInfo.first_name;
      params.last_name = cardInfo.last_name;
      params.email = cardInfo.email;
    }
    await payment.initiatePayment(params);
  }

  useEffect(() => {
    if (payment.status === 'success') {
      setTimeout(() => {
        refresh();
        fetchInvoices();
        setShowPaymentModal(false);
        setShowUpgrade(false);
        payment.reset();
      }, 2000);
    }
  }, [payment.status]);

  // Check URL params for payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    const ref = params.get('ref');
    if (paymentResult === 'success' && ref) {
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/billing');
      refresh();
      fetchInvoices();
    }
  }, []);

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <Skeleton className="h-5 w-48 mb-4" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)}
        </div>
      </div>
    );
  }

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

      {/* Lock warning */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-medium">{lockReason}</p>
        </div>
      )}

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
              <p className="text-gray-500 mt-1">
                {(plan.price_monthly / 100).toFixed(0)} €/mois HT
                <span className="text-gray-400 text-sm ml-2">
                  ({Math.round((plan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF)
                </span>
              </p>
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
          <div className="flex gap-2">
            {subscription && plan && plan.price_monthly > 0 && (subscription.status === 'trialing' || subscription.status === 'expired' || subscription.status === 'past_due') && (
              <button onClick={() => handleSelectPlan(plan)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                Payer maintenant
              </button>
            )}
            <button onClick={() => setShowUpgrade(!showUpgrade)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              {isLocked ? 'Choisir un plan' : 'Changer de plan'}
            </button>
          </div>
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
            <div key={p.id} className={`bg-white rounded-xl shadow p-6 border-2 transition-all ${plan?.id === p.id ? 'border-blue-500' : 'border-transparent hover:border-blue-200'}`}>
              <h3 className="font-semibold text-lg text-gray-900">{p.display_name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} €` : 'Gratuit'}
                {p.price_monthly > 0 && <span className="text-sm text-gray-400 font-normal">/mois</span>}
              </p>
              {p.price_monthly > 0 && (
                <p className="text-xs text-gray-400">{Math.round((p.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF</p>
              )}
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>{p.max_projects === -1 ? 'Projets illimités' : `${p.max_projects} projets`}</li>
                <li>{p.max_forms_per_project === -1 ? 'Formulaires illimités' : `${p.max_forms_per_project} formulaires/projet`}</li>
                <li>{p.max_responses_per_month === -1 ? 'Réponses illimitées' : `${p.max_responses_per_month} réponses/mois`}</li>
                <li>{p.max_users === -1 ? 'Utilisateurs illimités' : `${p.max_users} utilisateur${p.max_users > 1 ? 's' : ''}`}</li>
              </ul>
              {plan?.id === p.id ? (
                <div className="mt-4 text-center text-sm text-blue-600 font-medium py-2">Plan actuel</div>
              ) : (
                <button onClick={() => handleSelectPlan(p)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  {p.price_monthly > (plan?.price_monthly || 0) ? 'Passer au plan ' + p.display_name : 'Choisir'}
                </button>
              )}
            </div>
          ))}
          <div className="bg-white rounded-xl shadow p-6 border-2 border-transparent">
            <h3 className="font-semibold text-lg text-gray-900">Enterprise</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">Sur devis</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>Tout du plan Pro</li>
              <li>SSO / SAML 2.0</li>
              <li>Support dédié & SLA</li>
              <li>Déploiement on-premise</li>
            </ul>
            <a href="mailto:contact@manovende.com" className="mt-4 block w-full text-center border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium">
              Contactez-nous
            </a>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Paiement — {selectedPlan.display_name}</h3>
                <p className="text-sm text-gray-500">
                  {(selectedPlan.price_monthly / 100).toFixed(0)} € / mois
                  ({Math.round((selectedPlan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF)
                </p>
              </div>
              <button onClick={() => { setShowPaymentModal(false); payment.reset(); }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {payment.status === 'idle' && (
              <>
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'orange_money' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <input type="radio" name="pm" value="orange_money" checked={paymentMethod === 'orange_money'}
                      onChange={() => setPaymentMethod('orange_money')} className="hidden" />
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium text-gray-900">Orange Money</p>
                      <p className="text-xs text-gray-500">Paiement mobile money</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input type="radio" name="pm" value="card" checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')} className="hidden" />
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Carte bancaire</p>
                      <p className="text-xs text-gray-500">Visa / Mastercard via CamPay</p>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'orange_money' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Orange Money</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="6XXXXXXXX" maxLength={12}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    <p className="text-xs text-gray-400 mt-1">Un push USSD sera envoyé sur ce numéro</p>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                        <input type="text" value={cardInfo.first_name}
                          onChange={e => setCardInfo({...cardInfo, first_name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                        <input type="text" value={cardInfo.last_name}
                          onChange={e => setCardInfo({...cardInfo, last_name: e.target.value})}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={cardInfo.email}
                        onChange={e => setCardInfo({...cardInfo, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                )}

                <button onClick={handlePay}
                  disabled={paymentMethod === 'orange_money' ? !phone : (!cardInfo.first_name || !cardInfo.last_name || !cardInfo.email)}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  Payer {(selectedPlan.price_monthly / 100).toFixed(0)} € ({Math.round((selectedPlan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF)
                </button>
              </>
            )}

            {payment.status === 'processing' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Traitement en cours...</p>
              </div>
            )}

            {payment.status === 'pending' && (
              <div className="text-center py-6">
                <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">En attente de confirmation</p>
                {paymentMethod === 'orange_money' ? (
                  <p className="text-sm text-gray-500">Confirmez le paiement sur votre téléphone.</p>
                ) : (
                  <p className="text-sm text-gray-500">Complétez le paiement dans l&apos;onglet ouvert.</p>
                )}
                {payment.amountXaf && (
                  <p className="text-lg font-bold text-gray-900 mt-3">{payment.amountXaf.toLocaleString('fr-FR')} XAF</p>
                )}
              </div>
            )}

            {payment.status === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-bold text-lg">Paiement réussi !</p>
                <p className="text-sm text-gray-500 mt-1">Votre abonnement a été activé.</p>
              </div>
            )}

            {payment.status === 'failed' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-700 font-bold">Paiement échoué</p>
                <p className="text-sm text-gray-500 mt-1">{payment.error}</p>
                <button onClick={() => payment.reset()}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Réessayer
                </button>
              </div>
            )}
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
                <th className="pb-2">Mode</th>
                <th className="pb-2">Statut</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-3 font-mono text-gray-900">{inv.invoice_number}</td>
                  <td className="py-3 text-gray-500">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3">
                    <span className="font-medium">{((inv.amount_cents || inv.amount || 0) / 100).toFixed(2)} €</span>
                    {inv.amount_xaf && (
                      <span className="text-gray-400 text-xs ml-1">({Number(inv.amount_xaf).toLocaleString('fr-FR')} XAF)</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-500 text-xs">
                    {inv.payment_method === 'campay_om' ? '📱 Orange' :
                     inv.payment_method === 'campay_card' ? '💳 Carte' :
                     inv.payment_method === 'ynote_mtn' ? '📱 MTN' :
                     inv.payment_method || '—'}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      inv.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'pending' ? 'En attente' : inv.status === 'failed' ? 'Échouée' : inv.status}
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
        <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
