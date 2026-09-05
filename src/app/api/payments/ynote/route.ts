import { NextRequest, NextResponse } from 'next/server';
import { eurToXaf } from '@/lib/campay';
import { initYNotePayment } from '@/lib/ynote';
import { detectCmOperator, isValidCmMobile, toCmMsisdn, OPERATOR_LABELS, type CmOperator } from '@/lib/cm-operators';
import { getServiceSupabase, markInvoiceFailed } from '@/lib/billing/settle';

// POST /api/payments/ynote — Orange Money / MTN MoMo par push USSD (Y-Note).
// Même cycle de vie que CamPay : facture 'open' → webhook ou polling → 'paid' / 'void'.
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const {
      tenant_id,
      subscription_id,  // optionnel (recharge)
      plan_id,          // optionnel (recharge)
      operator,         // 'mtn' | 'orange' (déduit du numéro si absent)
      phone_number,     // requis
      amount_eur,
      description,
    } = body;

    if (!tenant_id || !phone_number) {
      return NextResponse.json(
        { error: 'Champs requis : tenant_id, phone_number' },
        { status: 400 }
      );
    }

    if (!isValidCmMobile(phone_number)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide (attendu : 6XX XXX XXX, Cameroun)' },
        { status: 400 }
      );
    }

    const detected = detectCmOperator(phone_number);
    const chosen: CmOperator | null =
      operator === 'mtn' || operator === 'orange' ? operator : detected;

    if (!chosen) {
      return NextResponse.json(
        { error: 'Impossible de déterminer l’opérateur. Choisissez Orange Money ou MTN MoMo.' },
        { status: 400 }
      );
    }
    if (detected && detected !== chosen) {
      return NextResponse.json(
        { error: `Ce numéro semble être un numéro ${OPERATOR_LABELS[detected]}. Vérifiez l’opérateur sélectionné.` },
        { status: 400 }
      );
    }

    // Montant : plan ou montant libre
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

    // order_id Y-Note ≤ 60 caractères : DR + tenant compact (32) + horodatage base36
    const tenantCompact = String(tenant_id).replace(/-/g, '').slice(0, 32);
    const externalRef = `DR${tenantCompact}${Date.now().toString(36).toUpperCase()}`;

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const storedPaymentMethod = chosen === 'mtn' ? 'ynote_momo' : 'ynote_om';
    const invoiceDescription = description || (plan ? `Abonnement DataReq Pro - Plan ${planName}` : 'Recharge compte DataReq Pro');

    const invoiceData: Record<string, unknown> = {
      tenant_id,
      invoice_number: invoiceNumber,
      amount: amountCents,
      currency: 'eur',
      status: 'open',
      description: invoiceDescription,
      payment_method: storedPaymentMethod,
      provider: 'ynote',
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
      console.error('Invoice creation error:', JSON.stringify(invoiceError));
      return NextResponse.json(
        { error: `Erreur création facture: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rgpd.manovende.com';
    const msisdn = toCmMsisdn(phone_number);

    let result;
    try {
      result = await initYNotePayment({
        orderId: externalRef,
        amountXaf,
        msisdn,
        description: `DataReq Pro - ${planName} (Facture ${invoiceNumber})`,
        notifUrl: `${baseUrl}/api/webhooks/ynote`,
        operator: chosen,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Échec de l’initiation Y-Note';
      console.error('Y-Note init error:', message);
      await markInvoiceFailed(supabase, invoice, { provider_status: 'INIT_ERROR' });
      return NextResponse.json(
        { error: `Le paiement n’a pas pu être initié auprès de ${OPERATOR_LABELS[chosen]}. Réessayez dans quelques instants.` },
        { status: 502 }
      );
    }

    await supabase
      .from('invoices')
      .update({
        ynote_message_id: result.messageId,
        provider_status: 'INITIATED',
        provider_payload: result.raw,
      })
      .eq('id', invoice.id);

    return NextResponse.json({
      success: true,
      type: 'ussd_push',
      provider: 'ynote',
      operator: chosen,
      reference: result.messageId,
      external_reference: externalRef,
      amount_xaf: amountXaf,
      amount_eur: amountEur,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      message: chosen === 'mtn'
        ? 'Validez le paiement MTN MoMo sur votre téléphone (fenêtre USSD ou *126#).'
        : 'Validez le paiement Orange Money sur votre téléphone (fenêtre USSD ou #150#).',
    });

  } catch (error: unknown) {
    console.error('Y-Note payment error:', error);
    const message = error instanceof Error ? error.message : 'Payment processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
