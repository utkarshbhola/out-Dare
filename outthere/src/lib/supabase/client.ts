import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client — safe to use in Client Components and event handlers.
// A singleton pattern avoids creating multiple connections on re-renders.
let client: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
