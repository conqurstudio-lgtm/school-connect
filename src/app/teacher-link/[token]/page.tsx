'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { TeacherSelfProfile } from '@/components/teacher/TeacherSelfProfile'

const T = {
  ink: '#1A1A1A',
  ink3: '#9A9A9A',
  bg: '#FCFCFF',
  border: 'rgba(0,0,0,0.07)',
  white: '#FFFFFF',
}

export default function TeacherTokenEntryPage() {
  const params = useParams<{ token: string }>()
  const rawToken = params?.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [message, setMessage] = useState('Opening your class dashboard…')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!token) {
      setFailed(true)
      setMessage('Need your teacher link')
      return
    }

    let cancelled = false

    fetch(`/api/teacher-session?token=${encodeURIComponent(token)}`, {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then(async res => {
        const json = await res.json().catch(() => ({}))
        if (cancelled) return

        if (!res.ok || !json.teacher?.id) {
          setFailed(true)
          setMessage('This teacher link is invalid or has expired')
          return
        }

        setTeacherId(json.teacher.id)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setMessage('Could not open teacher link')
        }
      })

    return () => { cancelled = true }
  }, [token])

  if (teacherId) {
    return <TeacherSelfProfile teacherId={teacherId} />
  }

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
        background: T.white,
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
          {failed
            ? 'Ask the school admin to copy a fresh teacher link.'
            : 'Please wait while we connect you to your class.'}
        </p>
      </section>
    </main>
  )
}
