// Règlement des factures datareq.invoices — transitions communes CamPay / Y-Note.
//
//   open → paid  (markInvoicePaid)   + activation / renouvellement de l'abonnement lié
//   open → void  (markInvoiceFailed)
//
// Les transitions sont idempotentes : la mise à jour est conditionnée à
// status = 'open' et l'abonnement n'est activé que si la transition a eu lieu ici
// (le webhook et le polling peuvent arriver en même temps).

import { createClient } from '@supabase/supabase-js';

export interface InvoiceRow {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  invoice_number: string;
  amount: number;
  amount_xaf: number | null;
  status: string;
  payment_method: string | null;
  provider: string | null;
  external_reference: string | null;
  campay_reference: string | null;
  ynote_message_id: string | null;
  [key: string]: unknown;
}

export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: 'datareq' } }
  );
}

/** Client service_role sur le schéma `datareq` (type inféré, schéma non-public). */
export type ServiceClient = ReturnType<typeof getServiceSupabase>;

export async function activateSubscription(supabase: ServiceClient, subscriptionId: string) {
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
    .eq('id', subscriptionId);
}

/**
 * Passe la facture en 'paid' si elle est encore 'open' et active l'abonnement lié.
 * Retourne true si la transition a été effectuée par cet appel.
 */
export async function markInvoicePaid(
  supabase: ServiceClient,
  invoice: Pick<InvoiceRow, 'id' | 'subscription_id' | 'invoice_number'>,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString(), ...extra })
    .eq('id', invoice.id)
    .eq('status', 'open')
    .select('id');

  if (error) {
    console.error('markInvoicePaid:', error.message);
    return false;
  }
  const transitioned = (data?.length ?? 0) > 0;
  if (transitioned && invoice.subscription_id) {
    await activateSubscription(supabase, invoice.subscription_id);
  }
  return transitioned;
}

/** Passe la facture en 'void' si elle est encore 'open'. */
export async function markInvoiceFailed(
  supabase: ServiceClient,
  invoice: Pick<InvoiceRow, 'id'>,
  extra: Record<string, unknown> = {}
): Promise<boolean> {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'void', ...extra })
    .eq('id', invoice.id)
    .eq('status', 'open')
    .select('id');

  if (error) {
    console.error('markInvoiceFailed:', error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}
