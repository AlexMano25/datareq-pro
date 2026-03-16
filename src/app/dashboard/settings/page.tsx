'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { usePayment } from '@/lib/hooks/usePayment';
import Link from 'next/link';

const EUR_XAF = 655.957;

export default function SettingsPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const { subscription, plan, limits, loading: subLoading, isLocked, daysRemaining, refresh } = useSubscription();
  const payment = usePayment();

  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', region: '' });

  // Plan change
  const [plans, setPlans] = useState<any[]>([]);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'orange_money' | 'card'>('orange_money');
  const [phone, setPhone] = useState('');
  const [cardInfo, setCardInfo] = useState({ first_name: '', last_name: '', email: '' });

  useEffect(() => {
    if (tenant) loadSettings();
  }, [tenant]);

  async function loadSettings() {
    const [tenantRes, userRes, plansRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenant!.tenant_id).single(),
      supabase.auth.getUser(),
      supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
    ]);
    if (tenantRes.data) {
      setTenantInfo(tenantRes.data);
      setOrgForm({ name: tenantRes.data.name || '', region: tenantRes.data.region || '' });
    }
    setUserEmail(userRes.data?.user?.email || '');
    if (plansRes.data) setPlans(plansRes.data);
    setLoading(false);
  }

  async function updateOrg(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('tenants')
      .update({ name: orgForm.name, region: orgForm.region })
      .eq('id', tenant!.tenant_id);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  function handleSelectPlan(p: any) {
    setSelectedPlan(p);
    setShowPaymentModal(true);
    setCardInfo(prev => ({ ...prev, email: userEmail }));
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

  // After successful payment, refresh subscription
  useEffect(() => {
    if (payment.status === 'success') {
      setTimeout(() => {
        refresh();
        setShowPaymentModal(false);
        setShowPlanSelector(false);
        payment.reset();
      }, 2000);
    }
  }, [payment.status]);

  const isLoading = tenantLoading || loading;

  // Skeleton component
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow p-6 mb-6">
            <Skeleton className="h-5 w-36 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
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
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500">Configurez votre organisation et votre compte</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
          Paramètres sauvegardés avec succès.
        </div>
      )}

      {/* Organization */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organisation</h2>
        <form onSubmit={updateOrg} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;organisation</label>
            <input type="text" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Région / Pays</label>
            <input type="text" value={orgForm.region} onChange={e => setOrgForm({...orgForm, region: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant Tenant</label>
            <input type="text" value={tenant?.tenant_id || ''} disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500 text-sm font-mono" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            Sauvegarder
          </button>
        </form>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Compte utilisateur</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={userEmail} disabled
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              tenant?.role === 'admin' ? 'bg-red-100 text-red-700' :
              tenant?.role === 'contributor' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {tenant?.role === 'admin' ? 'Administrateur' : tenant?.role === 'contributor' ? 'Contributeur' : 'Lecteur'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription - Dynamic */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Abonnement</h2>
          {currentStatus && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-blue-900">{plan?.display_name || 'Aucun plan'}</span>
              {plan && (
                <p className="text-blue-600 text-sm mt-1">
                  {plan.max_projects === -1 ? 'Projets illimités' : `${plan.max_projects} projets`}
                  {' — '}
                  {plan.max_users === -1 ? 'Utilisateurs illimités' : `${plan.max_users} utilisateurs`}
                  {' — '}
                  {plan.max_responses_per_month === -1 ? 'Réponses illimitées' : `${plan.max_responses_per_month} réponses/mois`}
                </p>
              )}
              {subscription?.status === 'trialing' && (
                <p className="text-sm text-yellow-600 mt-2 font-medium">
                  Essai : {daysRemaining()} jour{daysRemaining() > 1 ? 's' : ''} restant{daysRemaining() > 1 ? 's' : ''}
                </p>
              )}
              {subscription?.status === 'active' && subscription.current_period_end && (
                <p className="text-sm text-gray-500 mt-2">
                  Prochain renouvellement : {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            {plan && plan.price_monthly > 0 && (
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-900">{(plan.price_monthly / 100).toFixed(0)} €</span>
                <span className="text-sm text-blue-600">/mois</span>
                <p className="text-xs text-gray-400">{Math.round((plan.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF</p>
              </div>
            )}
          </div>

          {/* Usage bars */}
          {limits && (
            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-blue-200/50">
              <MiniUsageBar label="Projets" used={limits.projects.used} max={limits.projects.max} />
              <MiniUsageBar label="Utilisateurs" used={limits.users.used} max={limits.users.max} />
              <MiniUsageBar label="Réponses" used={limits.responses.used} max={limits.responses.max} />
            </div>
          )}

          <div className="mt-5 flex gap-3">
            {/* Pay current plan */}
            {subscription && plan && plan.price_monthly > 0 && (subscription.status === 'trialing' || subscription.status === 'expired' || subscription.status === 'past_due') && (
              <button
                onClick={() => handleSelectPlan(plan)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                Payer mon plan
              </button>
            )}
            {/* Renew */}
            {subscription?.status === 'active' && plan && plan.price_monthly > 0 && (
              <button
                onClick={() => handleSelectPlan(plan)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                Renouveler
              </button>
            )}
            <button
              onClick={() => setShowPlanSelector(!showPlanSelector)}
              className="border border-blue-300 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100/50 text-sm font-medium">
              {showPlanSelector ? 'Masquer les plans' : 'Changer de plan'}
            </button>
            <Link href="/dashboard/billing"
              className="text-blue-600 text-sm font-medium hover:underline py-2 px-2">
              Voir les factures
            </Link>
          </div>
        </div>

        {/* Plan selector */}
        {showPlanSelector && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {plans.filter(p => p.name !== 'enterprise').map(p => (
              <div key={p.id} className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                plan?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'
              }`} onClick={() => plan?.id !== p.id && handleSelectPlan(p)}>
                <h3 className="font-semibold text-gray-900">{p.display_name}</h3>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {p.price_monthly > 0 ? `${(p.price_monthly / 100).toFixed(0)} €` : 'Gratuit'}
                  {p.price_monthly > 0 && <span className="text-xs text-gray-400 font-normal">/mois</span>}
                </p>
                {p.price_monthly > 0 && (
                  <p className="text-xs text-gray-400">{Math.round((p.price_monthly / 100) * EUR_XAF).toLocaleString('fr-FR')} XAF</p>
                )}
                <ul className="mt-2 space-y-1 text-xs text-gray-600">
                  <li>{p.max_projects === -1 ? 'Projets illimités' : `${p.max_projects} projets`}</li>
                  <li>{p.max_users === -1 ? 'Utilisateurs illimités' : `${p.max_users} utilisateurs`}</li>
                </ul>
                {plan?.id === p.id ? (
                  <div className="mt-3 text-center text-xs text-blue-600 font-medium py-1.5 bg-blue-100 rounded-lg">Plan actuel</div>
                ) : (
                  <div className="mt-3 text-center text-xs text-white font-medium py-1.5 bg-blue-600 rounded-lg hover:bg-blue-700">
                    Choisir ce plan
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
                {/* Payment method selection */}
                <div className="space-y-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'orange_money' ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
                  }`}>
                    <input type="radio" name="method" value="orange_money"
                      checked={paymentMethod === 'orange_money'}
                      onChange={() => setPaymentMethod('orange_money')} className="hidden" />
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium text-gray-900">Orange Money</p>
                      <p className="text-xs text-gray-500">Paiement par mobile money</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    paymentMethod === 'card' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <input type="radio" name="method" value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')} className="hidden" />
                    <span className="text-2xl">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Carte bancaire</p>
                      <p className="text-xs text-gray-500">Visa / Mastercard via CamPay</p>
                    </div>
                  </label>
                </div>

                {/* Orange Money fields */}
                {paymentMethod === 'orange_money' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Orange Money</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="6XXXXXXXX" maxLength={12}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    <p className="text-xs text-gray-400 mt-1">Un push USSD sera envoyé sur ce numéro</p>
                  </div>
                )}

                {/* Card fields */}
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
                  <p className="text-sm text-gray-500">Confirmez le paiement sur votre téléphone avec votre code PIN Orange Money.</p>
                ) : (
                  <p className="text-sm text-gray-500">Complétez le paiement dans l&apos;onglet qui s&apos;est ouvert.</p>
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

      {/* Data & Security */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Données & Sécurité</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Hébergement</p>
              <p className="text-sm text-gray-500">Union Européenne (eu-west-1)</p>
            </div>
            <span className="text-green-600 text-sm">Conforme RGPD</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Chiffrement</p>
              <p className="text-sm text-gray-500">AES-256 au repos, TLS 1.3 en transit</p>
            </div>
            <span className="text-green-600 text-sm">Actif</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Pseudonymisation PII</p>
              <p className="text-sm text-gray-500">SHA-256 + masquage partiel</p>
            </div>
            <span className="text-green-600 text-sm">Activée</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Sauvegardes</p>
              <p className="text-sm text-gray-500">Automatiques quotidiennes, 30 jours de rétention</p>
            </div>
            <span className="text-green-600 text-sm">Actives</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow p-6 border-2 border-red-100">
        <h2 className="text-lg font-semibold text-red-700 mb-4">Zone de danger</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Exporter toutes les données</p>
              <p className="text-sm text-gray-500">Télécharger un export complet de votre organisation</p>
            </div>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Exporter
            </button>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-red-100">
            <div>
              <p className="font-medium text-red-700">Supprimer l&apos;organisation</p>
              <p className="text-sm text-red-400">Cette action est irréversible et supprimera toutes vos données.</p>
            </div>
            <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm font-medium">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniUsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 10 : Math.min(100, (used / max) * 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-blue-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-blue-700">{label}</span>
        <span className="font-medium text-blue-900">{used}/{isUnlimited ? '∞' : max}</span>
      </div>
      <div className="w-full bg-blue-200/40 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
