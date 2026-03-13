'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenant } from '@/lib/hooks/useTenant';

interface Form { id: string; name: string; status: string; is_public: boolean; public_token: string; created_at: string; }
interface Project { id: string; name: string; description: string; geography: string; objectives: string; status: string; forms: Form[]; }

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tenant, supabase } = useTenant();
  const [project, setProject] = useState<Project | null>(null);
  const [showFormCreate, setShowFormCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (tenant) fetchProject();
  }, [tenant, id]);

  async function fetchProject() {
    const { data, error } = await supabase
      .from('projects')
      .select('*, forms(*)')
      .eq('id', id as string)
      .eq('tenant_id', tenant!.tenant_id)
      .single();
    if (!error && data) setProject(data as any);
  }

  async function createForm(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('forms')
      .insert({
        tenant_id: tenant!.tenant_id,
        project_id: id as string,
        name: formData.name,
        description: formData.description,
      })
      .select()
      .single();
    if (!error && data) {
      setShowFormCreate(false);
      setFormData({ name: '', description: '' });
      router.push(`/dashboard/forms/${data.id}/builder`);
    }
  }

  if (!project) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <button onClick={() => router.push('/dashboard/projects')} className="text-blue-600 hover:underline text-sm mb-4 inline-block">← Retour aux projets</button>
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && <p className="text-gray-500 mt-2">{project.description}</p>}
        <div className="flex gap-4 mt-4 text-sm text-gray-400">
          {project.geography && <span>📍 {project.geography}</span>}
          <span className="capitalize">État: {project.status}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Formulaires</h2>
        <button onClick={() => setShowFormCreate(!showFormCreate)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          + Nouveau formulaire
        </button>
      </div>

      {showFormCreate && (
        <form onSubmit={createForm} className="bg-white rounded-xl shadow p-6 mb-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du formulaire</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Créer</button>
            <button type="button" onClick={() => setShowFormCreate(false)} className="text-gray-500 px-4 py-2">Annuler</button>
          </div>
        </form>
      )}

      {project.forms?.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow">
          <p className="text-gray-500">Aucun formulaire dans ce projet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {project.forms?.map(form => (
            <div key={form.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{form.name}</h3>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span className={form.status === 'published' ? 'text-green-600' : 'text-gray-400'}>{form.status}</span>
                  {form.is_public && <span>🌐 Public</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/forms/${form.id}/builder`}
                  className="text-blue-600 hover:underline text-sm">Éditer</Link>
                <Link href={`/dashboard/forms/${form.id}/responses`}
                  className="text-green-600 hover:underline text-sm">Réponses</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
