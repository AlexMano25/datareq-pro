'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: string;
  created_at: string;
}

export default function AuditPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (tenant) loadAuditLog();
  }, [tenant]);

  async function loadAuditLog() {
    // Try to fetch from audit_logs table if it exists
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenant!.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEntries(data);
    } else {
      // Generate synthetic audit from existing data
      const synthetic: AuditEntry[] = [];

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, created_by')
        .eq('tenant_id', tenant!.tenant_id);
      projects?.forEach(p => {
        synthetic.push({
          id: `proj-${p.id}`,
          action: 'create',
          entity_type: 'project',
          entity_id: p.id,
          user_id: p.created_by || tenant!.user_id,
          details: `Projet créé : "${p.name}"`,
          created_at: p.created_at,
        });
      });

      // Fetch forms
      const { data: forms } = await supabase
        .from('forms')
        .select('id, name, status, created_at')
        .eq('tenant_id', tenant!.tenant_id);
      forms?.forEach(f => {
        synthetic.push({
          id: `form-${f.id}`,
          action: f.status === 'published' ? 'publish' : 'create',
          entity_type: 'form',
          entity_id: f.id,
          user_id: tenant!.user_id,
          details: `Formulaire ${f.status === 'published' ? 'publié' : 'créé'} : "${f.name}"`,
          created_at: f.created_at,
        });
      });

      // Fetch responses
      const { data: responses } = await supabase
        .from('responses')
        .select('id, submitted_at, source')
        .eq('tenant_id', tenant!.tenant_id);
      responses?.forEach(r => {
        synthetic.push({
          id: `resp-${r.id}`,
          action: 'submit',
          entity_type: 'response',
          entity_id: r.id,
          user_id: 'public',
          details: `Réponse soumise (source: ${r.source || 'web'})`,
          created_at: r.submitted_at,
        });
      });

      // Fetch data requests
      const { data: requests } = await supabase
        .from('data_subject_requests')
        .select('id, request_type, requester_email, status, created_at')
        .eq('tenant_id', tenant!.tenant_id);
      requests?.forEach(r => {
        synthetic.push({
          id: `dsr-${r.id}`,
          action: 'request',
          entity_type: 'data_request',
          entity_id: r.id,
          user_id: r.requester_email,
          details: `Demande RGPD (${r.request_type}) de ${r.requester_email} — ${r.status}`,
          created_at: r.created_at,
        });
      });

      // Sort by date descending
      synthetic.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEntries(synthetic);
    }
    setLoading(false);
  }

  const actionIcons: Record<string, string> = {
    create: '➕', publish: '📢', submit: '📥', request: '🔒',
    update: '✏️', delete: '🗑️', export: '📤', login: '🔑',
  };

  const entityColors: Record<string, string> = {
    project: 'bg-blue-50 text-blue-600',
    form: 'bg-green-50 text-green-600',
    response: 'bg-purple-50 text-purple-600',
    data_request: 'bg-orange-50 text-orange-600',
  };

  const entityLabels: Record<string, string> = {
    project: 'Projet', form: 'Formulaire', response: 'Réponse', data_request: 'Demande RGPD',
  };

  const entityTypes = Array.from(new Set(entries.map(e => e.entity_type)));
  const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.entity_type === filter);

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement du journal d'audit...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal d'audit</h1>
        <p className="text-gray-500">Traçabilité complète des actions sur votre organisation</p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-blue-700 text-sm">
          Le journal d'audit enregistre toutes les actions effectuées dans votre espace. Il constitue une preuve de conformité en cas de contrôle par une autorité de protection des données (CNIL, etc.).
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}>
          Tout ({entries.length})
        </button>
        {entityTypes.map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}>
            {entityLabels[type] || type} ({entries.filter(e => e.entity_type === type).length})
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Aucune entrée dans le journal.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                <div className="text-xl mt-1">{actionIcons[entry.action] || '📄'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{entry.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${entityColors[entry.entity_type] || 'bg-gray-100 text-gray-600'}`}>
                      {entityLabels[entry.entity_type] || entry.entity_type}
                    </span>
                    <span className="text-xs text-gray-400">
                      par {entry.user_id === 'public' ? 'Anonyme' : entry.user_id.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                  <br />
                  {new Date(entry.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
