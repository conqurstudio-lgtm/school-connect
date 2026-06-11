'use client'

import { useEffect, useState } from 'react'

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

export function getTeacherStartupPhotoUrl(teacher?: any) {
  return String(
    teacher?.photo_url ||
    teacher?.image_url ||
    teacher?.avatar_url ||
    teacher?.profile_photo_url ||
    ''
  ).trim()
}

export function preloadTeacherStartupImage(teacher?: any) {
  if (typeof window === 'undefined') return Promise.resolve()

  const url = getTeacherStartupPhotoUrl(teacher)
  if (!url) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let done = false

    const finish = () => {
      if (done) return
      done = true
      window.clearTimeout(timer)
      resolve()
    }

    const timer = window.setTimeout(finish, 1200)
    const image = new Image()
    image.decoding = 'async'
    image.onload = finish
    image.onerror = finish
    image.src = url

    if (image.complete) finish()
  })
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
  const photoUrl = getTeacherStartupPhotoUrl(teacher)
  const name = teacher?.name || 'Teacher'
  const [loadedPhotoUrl, setLoadedPhotoUrl] = useState('')
  const hasLoadedPhoto = Boolean(photoUrl && loadedPhotoUrl === photoUrl)

  useEffect(() => {
    let cancelled = false

    if (!photoUrl) {
      setLoadedPhotoUrl('')
      return () => { cancelled = true }
    }

    preloadTeacherStartupImage({ photo_url: photoUrl }).then(() => {
      if (!cancelled) setLoadedPhotoUrl(photoUrl)
    })

    return () => {
      cancelled = true
    }
  }, [photoUrl])

  const content = (
    <>
      <div
        className={`teacher-startup-mark ${leaving ? 'is-leaving' : ''}`}
        aria-label={`${name} profile photo`}
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={hasLoadedPhoto ? 'teacher-startup-photo is-ready' : 'teacher-startup-photo'}
            onLoad={() => setLoadedPhotoUrl(photoUrl)}
          />
        )}

        <span className={hasLoadedPhoto ? 'teacher-startup-initials is-hidden' : 'teacher-startup-initials'}>
          {initialsFrom(name)}
        </span>
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
          position: relative;
          width: 92px;
          height: 92px;
          border-radius: 32px;
          background: ${T.accentSoft};
          color: ${T.accent};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-size: 25px;
          font-weight: 560;
          box-shadow: 0 14px 34px rgba(15,23,42,0.052);
          animation: teacherStartupIn 260ms cubic-bezier(.2,.8,.2,1) both;
          will-change: opacity, transform;
          contain: paint;
        }

        .teacher-startup-mark.is-leaving {
          animation: teacherStartupOut 240ms cubic-bezier(.2,.8,.2,1) forwards;
        }

        .teacher-startup-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.015);
          transition: opacity 180ms cubic-bezier(.2,.8,.2,1), transform 220ms cubic-bezier(.2,.8,.2,1);
          will-change: opacity, transform;
        }

        .teacher-startup-photo.is-ready {
          opacity: 1;
          transform: scale(1);
        }

        .teacher-startup-initials {
          position: relative;
          z-index: 1;
          opacity: 1;
          transition: opacity 160ms cubic-bezier(.2,.8,.2,1);
        }

        .teacher-startup-initials.is-hidden {
          opacity: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .teacher-startup-mark,
          .teacher-startup-mark.is-leaving {
            animation: none;
          }

          .teacher-startup-photo,
          .teacher-startup-initials {
            transition: none;
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
          transform: 'translateZ(0)',
          willChange: 'opacity',
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
