import { createServerSupabase } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicToken: string }> }
) {
  try {
    const { publicToken } = await params;
    const supabase = await createServerSupabase();

    const { data: form, error } = await supabase
      .from('forms')
      .select('id, name, description, status, is_public, public_token, form_fields(*)')
      .eq('public_token', publicToken)
      .eq('status', 'published')
      .eq('is_public', true)
      .single();

    if (error || !form) {
      return NextResponse.json(
        { error: 'Form not found or not public' },
        { status: 404 }
      );
    }

    // Sort fields by order
    if (form.form_fields) {
      form.form_fields.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    return NextResponse.json(form);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
