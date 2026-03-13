'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/hooks/useTenant';

interface Project {
  id: string;
  name: string;
  description: string | null;
  geography: string | null;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', geography: '', objectives: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) fetchProjects();
  }, [tenant]);

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('tenant_id', tenant!.tenant_id)
      .order('created_at', { ascending: false });
    if (!error && data) setProjects(data);
    setLoading(false);
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from('projects')
      .insert({
        tenant_id: tenant!.tenant_id,
        name: form.name,
        description: form.description,
        geography: form.geography,
        objectives: form.objectives,
        created_by: tenant!.user_id,
      });
    if (!error) {
      setShowForm(false);
      setForm({ name: '', description: '', geography: '', objectives: '' });
      fetchProjects();
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-yellow-100 text-yellow-700',
  };

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projets d'étude</h1>
          <p className="text-gray-500">Gérez vos projets de collecte et conformité données</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + Nouveau projet
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProject} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone géographique</label>
              <input type="text" value={form.geography} onChange={e => setForm({...form, geography: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Europe, Afrique..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objectifs</label>
            <textarea value={form.objectives} onChange={e => setForm({...form, objectives: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={2} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2">Annuler</button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500 text-lg">Aucun projet pour le moment</p>
          <p className="text-gray-400 mt-2">Créez votre premier projet pour commencer</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}
              className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow block">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                  {project.description && <p className="text-gray-500 mt-1">{project.description}</p>}
                  {project.geography && <p className="text-sm text-gray-400 mt-1">📍 {project.geography}</p>}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || ''}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-3">Créé le {new Date(project.created_at).toLocaleDateString('fr-FR')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
