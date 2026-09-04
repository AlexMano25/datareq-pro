import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec la clé service_role (contourne le RLS).
 * À n'utiliser QUE côté serveur (routes API), jamais dans un composant client.
 * Initialisation paresseuse pour ne pas planter le build quand les variables
 * d'environnement ne sont pas encore définies.
 */
export function createServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant');
  }
  return createClient(url, key, {
    db: { schema: 'datareq' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
