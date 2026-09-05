'use client';

import { useState, useCallback, useRef } from 'react';

// Règle métier : carte bancaire → CamPay (lien de paiement),
//                Orange Money / MTN MoMo → Y-Note (push USSD).
export type PaymentMethod = 'orange_money' | 'mtn_momo' | 'card';
export type PaymentProvider = 'campay' | 'ynote';
type PaymentStatus = 'idle' | 'processing' | 'pending' | 'success' | 'failed';

export const PROVIDER_FOR_METHOD: Record<PaymentMethod, PaymentProvider> = {
  orange_money: 'ynote',
  mtn_momo: 'ynote',
  card: 'campay',
};

interface PaymentState {
  status: PaymentStatus;
  provider: PaymentProvider | null;
  reference: string | null;
  externalReference: string | null;
  paymentLink: string | null;
  ussdCode: string | null;
  invoiceNumber: string | null;
  amountXaf: number | null;
  amountEur: number | null;
  message: string | null;
  error: string | null;
}

interface InitPaymentParams {
  tenant_id: string;
  subscription_id?: string;  // optionnel (recharge)
  plan_id?: string;          // optionnel (recharge)
  payment_method: PaymentMethod;
  phone_number?: string;     // requis pour Orange Money / MTN MoMo
  first_name?: string;       // carte
  last_name?: string;        // carte
  email?: string;            // carte
  amount_eur: number;
  description?: string;
}

const INITIAL_STATE: PaymentState = {
  status: 'idle',
  provider: null,
  reference: null,
  externalReference: null,
  paymentLink: null,
  ussdCode: null,
  invoiceNumber: null,
  amountXaf: null,
  amountEur: null,
  message: null,
  error: null,
};

interface CheckStatusOptions {
  provider?: PaymentProvider;
  /** true si `ref` est la référence externe (order_id / external_reference) et non celle du fournisseur */
  byExternalRef?: boolean;
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>(INITIAL_STATE);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (ref: string, opts: CheckStatusOptions = {}) => {
    const provider = opts.provider || 'campay';
    const param = opts.byExternalRef ? 'external_ref' : 'reference';
    try {
      const res = await fetch(`/api/payments/${provider}/status?${param}=${encodeURIComponent(ref)}`);
      const data = await res.json();

      if (data.status === 'SUCCESSFUL') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'success',
          provider,
          invoiceNumber: data.invoice_number,
          message: data.message || null,
          error: null,
        }));
        return true;
      } else if (data.status === 'FAILED') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          provider,
          error: data.message || 'Le paiement a échoué',
        }));
        return true;
      }
      return false; // toujours en attente
    } catch {
      return false;
    }
  }, [stopPolling]);

  const startPolling = useCallback((reference: string, provider: PaymentProvider) => {
    stopPolling();
    let attempts = 0;
    const maxAttempts = 40; // 40 x 5 s ≈ 3 min

    pollingRef.current = setInterval(async () => {
      attempts++;
      const done = await checkStatus(reference, { provider });
      if (done || attempts >= maxAttempts) {
        stopPolling();
        if (!done && attempts >= maxAttempts) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Délai d’attente dépassé. Vérifiez le statut dans votre historique de facturation.',
          }));
        }
      }
    }, 5000);
  }, [checkStatus, stopPolling]);

  const initiatePayment = useCallback(async (params: InitPaymentParams) => {
    const provider = PROVIDER_FOR_METHOD[params.payment_method];
    setState({ ...INITIAL_STATE, status: 'processing', provider });

    try {
      let res: Response;
      if (provider === 'ynote') {
        // Orange Money / MTN MoMo → Y-Note (push USSD)
        res = await fetch('/api/payments/ynote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: params.tenant_id,
            subscription_id: params.subscription_id,
            plan_id: params.plan_id,
            operator: params.payment_method === 'mtn_momo' ? 'mtn' : 'orange',
            phone_number: params.phone_number,
            amount_eur: params.amount_eur,
            description: params.description,
          }),
        });
      } else {
        // Carte bancaire → CamPay (lien de paiement)
        res = await fetch('/api/payments/campay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...params, payment_method: 'card' }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Erreur lors de l’initiation du paiement',
        }));
        return;
      }

      if (data.type === 'payment_link' && data.link) {
        setState(prev => ({
          ...prev,
          status: 'pending',
          provider: 'campay',
          reference: data.reference,
          paymentLink: data.link,
          invoiceNumber: data.invoice_number,
          amountXaf: data.amount_xaf,
          amountEur: data.amount_eur,
          message: data.message || null,
        }));
        window.open(data.link, '_blank');
        if (data.reference) startPolling(data.reference, 'campay');

      } else if (data.type === 'ussd_push') {
        setState(prev => ({
          ...prev,
          status: 'pending',
          provider: 'ynote',
          reference: data.reference,
          externalReference: data.external_reference || null,
          ussdCode: data.ussd_code || null,
          invoiceNumber: data.invoice_number,
          amountXaf: data.amount_xaf,
          amountEur: data.amount_eur,
          message: data.message || null,
        }));
        if (data.reference) startPolling(data.reference, 'ynote');

      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Réponse inattendue du serveur de paiement',
        }));
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur réseau';
      setState(prev => ({ ...prev, status: 'failed', error: message }));
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState(INITIAL_STATE);
  }, [stopPolling]);

  return {
    ...state,
    initiatePayment,
    checkStatus,
    reset,
    stopPolling,
  };
}
