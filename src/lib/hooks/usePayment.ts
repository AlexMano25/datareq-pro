'use client';

import { useState, useCallback, useRef } from 'react';

type PaymentMethod = 'orange_money' | 'card';
type PaymentStatus = 'idle' | 'processing' | 'pending' | 'success' | 'failed';

interface PaymentState {
  status: PaymentStatus;
  reference: string | null;
  paymentLink: string | null;
  ussdCode: string | null;
  invoiceNumber: string | null;
  amountXaf: number | null;
  amountEur: number | null;
  error: string | null;
}

interface InitPaymentParams {
  tenant_id: string;
  subscription_id: string;
  plan_id: string;
  payment_method: PaymentMethod;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  amount_eur?: number;
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    status: 'idle',
    reference: null,
    paymentLink: null,
    ussdCode: null,
    invoiceNumber: null,
    amountXaf: null,
    amountEur: null,
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async (reference: string) => {
    try {
      const res = await fetch(`/api/payments/campay/status?reference=${reference}`);
      const data = await res.json();

      if (data.status === 'SUCCESSFUL') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'success',
          invoiceNumber: data.invoice_number,
          error: null,
        }));
        return true;
      } else if (data.status === 'FAILED') {
        stopPolling();
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: data.message || 'Le paiement a \u00E9chou\u00E9',
        }));
        return true;
      }
      return false; // still pending
    } catch {
      return false;
    }
  }, [stopPolling]);

  const startPolling = useCallback((reference: string) => {
    stopPolling();
    let attempts = 0;
    const maxAttempts = 40; // 40 x 5s = ~3 minutes

    pollingRef.current = setInterval(async () => {
      attempts++;
      const done = await checkStatus(reference);
      if (done || attempts >= maxAttempts) {
        stopPolling();
        if (attempts >= maxAttempts) {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'D\u00E9lai d\u2019attente d\u00E9pass\u00E9. V\u00E9rifiez le statut dans votre historique.',
          }));
        }
      }
    }, 5000);
  }, [checkStatus, stopPolling]);

  const initiatePayment = useCallback(async (params: InitPaymentParams) => {
    setState({
      status: 'processing',
      reference: null,
      paymentLink: null,
      ussdCode: null,
      invoiceNumber: null,
      amountXaf: null,
      amountEur: null,
      error: null,
    });

    try {
      const res = await fetch('/api/payments/campay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: data.error || 'Erreur lors de l\u2019initiation du paiement',
        }));
        return;
      }

      if (data.type === 'payment_link' && data.link) {
        // Card payment - redirect to CamPay payment page
        setState(prev => ({
          ...prev,
          status: 'pending',
          reference: data.reference,
          paymentLink: data.link,
          invoiceNumber: data.invoice_number,
          amountXaf: data.amount_xaf,
          amountEur: data.amount_eur,
        }));
        // Open payment link in new tab
        window.open(data.link, '_blank');
        // Start polling for status
        if (data.reference) {
          startPolling(data.reference);
        }

      } else if (data.type === 'ussd_push') {
        // Orange Money - USSD push sent to phone
        setState(prev => ({
          ...prev,
          status: 'pending',
          reference: data.reference,
          ussdCode: data.ussd_code,
          invoiceNumber: data.invoice_number,
          amountXaf: data.amount_xaf,
          amountEur: data.amount_eur,
        }));
        // Start polling for confirmation
        if (data.reference) {
          startPolling(data.reference);
        }
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur r\u00E9seau';
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: message,
      }));
    }
  }, [startPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({
      status: 'idle',
      reference: null,
      paymentLink: null,
      ussdCode: null,
      invoiceNumber: null,
      amountXaf: null,
      amountEur: null,
      error: null,
    });
  }, [stopPolling]);

  return {
    ...state,
    initiatePayment,
    checkStatus: (ref: string) => checkStatus(ref),
    reset,
    stopPolling,
  };
}

