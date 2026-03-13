'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';

export default function SettingsPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', region: '' });

  useEffect(() => {
    if (tenant) loadSettings();
  }, [tenant]);

  async function loadSettings() {
    const [tenantRes, userRes] = await Promise.all([
      supabase.from('tenants').select('*').eq('id', tenant!.tenant_id).single(),
      supabase.auth.getUser(),
    ]);
    if (tenantRes.data) {
      setTenantInfo(tenantRes.data);
      setOrgForm({ name: tenantRes.data.name || '', region: tenantRes.data.region || '' });
    }
    setUserEmail(userRes.data?.user?.email || '');
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

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'organisation</label>
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

      {/* Subscription */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Abonnement</h2>
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-blue-900">Plan Pro</span>
              <p className="text-blue-600 text-sm mt-1">Projets illimités — 10 utilisateurs — 10 000 réponses/mois</p>
            </div>
            <span className="text-2xl font-bold text-blue-900">149€<span className="text-sm font-normal text-blue-600">/mois</span></span>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="text-blue-600 text-sm font-medium hover:underline">Changer de plan</button>
            <span className="text-blue-300">|</span>
            <button className="text-blue-600 text-sm font-medium hover:underline">Voir les factures</button>
          </div>
        </div>
      </div>

      {/* Data & Security */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Données & Sécurité</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Hébergement</p>
              <p className="text-sm text-gray-500">Union Européenne (eu-west-1)</p>
            </div>
            <span className="text-green-600 text-sm">✓ Conforme RGPD</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Chiffrement</p>
              <p className="text-sm text-gray-500">AES-256 au repos, TLS 1.3 en transit</p>
            </div>
            <span className="text-green-600 text-sm">✓ Actif</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Pseudonymisation PII</p>
              <p className="text-sm text-gray-500">SHA-256 + masquage partiel</p>
            </div>
            <span className="text-green-600 text-sm">✓ Activée</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Sauvegardes</p>
              <p className="text-sm text-gray-500">Automatiques quotidiennes, 30 jours de rétention</p>
            </div>
            <span className="text-green-600 text-sm">✓ Actives</span>
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
              <p className="font-medium text-red-700">Supprimer l'organisation</p>
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
