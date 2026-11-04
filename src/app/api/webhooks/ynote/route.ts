import { NextRequest, NextResponse } from 'next/server';
import {
  getYNotePaymentStatus,
  extractYNoteMessageId,
  extractYNoteOrderId,
  normalizeYNoteStatus,
  amountMatches,
  sanitizeYNotePayload,
} from '@/lib/ynote';
import type { CmOperator } from '@/lib/cm-operators';
import { getServiceSupabase, markInvoicePaid, markInvoiceFailed } from '@/lib/billing/settle';

// Webhook Y-Note (notifUrl) : https://rgpd.manovende.com/api/webhooks/ynote
// Sécurité : la notification n'est jamais crue sur parole — le statut est
// re-vérifié auprès de l'API Y-Note avant de confirmer la facture (idempotent).
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }
    // ⚠️ Le corps de la notification n'est jamais journalisé : l'API Y-Note y
    // réinjecte nos identifiants en clair dans ses messages d'erreur, et le champ
    // `notifUrl` peut contenir notre jeton de webhook.
    const messageId = extractYNoteMessageId(payload);
    const orderId = extractYNoteOrderId(payload);

    if (!messageId && !orderId) {
      return NextResponse.json({ error: 'MessageId ou order_id manquant' }, { status: 400 });
    }

    // Recherche de la facture : MessageId puis order_id (external_reference)
    let invoice = null;
    if (messageId) {
      const { data } = await supabase
        .from('invoices').select('*')
        .eq('provider', 'ynote').eq('ynote_message_id', messageId).limit(1);
      invoice = data?.[0] ?? null;
    }
    if (!invoice && orderId) {
      const { data } = await supabase
        .from('invoices').select('*')
        .eq('provider', 'ynote').eq('external_reference', orderId).limit(1);
      invoice = data?.[0] ?? null;
    }

    if (!invoice) {
      console.warn('Y-Note webhook: facture introuvable', messageId, orderId);
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    if (invoice.status === 'paid' || invoice.status === 'void') {
      return NextResponse.json({ message: 'Déjà traitée', status: invoice.status });
    }

    const effectiveMessageId = invoice.ynote_message_id || messageId;
    if (!effectiveMessageId) {
      return NextResponse.json({ message: 'Notification reçue (MessageId inconnu)', status: 'pending' });
    }

    // Re-vérification auprès de Y-Note (source de vérité) : la bonne valeur
    // `payment_method` dépend de l'opérateur enregistré à l'initiation.
    const operator: CmOperator = invoice.payment_method === 'ynote_om' ? 'orange' : 'mtn';
    let verifiedStatus: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
    let providerStatus: string;
    let providerPayload: Record<string, unknown>;
    try {
      const tx = await getYNotePaymentStatus(effectiveMessageId, operator);
      verifiedStatus = tx.status;
      providerStatus = tx.providerStatus;
      providerPayload = tx.raw;
      // Le montant relu doit correspondre au montant demandé : sinon on ne valide pas.
      if (verifiedStatus === 'SUCCESSFUL' && !amountMatches(invoice.amount_xaf, tx.amount)) {
        console.error(
          'Y-Note webhook : montant incohérent (facture %s) : attendu %s FCFA, relu %s FCFA — facture NON validée',
          invoice.invoice_number,
          invoice.amount_xaf,
          tx.amount
        );
        return NextResponse.json({ message: 'Montant incohérent — vérification manuelle requise', status: 'pending' });
      }
    } catch (err: unknown) {
      // API indisponible : on ne confirme rien et on laisse le polling finaliser.
      console.error('Y-Note webhook: vérification impossible', err instanceof Error ? err.message : 'erreur inconnue');
      await supabase
        .from('invoices')
        .update({
          ynote_message_id: effectiveMessageId,
          provider_status: 'UNVERIFIED',
        })
        .eq('id', invoice.id)
        .eq('status', 'open');
      return NextResponse.json({ message: 'Notification reçue, vérification différée', status: 'pending' });
    }

    if (verifiedStatus === 'SUCCESSFUL') {
      const done = await markInvoicePaid(supabase, invoice, {
        ynote_message_id: effectiveMessageId,
        provider_status: providerStatus,
        provider_payload: sanitizeYNotePayload(providerPayload, effectiveMessageId),
      });
      console.log(`Y-Note webhook: paiement confirmé pour ${invoice.invoice_number} (transition ici: ${done})`);
      return NextResponse.json({ message: 'Paiement confirmé', invoice_number: invoice.invoice_number });
    }

    if (verifiedStatus === 'FAILED') {
      await markInvoiceFailed(supabase, invoice, {
        ynote_message_id: effectiveMessageId,
        provider_status: providerStatus,
        provider_payload: sanitizeYNotePayload(providerPayload, effectiveMessageId),
      });
      console.log(`Y-Note webhook: paiement échoué pour ${invoice.invoice_number}`);
      return NextResponse.json({ message: 'Échec enregistré', invoice_number: invoice.invoice_number });
    }

    // Toujours en attente selon l'API (même si la notification disait autre chose)
    await supabase
      .from('invoices')
      .update({
        ynote_message_id: effectiveMessageId,
        provider_status: providerStatus,
        provider_payload: sanitizeYNotePayload(providerPayload, effectiveMessageId),
      })
      .eq('id', invoice.id)
      .eq('status', 'open');

    return NextResponse.json({
      message: 'Notification reçue',
      status: normalizeYNoteStatus(providerStatus).toLowerCase(),
    });

  } catch (error: unknown) {
    console.error('Y-Note webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET : vérification de disponibilité (healthcheck / déclaration de l'URL)
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ynote-webhook' });
}
