import { createServerSupabase } from '@/lib/supabase/server';
import { anonymizeField } from '@/lib/anonymize';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ publicToken: string }> }) {
  try {
    const { publicToken } = await params;
    const body = await req.json();
    const supabase = await createServerSupabase();

    // Find form by token
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*, form_fields(*)')
      .eq('public_token', publicToken)
      .eq('status', 'published')
      .eq('is_public', true)
      .single();
    if (formError || !form) return NextResponse.json({ error: 'Form not found or not public' }, { status: 404 });

    // Create response
    const { data: response, error: respError } = await supabase
      .from('responses')
      .insert({
        form_id: form.id,
        project_id: form.project_id,
        tenant_id: form.tenant_id,
        source: 'public',
        meta: { userAgent: req.headers.get('user-agent') },
      })
      .select()
      .single();
    if (respError) return NextResponse.json({ error: respError.message }, { status: 500 });

    // Insert response items with anonymization for PII fields
    const fieldsMap = new Map(form.form_fields.map((f: any) => [f.id, f]));
    const items = Object.entries(body.answers || {}).map(([fieldId, value]) => {
      const field = fieldsMap.get(fieldId) as any;
      const rawValue = String(value);
      const isPii = field?.is_pii || false;
      return {
        response_id: response.id,
        form_field_id: fieldId,
        raw_value: rawValue,
        anonymized_value: isPii ? anonymizeField(rawValue, field?.field_type || 'text') : null,
        is_pseudonymized: isPii,
      };
    });

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('response_items').insert(items);
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, responseId: response.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
