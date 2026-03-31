'use client';
import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/hooks/useTenant';

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
  { value: 'phone', label: 'Telephone' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Choix unique' },
  { value: 'multiselect', label: 'Choix multiple' },
  { value: 'checkbox', label: 'Case a cocher' },
];

export default function FormBuilderPage() {
  const { id } = useParams();
  const { tenant, supabase } = useTenant();
  const [form, setForm] = useState<FormData | null>(null);
  const [newField, setNewField] = useState({ label: '', field_type: 'text', required: false, is_pii: false, metadata: {} as any });
  const [showAddField, setShowAddField] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectOptions, setSelectOptions] = useState('');
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const fetchForm = useCallback(async () => {
    if (!tenant) return;
    const { data, error } = await supabase
      .from('forms')
      .select('*, form_fields(*)')
      .eq('id', id as string)
      .eq('tenant_id', tenant.tenant_id)
      .single();
    if (!error && data) {
      if (data.form_fields) {
        (data.form_fields as any[]).sort((a: any, b: any) => a.order_index - b.order_index);
      }
      setForm(data as any);
    }
  }, [tenant, id, supabase]);

  useEffect(() => {
    if (tenant) fetchForm();
  }, [tenant, fetchForm]);

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const fieldData = { ...newField };
    if (['select', 'multiselect'].includes(newField.field_type) && selectOptions) {
      fieldData.metadata = { options: selectOptions.split(',').map(o => o.trim()) };
    }

    const nextOrder = form?.form_fields.length || 0;

    // Optimistic update — add field immediately to UI
    const tempId = `temp-${Date.now()}`;
    const optimisticField: FormField = {
      id: tempId,
      label: fieldData.label,
      field_type: fieldData.field_type,
      required: fieldData.required,
      is_pii: fieldData.is_pii,
      order_index: nextOrder,
      metadata: fieldData.metadata || {},
    };

    setForm(prev => prev ? { ...prev, form_fields: [...prev.form_fields, optimisticField] } : prev);
    setNewField({ label: '', field_type: 'text', required: false, is_pii: false, metadata: {} });
    setSelectOptions('');
    setShowAddField(false);

    // Persist to DB in background
    const { error } = await supabase
      .from('form_fields')
      .insert({
        form_id: id as string,
        label: fieldData.label,
        field_type: fieldData.field_type,
        required: fieldData.required,
        is_pii: fieldData.is_pii,
        order_index: nextOrder,
        metadata: fieldData.metadata || {},
      });

    if (error) {
      // Rollback optimistic update
      setForm(prev => prev ? { ...prev, form_fields: prev.form_fields.filter(f => f.id !== tempId) } : prev);
    } else {
      // Refresh to get real ID
      startTransition(() => { fetchForm(); });
    }
    setSaving(false);
  }

  async function deleteField(fieldId: string) {
    // Optimistic removal
    setForm(prev => prev ? { ...prev, form_fields: prev.form_fields.filter(f => f.id !== fieldId) } : prev);
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId);
    if (error) fetchForm(); // rollback on error
  }

  async function publishForm() {
    if (!form) return;
    // Optimistic update
    setForm(prev => prev ? { ...prev, status: 'published', is_public: true } : prev);
    await supabase
      .from('forms')
      .update({ status: 'published', is_public: true, updated_at: new Date().toISOString() })
      .eq('id', id as string)
      .eq('tenant_id', tenant!.tenant_id);
    fetchForm();
  }

  function copyPublicLink() {
    if (form) {
      navigator.clipboard.writeText(`${window.location.origin}/f/${form.public_token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!form) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="space-y-3 mt-6">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
          {form.description && <p className="text-gray-500 mt-1">{form.description}</p>}
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{form.status === 'published' ? 'Publie' : 'Brouillon'}</span>
        </div>
        <div className="flex gap-2">
          {form.status !== 'published' && (
            <button onClick={publishForm} disabled={isPending || form.form_fields.length === 0}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors">
              Publier le formulaire
            </button>
          )}
          {form.is_public && (
            <button onClick={copyPublicLink}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm transition-colors">
              {copied ? 'Copie !' : 'Copier le lien public'}
            </button>
          )}
        </div>
      </div>

      {/* Field count indicator */}
      <div className="text-sm text-gray-400 mb-3">{form.form_fields.length} champ{form.form_fields.length !== 1 ? 's' : ''}</div>

      <div className="space-y-3 mb-6">
        {form.form_fields.map((field, index) => (
          <div key={field.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex justify-between items-center transition-all ${field.id.startsWith('temp-') ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-4">
              <span className="text-gray-300 font-mono text-sm w-6 text-center">{index + 1}</span>
              <div>
                <p className="font-medium text-gray-900">{field.label}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}</span>
                  {field.required && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Requis</span>}
                  {field.is_pii && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">Donnee personnelle</span>}
                </div>
              </div>
            </div>
            <button onClick={() => deleteField(field.id)} className="text-red-400 hover:text-red-600 text-sm transition-colors">
              Supprimer
            </button>
          </div>
        ))}
      </div>

      {showAddField ? (
        <form onSubmit={addField} className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Ajouter un champ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Libelle</label>
              <input type="text" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} required
                autoFocus className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ex: Nom complet" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {['select', 'multiselect'].includes(newField.field_type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options (separees par des virgules)</label>
              <input type="text" value={selectOptions} onChange={e => setSelectOptions(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg" placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} className="rounded" />
              Champ requis
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newField.is_pii} onChange={e => setNewField({...newField, is_pii: e.target.checked})} className="rounded" />
              Donnee personnelle (PII)
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
            <button type="button" onClick={() => setShowAddField(false)} className="text-gray-500 px-4 py-2 hover:text-gray-700">Annuler</button>
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
