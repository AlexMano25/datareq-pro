'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTenant } from '@/lib/hooks/useTenant';

export default function FormResponsesPage() {
  const { id } = useParams();
  const { tenant, supabase } = useTenant();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) fetchResponses();
  }, [tenant, id]);

  async function fetchResponses() {
    const { data, error } = await supabase
      .from('responses')
      .select('*, response_items(*, form_fields:form_field_id(label, field_type, is_pii))')
      .eq('form_id', id as string)
      .order('submitted_at', { ascending: false });
    if (!error && data) setResponses(data);
    setLoading(false);
  }

  async function exportCSV() {
    // Get form fields
    const { data: fields } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', id as string)
      .order('order_index');
    if (!fields) return;

    // Get responses with items
    const { data: allResponses } = await supabase
      .from('responses')
      .select('*, response_items(*)')
      .eq('form_id', id as string)
      .order('submitted_at', { ascending: false });
    if (!allResponses) return;

    // Build CSV
    const headers = ['Response ID', 'Submitted At', ...fields.map(f => f.label)];
    const rows = allResponses.map(r => {
      const itemsMap = new Map((r as any).response_items.map((i: any) => [i.form_field_id, i]));
      return [
        r.id,
        r.submitted_at,
        ...fields.map(f => {
          const item = itemsMap.get(f.id) as any;
          if (!item) return '';
          return f.is_pii && item.anonymized_value ? item.anonymized_value : (item.raw_value || '');
        }),
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réponses ({responses.length})</h1>
        </div>
        <button onClick={exportCSV} disabled={responses.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
          Exporter CSV
        </button>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-gray-500">Aucune réponse reçue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((resp: any) => (
            <div key={resp.id} className="bg-white rounded-xl shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-400">Soumis le {new Date(resp.submitted_at).toLocaleString('fr-FR')}</span>
                <span className="text-xs text-gray-400">{resp.source}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {resp.response_items?.map((item: any) => (
                  <div key={item.id} className="text-sm">
                    <span className="font-medium text-gray-600">{item.form_fields?.label || 'Champ'}:</span>{' '}
                    <span className={item.is_pseudonymized ? 'text-yellow-600 italic' : 'text-gray-900'}>
                      {item.is_pseudonymized? item.anonymized_value : item.raw_value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
