'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Token landing page — validates the cookie + token, then redirects
 * to the teacher's profile dashboard at /teachers/{id}?edit=1.
 * The token is only consumed for the cookie set-up; subsequent visits
 * to /teachers/{id}?edit=1 use the cookie.
 */
export function TeacherTokenLanding({ token }: { token: string }) {
  const router = useRouter()

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/teacher-session?token=${encodeURIComponent(token)}`)
        const json = await res.json()
        if (res.ok && json.teacher?.id) {
          router.replace(`/teachers/${json.teacher.id}?edit=1`)
        } else {
          router.replace('/teacher')
        }
      } catch {
        router.replace('/teacher')
      }
    })()
  }, [token, router])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.07)', borderTopColor: '#1A1A1A',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}
