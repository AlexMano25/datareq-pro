// Y-Note (PayNote) — Orange Money + MTN Mobile Money par push USSD.
// Serveur uniquement (secrets). Références : manoverde-app/src/lib/ynote.ts et
// SmartBailAfrica/supabase/functions/ynote-collect.
//
//   Jeton   : POST https://omapi-token.ynote.africa/oauth2/token
//             Authorization: Basic base64(clientId:clientSecret), grant_type=client_credentials
//   Paiement: POST https://omapi.ynote.africa/prod/webpayment (Bearer)
//             { API_MUT: { customerkey, customersecret, order_id, amount, subscriberMsisdn,
//                          description, notifUrl, PaiementMethod: 'MTN_CMR' | 'OM_CMR' } }
//             subscriberMsisdn au format LOCAL (6XXXXXXXX) — avec l'indicatif 237, la demande
//             est acceptée puis n'aboutit jamais (mesuré en production).
//             → { MessageId } (Orange le renvoie dans `parameters`, MTN à la racine)
//   Statut  : POST https://omapi.ynote.africa/prod/webpayment/status (Bearer, chemin UNIQUE)
//             { customerkey, customersecret, message_id, payment_method: 'OM_CMR' | 'MTN_CMR' }
//             ⚠️ Orange utilise le MÊME libellé OM_CMR à l'encaissement ET au statut.

import type { CmOperator } from '@/lib/cm-operators';

const YNOTE_TOKEN_URL = 'https://omapi-token.ynote.africa/oauth2/token';
const YNOTE_PAYMENT_URL = 'https://omapi.ynote.africa/prod/webpayment';
// Chemin UNIQUE : `webpaymentmtn` n'existe pas dans la spécification (0 occurrence sur 16 chemins).
const YNOTE_STATUS_URL = process.env.YNOTE_STATUS_URL || 'https://omapi.ynote.africa/prod/webpayment/status';

// Cloudflare refuse les clients qui ne s'annoncent pas (403 error code 1010).
const YNOTE_USER_AGENT = 'ManoVerde-DataReq/1.0 (+https://rgpd.manovende.com)';

export type YNoteMethod = 'MTN_CMR' | 'OM_CMR';
export type YNoteStatusMethod = 'MTN_CMR' | 'OM_CMR';
export type YNoteNormalizedStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED';

/** Encaissement — `PaiementMethod` (avec un « e »). */
export const OPERATOR_TO_YNOTE_METHOD: Record<CmOperator, YNoteMethod> = {
  mtn: 'MTN_CMR',
  orange: 'OM_CMR',
};

/** Statut — `payment_method` (snake_case) : les valeurs diffèrent de l'encaissement pour Orange. */
export const OPERATOR_TO_STATUS_METHOD: Record<CmOperator, YNoteStatusMethod> = {
  mtn: 'MTN_CMR',
  orange: 'OM_CMR',
};

/**
 * Code d'erreur court extrait d'une réponse Y-Note, pour les journaux.
 * ⚠️ Ne JAMAIS journaliser la réponse brute : leur API réinjecte `customerkey` et
 * `customersecret` en clair dans ses messages d'erreur.
 */
function codeSuffix(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const rec = data as Record<string, unknown>;
  const code = rec.statusCode ?? rec.status_code ?? rec.code ?? rec.StatusCode ?? rec.error;
  if (code == null || code === '') return '';
  const s = String(code);
  return /^[A-Za-z0-9_.-]{1,40}$/.test(s) ? ` (${s})` : '';
}

/** 2376XXXXXXXX → 6XXXXXXXX : format LOCAL exigé par Y-Note (avec l'indicatif, rien n'aboutit). */
export function toLocalMsisdn(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '');
  return d.length === 12 && d.startsWith('237') ? d.slice(3) : d;
}

/** true si le montant relu correspond au montant attendu (pas de montant relu = comparaison impossible). */
export function amountMatches(expected: unknown, received: unknown): boolean {
  if (!received || !(Number(expected) > 0)) return true;
  return Math.round(Number(expected)) === Math.round(Number(received));
}

const SUCCESS_STATES = ['SUCCESS', 'SUCCESSFUL', 'SUCCESSFULL', 'PAID', 'COMPLETED'];
const FAILED_STATES = ['FAILED', 'FAILURE', 'EXPIRED', 'CANCELLED', 'CANCELED', 'REJECTED'];

export interface YNotePaymentParams {
  orderId: string;        // ≤ 60 caractères, sans caractères spéciaux
  amountXaf: number;      // montant entier en FCFA
  msisdn: string;         // 6XXXXXXXX ou 2376XXXXXXXX : l'indicatif est retiré à l'envoi
  description: string;
  notifUrl: string;
  operator: CmOperator;
}

export interface YNotePaymentResult {
  messageId: string;
  /** Conservé pour `invoices.provider_payload` — ne JAMAIS le journaliser. */
  raw: Record<string, unknown>;
}

export interface YNoteStatusResult {
  status: YNoteNormalizedStatus;
  providerStatus: string;
  amount: number | null;
  /** Conservé pour `invoices.provider_payload` — ne JAMAIS le journaliser. */
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
      'User-Agent': YNOTE_USER_AGENT,
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(`Y-Note OAuth2 HTTP ${resp.status}${codeSuffix(data)}`);
  }
  const data = await resp.json();
  if (!data.access_token) throw new Error('Y-Note OAuth2 : access_token absent');
  // Mesuré en production : expires_in = 86400 (24 h). Cache de 23 h au plus
  // (quota : 10 requêtes/minute, puis blocage de 5 minutes).
  const expiresIn = Number(data.expires_in) > 0 ? Number(data.expires_in) : 86400;
  cachedToken = { value: data.access_token, expiry: now + Math.min(expiresIn - 60, 82800) * 1000 };
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

/** Réponse MTN : le champ `message` porte la réponse de l'opérateur, en JSON échappé. */
function unwrapMessage(payload: Record<string, unknown>): Record<string, unknown> | null {
  const m = payload.message;
  if (typeof m !== 'string') return null;
  const s = m.trim();
  if (!s.startsWith('{')) return null;
  try { return JSON.parse(s) as Record<string, unknown>; } catch { return null; }
}

/** Extrait le statut brut d'une réponse / notification Y-Note (plusieurs formes connues). */
export function extractYNoteStatus(payload: Record<string, unknown>): string {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  const inner = unwrapMessage(payload);
  return pick(payload, ['status', 'transaction_status', 'transactionStatus', 'Status'])
    ?? pick(data, ['status', 'transaction_status'])
    ?? (inner ? (pick(inner, ['Status', 'status']) ?? '') : '')
    ?? '';
}

/** Montant relu (racine, `data`, ou `message` JSON échappé renvoyé par MTN). */
export function extractYNoteAmount(payload: Record<string, unknown>): number | null {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  const inner = unwrapMessage(payload);
  const v = payload.amount ?? payload.Amount ?? data.amount ?? (inner ? (inner.Amount ?? inner.amount) : undefined);
  return Number(v) > 0 ? Math.round(Number(v)) : null;
}

/** Extrait le MessageId d'une réponse / notification Y-Note (Orange le place dans `parameters`). */
export function extractYNoteMessageId(payload: Record<string, unknown>): string {
  const data = (payload.data && typeof payload.data === 'object') ? payload.data as Record<string, unknown> : {};
  const params = (payload.parameters && typeof payload.parameters === 'object')
    ? payload.parameters as Record<string, unknown> : {};
  return pick(payload, ['MessageId', 'messageId', 'message_id', 'transaction_id'])
    ?? pick(params, ['MessageId', 'messageId', 'message_id'])
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

  // Format attendu par Y-Note : LOCAL (6XXXXXXXX). L'indicatif 237 est retiré ici.
  const msisdnLocal = toLocalMsisdn(params.msisdn);
  if (!/^6\d{8}$/.test(msisdnLocal)) {
    throw new Error('Numéro de téléphone invalide pour Y-Note (format attendu 6XXXXXXXX)');
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
      subscriberMsisdn: msisdnLocal,
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
      'User-Agent': YNOTE_USER_AGENT,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    // Jamais le corps brut : il réinjecte nos identifiants en clair.
    throw new Error(`Y-Note webpayment HTTP ${resp.status}${codeSuffix(data)}`);
  }
  // Orange renvoie le MessageId dans `parameters`, MTN à la racine.
  const messageId = extractYNoteMessageId(data);
  if (!messageId) throw new Error(`Y-Note : MessageId absent (HTTP ${resp.status})`);
  return { messageId, raw: data };
}

/**
 * Interroge le statut d'une transaction Y-Note par son MessageId.
 * Chemin UNIQUE : POST /prod/webpayment/status, avec `message_id` ET `payment_method`
 * (OM_CMR pour Orange, MTN_CMR pour MTN).
 */
export async function getYNotePaymentStatus(messageId: string, operator: CmOperator): Promise<YNoteStatusResult> {
  const creds = getCredentials();
  const token = await getAccessToken(creds);

  const resp = await fetch(YNOTE_STATUS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': YNOTE_USER_AGENT,
    },
    body: JSON.stringify({
      customerkey: creds.customerKey,
      customersecret: creds.customerSecret,
      message_id: messageId, // snake_case obligatoire
      payment_method: OPERATOR_TO_STATUS_METHOD[operator],
    }),
    cache: 'no-store',
  });
  const data = await parseJson(resp);
  if (!resp.ok) {
    // Jamais le corps brut : un 422 renvoie customerkey ET customersecret en clair.
    throw new Error(`Y-Note status HTTP ${resp.status}${codeSuffix(data)}`);
  }
  const providerStatus = extractYNoteStatus(data) || 'UNKNOWN';
  return {
    status: normalizeYNoteStatus(providerStatus),
    providerStatus,
    amount: extractYNoteAmount(data),
    raw: data,
  };
}

/**
 * Réponse du fournisseur **expurgée** avant persistance (`invoices.provider_payload`).
 * On ne stocke JAMAIS le corps brut renvoyé par Y-Note : l'API y réinjecte nos
 * identifiants en clair dans ses messages d'erreur (`customerkey`, `customersecret`).
 * On ne garde que l'exploitable : identifiant de message, statut, code de statut.
 */
export function sanitizeYNotePayload(
  data: unknown,
  messageId?: string | null
): Record<string, unknown> {
  const d = (data ?? {}) as Record<string, unknown>;
  const code = d.statusCode ?? d.status_code ?? null;
  return {
    message_id: messageId ?? extractYNoteMessageId(d) ?? null,
    status: extractYNoteStatus(d) || null,
    status_code: typeof code === 'number' || typeof code === 'string' ? code : null,
  };
}
