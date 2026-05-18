'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function HomePage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      window.location.href = session?.user ? '/feed' : '/auth/login'
    })
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#FCFCFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%',
                    border: '2px solid #E8E8E8', borderTopColor: '#1A1A1A',
                    animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}
