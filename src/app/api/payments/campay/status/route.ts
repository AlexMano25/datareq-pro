import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTransactionStatus } from '@/lib/campay';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'datareq' } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const external_reference = searchParams.get('external_ref');

    if (!reference && !external_reference) {
      return NextResponse.json(
        { error: 'reference or external_ref parameter required' },
        { status: 400 }
      );
    }

    // Find invoice
    let invoice;
    if (reference) {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('campay_reference', reference)
        .single();
      invoice = data;
    } else {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('external_reference', external_reference)
        .single();
      invoice = data;
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // If already completed, return cached status
    if (invoice.status === 'paid' || invoice.status === 'failed') {
      return NextResponse.json({
        status: invoice.status === 'paid' ? 'SUCCESSFUL' : 'FAILED',
        invoice_status: invoice.status,
        invoice_number: invoice.invoice_number,
        amount_eur: invoice.amount_cents / 100,
      });
    }

    // Check with CamPay
    if (invoice.campay_reference) {
      const txStatus = await getTransactionStatus(invoice.campay_reference);

      if (txStatus.status === 'SUCCESSFUL') {
        // Update invoice as paid
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            campay_operator: txStatus.operator,
            campay_code: txStatus.code,
            campay_operator_reference: txStatus.operator_reference,
          })
          .eq('id', invoice.id);

        // Activate/renew subscription
        const now = new Date();
        const nextPeriod = new Date(now);
        nextPeriod.setMonth(nextPeriod.getMonth() + 1);

        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: nextPeriod.toISOString(),
          })
          .eq('id', invoice.subscription_id);

        return NextResponse.json({
          status: 'SUCCESSFUL',
          invoice_status: 'paid',
          invoice_number: invoice.invoice_number,
          amount_eur: invoice.amount_cents / 100,
          operator: txStatus.operator,
          message: 'Paiement effectu\u00E9 avec succ\u00E8s. Abonnement activ\u00E9.',
        });

      } else if (txStatus.status === 'FAILED') {
        await supabase
          .from('invoices')
          .update({ status: 'failed' })
          .eq('id', invoice.id);

        return NextResponse.json({
          status: 'FAILED',
          invoice_status: 'failed',
          invoice_number: invoice.invoice_number,
          message: 'Le paiement a \u00E9chou\u00E9. Veuillez r\u00E9essayer.',
        });
      }

      // Still pending
      return NextResponse.json({
        status: 'PENDING',
        invoice_status: 'pending',
        invoice_number: invoice.invoice_number,
        message: 'Paiement en attente de confirmation...',
      });
    }

    return NextResponse.json({
      status: 'PENDING',
      invoice_status: invoice.status,
      invoice_number: invoice.invoice_number,
    });

  } catch (error: unknown) {
    console.error('Status check error:', error);
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
