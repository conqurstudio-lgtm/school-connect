import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Safari ITP fix — use localStorage explicitly
        storage:          typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession:   true,
        detectSessionInUrl: true,
        flowType:         'pkce',
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
    }
  )
}
