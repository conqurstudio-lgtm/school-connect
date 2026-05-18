'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GraduationCap } from 'lucide-react'

const T = {
  ink: '#1A1A1A',
  ink2: '#4A4A4A',
  ink3: '#9A9A9A',
  bg: '#FCFCFF',
  border: 'rgba(0,0,0,0.07)',
}

export default function TeacherLinkBridgePage() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [message, setMessage] = useState(token ? 'Opening your class dashboard…' : 'Need your teacher link')

  useEffect(() => {
    if (!token) return

    let cancelled = false

    fetch(`/api/teacher-session?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok || !json.teacher?.id) {
          setMessage('This teacher link is invalid or has expired')
          return
        }

        router.replace(`/teachers/${json.teacher.id}?edit=1`)
      })
      .catch(() => {
        if (!cancelled) setMessage('Could not open teacher link')
      })

    return () => { cancelled = true }
  }, [token, router])

  return (
    <main style={{
      minHeight: '100dvh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 360,
        textAlign: 'center',
        background: '#FFFFFF',
        border: `1px solid ${T.border}`,
        borderRadius: 24,
        padding: '34px 24px',
        boxShadow: '0 18px 48px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: '#F0F0F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: T.ink,
        }}>
          <GraduationCap size={28} strokeWidth={1.6} />
        </div>

        <h1 style={{
          fontSize: 20,
          lineHeight: 1.15,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: T.ink,
          margin: '0 0 8px',
        }}>
          {message}
        </h1>

        <p style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: T.ink3,
          margin: 0,
        }}>
          {token
            ? 'Please wait while we connect you to your class.'
            : 'Open the private link your school admin shared with you to access your dashboard.'}
        </p>
      </section>
    </main>
  )
}
