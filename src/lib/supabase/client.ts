import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'datareq' },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          // Force Accept-Profile and Content-Profile headers for datareq schema
          // createBrowserClient from @supabase/ssr v0.9.0 does not forward db.schema
          if (!headers.has('Accept-Profile')) {
            headers.set('Accept-Profile', 'datareq');
          }
          if (!headers.has('Content-Profile')) {
            headers.set('Content-Profile', 'datareq');
          }
          return fetch(url, { ...init, headers });
        },
      },
    }
  );
}
