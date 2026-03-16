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
      subscription_id,  // optional for deposits
      plan_id,           // optional for deposits
      payment_method,    // 'mobile_money', 'card'
      phone_number,      // required for mobile_money
      first_name,
      last_name,
      email,
      amount_eur,        // direct amount in EUR
      description,       // optional custom description
    } = body;

    if (!tenant_id || !payment_method) {
      return NextResponse.json(
        { error: 'Champs requis : tenant_id, payment_method' },
        { status: 400 }
      );
    }

    // Determine amount
    let amountEur = amount_eur;
    let planName = 'Dépôt';
    let invoiceDescription = description || 'Recharge de compte DataReq Pro';

    if (plan_id) {
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', plan_id)
        .single();
      if (plan) {
        amountEur = amountEur || (plan.price_monthly / 100);
        planName = plan.display_name || plan.name;
        invoiceDescription = description || `Abonnement DataReq Pro - Plan ${planName}`;
      }
    }

    if (!amountEur || amountEur <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const amountXaf = eurToXaf(amountEur);
    const amountCents = Math.round(amountEur * 100);
    const externalRef = `DR-${tenant_id}-${Date.now()}`;

    // Determine payment_method label for invoice
    let pmLabel = 'campay';
    if (payment_method === 'mobile_money') {
      // CamPay auto-detects Orange vs MTN from phone number
      pmLabel = 'campay_mobile';
    } else if (payment_method === 'card') {
      pmLabel = 'campay_card';
    }

    // Create pending invoice
    const invoiceData: any = {
      tenant_id,
      amount_cents: amountCents,
      currency: 'EUR',
      status: 'pending',
      description: invoiceDescription,
      payment_method: pmLabel,
      external_reference: externalRef,
      amount_xaf: amountXaf,
    };
    if (subscription_id) invoiceData.subscription_id = subscription_id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      return NextResponse.json({ error: 'Erreur création facture: ' + invoiceError.message }, { status: 500 });
    }

    let result;

    if (payment_method === 'mobile_money') {
      // Mobile Money (Orange or MTN) via USSD push - CamPay auto-detects operator
      if (!phone_number) {
        return NextResponse.json(
          { error: 'Numéro de téléphone requis pour le paiement mobile money' },
          { status: 400 }
        );
      }

      const formattedPhone = phone_number.startsWith('237')
        ? phone_number
        : `237${phone_number}`;

      result = await initCollect({
        amount: String(amountXaf),
        currency: 'XAF',
        from: formattedPhone,
        description: `DataReq Pro - ${planName} (${invoice.invoice_number || externalRef})`,
        external_reference: externalRef,
      });

      if (result.reference) {
        await supabase
          .from('invoices')
          .update({
            campay_reference: result.reference,
            campay_operator: result.operator,
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
        message: result.message || 'Veuillez confirmer le paiement sur votre téléphone',
      });

    } else if (payment_method === 'card') {
      if (!first_name || !last_name || !email) {
        return NextResponse.json(
          { error: 'Prénom, nom et email requis pour le paiement par carte' },
          { status: 400 }
        );
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rgpd.manovende.com';

      result = await getPaymentLink({
        amount: String(amountXaf),
        currency: 'XAF',
        description: `DataReq Pro - ${planName} (${invoice.invoice_number || externalRef})`,
        external_reference: externalRef,
        from: phone_number ? (phone_number.startsWith('237') ? phone_number : `237${phone_number}`) : '',
        first_name,
        last_name,
        email,
        redirect_url: `${baseUrl}/dashboard/billing?payment=success&ref=${externalRef}`,
        failure_redirect_url: `${baseUrl}/dashboard/billing?payment=failed&ref=${externalRef}`,
        payment_options: 'CARD',
      });

      if (result.reference) {
        await supabase
          .from('invoices')
          .update({
            campay_reference: result.reference,
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
        { error: 'Mode de paiement invalide. Utilisez: mobile_money, card' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Erreur de paiement';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
