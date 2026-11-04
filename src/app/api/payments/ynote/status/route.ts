import { NextRequest, NextResponse } from 'next/server';
import { getYNotePaymentStatus, amountMatches, sanitizeYNotePayload } from '@/lib/ynote';
import type { CmOperator } from '@/lib/cm-operators';
import { getServiceSupabase, markInvoicePaid, markInvoiceFailed } from '@/lib/billing/settle';

// GET /api/payments/ynote/status?reference=<MessageId> | ?external_ref=<order_id>
// Polling côté client : interroge Y-Note tant que la facture est 'open'.
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const externalReference = searchParams.get('external_ref');

    if (!reference && !externalReference) {
      return NextResponse.json(
        { error: 'Paramètre reference ou external_ref requis' },
        { status: 400 }
      );
    }

    const query = supabase.from('invoices').select('*').eq('provider', 'ynote').limit(1);
    const { data: rows } = reference
      ? await query.eq('ynote_message_id', reference)
      : await query.eq('external_reference', externalReference);
    const invoice = rows?.[0];

    if (!invoice) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    // Déjà finalisée (webhook ou appel précédent) : pas d'appel réseau
    if (invoice.status === 'paid' || invoice.status === 'void') {
      return NextResponse.json({
        status: invoice.status === 'paid' ? 'SUCCESSFUL' : 'FAILED',
        invoice_status: invoice.status,
        invoice_number: invoice.invoice_number,
        amount_eur: invoice.amount / 100,
        provider: 'ynote',
        message: invoice.status === 'paid'
          ? 'Paiement effectué avec succès.'
          : 'Le paiement a échoué. Veuillez réessayer.',
      });
    }

    if (!invoice.ynote_message_id) {
      return NextResponse.json({
        status: 'PENDING',
        invoice_status: invoice.status,
        invoice_number: invoice.invoice_number,
        provider: 'ynote',
      });
    }

    // La bonne valeur `payment_method` dépend de l'opérateur enregistré à l'initiation.
    const operator: CmOperator = invoice.payment_method === 'ynote_om' ? 'orange' : 'mtn';
    const tx = await getYNotePaymentStatus(invoice.ynote_message_id, operator);

    // Le montant relu doit correspondre au montant demandé : sinon on ne valide pas.
    if (tx.status === 'SUCCESSFUL' && !amountMatches(invoice.amount_xaf, tx.amount)) {
      console.error(
        'Y-Note montant incohérent (facture %s) : attendu %s FCFA, relu %s FCFA — facture NON validée',
        invoice.invoice_number,
        invoice.amount_xaf,
        tx.amount
      );
      return NextResponse.json(
        { error: 'Montant du paiement incohérent — vérification manuelle requise' },
        { status: 409 }
      );
    }

    if (tx.status === 'SUCCESSFUL') {
      await markInvoicePaid(supabase, invoice, {
        provider_status: tx.providerStatus,
        provider_payload: sanitizeYNotePayload(tx.raw, invoice.ynote_message_id),
      });
      return NextResponse.json({
        status: 'SUCCESSFUL',
        invoice_status: 'paid',
        invoice_number: invoice.invoice_number,
        amount_eur: invoice.amount / 100,
        provider: 'ynote',
        operator: invoice.payment_method === 'ynote_momo' ? 'mtn' : 'orange',
        message: invoice.subscription_id
          ? 'Paiement effectué avec succès. Abonnement activé.'
          : 'Paiement effectué avec succès.',
      });
    }

    if (tx.status === 'FAILED') {
      await markInvoiceFailed(supabase, invoice, {
        provider_status: tx.providerStatus,
        provider_payload: sanitizeYNotePayload(tx.raw, invoice.ynote_message_id),
      });
      return NextResponse.json({
        status: 'FAILED',
        invoice_status: 'void',
        invoice_number: invoice.invoice_number,
        provider: 'ynote',
        message: 'Le paiement a échoué ou a été refusé. Veuillez réessayer.',
      });
    }

    // Toujours en attente : on mémorise le statut brut sans changer l'état
    await supabase
      .from('invoices')
      .update({ provider_status: tx.providerStatus })
      .eq('id', invoice.id)
      .eq('status', 'open');

    return NextResponse.json({
      status: 'PENDING',
      invoice_status: 'open',
      invoice_number: invoice.invoice_number,
      provider: 'ynote',
      message: 'Paiement en attente de confirmation sur votre téléphone...',
    });

  } catch (error: unknown) {
    console.error('Y-Note status check error:', error);
    const message = error instanceof Error ? error.message : 'Status check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
