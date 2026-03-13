'use client';
import { useEffect, useState } from 'react';
import { useTenant } from '@/lib/hooks/useTenant';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
}

export default function TeamPage() {
  const { tenant, loading: tenantLoading, supabase } = useTenant();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'contributor' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tenant) fetchMembers();
  }, [tenant]);

  async function fetchMembers() {
    const { data } = await supabase
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant!.tenant_id)
      .order('created_at', { ascending: true });
    if (data) setMembers(data);
    setLoading(false);
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    // Check if user already exists
    const { data: existing } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenant!.tenant_id);

    // In a real app, this would send an invitation email
    // For now, we show a success message
    setMessage(`Invitation envoyée à ${inviteForm.email} avec le rôle ${inviteForm.role === 'admin' ? 'Administrateur' : inviteForm.role === 'contributor' ? 'Contributeur' : 'Lecteur'}.`);
    setInviteForm({ email: '', role: 'contributor' });
    setShowInvite(false);
  }

  async function updateRole(memberId: string, newRole: string) {
    const { error } = await supabase
      .from('tenant_users')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('tenant_id', tenant!.tenant_id);
    if (!error) fetchMembers();
  }

  async function removeMember(memberId: string) {
    if (members.length <= 1) {
      setMessage('Impossible de supprimer le dernier membre de l\'organisation.');
      return;
    }
    const { error } = await supabase
      .from('tenant_users')
      .delete()
      .eq('id', memberId)
      .eq('tenant_id', tenant!.tenant_id);
    if (!error) fetchMembers();
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrateur',
    contributor: 'Contributeur',
    viewer: 'Lecteur',
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    contributor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-700',
  };

  if (tenantLoading || loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion d'équipe</h1>
          <p className="text-gray-500">Gérez les membres et leurs rôles dans votre organisation</p>
        </div>
        {tenant?.role === 'admin' && (
          <button onClick={() => setShowInvite(!showInvite)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
            + Inviter un membre
          </button>
        )}
      </div>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
          {message}
        </div>
      )}

      {showInvite && (
        <form onSubmit={inviteMember} className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Inviter un nouveau membre</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={inviteForm.email}
                onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="collaborateur@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="admin">Administrateur — Accès complet</option>
                <option value="contributor">Contributeur — Projets et formulaires</option>
                <option value="viewer">Lecteur — Consultation seule</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Envoyer</button>
              <button type="button" onClick={() => setShowInvite(false)} className="text-gray-500 px-4 py-2">Annuler</button>
            </div>
          </div>
        </form>
      )}

      {/* Roles explanation */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Niveaux d'accès</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <span className="font-semibold text-red-700">Administrateur</span>
            <p className="text-sm text-red-600 mt-1">Accès complet : gestion des membres, projets, formulaires, demandes RGPD, paramètres.</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <span className="font-semibold text-blue-700">Contributeur</span>
            <p className="text-sm text-blue-600 mt-1">Création et édition de projets et formulaires, consultation des réponses et demandes.</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <span className="font-semibold text-gray-700">Lecteur</span>
            <p className="text-sm text-gray-600 mt-1">Consultation seule : projets, formulaires, réponses et demandes sans modification.</p>
          </div>
        </div>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Membres ({members.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(member => (
            <div key={member.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                  {member.user_id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Utilisateur {member.user_id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-400">Membre depuis le {new Date(member.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[member.role] || ''}`}>
                  {roleLabels[member.role] || member.role}
                </span>
                {tenant?.role === 'admin' && member.user_id !== tenant.user_id && (
                  <div className="flex gap-2">
                    <select value={member.role}
                      onChange={e => updateRole(member.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1">
                      <option value="admin">Admin</option>
                      <option value="contributor">Contributeur</option>
                      <option value="viewer">Lecteur</option>
                    </select>
                    <button onClick={() => removeMember(member.id)}
                      className="text-red-500 hover:text-red-700 text-sm">Retirer</button>
                  </div>
                )}
                {member.user_id === tenant?.user_id && (
                  <span className="text-xs text-gray-400">Vous</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
