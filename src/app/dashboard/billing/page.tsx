'use client';

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePayment } from '@/lib/hooks/usePayment';

type PaymentMethod = 'mobile_money' | 'card';
type ModalMode = 'plan' | 'deposit';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  billing_period: string;
  max_projects: number;
  max_forms: number;
  max_users: number;
  max_responses: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  amount_xaf?: number;
  status: string;
  created_at: string;
  paid_at?: string;
  payment_method?: string;
  description?: string;
}

const DEPOSIT_PRESETS = [25, 50, 100, 200];

export default function BillingPage() {
  const { subscription, plan, limits, loading, isLocked, lockReason, daysRemaining, refresh } = useSubscription();
  const payment = usePayment();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [phone, setPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('plan');
  const [depositAmount, setDepositAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [tenant, setTenant] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Get tenant_id from auth user metadata or subscription
      const { data: { user } } = await supabase.auth.getUser();
      const tid = subscription?.tenant_id || user?.user_metadata?.tenant_id;
      if (tid) setTenant(tid);

      const { data: plansData } = await supabase.from('plans').select('*').order('price_monthly');
      if (plansData) setPlans(plansData);

      if (tid) {
        const { data: invData } = await supabase
          .from('invoices').select('*')
          .eq('tenant_id', tid)
          .order('created_at', { ascending: false }).limit(20);
        if (invData) setInvoices(invData);
      }
    }
    if (!loading) fetchData();
  }, [loading, subscription]);

  useEffect(() => {
    if (payment.status === 'success') { refresh(); setShowPaymentModal(false); }
  }, [payment.status, refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ps = params.get('payment');
    const ref = params.get('ref');
    if (ps === 'success' && ref) payment.checkStatus(ref);
  }, []);

  // Calculate balance from invoices
  const balance = invoices.reduce((acc, inv) => {
    if (inv.status !== 'paid') return acc;
    if (inv.description?.toLowerCase().includes('recharge')) return acc + inv.amount;
    return acc - inv.amount;
  }, 0);
  const balanceEur = balance / 100;
  const balanceXaf = Math.round(balanceEur * 655.957);

  const handlePlanPayment = (planId: string) => {
    setSelectedPlan(planId);
    setModalMode('plan');
    setShowPaymentModal(true);
    payment.reset();
  };

  const handleDeposit = () => {
    setModalMode('deposit');
    setShowPaymentModal(true);
    payment.reset();
  };

  const getPayAmount = (): number => {
    if (modalMode === 'deposit') {
      return customAmount ? parseFloat(customAmount) : depositAmount;
    }
    const sp = plans.find(p => p.id === selectedPlan);
    return sp ? sp.price_monthly / 100 : 0;
  };

  const submitPayment = async () => {
    const tid = tenant || subscription?.tenant_id;
    if (!tid) return;

    const amount = getPayAmount();
    if (!amount || amount <= 0) return;

    const isMobile = paymentMethod === 'mobile_money';

    if (isMobile && phone.length < 9) return;
    if (!isMobile && (!cardName || !cardEmail)) return;

    const nameParts = cardName.split(' ');
    const firstName = isMobile ? 'Client' : (nameParts[0] || 'Client');
    const lastName = isMobile ? 'DataReq' : (nameParts.slice(1).join(' ') || 'DataReq');

    await payment.initiatePayment({
      tenant_id: tid,
      subscription_id: subscription?.id,
      plan_id: modalMode === 'plan' ? selectedPlan || undefined : undefined,
      payment_method: paymentMethod,
      phone_number: phone || undefined,
      first_name: firstName,
      last_name: lastName,
      email: isMobile ? 'client@datareq.pro' : cardEmail,
      amount_eur: amount,
      description: modalMode === 'deposit' ? `Recharge compte - ${amount} EUR` : undefined,
    });
  };

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      trialing: 'bg-blue-100 text-blue-800', active: 'bg-green-100 text-green-800',
      past_due: 'bg-yellow-100 text-yellow-800', canceled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800', suspended: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      trialing: 'Essai gratuit', active: 'Actif', past_due: 'Paiement en retard',
      canceled: 'Annul\u00E9', expired: 'Expir\u00E9', suspended: 'Suspendu',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>;
  }

  function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
    const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500';
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium">{used} / {max === -1 ? '\u221E' : max}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full ${color}`} style={{ width: `${max === -1 ? 10 : pct}%` }} />
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6"><div className="h-32 bg-gray-100 rounded animate-pulse" /></div>
        <div className="bg-white rounded-lg shadow p-6"><div className="h-32 bg-gray-100 rounded animate-pulse" /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Facturation & Abonnement</h1>

      {/* Top cards: Plan + Solde */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-500">Plan actuel</h2>
            {subscription && statusBadge(subscription.status)}
          </div>
          <p className={`text-2xl font-bold ${plan ? 'text-blue-600' : 'text-red-500'}`}>
            {plan ? plan.name : 'Aucun plan'}
          </p>
          {plan && plan.price_monthly > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {(plan.price_monthly / 100).toFixed(0)} \u20AC/mois ~ {Math.round((plan.price_monthly / 100) * 655.957).toLocaleString()} FCFA
            </p>
          )}
          {subscription?.status === 'trialing' && (
            <p className="text-sm text-blue-600 mt-2">Essai : {daysRemaining()} jours restants</p>
          )}
          {subscription?.current_period_end && (
            <p className="text-xs text-gray-400 mt-1">Renouvellement : {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}</p>
          )}
        </div>

        {/* Account Balance */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Solde du compte</h2>
          <p className="text-2xl font-bold text-green-700">
            {balanceEur.toFixed(2)} \u20AC <span className="text-sm font-normal text-gray-500">({balanceXaf.toLocaleString()} XAF)</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Rechargez pour payer automatiquement vos prochains mois</p>
          <button
            onClick={handleDeposit}
            className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-medium text-sm"
          >
            Recharger mon compte
          </button>
        </div>
      </div>

      {/* Usage */}
      {plan && limits && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Utilisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageBar label="Projets" used={limits.projects_used || 0} max={limits.max_projects} />
            <UsageBar label="Formulaires" used={limits.forms_used || 0} max={limits.max_forms} />
            <UsageBar label="Utilisateurs" used={limits.users_used || 0} max={limits.max_users} />
          </div>
        </div>
      )}

      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Acc\u00E8s restreint</p>
          <p className="text-red-600 text-sm mt-1">{lockReason}</p>
        </div>
      )}

      {/* Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{isLocked ? 'Renouveler votre abonnement' : 'Changer de plan'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.filter(p => p.name !== 'Enterprise').map(p => (
            <div key={p.id} className={`border rounded-lg p-4 ${p.id === plan?.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} \u20AC` : 'Gratuit'}
                <span className="text-sm text-gray-500 font-normal">/mois HT</span>
              </p>
              <p className="text-xs text-gray-400">~ {Math.round((p.price_monthly / 100) * 655.957).toLocaleString()} FCFA</p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600">
                <li>{p.max_projects === -1 ? 'Projets illimit\u00E9s' : `${p.max_projects} projets`}</li>
                <li>{p.max_forms === -1 ? 'Formulaires illimit\u00E9s' : `${p.max_forms} formulaires`}</li>
                <li>{p.max_users === -1 ? 'Utilisateurs illimit\u00E9s' : `${p.max_users} utilisateurs`}</li>
              </ul>
              <button
                onClick={() => handlePlanPayment(p.id)}
                className={`mt-4 w-full py-2 rounded-lg text-sm font-medium text-white ${p.id === plan?.id ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {p.id === plan?.id ? 'Renouveler' : p.price_monthly > (plan?.price_monthly || 0) ? 'Passer au plan' : 'Choisir ce plan'}
              </button>
            </div>
          ))}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-bold text-lg">Enterprise</h3>
            <p className="text-2xl font-bold text-gray-700 mt-2">Sur devis</p>
            <p className="text-sm text-gray-500 mt-1">Tout du plan Pro</p>
            <p className="text-sm text-gray-500">SSO / SAML 2.0</p>
            <p className="text-sm text-gray-500">Support d\u00E9di\u00E9</p>
            <a href="mailto:support@manovende.com?subject=DataReq Pro Enterprise"
              className="mt-4 block w-full text-center border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium">
              Contactez-nous
            </a>
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Historique de facturation</h2>
        {invoices.length === 0 ? <p className="text-gray-500 text-sm">Aucune facture pour le moment.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">N\u00B0</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4">EUR</th>
                <th className="pb-2 pr-4">XAF</th>
                <th className="pb-2 pr-4">Moyen</th>
                <th className="pb-2">Statut</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2 pr-4 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="py-2 pr-4">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-2 pr-4 text-xs max-w-[200px] truncate">{inv.description || '-'}</td>
                    <td className="py-2 pr-4">{(inv.amount / 100).toFixed(2)} \u20AC</td>
                    <td className="py-2 pr-4">{inv.amount_xaf ? `${inv.amount_xaf.toLocaleString()} FCFA` : '-'}</td>
                    <td className="py-2 pr-4 text-xs">
                      {inv.payment_method === 'campay_om' ? '\u{1F7E0} Mobile Money' : inv.payment_method === 'campay_card' ? '\u{1F4B3} Carte' : '-'}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.status === 'paid' ? 'Pay\u00E9e' : inv.status === 'pending' ? 'En attente' : '\u00C9chou\u00E9e'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {modalMode === 'deposit' ? 'Recharger mon compte' : 'Paiement'}
              </h3>
              <button onClick={() => { setShowPaymentModal(false); payment.reset(); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {(payment.status === 'idle' || payment.status === 'failed') ? (<>
              {/* Amount display */}
              {modalMode === 'plan' && selectedPlan && (() => {
                const p = plans.find(pl => pl.id === selectedPlan);
                if (!p) return null;
                const xaf = Math.round((p.price_monthly / 100) * 655.957);
                return (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="font-medium">Plan {p.name}</p>
                    <p className="text-blue-600 font-bold">{(p.price_monthly / 100).toFixed(0)} \u20AC/mois = {xaf.toLocaleString()} FCFA</p>
                  </div>
                );
              })()}

              {/* Deposit amount selection */}
              {modalMode === 'deposit' && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Montant de la recharge</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {DEPOSIT_PRESETS.map(amt => (
                      <button
                        key={amt}
                        onClick={() => { setDepositAmount(amt); setCustomAmount(''); }}
                        className={`py-2 rounded-lg text-sm font-medium border ${!customAmount && depositAmount === amt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                      >
                        {amt} \u20AC
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">ou</span>
                    <div className="flex-1 flex">
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Montant personnalis\u00E9"
                        className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm"
                        min="5"
                      />
                      <span className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg px-3 py-2 text-sm text-gray-600">\u20AC</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    = {Math.round(getPayAmount() * 655.957).toLocaleString()} FCFA
                  </p>
                </div>
              )}

              {payment.status === 'failed' && payment.error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{payment.error}</div>
              )}

              {/* Payment method */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-gray-700">Moyen de paiement</label>
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${paymentMethod === 'mobile_money' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="pm" value="mobile_money" checked={paymentMethod === 'mobile_money'} onChange={() => setPaymentMethod('mobile_money')} className="mr-3" />
                  <span className="text-xl mr-2">\u{1F4F1}</span>
                  <div>
                    <p className="font-medium text-sm">Mobile Money</p>
                    <p className="text-xs text-gray-500">Orange Money ou MTN MoMo - CamPay d\u00E9tecte automatiquement</p>
                  </div>
                </label>
                <label className={`flex items-center p-3 border rounded-lg cursor-pointer ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <input type="radio" name="pm" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="mr-3" />
                  <span className="text-xl mr-2">\u{1F4B3}</span>
                  <div>
                    <p className="font-medium text-sm">Carte bancaire</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard - CamPay</p>
                  </div>
                </label>
              </div>

              {/* Phone number for mobile money */}
              {paymentMethod === 'mobile_money' && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Num\u00E9ro de t\u00E9l\u00E9phone</label>
                  <div className="flex">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2 text-sm text-gray-600">+237</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="6XX XXX XXX"
                      className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 text-sm"
                      maxLength={9}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Orange (69x, 65x) ou MTN (67x, 68x)</p>
                </div>
              )}

              {/* Card info */}
              {paymentMethod === 'card' && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nom complet</label>
                    <input type="text" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Pr\u00E9nom Nom" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                    <input type="email" value={cardEmail} onChange={(e) => setCardEmail(e.target.value)} placeholder="email@exemple.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              )}

              <button
                onClick={submitPayment}
                disabled={
                  (paymentMethod === 'mobile_money' && phone.length < 9) ||
                  (paymentMethod === 'card' && (!cardName || !cardEmail)) ||
                  getPayAmount() <= 0
                }
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {modalMode === 'deposit'
                  ? `Recharger ${getPayAmount()} \u20AC (${Math.round(getPayAmount() * 655.957).toLocaleString()} FCFA)`
                  : 'Proc\u00E9der au paiement'}
              </button>
            </>) : payment.status === 'processing' ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Connexion \u00E0 CamPay...</p>
                <p className="text-xs text-gray-400 mt-2">Veuillez patienter quelques secondes</p>
              </div>
            ) : payment.status === 'pending' ? (
              <div className="text-center py-6">
                <div className="animate-pulse text-5xl mb-4">{paymentMethod === 'mobile_money' ? '\u{1F4F1}' : '\u{1F4B3}'}</div>
                <p className="font-medium text-lg mb-2">
                  {paymentMethod === 'mobile_money' ? 'Confirmez sur votre t\u00E9l\u00E9phone' : 'Finalisez le paiement par carte'}
                </p>
                {payment.ussdCode && <p className="text-sm text-gray-500 mb-2">Composez {payment.ussdCode} si besoin</p>}
                {payment.amountXaf && <p className="text-blue-600 font-bold">{payment.amountXaf.toLocaleString()} FCFA</p>}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  En attente de confirmation...
                </div>
              </div>
            ) : payment.status === 'success' ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">\u2705</div>
                <p className="font-bold text-lg text-green-700 mb-2">Paiement r\u00E9ussi !</p>
                {payment.invoiceNumber && <p className="text-sm text-gray-500">Facture {payment.invoiceNumber}</p>}
                <button onClick={() => { setShowPaymentModal(false); payment.reset(); }} className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Fermer</button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

