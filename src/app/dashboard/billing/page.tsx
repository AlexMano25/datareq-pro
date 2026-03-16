'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { useTenant } from '@/lib/hooks/useTenant';
import { usePayment } from '@/lib/hooks/usePayment';

const EUR_XAF = 655.957;

type ModalMode = 'plan' | 'deposit' | null;

export default function BillingPage() {
  const { subscription, plan, limits, loading, daysRemaining, isLocked, lockReason, refresh } = useSubscription();
  const { tenant, supabase } = useTenant();
  const payment = usePayment();
  const [plans, setPlans] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [balance, setBalance] = useState<number>(0);

  // Payment modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'card'>('orange_money');
  const [phone, setPhone] = useState('');
  const [cardInfo, setCardInfo] = useState({ first_name: '', last_name: '', email: '' });
  const [depositAmountEur, setDepositAmountEur] = useState(50);
  const [customDeposit, setCustomDeposit] = useState('');

  const fetchInvoices = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenant.tenant_id)
      .order('created_at', { ascending: false });
    if (data) {
      setInvoices(data);
      // Calculate balance from paid deposits minus paid subscription invoices
      let bal = 0;
      for (const inv of data) {
        if (inv.status === 'paid') {
          const amt = (inv.amount_cents || inv.amount || 0) / 100;
          if (inv.description?.includes('Dépôt') || inv.description?.includes('Recharge')) {
            bal += amt;
          } else {
            bal -= amt;
          }
        }
      }
      setBalance(Math.max(0, bal));
    }
  }, [tenant, supabase]);

  useEffect(() => {
    if (tenant) {
      Promise.all([
        supabase.from('plans').select('*').eq('is_active', true).order('sort_order').then(({ data }) => { if (data) setPlans(data); }),
        fetchInvoices(),
      ]);
    }
  }, [tenant]);

  // Open plan payment modal
  function handleSelectPlan(p: any) {
    setSelectedPlan(p);
    setModalMode('plan');
  }

  // Open deposit modal
  function handleDeposit() {
    setSelectedPlan(null);
    setDepositAmountEur(50);
    setCustomDeposit('');
    setModalMode('deposit');
  }

  function getPayAmount(): number {
    if (modalMode === 'deposit') {
      return customDeposit ? parseFloat(customDeposit) : depositAmountEur;
    }
    return selectedPlan ? selectedPlan.price_monthly / 100 : 0;
  }

  async function handlePay() {
    if (!subscription || !tenant) return;
    const amountEur = getPayAmount();
    if (!amountEur || amountEur <= 0) return;

    const params: any = {
      tenant_id: tenant.tenant_id,
      subscription_id: subscription.id,
      plan_id: modalMode === 'plan' && selectedPlan ? selectedPlan.id : (plan?.id || subscription.plan_id),
      payment_method: paymentMethod,
      amount_eur: amountEur,
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
        setModalMode(null);
        payment.reset();
        setShowUpgrade(false);
      }, 2000);
    }
  }, [payment.status]);

  // Handle payment return from CamPay redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');
    if (paymentResult === 'success' || paymentResult === 'failed') {
      window.history.replaceState({}, '', '/dashboard/billing');
      if (paymentResult === 'success') {
        refresh();
        fetchInvoices();
      }
    }
  }, []);

  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6"><Skeleton className="h-5 w-32 mb-3" /><Skeleton className="h-9 w-48" /></div>
          <div className="bg-white rounded-xl shadow p-6"><Skeleton className="h-5 w-32 mb-3" /><Skeleton className="h-9 w-32" /></div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid grid-cols-3 gap-4"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
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
  const payAmount = getPayAmount();
  const payAmountXaf = Math.round(payAmount * EUR_XAF);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Facturation & Abonnement</h1>

      {/* Lock warning */}
      {isLocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-medium">{lockReason}</p>
        </div>
      )}

      {/* Top cards: Plan + Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Current Plan Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Plan actuel</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-blue-600">{plan?.display_name || 'Aucun'}</span>
            {currentStatus && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            )}
          </div>
          {plan && plan.price_monthly > 0 && (
            <p className="text-gray-500 text-sm mt-1">
              {(plan.price_monthly / 100).toFixed(0)} €/mois
              <span className="text-gray-400 ml-1">({Math.round((plan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF)</span>
            </p>
          )}
          {subscription?.status === 'trialing' && (
            <p className="text-xs text-yellow-600 mt-2">
              Essai : {daysRemaining()} jour{daysRemaining() > 1 ? 's' : ''} restant{daysRemaining() > 1 ? 's' : ''}
            </p>
          )}
          {subscription?.status === 'active' && subscription.current_period_end && (
            <p className="text-xs text-gray-400 mt-2">
              Renouvellement : {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            {plan && plan.price_monthly > 0 && (
              <button onClick={() => handleSelectPlan(plan)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm font-medium">
                {subscription?.status === 'active' ? 'Renouveler' : 'Payer mon plan'}
              </button>
            )}
            <button onClick={() => setShowUpgrade(!showUpgrade)}
              className="border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 text-sm font-medium">
              Changer de plan
            </button>
          </div>
        </div>

        {/* Balance / Deposit Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow p-6 border border-green-100">
          <h2 className="text-sm font-medium text-green-700 mb-2">Solde du compte</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-700">{balance.toFixed(2)} €</span>
            <span className="text-sm text-green-500">({Math.round(balance * EUR_XAF).toLocaleString('fr-FR')} XAF)</span>
          </div>
          <p className="text-xs text-green-600/70 mt-1">
            Rechargez votre compte pour payer vos prochains mois automatiquement
          </p>
          <button onClick={handleDeposit}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium w-full">
            Recharger mon compte
          </button>
        </div>
      </div>

      {/* Usage limits */}
      {limits && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-4">Utilisation</h2>
          <div className="grid grid-cols-3 gap-6">
            <UsageBar label="Projets" used={limits.projects.used} max={limits.projects.max} />
            <UsageBar label="Formulaires" used={limits.forms.used} max={limits.forms.max} />
            <UsageBar label="Utilisateurs" used={limits.users.used} max={limits.users.max} />
          </div>
        </div>
      )}

      {/* Plan selection */}
      {showUpgrade && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Changer de plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.filter(p => p.name !== 'enterprise').map(p => (
              <div key={p.id} className={`bg-white rounded-xl shadow p-6 border-2 transition-all ${plan?.id === p.id ? 'border-blue-500' : 'border-transparent hover:border-blue-200'}`}>
                <h3 className="font-semibold text-lg text-gray-900">{p.display_name}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} €` : 'Gratuit'}
                  {p.price_monthly > 0 && <span className="text-sm text-gray-400 font-normal">/mois</span>}
                </p>
                {p.price_monthly > 0 && (
                  <p className="text-xs text-gray-400">{Math.round((p.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF</p>
                )}
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <li>{p.max_projects === -1 ? 'Projets illimités' : `${p.max_projects} projets`}</li>
                  <li>{p.max_forms_per_project === -1 ? 'Formulaires illimités' : `${p.max_forms_per_project} form./projet`}</li>
                  <li>{p.max_responses_per_month === -1 ? 'Réponses illimitées' : `${p.max_responses_per_month} rép./mois`}</li>
                  <li>{p.max_users === -1 ? 'Utilisateurs illimités' : `${p.max_users} utilisateur${p.max_users > 1 ? 's' : ''}`}</li>
                </ul>
                {plan?.id === p.id ? (
                  <div className="mt-4 text-center text-sm text-blue-600 font-medium py-2 bg-blue-50 rounded-lg">Plan actuel</div>
                ) : (
                  <button onClick={() => handleSelectPlan(p)}
                    className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Choisir {p.display_name}
                  </button>
                )}
              </div>
            ))}
            <div className="bg-white rounded-xl shadow p-6 border-2 border-transparent">
              <h3 className="font-semibold text-lg text-gray-900">Enterprise</h3>
              <p className="text-2xl font-bold text-gray-900 mt-2">Sur devis</p>
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
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
        </div>
      )}

      {/* ========== PAYMENT MODAL ========== */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {modalMode === 'deposit' ? 'Recharger mon compte' : `Paiement — ${selectedPlan?.display_name}`}
                </h3>
                {modalMode === 'plan' && selectedPlan && (
                  <p className="text-sm text-gray-500">
                    {(selectedPlan.price_monthly / 100).toFixed(0)} € / mois
                    ({Math.round((selectedPlan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF)
                  </p>
                )}
              </div>
              <button onClick={() => { setModalMode(null); payment.reset(); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {payment.status === 'idle' && (
              <>
                {/* Deposit amount selection */}
                {modalMode === 'deposit' && (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Montant du dépôt</label>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[25, 50, 100, 200].map(amt => (
                        <button key={amt}
                          onClick={() => { setDepositAmountEur(amt); setCustomDeposit(''); }}
                          className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                            !customDeposit && depositAmountEur === amt
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-700 hover:border-green-300'
                          }`}>
                          {amt} €
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input type="number" value={customDeposit}
                        onChange={e => { setCustomDeposit(e.target.value); }}
                        placeholder="Montant personnalisé (EUR)"
                        min="5" step="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-sm" />
                      {payAmount > 0 && (
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          = {payAmountXaf.toLocaleString('fr-FR')} XAF
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment method */}
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

                {/* Phone for Orange Money */}
                {paymentMethod === 'orange_money' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Orange Money</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="6XXXXXXXX" maxLength={12}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    <p className="text-xs text-gray-400 mt-1">Un push USSD sera envoyé sur ce numéro</p>
                  </div>
                )}

                {/* Card info */}
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

                {/* Pay button */}
                <button onClick={handlePay}
                  disabled={payAmount <= 0 || (paymentMethod === 'orange_money' ? !phone : (!cardInfo.first_name || !cardInfo.last_name || !cardInfo.email))}
                  className={`w-full text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    modalMode === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}>
                  {modalMode === 'deposit' ? 'Recharger' : 'Payer'} {payAmount.toFixed(0)} € ({payAmountXaf.toLocaleString('fr-FR')} XAF)
                </button>
              </>
            )}

            {/* Processing */}
            {payment.status === 'processing' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Traitement en cours...</p>
              </div>
            )}

            {/* Pending */}
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

            {/* Success */}
            {payment.status === 'success' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-700 font-bold text-lg">
                  {modalMode === 'deposit' ? 'Recharge effectuée !' : 'Paiement réussi !'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {modalMode === 'deposit' ? 'Votre solde a été crédité.' : 'Votre abonnement a été activé.'}
                </p>
              </div>
            )}

            {/* Failed */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">N° Facture</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Montant</th>
                  <th className="pb-2">Mode</th>
                  <th className="pb-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="py-3 font-mono text-gray-900 text-xs">{inv.invoice_number}</td>
                    <td className="py-3 text-gray-500">{new Date(inv.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3 text-gray-700 text-xs max-w-[200px] truncate">{inv.description || '—'}</td>
                    <td className="py-3">
                      <span className="font-medium">{((inv.amount_cents || inv.amount || 0) / 100).toFixed(2)} €</span>
                      {inv.amount_xaf && (
                        <span className="text-gray-400 text-xs block">({Number(inv.amount_xaf).toLocaleString('fr-FR')} XAF)</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {inv.payment_method === 'campay_om' ? '📱 OM' :
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
