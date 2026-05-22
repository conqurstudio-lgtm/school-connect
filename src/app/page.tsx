'use client'
// school-admin-landing-route-repair-v1
// school-root-route-async-repair-v2

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  useEffect(() => {
    let alive = true

    const routeUser = async () => {
      const { data: sessionResult } = await supabase.auth.getSession()
      const session = sessionResult?.session

      if (!alive) return

      if (!session?.user) {
        window.location.href = '/auth/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!alive) return

      window.location.href = profile?.role === 'school' ? '/school' : '/feed'
    }

    routeUser()

    return () => {
      alive = false
    }
  }, [])

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      fontWeight: 500,
    }}>
      Opening School Connect...
    </main>
  )
}
