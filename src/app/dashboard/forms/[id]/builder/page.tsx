'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  id: string; label: string; field_type: string; required: boolean; is_pii: boolean; order_index: number; metadata: any;
}
interface FormData {
  id: string; name: string; description: string; status: string; is_public: boolean; public_token: string; form_fields: FormField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Choix unique' },
  { value: 'multiselect', label: 'Choix multiple' },
  { value: 'checkbox', label: 'Case à cocher' },
];

export default function FormBuilderPage() {
  const { id } = useParams();
  const [form, setForm] = useState<FormData | null>(null);
  const [newField, setNewField] = useState({ label: '', field_type: 'text', required: false, is_pii: false, metadata: {} as any });
  const [showAddField, setShowAddField] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectOptions, setSelectOptions] = useState('');

  useEffect(() => { fetchForm(); }, [id]);

  async function fetchForm() {
    const res = await fetch(`/api/forms/${id}`);
    if (res.ok) setForm(await res.json());
  }

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    const fieldData = { ...newField };
    if (['select', 'multiselect'].includes(newField.field_type) && selectOptions) {
      fieldData.metadata = { options: selectOptions.split(',').map(o => o.trim()) };
    }
    const res = await fetch(`/api/forms/${id}/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldData),
    });
    if (res.ok) {
      setNewField({ label: '', field_type: 'text', required: false, is_pii: false, metadata: {} });
      setSelectOptions('');
      setShowAddField(false);
      fetchForm();
    }
  }

  async function deleteField(fieldId: string) {
    await fetch(`/api/form-fields/${fieldId}`, { method: 'DELETE' });
    fetchForm();
  }

  async function publishForm() {
    setPublishing(true);
    await fetch(`/api/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published', is_public: true }),
    });
    fetchForm();
    setPublishing(false);
  }

  function copyPublicLink() {
    if (form) {
      navigator.clipboard.writeText(`${window.location.origin}/f/${form.public_token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!form) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
          {form.description && <p className="text-gray-500 mt-1">{form.description}</p>}
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{form.status}</span>
        </div>
        <div className="flex gap-2">
          {form.status !== 'published' && (
            <button onClick={publishForm} disabled={publishing || form.form_fields.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
              {publishing ? 'Publication...' : 'Publier le formulaire'}
            </button>
          )}
          {form.is_public && (
            <button onClick={copyPublicLink}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
              {copied ? 'Copié !' : 'Copier le lien public'}
            </button>
          )}
        </div>
      </div>

      {/* Fields list */}
      <div className="space-y-3 mb-6">
        {form.form_fields.map((field, index) => (
          <div key={field.id} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-300 font-mono text-sm">{index + 1}</span>
              <div>
                <p className="font-medium text-gray-900">{field.label}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{field.field_type}</span>
                  {field.required && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Requis</span>}
                  {field.is_pii && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Donnée personnelle</span>}
                </div>
              </div>
            </div>
            <button onClick={() => deleteField(field.id)} className="text-red-400 hover:text-red-600 text-sm">Supprimer</button>
          </div>
        ))}
      </div>

      {/* Add field form */}
      {showAddField ? (
        <form onSubmit={addField} className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Ajouter un champ</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
              <input type="text" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} required
                className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Nom complet" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {['select', 'multiselect'].includes(newField.field_type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options (séparées par des virgules)</label>
              <input type="text" value={selectOptions} onChange={e => setSelectOptions(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg" placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} />
              Champ requis
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newField.is_pii} onChange={e => setNewField({...newField, is_pii: e.target.checked})} />
              Donnée personnelle (PII) — sera pseudonymisée
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Ajouter</button>
            <button type="button" onClick={() => setShowAddField(false)} className="text-gray-500 px-4 py-2">Annuler</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowAddField(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
          + Ajouter un champ
        </button>
      )}
    </div>
  );
}
