import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPaymentLink, eurToXaf } from '@/lib/campay';

// Lazy initialization to avoid build-time crash when env vars aren't available
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'datareq' } }
  );
}

// POST /api/payments/campay — carte bancaire uniquement (lien de paiement CamPay).
// Règle métier : Orange Money / MTN MoMo passent par /api/payments/ynote (push USSD).
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const {
      tenant_id,
      subscription_id,  // optional for deposits
      plan_id,           // optional for deposits
      payment_method,    // 'card' uniquement
      phone_number,      // optionnel (transmis à CamPay pour le lien)
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

    if (payment_method !== 'card') {
      return NextResponse.json(
        { error: 'Orange Money et MTN MoMo sont traités via /api/payments/ynote. CamPay est réservé à la carte bancaire.' },
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
        planName = plan.display_name || plan.name;
        if (!amountEur) amountEur = plan.price_monthly / 100;
      }
    }

    if (!amountEur || amountEur <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const amountCents = Math.round(amountEur * 100);
    const amountXaf = eurToXaf(amountEur);
    const externalRef = `DR-${tenant_id}-${subscription_id || 'deposit'}-${Date.now()}`;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const storedPaymentMethod = 'campay_card';
    const invoiceDescription = description || (plan ? `Abonnement DataReq Pro - Plan ${planName}` : `Recharge compte DataReq Pro`);

    // Create invoice in database - use correct column names matching DB schema
    const invoiceData: Record<string, unknown> = {
      tenant_id,
      invoice_number: invoiceNumber,  // NOT NULL in DB
      amount: amountCents,            // DB column is 'amount', not 'amount_cents'
      currency: 'eur',
      status: 'open',                 // DB CHECK: draft/open/paid/void/uncollectible (NOT 'pending')
      description: invoiceDescription,
      payment_method: storedPaymentMethod,
      provider: 'campay',
      external_reference: externalRef,
    };
    if (subscription_id) invoiceData.subscription_id = subscription_id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice creation error:', JSON.stringify(invoiceError));
      return NextResponse.json(
        { error: `Erreur création facture: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    let result;

    if (payment_method === 'card') {
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
        description: `DataReq Pro - ${planName} (Facture ${invoiceNumber})`,
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
        invoice_number: invoiceNumber,
        message: 'Redirection vers la page de paiement par carte',
      });

    } else {
      return NextResponse.json(
        { error: 'Méthode de paiement invalide. Utilisez : card' },
        { status: 400 }
      );
    }

  } catch (error: unknown) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
