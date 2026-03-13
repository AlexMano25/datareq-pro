'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';

interface Stats {
  projects: number;
  forms: number;
  responses: number;
  pendingRequests: number;
  completedRequests: number;
  totalRequests: number;
  piiFields: number;
  publishedForms: number;
}

export default function AnalyticsPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) loadStats();
  }, [tenant]);

  async function loadStats() {
    const tid = tenant!.tenant_id;

    const [projectsRes, formsRes, responsesRes, requestsRes, piiRes] = await Promise.all([
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('tenant_id', tid),
      supabase.from('forms').select('id, status', { count: 'exact' }).eq('tenant_id', tid),
      supabase.from('responses').select('id, submitted_at, form_id', { count: 'exact' }).eq('tenant_id', tid).order('submitted_at', { ascending: false }).limit(5),
      supabase.from('data_subject_requests').select('*', { count: 'exact' }).eq('tenant_id', tid).order('created_at', { ascending: false }).limit(5),
      supabase.from('form_fields').select('id, form_id').eq('is_pii', true),
    ]);

    const publishedForms = formsRes.data?.filter((f: any) => f.status === 'published').length || 0;
    const pendingRequests = requestsRes.data?.filter((r: any) => r.status === 'pending' || r.status === 'in_progress').length || 0;
    const completedRequests = requestsRes.data?.filter((r: any) => r.status === 'completed').length || 0;

    setStats({
      projects: projectsRes.count || 0,
      forms: formsRes.count || 0,
      responses: responsesRes.count || 0,
      pendingRequests,
      completedRequests,
      totalRequests: requestsRes.count || 0,
      piiFields: piiRes.data?.length || 0,
      publishedForms,
    });

    setRecentResponses(responsesRes.data || []);
    setRecentRequests(requestsRes.data || []);
    setLoading(false);
  }

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement du tableau de bord...</div>;
  if (!stats) return <div className="text-center py-12 text-gray-400">Erreur de chargement</div>;

  const statCards = [
    { label: 'Projets actifs', value: stats.projects, icon: '📁', color: 'bg-blue-50 text-blue-700' },
    { label: 'Formulaires', value: `${stats.publishedForms}/${stats.forms}`, sub: 'publiés', icon: '📋', color: 'bg-green-50 text-green-700' },
    { label: 'Réponses collectées', value: stats.responses, icon: '📊', color: 'bg-purple-50 text-purple-700' },
    { label: 'Demandes RGPD', value: stats.totalRequests, sub: `${stats.pendingRequests} en attente`, icon: '🔒', color: 'bg-orange-50 text-orange-700' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const typeLabels: Record<string, string> = {
    access: 'Accès', delete: 'Suppression', rectification: 'Rectification',
    portability: 'Portabilité', objection: 'Opposition',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500">Vue d'ensemble de votre conformité données</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className={`rounded-xl p-5 ${card.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm opacity-75">{card.label}</div>
            {card.sub && <div className="text-xs opacity-60 mt-1">{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Compliance Score */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Score de conformité</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: 'Champs PII identifiés', value: stats.piiFields, status: stats.piiFields > 0 ? 'ok' : 'warning' },
            { label: 'Formulaires publiés', value: stats.publishedForms, status: stats.publishedForms > 0 ? 'ok' : 'info' },
            { label: 'Demandes traitées', value: stats.completedRequests, status: 'ok' },
            { label: 'Demandes en attente', value: stats.pendingRequests, status: stats.pendingRequests > 3 ? 'warning' : 'ok' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold ${
                item.status === 'ok' ? 'bg-green-100 text-green-700' :
                item.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '—'}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{item.value}</div>
              <div className="text-sm text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Responses */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dernières réponses</h2>
          {recentResponses.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune réponse pour le moment</p>
          ) : (
            <div className="space-y-3">
              {recentResponses.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm text-gray-700">Réponse #{r.id.slice(0, 8)}</span>
                    <span className="text-xs text-gray-400 ml-2">{r.source || 'web'}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.submitted_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent GDPR Requests */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demandes RGPD récentes</h2>
          {recentRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune demande pour le moment</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{r.requester_email}</span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{typeLabels[r.request_type] || r.request_type}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[r.status] || ''}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
