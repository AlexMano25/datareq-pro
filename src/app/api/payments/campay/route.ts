import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initCollect, getPaymentLink, eurToXaf } from '@/lib/campay';

// Lazy initialization to avoid build-time crash when env vars aren't available
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
      subscription_id,  // optional for deposits
      plan_id,           // optional for deposits
      payment_method,    // 'mobile_money', 'orange_money', 'card'
      phone_number,      // required for mobile money
      first_name,
      last_name,
      email,
      amount_eur,        // amount in EUR
      description,       // optional description (e.g. "Recharge")
    } = body;

    if (!tenant_id || !payment_method) {
      return NextResponse.json(
        { error: 'Champs requis : tenant_id, payment_method' },
        { status: 400 }
      );
    }

    // Determine amount: from plan or directly from amount_eur
    let amountEur = amount_eur;
    let planName = 'Recharge';
    let plan = null;

    if (plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();
      plan = planData;
      if (plan) {
        planName = plan.name;
        if (!amountEur) amountEur = plan.price_cents / 100;
      }
    }

    if (!amountEur || amountEur <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const amountCents = Math.round(amountEur * 100);
    const amountXaf = eurToXaf(amountEur);
    const externalRef = `DR-${tenant_id}-${subscription_id || 'deposit'}-${Date.now()}`;

    // Normalize payment method for storage
    const isMobileMoney = payment_method === 'mobile_money' || payment_method === 'orange_money';
    const storedPaymentMethod = isMobileMoney ? 'campay_om' : 'campay_card';
    const invoiceDescription = description || (plan ? `Abonnement DataReq Pro - Plan ${planName}` : `Recharge compte DataReq Pro`);

    // Create pending invoice in database
    const invoiceData: Record<string, unknown> = {
      tenant_id,
      amount_cents: amountCents,
      currency: 'EUR',
      status: 'pending',
      description: invoiceDescription,
      payment_method: storedPaymentMethod,
      external_reference: externalRef,
    };
    if (subscription_id) invoiceData.subscription_id = subscription_id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    let result;

    if (isMobileMoney) {
      // Mobile Money collection via USSD push (Orange or MTN - CamPay auto-detects)
      if (!phone_number) {
        return NextResponse.json(
          { error: 'Numéro de téléphone requis pour le paiement Mobile Money' },
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
        description: `DataReq Pro - ${planName} (Facture ${invoice.invoice_number})`,
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
        description: `DataReq Pro - ${planName} (Facture ${invoice.invoice_number})`,
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
        { error: 'Méthode de paiement invalide. Utilisez : mobile_money, orange_money, card' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

