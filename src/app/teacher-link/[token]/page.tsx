'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { TeacherReportDashboard } from '@/components/teacher/TeacherReportDashboard'
import { TeacherStartupLoader, readTeacherStartupCache } from '@/components/teacher/TeacherStartupLoader'

const T = {
  ink: '#262626',
  ink3: '#9A9CA3',
  bg: '#FFFFFF',
  border: 'rgba(0,0,0,0.07)',
  white: '#FFFFFF',
}

function TeacherLinkError({ message }: { message: string }) {
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
        boxShadow: '0 18px 48px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: '#F8F8F9',
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
          fontWeight: 650,
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
          Open the private teacher link shared by the school admin.
        </p>
      </section>
    </main>
  )
}

export default function TeacherTokenEntryPage() {
  const params = useParams<{ token: string }>()
  const rawToken = params?.token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  const [session, setSession] = useState<any>(null)
  const [message, setMessage] = useState('Need your teacher link')
  const [failed, setFailed] = useState(false)
  const [cached, setCached] = useState<any>(null)


  useEffect(() => {
    setCached(readTeacherStartupCache(token))
  }, [token])

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
          setMessage(json.error || 'This teacher link is invalid or has expired')
          return
        }

        setSession(json)
      })
      .catch((error) => {
        if (!cancelled) {
          setFailed(true)
          setMessage(error?.message || 'Could not open teacher link')
        }
      })

    return () => { cancelled = true }
  }, [token])

  if (session?.teacher?.id) {
    return <TeacherReportDashboard initialSession={session} initialToken={token} />
  }

  if (failed) return <TeacherLinkError message={message} />

  return <TeacherStartupLoader teacher={cached?.session?.teacher} />
}
