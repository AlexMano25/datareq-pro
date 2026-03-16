// CamPay Payment Gateway Integration
// Supports: Orange Money (collect) + Card payments (payment link)
// MTN Money remains on Y-Note

const CAMPAY_BASE_URL = process.env.CAMPAY_ENVIRONMENT === 'PROD'
  ? 'https://www.campay.net'
  : 'https://demo.campay.net';

const CAMPAY_USERNAME = process.env.CAMPAY_APP_USERNAME || '';
const CAMPAY_PASSWORD = process.env.CAMPAY_APP_PASSWORD || '';

interface CamPayToken {
  token: string;
  is_successful: boolean;
}

interface CollectRequest {
  amount: string;
  currency: string;
  from: string;
  description: string;
  external_reference: string;
}

interface CollectResponse {
  reference: string;
  ussd_code?: string;
  operator?: string;
  external_reference?: string;
  status: string;
  amount?: number;
  currency?: string;
  code?: string;
  operator_reference?: string;
  message?: string;
}

interface PaymentLinkRequest {
  amount: string;
  currency: string;
  description: string;
  external_reference: string;
  from?: string;
  first_name: string;
  last_name: string;
  email: string;
  redirect_url: string;
  failure_redirect_url: string;
  payment_options: string; // "MOMO,CARD" or "CARD" or "MOMO"
}

interface PaymentLinkResponse {
  status: string;
  link: string;
  reference: string;
  message?: string;
}

interface TransactionStatus {
  reference: string;
  external_reference: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  amount: number;
  currency: string;
  operator: string;
  code: string;
  operator_reference: string;
  message?: string;
}

interface BalanceResponse {
  total_balance: number;
  mtn_balance: number;
  orange_balance: number;
  currency: string;
}

// Get authentication token
async function getToken(): Promise<CamPayToken> {
  try {
    const response = await fetch(`${CAMPAY_BASE_URL}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: CAMPAY_USERNAME,
        password: CAMPAY_PASSWORD,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { token: data.token, is_successful: true };
    }
    return { token: '', is_successful: false };
  } catch {
    return { token: '', is_successful: false };
  }
}

// Get authorized headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { token, is_successful } = await getToken();
  if (!is_successful || !token) {
    throw new Error('CamPay authentication failed. Check credentials.');
  }
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
}

// Initiate a Mobile Money collection (non-blocking - Orange Money)
export async function initCollect(data: CollectRequest): Promise<CollectResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CAMPAY_BASE_URL}/api/collect/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: String(data.amount),
      currency: data.currency || 'XAF',
      from: data.from,
      description: data.description,
      external_reference: data.external_reference,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    return { reference: '', status: 'FAILED', message: result.message || 'Collection failed' };
  }
  return result;
}

// Generate a payment link (supports MOMO + CARD)
export async function getPaymentLink(data: PaymentLinkRequest): Promise<PaymentLinkResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CAMPAY_BASE_URL}/api/get_payment_link/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: String(data.amount),
      currency: data.currency || 'XAF',
      description: data.description,
      external_reference: data.external_reference,
      from: data.from || '',
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      redirect_url: data.redirect_url,
      failure_redirect_url: data.failure_redirect_url,
      payment_options: data.payment_options || 'CARD',
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    return { status: 'FAILED', link: '', reference: '', message: result.message || 'Payment link creation failed' };
  }
  return { status: 'SUCCESSFUL', link: result.link, reference: result.reference };
}

// Check transaction status
export async function getTransactionStatus(reference: string): Promise<TransactionStatus> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CAMPAY_BASE_URL}/api/transaction/${reference}`, {
    method: 'GET',
    headers,
  });

  const result = await response.json();
  return result;
}

// Get CamPay account balance
export async function getBalance(): Promise<BalanceResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CAMPAY_BASE_URL}/api/balance/`, {
    method: 'GET',
    headers,
  });

  return await response.json();
}

// Disburse funds (withdraw to mobile money)
export async function disburse(data: {
  amount: string;
  currency: string;
  to: string;
  description: string;
  external_reference: string;
}) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${CAMPAY_BASE_URL}/api/withdraw/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: String(data.amount),
      currency: data.currency || 'XAF',
      to: data.to,
      description: data.description,
      external_reference: data.external_reference,
    }),
  });

  return await response.json();
}

// Convert EUR to XAF (approximate rate)
export function eurToXaf(eurAmount: number): number {
  const RATE = 655.957; // Fixed EUR/XAF parity
  return Math.round(eurAmount * RATE);
}

// Convert XAF to EUR
export function xafToEur(xafAmount: number): number {
  const RATE = 655.957;
  return Math.round((xafAmount / RATE) * 100) / 100;
}

export type {
  CollectRequest,
  CollectResponse,
  PaymentLinkRequest,
  PaymentLinkResponse,
  TransactionStatus,
  BalanceResponse,
};

