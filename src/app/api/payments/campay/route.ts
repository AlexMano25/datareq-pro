import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initCollect, getPaymentLink, eurToXaf } from '@/lib/campay';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'datareq' } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const {
      tenant_id,
      subscription_id,
      plan_id,
      payment_method, // 'orange_money', 'card'
      phone_number,   // required for orange_money
      first_name,
      last_name,
      email,
      amount_eur,     // amount in EUR (from plan price)
    } = body;

    if (!tenant_id || !subscription_id || !plan_id || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: tenant_id, subscription_id, plan_id, payment_method' },
        { status: 400 }
      );
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Calculate amount in XAF
    const amountEur = amount_eur || (plan.price_cents / 100);
    const amountXaf = eurToXaf(amountEur);
    const externalRef = `DR-${tenant_id}-${subscription_id}-${Date.now()}`;

    // Create pending invoice in database
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id,
        subscription_id,
        amount_cents: plan.price_cents,
        currency: 'EUR',
        status: 'pending',
        description: `Abonnement DataReq Pro - Plan ${plan.name}`,
        payment_method: payment_method === 'orange_money' ? 'campay_om' : 'campay_card',
        external_reference: externalRef,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    let result;

    if (payment_method === 'orange_money') {
      // Direct Orange Money collection via USSD push
      if (!phone_number) {
        return NextResponse.json(
          { error: 'Phone number required for Orange Money payment' },
          { status: 400 }
        );
      }

      // Ensure phone starts with 237
      const formattedPhone = phone_number.startsWith('237')
        ? phone_number
        : `237${phone_number}`;

      result = await initCollect({
        amount: String(amountXaf),
        currency: 'XAF',
        from: formattedPhone,
        description: `DataReq Pro - ${plan.name} (Facture ${invoice.invoice_number})`,
        external_reference: externalRef,
      });

      // Update invoice with CamPay reference
      if (result.reference) {
        await supabase
          .from('invoices')
          .update({
            campay_reference: result.reference,
            amount_xaf: amountXaf,
          })
          .eq('id', invoice.id);
      }

      return NextResponse.json({
        success: true,
        type: 'ussd_push',
        reference: result.reference,
        ussd_code: result.ussd_code,
        operator: result.operator,
        amount_xaf: amountXaf,
        amount_eur: amountEur,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        message: 'Veuillez confirmer le paiement sur votre t\u00E9l\u00E9phone',
      });

    } else if (payment_method === 'card') {
      // Card payment via payment link
      if (!first_name || !last_name || !email) {
        return NextResponse.json(
          { error: 'first_name, last_name and email required for card payment' },
          { status: 400 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rgpd.manovende.com';

      result = await getPaymentLink({
        amount: String(amountXaf),
        currency: 'XAF',
        description: `DataReq Pro - ${plan.name} (Facture ${invoice.invoice_number})`,
        external_reference: externalRef,
        from: phone_number ? (phone_number.startsWith('237') ? phone_number : `237${phone_number}`) : '',
        first_name,
        last_name,
        email,
        redirect_url: `${baseUrl}/dashboard/billing?payment=success&ref=${externalRef}`,
        failure_redirect_url: `${baseUrl}/dashboard/billing?payment=failed&ref=${externalRef}`,
        payment_options: 'CARD',
      });

      if (result.status === 'SUCCESSFUL' && result.reference) {
        await supabase
          .from('invoices')
          .update({
            campay_reference: result.reference,
            amount_xaf: amountXaf,
            payment_link: result.link,
          })
          .eq('id', invoice.id);
      }

      return NextResponse.json({
        success: true,
        type: 'payment_link',
        link: result.link,
        reference: result.reference,
        amount_xaf: amountXaf,
        amount_eur: amountEur,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        message: 'Redirection vers la page de paiement par carte',
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid payment_method. Use: orange_money, card' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
