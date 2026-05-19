'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TeacherTokenLanding({ token }: { token: string }) {
  const router = useRouter()

  useEffect(() => {
    if (token) {
      router.replace(`/teacher-link/${encodeURIComponent(token)}`)
    }
  }, [token, router])

  return (
    <main style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: '#FCFCFF',
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      textAlign: 'center',
    }}>
      <div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#1A1A1A',
          margin: '0 0 8px',
          letterSpacing: '-0.03em',
        }}>
          Opening teacher dashboard…
        </h1>
        <p style={{
          fontSize: 14,
          color: '#9A9A9A',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Please wait while we open the correct teacher link.
        </p>
      </div>
    </main>
  )
}
