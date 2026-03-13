'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface FormField {
  id: string; label: string; field_type: string; required: boolean; metadata: any;
}

export default function PublicFormPage() {
  const { publicToken } = useParams();
  const [fields, setFields] = useState<FormField[]>([]);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormDetails();
  }, [publicToken]);

  async function fetchFormDetails() {
    try {
      const res = await fetch(`/api/public/forms/${publicToken}`);
      if (res.ok) {
        const data = await res.json();
        setFormName(data.name);
        setFormDesc(data.description || '');
        setFields(data.form_fields || []);
      }
    } catch {}
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/public/forms/${publicToken}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function updateAnswer(fieldId: string, value: any) {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  }

  function renderField(field: FormField) {
    const common = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    switch (field.field_type) {
      case 'textarea':
        return <textarea className={common} rows={3} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
      case 'number':
        return <input type="number" className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
      case 'date':
        return <input type="date" className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
      case 'email':
        return <input type="email" className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
      case 'phone':
        return <input type="tel" className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
      case 'checkbox':
        return <input type="checkbox" checked={answers[field.id] || false} onChange={e => updateAnswer(field.id, e.target.checked)} className="w-5 h-5" />;
      case 'select':
        return (
          <select className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)}>
            <option value="">Sélectionnez...</option>
            {(field.metadata?.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'multiselect':
        return (
          <div className="space-y-1">
            {(field.metadata?.options || []).map((opt: string) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={(answers[field.id] || []).includes(opt)}
                  onChange={e => {
                    const current = answers[field.id] || [];
                    updateAnswer(field.id, e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt));
                  }} />
                {opt}
              </label>
            ))}
          </div>
        );
      default:
        return <input type="text" className={common} required={field.required} value={answers[field.id] || ''} onChange={e => updateAnswer(field.id, e.target.value)} />;
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">Merci !</h1>
          <p className="text-gray-500 mt-2">Votre réponse a été enregistrée avec succès.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6 pb-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">{formName}</h1>
            {formDesc && <p className="text-gray-500 mt-2">{formDesc}</p>}
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
            <button type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium text-lg">
              Envoyer ma réponse
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">Propulsé par DataReq Pro</p>
        </div>
      </div>
    </div>
  );
}
