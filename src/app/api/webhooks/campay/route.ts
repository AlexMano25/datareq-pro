import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: 'datareq' } }
);

// CamPay Webhook - called when payment status changes
// Configure this URL in CamPay dashboard: https://rgpd.manovende.com/api/webhooks/campay
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.CAMPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${webhookSecret}`) {
        console.warn('CamPay webhook: invalid authorization');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    console.log('CamPay webhook received:', JSON.stringify(body));

    const {
      reference,
      external_reference,
      status,
      amount,
      currency,
      operator,
      code,
      operator_reference,
    } = body;

    if (!reference && !external_reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    // Find the invoice
    let invoice;
    if (reference) {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('campay_reference', reference)
        .single();
      invoice = data;
    }
    if (!invoice && external_reference) {
      const { data } = await supabase
        .from('invoices')
        .select('*')
        .eq('external_reference', external_reference)
        .single();
      invoice = data;
    }

    if (!invoice) {
      console.warn('CamPay webhook: invoice not found for ref:', reference, external_reference);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Skip if already processed
    if (invoice.status === 'paid' || invoice.status === 'failed') {
      return NextResponse.json({ message: 'Already processed', status: invoice.status });
    }

    if (status === 'SUCCESSFUL') {
      // Mark invoice as paid
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          campay_reference: reference || invoice.campay_reference,
          campay_operator: operator,
          campay_code: code,
          campay_operator_reference: operator_reference,
          amount_xaf: amount,
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

      console.log(`CamPay webhook: payment successful for invoice ${invoice.invoice_number}`);

      return NextResponse.json({
        message: 'Payment processed successfully',
        invoice_number: invoice.invoice_number,
      });

    } else if (status === 'FAILED') {
      await supabase
        .from('invoices')
        .update({
          status: 'failed',
          campay_reference: reference || invoice.campay_reference,
        })
        .eq('id', invoice.id);

      console.log(`CamPay webhook: payment failed for invoice ${invoice.invoice_number}`);

      return NextResponse.json({
        message: 'Payment failure recorded',
        invoice_number: invoice.invoice_number,
      });
    }

    // PENDING or other status - acknowledge
    return NextResponse.json({ message: 'Webhook received', status: status || 'unknown' });

  } catch (error: unknown) {
    console.error('CamPay webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Allow GET for webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'campay-webhook' });
}

