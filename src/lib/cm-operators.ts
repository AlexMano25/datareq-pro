// Détection de l'opérateur mobile camerounais à partir du numéro (isomorphe :
// utilisable côté client pour la pré-sélection et côté serveur pour la validation).
//
// Règle métier (Mano Verde) :
//   MTN    : 67x, 650-654, 680-684
//   Orange : 69x, 655-659, 685-689

export type CmOperator = 'mtn' | 'orange';

export const OPERATOR_LABELS: Record<CmOperator, string> = {
  mtn: 'MTN Mobile Money',
  orange: 'Orange Money',
};

/** Ne garde que les chiffres et retire l'indicatif 237 s'il est présent. */
export function toLocalCmNumber(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('237') && digits.length > 9) return digits.slice(3);
  return digits;
}

/** Format MSISDN attendu par Y-Note : 2376XXXXXXXX (12 chiffres). */
export function toCmMsisdn(phone: string): string {
  const local = toLocalCmNumber(phone);
  return local ? `237${local}` : '';
}

export function isValidCmMobile(phone: string): boolean {
  const local = toLocalCmNumber(phone);
  return /^6\d{8}$/.test(local);
}

/** Retourne l'opérateur déduit du préfixe, ou null si inconnu / numéro incomplet. */
export function detectCmOperator(phone: string): CmOperator | null {
  const local = toLocalCmNumber(phone);
  if (local.length < 3 || !local.startsWith('6')) return null;

  const p2 = local.slice(0, 2);
  const p3 = Number(local.slice(0, 3));

  if (p2 === '67') return 'mtn';
  if (p2 === '69') return 'orange';
  if (p3 >= 650 && p3 <= 654) return 'mtn';
  if (p3 >= 655 && p3 <= 659) return 'orange';
  if (p3 >= 680 && p3 <= 684) return 'mtn';
  if (p3 >= 685 && p3 <= 689) return 'orange';
  return null;
}
