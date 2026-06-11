'use client'

const T = {
  ink: '#252525',
  ink3: '#9A9CA3',
  bg: '#FFFFFF',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
  white: '#FFFFFF',
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

function initialsFrom(name?: string | null) {
  return String(name || 'T')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function TeacherStartupLoader({ teacher, leaving = false, overlay = false }: any) {
  const photoUrl = teacher?.photo_url || teacher?.image_url || teacher?.avatar_url || ''
  const name = teacher?.name || 'Teacher'

  const content = (
    <>
      <div
        className={`teacher-startup-mark ${leaving ? 'is-leaving' : ''}`}
        style={{
          background: photoUrl ? `url(${photoUrl}) center/cover` : T.accentSoft,
          color: T.accent,
          boxShadow: '0 14px 34px rgba(15,23,42,0.055)',
        }}
        aria-label={`${name} profile photo`}
      >
        {!photoUrl && initialsFrom(name)}
      </div>

      <style>{`
        @keyframes teacherStartupIn {
          from { opacity: 0; transform: translateY(8px) scale(0.965); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes teacherStartupOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-5px) scale(0.985); }
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
          animation: teacherStartupIn 260ms cubic-bezier(.2,.8,.2,1) both;
          will-change: opacity, transform;
        }

        .teacher-startup-mark.is-leaving {
          animation: teacherStartupOut 240ms cubic-bezier(.2,.8,.2,1) forwards;
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
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: leaving ? 'teacherStartupBackdropOut 280ms cubic-bezier(.2,.8,.2,1) forwards' : undefined,
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
