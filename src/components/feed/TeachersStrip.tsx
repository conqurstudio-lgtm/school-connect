// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
}

interface Teacher {
  id:          string
  name:        string
  photo_url:   string | null
  grade:       string
  class_name:  string | null
}

export function TeachersStrip() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [mine,     setMine]     = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)   // hydrated from cache?
  const [active,   setActive]   = useState<Teacher | null>(null)
  const [unreadTeachers, setUnreadTeachers] = useState<Record<string, number>>({})


  const checkTeacherMessages = async (teacherList: Teacher[], mineIds: string[] = []) => {
    try {
      if (!Array.isArray(teacherList) || teacherList.length === 0) {
        setUnreadTeachers({})
        return
      }

      const res = await fetch('/api/thread-status', { cache: 'no-store' })
      if (!res.ok) return

      const json = await res.json()
      const byTeacher = json.by_teacher || {}
      const next: Record<string, number> = {}

      // Important: do not depend only on my_teacher_ids here.
      // If the parent/child mapping has not filled my_teacher_ids yet,
      // /api/thread-status is still the source of truth for approved
      // teacher relationship unread messages.
      teacherList.forEach((teacher: any) => {
        const count = Number(byTeacher?.[teacher.id]?.unread_count || 0)
        if (count > 0) next[teacher.id] = count
      })

      setUnreadTeachers(next)
    } catch {}
  }

  // Hydrate from sessionStorage immediately on mount (no network)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('teachers-cache')
      if (cached) {
        const { teachers: t, mine: m } = JSON.parse(cached)
        if (Array.isArray(t)) {
          setTeachers(t)
          setMine(m ?? [])
          checkTeacherMessages(t, m ?? [])
          checkTeacherMessages(t, m ?? [])
        }
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Background fetch — always refresh quietly
  useEffect(() => {
    if (!hydrated) return
    fetch('/api/school-teachers')
      .then(r => r.json())
      .then(j => {
        const newTeachers = j.teachers ?? []
        const newMine     = j.my_teacher_ids ?? []
        setTeachers(newTeachers)
        setMine(newMine)
        checkTeacherMessages(newTeachers, newMine)
        checkTeacherMessages(newTeachers, newMine)
        try {
          sessionStorage.setItem('teachers-cache', JSON.stringify({
            teachers: newTeachers, mine: newMine,
          }))
        } catch {}
      })
      .catch(() => {})
  }, [hydrated])


  // Refresh teacher-message dots when the parent returns to the feed
  // or when a teacher thread marks itself as seen.
  useEffect(() => {
    const refreshTeacherDots = () => {
      checkTeacherMessages(teachers, mine)
    }

    window.addEventListener('focus', refreshTeacherDots)
    window.addEventListener('teacher-thread-seen', refreshTeacherDots as EventListener)

    return () => {
      window.removeEventListener('focus', refreshTeacherDots)
      window.removeEventListener('teacher-thread-seen', refreshTeacherDots as EventListener)
    }
  }, [teachers, mine])


  // teacher-dot-poll: keep teacher avatar dots fresh while parent is on the feed.
  useEffect(() => {
    const refreshTeacherDots = () => checkTeacherMessages(teachers, mine)

    window.addEventListener('focus', refreshTeacherDots)
    window.addEventListener('teacher-thread-seen', refreshTeacherDots as EventListener)

    const interval = window.setInterval(refreshTeacherDots, 20_000)

    return () => {
      window.removeEventListener('focus', refreshTeacherDots)
      window.removeEventListener('teacher-thread-seen', refreshTeacherDots as EventListener)
      window.clearInterval(interval)
    }
  }, [teachers, mine])

  // Show ghost skeleton while waiting for first fetch and no cache
  if (!hydrated) return null  // brief; effect fires immediately

  // If still empty after hydration AND we never had cache, show ghost squircles
  // so the layout doesn't shift when real data arrives.
  const isLikelyEmpty = teachers.length === 0
  if (isLikelyEmpty) {
    return <GhostStrip />
  }

  return (
    <>
      <div style={{
        display: 'flex', gap: 12,
        padding: '16px 16px 20px',
        overflowX: 'auto',
        overflowY: 'visible',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {teachers.map(t => {
          const isMine = mine.includes(t.id)
          const initials = t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          return (
            <button key={t.id} onClick={() => {
                try { sessionStorage.setItem('feed-scroll-y', String(window.scrollY)) } catch {}
                router.push(`/teachers/${t.id}`)
              }}
              style={{
                flex: '0 0 auto', position: 'relative',
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', fontFamily: 'inherit',
                textAlign: 'center',
              }}>
              {/* Squircle photo */}
              <div style={{
                width: 108, height: 108,
                borderRadius: 36,
                overflow: 'hidden',
                background: t.photo_url
                  ? `url(${t.photo_url}) center/cover`
                  : '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, fontWeight: 600, color: T.ink2,
              }}>
                {!t.photo_url && initials}
              </div>

              {/* Teacher-message notification dot: teacher-specific messages live on the avatar. */}
              {unreadTeachers[t.id] > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: unreadTeachers[t.id] > 1 ? 19 : 10,
                  height: unreadTeachers[t.id] > 1 ? 19 : 10,
                  padding: unreadTeachers[t.id] > 1 ? '0 5px' : 0,
                  borderRadius: 999,
                  background: '#EF4444',
                  color: '#FFFFFF',
                  border: `2px solid ${T.bg}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 850,
                  lineHeight: 1,
                }}>
                  {unreadTeachers[t.id] > 1 ? unreadTeachers[t.id] : ''}
                </div>
              )}

              {/* Highlight dot — small filled circle below the photo for "my child's teacher" */}
              {isMine && (
                <div style={{
                  position: 'absolute',
                  bottom: -8,
                  left: '50%', transform: 'translateX(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: T.ink,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {active && <TeacherSheet teacher={active} onClose={() => setActive(null)} />}
    </>
  )
}

// Ghost skeleton — shown when teachers haven't loaded yet
function GhostStrip() {
  return (
    <div style={{
      display: 'flex', gap: 12,
      padding: '16px 16px 20px',
      overflowX: 'hidden',
      opacity: 0.55,
    }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: 108, height: 108, borderRadius: 36,
          background: '#F0F0F2', flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

// Bottom-sheet showing teacher details when tapped
function TeacherSheet({ teacher, onClose }: { teacher: Teacher; onClose: () => void }) {
  const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 36px',
        textAlign: 'center',
        animation: 'slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          width: 100, height: 100, borderRadius: 28,
          background: teacher.photo_url
            ? `url(${teacher.photo_url}) center/cover`
            : '#F0F0F4',
          margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 600, color: T.ink2,
        }}>
          {!teacher.photo_url && initials}
        </div>

        <h2 style={{
          fontSize: 22, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.025em', margin: '0 0 4px',
        }}>
          {teacher.name}
        </h2>
        <p style={{
          fontSize: 14, color: T.ink3, margin: 0,
          letterSpacing: '-0.005em',
        }}>
          {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} Teacher
        </p>
      </div>
    </div>
  )
}
