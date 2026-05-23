'use client'
// school-connect-route-lock-v1
// root-safe-login-redirect-v4

import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    window.location.replace('/auth/login')
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
