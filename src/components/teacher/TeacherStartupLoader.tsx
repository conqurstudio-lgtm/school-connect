'use client'

import { useEffect, useState } from 'react'

const T = {
  ink: '#252525',
  bg: '#FFFFFF',
  accent: '#717171',
  accentSoft: '#F5F5F5',
}

const TEACHER_DASHBOARD_CACHE_PREFIX = 'school-connect:teacher-dashboard-cache:v2:'
const TEACHER_DASHBOARD_CACHE_LAST = 'school-connect:teacher-dashboard-cache:v2:last'

function safeToken(token?: string | null) {
  return String(token || '').trim() || 'current'
}

export function teacherStartupCacheKey(token?: string | null) {
  return `${TEACHER_DASHBOARD_CACHE_PREFIX}${safeToken(token)}`
}

export function readTeacherStartupCache(token?: string | null) {
  if (typeof window === 'undefined') return null

  const keys = token
    ? [teacherStartupCacheKey(token), TEACHER_DASHBOARD_CACHE_LAST]
    : [TEACHER_DASHBOARD_CACHE_LAST]

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (parsed?.session?.teacher?.id) return parsed
    } catch {
      // Ignore local storage parse errors.
    }
  }

  return null
}

export function writeTeacherStartupCache(token: string | null | undefined, session: any, momentSummary?: any) {
  if (typeof window === 'undefined' || !session?.teacher?.id) return

  const payload = JSON.stringify({
    session,
    momentSummary: momentSummary || null,
    saved_at: new Date().toISOString(),
  })

  try {
    window.localStorage.setItem(teacherStartupCacheKey(token), payload)
    window.localStorage.setItem(TEACHER_DASHBOARD_CACHE_LAST, payload)
  } catch {
    // Caching should never block the teacher dashboard.
  }
}

export function getTeacherStartupPhotoUrl(teacher?: any) {
  return String(
    teacher?.photo_url ||
    teacher?.image_url ||
    teacher?.avatar_url ||
    teacher?.profile_photo_url ||
    ''
  ).trim()
}

// Kept for backwards compatibility with earlier imports.
// It resolves quickly so the page does not wait on a slow remote image.
export function preloadTeacherStartupImage(_teacher?: any) {
  return Promise.resolve()
}

function initialsFrom(name?: string | null) {
  return String(name || 'Teacher')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TeacherStartupLoader({ teacher, leaving = false, overlay = false }: any) {
  // Important for Next hydration:
  // localStorage cache is only available on the client. The first server render and
  // the first client hydration render must match, so teacher-specific text/photo is
  // only painted after mount.
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const readyTeacher = mounted ? teacher : null
  const photoUrl = getTeacherStartupPhotoUrl(readyTeacher)
  const name = readyTeacher?.name || 'Teacher'
  const initials = mounted && !photoUrl ? initialsFrom(name) : ''

  const content = (
    <>
      <div
        className={`teacher-startup-mark ${leaving ? 'is-leaving' : ''}`}
        style={{
          background: photoUrl ? `url(${photoUrl}) center/cover` : T.accentSoft,
          color: T.accent,
        }}
        aria-label={mounted ? `${name} profile photo` : 'Teacher profile loading'}
        suppressHydrationWarning
      >
        {initials}
      </div>

      <style>{`
        @keyframes teacherStartupIn {
          from { opacity: 0; transform: translateY(7px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes teacherStartupOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-4px) scale(0.987); }
        }

        @keyframes teacherStartupBackdropOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        .teacher-startup-mark {
          width: 92px;
          height: 92px;
          border-radius: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-size: 25px;
          font-weight: 560;
          box-shadow: 0 12px 28px rgba(15,23,42,0.045);
          animation: teacherStartupIn 220ms cubic-bezier(.2,.8,.2,1) both;
          will-change: opacity, transform;
          contain: paint;
        }

        .teacher-startup-mark.is-leaving {
          animation: teacherStartupOut 190ms cubic-bezier(.2,.8,.2,1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .teacher-startup-mark,
          .teacher-startup-mark.is-leaving {
            animation: none;
          }
        }
      `}</style>
    </>
  )

  if (overlay) {
    return (
      <div
        className={leaving ? 'teacher-startup-overlay is-leaving' : 'teacher-startup-overlay'}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 12000,
          background: 'rgba(255,255,255,0.985)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(2.5px)',
          WebkitBackdropFilter: 'blur(2.5px)',
          animation: leaving ? 'teacherStartupBackdropOut 220ms cubic-bezier(.2,.8,.2,1) forwards' : undefined,
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <main style={{
      minHeight: '100dvh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
      {content}
    </main>
  )
}
