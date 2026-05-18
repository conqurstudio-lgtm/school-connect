// @ts-nocheck
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  
  // Get auth token from cookie
  const authCookie = cookieStore.getAll().find(c => 
    c.name.includes('auth-token') || 
    c.name.includes('school-connect-auth') ||
    c.name.startsWith('sb-')
  )

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: authCookie ? {
          Authorization: `Bearer ${authCookie.value}`,
        } : {},
      }
    }
  )
}
