import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'datareq' },
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          const urlStr = typeof url === 'string' ? url : url.toString();
          // Only add schema headers for PostgREST requests, not auth/storage/realtime
          if (urlStr.includes('/rest/v1/')) {
            const headers = new Headers(init?.headers);
            if (!headers.has('Accept-Profile')) {
              headers.set('Accept-Profile', 'datareq');
            }
            if (!headers.has('Content-Profile')) {
              headers.set('Content-Profile', 'datareq');
            }
            return fetch(url, { ...init, headers });
          }
          return fetch(url, init);
        },
      },
    }
  );
}
