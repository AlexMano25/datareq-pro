'use client';
import { useEffect, useState } from 'react';

interface DSR { id: string; requester_email: string; request_type: string; status: string; notes: string | null; created_at: string; resolved_at: string | null; }

export default function DataRequestsPage() {
  const [requests, setRequests] = useState<DSR[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ requester_email: '', request_type: 'access', notes: '' });

  useEffect(() => { fetchRequests(); }, []);

  async function fetchRequests() {
    const res = await fetch('/api/data-requests');
    if (res.ok) setRequests(await res.json());
  }

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/data-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ requester_email: '', request_type: 'access', notes: '' }); fetchRequests(); }
  }

  const typeLabels: Record<string, string> = { access: 'Accès', delete: 'Suppression', rectification: 'Rectification', portability: 'Portabilité', objection: 'Opposition' };
  const statusColors: Record<string, string> = { pending: 'bg-yellow-100 text-yellow-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes RGPD</h1>
          <p className="text-gray-500">Gestion des droits des personnes concernées</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          + Nouvelle demande
        </button>
      </div>

      {showForm && (
        <form onSubmit={createRequest} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email du demandeur</label>
              <input type="email" value={form.requester_email} onChange={e => setForm({...form, requester_email: e.target.value})} required
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de demande</label>
              <select value={form.request_type} onChange={e => setForm({...form, request_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Enregistrer</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2">Annuler</button>
          </div>
        </form>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">Aucune demande pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{req.requester_email}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{typeLabels[req.request_type]}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[req.status]}`}>{req.status}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
