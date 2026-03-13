import * as crypto from 'crypto';

export function pseudonymize(value: string): string {
  const hash = crypto.createHash('sha256').update(value + process.env.NEXT_PUBLIC_SUPABASE_URL).digest('hex');
  return `PSEUDO_${hash.substring(0, 12)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return pseudonymize(email);
  return `${local[0]}***@${domain}`;
}

export function maskName(name: string): string {
  if (name.length <= 2) return '***';
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
}

export function anonymizeField(value: string, fieldType: string): string {
  if (!value) return value;
  switch (fieldType) {
    case 'email': return maskEmail(value);
    case 'phone': return value.replace(/\d(?=\d{2})/g, '*');
    default: return pseudonymize(value);
  }
}
