// Y-Note (PayNote) — Orange Money + MTN Mobile Money par push USSD.
// Serveur uniquement (secrets). Références : manoverde-app/src/lib/ynote.ts et
// SmartBailAfrica/supabase/functions/ynote-collect.
//
//   Jeton   : POST https://omapi-token.ynote.africa/oauth2/token
//             Authorization: Basic base64(clientId:clientSecret), grant_type=client_credentials
//   Paiement: POST https://omapi.ynote.africa/prod/webpayment (Bearer)
//             { API_MUT: { customerkey, customersecret, order_id, amount, subscriberMsisdn,
//                          description, notifUrl, PaiementMethod: 'MTN_CMR' | 'OM_CMR' } }
//             → { MessageId }
//   Statut  : POST https://omapi.ynote.africa/prod/webpaymentmtn/status (Bearer)
//             { customerkey, customersecret, message_id }  (clés en snake_case)

import type { CmOperator } from '@/lib/cm-operators';

const YNOTE_TOKEN_URL = 'https://omapi-token.ynote.africa/oauth2/token';
const YNOTE_PAYMENT_URL = 'https://omapi.ynote.africa/prod/webpayment';
const YNOTE_STATUS_URL = process.env.YNOTE_STATUS_URL || 'https://omapi.ynote.africa/prod/webpaymentmtn/status';

export type YNoteMethod = 'MTN_CMR' | 'OM_CMR';
export type YNoteNormalizedStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

export const OPERATOR_TO_YNOTE_METHOD: Record<CmOperator, YNoteMethod> = {
  mtn: 'MTN_CMR',
  orange: 'OM_CMR',
};

const SUCCESS_STATES = ['SUCCESS', 'SUCCESSFUL', 'SUCCESSFULL', 'PAID', 'COMPLETED'];
const FAILED_STATES = ['FAILED', 'FAILURE', 'EXPIRED', 'CANCELLED', 'CANCELED', 'REJECTED'];

export interface YNotePaymentParams {
  orderId: string;        // ≤ 60 caractères, sans caractères spéciaux
  amountXaf: number;      // montant entier en FCFA
  msisdn: string;         // 2376XXXXXXXX
  description: string;
  notifUrl: string;
  operator: CmOperator;
}

export interface YNotePaymentResult {
  messageId: string;
  raw: Record<string, unknown>;
}

export interface YNoteStatusResult {
  status: YNoteNormalizedStatus;
  providerStatus: string;
  raw: Record<string, unknown>;
}

interface YNoteCredentials {
  clientId: string;
  clientSecret: string;
  customerKey: string;
  customerSecret: string;
}

function getCredentials(): YNoteCredentials {
  const clientId = process.env.YNOTE_CLIENT_ID;
  const clientSecret = process.env.YNOTE_CLIENT_SECRET;
  const customerKey = process.env.YNOTE_CUSTOMER_KEY;
  const customerSecret = process.env.YNOTE_CUSTOMER_SECRET;
  if (!clientId || !clientSecret || !customerKey || !customerSecret) {
    throw new Error(
      'Configuration Y-Note manquante (YNOTE_CLIENT_ID, YNOTE_CLIENT_SECRET, YNOTE_CUSTOMER_KEY, YNOTE_CUSTOMER_SECRET)'
    );
  }
  return { clientId, clientSecret, customerKey, customerSecret };
}

export function isYNoteConfigured(): boolean {
  return Boolean(
    process.env.YNOTE_CLIENT_ID &&
    process.env.YNOTE_CLIENT_SECRET &&
    process.env.YNOTE_CUSTOMER_KEY &&
    process.env.YNOTE_CUSTOMER_SECRET
  );
}

// Cache du jeton au niveau du module (réutilisé tant que le processus est chaud)
let cachedToken: { value: string; expiry: number } | null = null;

async function getAccessToken(creds: YNoteCredentials): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiry - 30_000) return cachedToken.value;

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const resp = await fetch(YNOTE_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`Y-Note OAuth2 ${resp.status}: ${txt.slice(0, 300)}`);
  }
  const data = await resp.json();
  if (!data.access_token) throw new Error('Y-Note OAuth2 : access_token absent');
  const expiresIn = Number(data.expires_in) || 3600;
  cachedToken = { value: data.access_token, expiry: now + expiresIn * 1000 };
  return cachedToken.value;
}

async function parseJson(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function pick(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return String(v);
  }
  return undefined;
}

/** Normalise un statut Y-Note (ou tout autre libellé) en PENDING / SUCCESSFUL / FAILED. */
export function normalizeYNoteStatus(providerStatus: string | undefined | null): YNoteNormalizedStatus {
  const s = String(providerStatus || '').toUpperCase();
  if (SUCCESS_STATES.includes(s)) return 'SUCCESSFUL';
  if (FAILED_STATES.includes(s)) return 'FAILED';
  return 'PENDING';
}

/** Extrait le statut brut d'une réponse / notification Y-Note (plusieurs formes connues). */
export function extractYNoteStatus(payload: Record<string, unknown>): string {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  return pick(payload, ['status', 'transaction_status', 'transactionStatus', 'Status'])
    ?? pick(data, ['status', 'transaction_status'])
    ?? '';
}

/** Extrait le MessageId d'une réponse / notification Y-Note. */
export function extractYNoteMessageId(payload: Record<string, unknown>): string {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  return pick(payload, ['MessageId', 'messageId', 'message_id', 'transaction_id'])
    ?? pick(data, ['MessageId', 'messageId', 'message_id'])
    ?? '';
}

/** Extrait l'order_id d'une notification Y-Note. */
export function extractYNoteOrderId(payload: Record<string, unknown>): string {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  return pick(payload, ['order_id', 'orderId', 'external_reference'])
    ?? pick(data, ['order_id', 'orderId'])
    ?? '';
}

/** Lance un push USSD (Orange Money ou MTN MoMo) via Y-Note. */
export async function initYNotePayment(params: YNotePaymentParams): Promise<YNotePaymentResult> {
  const creds = getCredentials();

  if (!/^2376\d{8}$/.test(params.msisdn)) {
    throw new Error(`Numéro de téléphone invalide pour Y-Note : ${params.msisdn}`);
  }
  if (!params.orderId || params.orderId.length > 60) {
    throw new Error('order_id Y-Note invalide (≤ 60 caractères requis)');
  }

  const token = await getAccessToken(creds);
  const payload = {
    API_MUT: {
      customerkey: creds.customerKey,
      customersecret: creds.customerSecret,
      order_id: params.orderId,
      amount: String(Math.round(params.amountXaf)),
      subscriberMsisdn: params.msisdn,
      description: params.description.slice(0, 120),
      notifUrl: params.notifUrl,
      PaiementMethod: OPERATOR_TO_YNOTE_METHOD[params.operator],
    },
  };

  const resp = await fetch(YNOTE_PAYMENT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    const msg = pick(data, ['message', 'error', 'raw']) || 'échec de l’initiation';
    throw new Error(`Y-Note webpayment ${resp.status}: ${msg.slice(0, 200)}`);
  }
  const messageId = extractYNoteMessageId(data);
  if (!messageId) {
    throw new Error(`Y-Note : MessageId absent (${JSON.stringify(data).slice(0, 200)})`);
  }
  return { messageId, raw: data };
}

/** Interroge le statut d'une transaction Y-Note par son MessageId. */
export async function getYNotePaymentStatus(messageId: string): Promise<YNoteStatusResult> {
  const creds = getCredentials();
  const token = await getAccessToken(creds);

  const resp = await fetch(YNOTE_STATUS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerkey: creds.customerKey,
      customersecret: creds.customerSecret,
      message_id: messageId, // snake_case obligatoire
    }),
    cache: 'no-store',
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    const msg = pick(data, ['message', 'error', 'raw']) || 'échec de la vérification';
    throw new Error(`Y-Note status ${resp.status}: ${msg.slice(0, 200)}`);
  }
  const providerStatus = extractYNoteStatus(data) || 'UNKNOWN';
  return { status: normalizeYNoteStatus(providerStatus), providerStatus, raw: data };
}
