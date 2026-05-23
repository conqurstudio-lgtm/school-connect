// @ts-nocheck
'use client'
// parent-school-life-home-v1
// /feed is now the Parent School Life home.
// It is not a school/admin feed and not a teacher home.

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, FileText, LogOut, MessageCircle, School } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useFeed } from '@/lib/hooks/useFeed'
import { PullToRefresh } from '@/components/feed/PullToRefresh'
import { PostCard } from '@/components/feed/PostCard'
import { NotificationPanel } from '@/components/layout/NotificationPanel'

const T = {
  ink: '#171717',
  ink2: '#4B4B4F',
  ink3: '#8D8D94',
  border: 'rgba(0,0,0,0.08)',
  softBorder: 'rgba(0,0,0,0.06)',
  white: '#FFFFFF',
  soft: '#F7F7F9',
  muted: '#FAFAFB',
}

function useTeacherCookie() {
  const [state, setState] = useState({ hasTeacher: false, loading: true })

  useEffect(() => {
    let alive = true

    fetch('/api/teacher-session')
      .then(async r => {
        if (!alive) return

        if (!r.ok) {
          setState({ hasTeacher: false, loading: false })
          return
        }

        const j = await r.json()
        setState({ hasTeacher: !!j.teacher?.id, loading: false })
      })
      .catch(() => {
        if (alive) setState({ hasTeacher: false, loading: false })
      })

    return () => { alive = false }
  }, [])

  return state
}

function Spinner() {
  return (
    <div style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      border: '2px solid #E8E8E8',
      borderTopColor: T.ink,
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}

function EmptySchoolLife({ onReports }: { onReports: () => void }) {
  return (
    <div style={{
      margin: '16px 16px 28px',
      border: `1px dashed ${T.border}`,
      borderRadius: 22,
      background: 'transparent',
      padding: '30px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 18,
        background: T.soft,
        color: T.ink2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
      }}>
        <School size={20} strokeWidth={1.8} />
      </div>

      <p style={{
        margin: '0 0 5px',
        color: T.ink,
        fontSize: 15.5,
        fontWeight: 620,
        letterSpacing: '-0.01em',
      }}>
        No school life yet
      </p>

      <p style={{
        margin: '0 auto 16px',
        color: T.ink3,
        fontSize: 13,
        lineHeight: 1.45,
        maxWidth: 280,
      }}>
        Updates, moments and class posts will appear here once your school starts sharing.
      </p>

      <button
        type="button"
        onClick={onReports}
        style={{
          minHeight: 42,
          padding: '0 15px',
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          background: T.white,
          color: T.ink2,
          fontSize: 13.5,
          fontWeight: 580,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        View child reports
      </button>
    </div>
  )
}

function FilterPills({ active, onChange }: any) {
  const filters = [
    ['all', 'All'],
    ['moments', 'Moments'],
    ['updates', 'Updates'],
    ['events', 'Events'],
    ['documents', 'Docs'],
  ]

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '10px 16px 12px',
      borderBottom: `1px solid ${T.softBorder}`,
      background: T.white,
    }}>
      {filters.map(([key, label]) => {
        const selected = active === key

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              height: 34,
              padding: '0 13px',
              borderRadius: 999,
              border: selected ? `1px solid ${T.ink}` : `1px solid ${T.border}`,
              background: selected ? T.ink : T.white,
              color: selected ? T.white : T.ink2,
              fontSize: 13,
              fontWeight: 580,
              fontFamily: 'inherit',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function FeedClient() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reenter, setReenter] = useState(false)

  const { authUser, loading: authLoading, signOut, isSchool, school } = useAuth()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(authUser?.id)
  const { hasTeacher: isTeacher, loading: teacherCookieLoading } = useTeacherCookie()

  const {
    posts,
    loading: schoolLifeLoading,
    filter,
    changeFilter,
    refetch,
    updatePostReaction,
    optimisticIds,
  } = useFeed(school?.id, authUser?.id)

  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('feed-left') === '1') {
        setReenter(true)
        sessionStorage.removeItem('feed-left')
        window.setTimeout(() => setReenter(false), 280)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (teacherCookieLoading || authLoading) return

    if (isTeacher) {
      router.replace('/teacher')
      return
    }

    if (!authUser) {
      window.location.href = '/auth/login'
      return
    }

    if (isSchool) {
      router.replace('/school')
    }
  }, [authLoading, authUser, isSchool, isTeacher, router, teacherCookieLoading])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    try {
      const saved = sessionStorage.getItem('parent-school-life-scroll-y') || sessionStorage.getItem('feed-scroll-y')
      if (saved) {
        const y = parseInt(saved, 10)
        requestAnimationFrame(() => { el.scrollTop = y })
      }
    } catch {}

    let t: ReturnType<typeof setTimeout> | null = null

    const onScroll = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        try {
          sessionStorage.setItem('parent-school-life-scroll-y', String(el.scrollTop))
        } catch {}
      }, 120)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (t) clearTimeout(t)
      try { sessionStorage.setItem('parent-school-life-scroll-y', String(el.scrollTop)) } catch {}
    }
  }, [])

  const teacherIds = useMemo(() => {
    const ids: string[] = []

    for (const post of posts || []) {
      const id =
        post.teacher_id ||
        post.teacher?.id ||
        post.teacherInfo?.id ||
        post.author_teacher_id ||
        null

      if (id && !ids.includes(String(id))) ids.push(String(id))
    }

    return ids
  }, [posts])

  const openReports = () => {
    try { sessionStorage.setItem('feed-left', '1') } catch {}
    router.push('/reports')
  }

  const openMessages = () => {
    try { sessionStorage.setItem('feed-left', '1') } catch {}

    if (teacherIds[0]) {
      router.push(`/teachers/${teacherIds[0]}?tab=messages`)
      return
    }

    router.push('/reports')
  }

  if (authLoading || teacherCookieLoading) {
    return (
      <main style={{
        minHeight: '100dvh',
        background: T.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Spinner />
      </main>
    )
  }

  if (!authUser || isSchool || isTeacher) return null

  if (!school) {
    return (
      <main style={{
        minHeight: '100dvh',
        background: T.white,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            background: T.soft,
            color: T.ink2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <School size={21} strokeWidth={1.8} />
          </div>

          <p style={{ margin: '0 0 6px', color: T.ink, fontSize: 16, fontWeight: 620 }}>
            No school linked
          </p>
          <p style={{ margin: 0, color: T.ink3, fontSize: 13.2, lineHeight: 1.48 }}>
            Ask your school or teacher for a private invite link so your child can be connected.
          </p>
        </div>
      </main>
    )
  }

  const parentName = authUser.profile?.full_name || authUser.email?.split('@')?.[0] || 'Parent'
  const childName = authUser.profile?.child_name || 'your child'

  return (
    <main className={`parent-school-life-root ${reenter ? 'feed-reenter' : ''}`} style={{
      minHeight: '100dvh',
      background: T.white,
      color: T.ink,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div
        ref={scrollRef}
        data-scroll-container
        style={{
          height: '100dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: T.white,
        }}
      >
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${T.softBorder}`,
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px 12px',
        }}>
          <div style={{
            maxWidth: 560,
            margin: '0 auto',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 16,
                  background: school.logo_url ? `url(${school.logo_url}) center/cover` : T.soft,
                  border: `1px solid ${T.border}`,
                  color: T.ink2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 650,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {!school.logo_url && (school.name || 'S').charAt(0)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    color: T.ink,
                    fontSize: 15.5,
                    fontWeight: 640,
                    letterSpacing: '-0.018em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    School Life
                  </p>
                  <p style={{
                    margin: '2px 0 0',
                    color: T.ink3,
                    fontSize: 12.5,
                    lineHeight: 1.25,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {school.name} · {childName}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => { setShowNotifs(true); if (unreadCount > 0) markAllRead() }}
                  aria-label="Notifications"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    color: T.ink2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  <Bell size={17} strokeWidth={1.8} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -3,
                      right: -3,
                      minWidth: 18,
                      height: 18,
                      padding: '0 4px',
                      borderRadius: 999,
                      background: '#EF4444',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      boxSizing: 'border-box',
                      border: '2px solid #FFFFFF',
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    color: T.ink2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginTop: 12,
            }}>
              <button
                type="button"
                onClick={openMessages}
                style={{
                  minHeight: 42,
                  borderRadius: 15,
                  border: `1px solid ${T.border}`,
                  background: T.muted,
                  color: T.ink2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <MessageCircle size={16} strokeWidth={1.8} />
                Messages
              </button>

              <button
                type="button"
                onClick={openReports}
                style={{
                  minHeight: 42,
                  borderRadius: 15,
                  border: `1px solid ${T.border}`,
                  background: T.muted,
                  color: T.ink2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <FileText size={16} strokeWidth={1.8} />
                Child reports
              </button>
            </div>
          </div>
        </header>

        <section style={{
          maxWidth: 560,
          margin: '0 auto',
        }}>
          <div style={{ padding: '16px 16px 4px' }}>
            <p style={{
              margin: 0,
              color: T.ink,
              fontSize: 17,
              fontWeight: 640,
              letterSpacing: '-0.02em',
            }}>
              Hello, {parentName.split(' ')[0] || 'Parent'}
            </p>
            <p style={{
              margin: '4px 0 0',
              color: T.ink3,
              fontSize: 13,
              lineHeight: 1.45,
            }}>
              Updates, moments and class posts connected to {childName}.
            </p>
          </div>

          <FilterPills active={filter} onChange={changeFilter} />

          <PullToRefresh onRefresh={refetch}>
            {schoolLifeLoading && posts.length === 0 ? (
              <div style={{
                minHeight: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Spinner />
              </div>
            ) : posts.length === 0 ? (
              <EmptySchoolLife onReports={openReports} />
            ) : (
              <div
                aria-busy={schoolLifeLoading ? 'true' : 'false'}
                style={{
                  display: 'grid',
                  gap: 14,
                  padding: '14px 14px calc(28px + env(safe-area-inset-bottom, 0px))',
                }}
              >
                {posts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    isSchool={false}
                    userId={authUser.id}
                    schoolId={school.id}
                    schoolName={school.name}
                    schoolLogoUrl={school.logo_url ?? undefined}
                    isOptimistic={optimisticIds.includes(post.id)}
                    onReactionChange={(id, type, prevType) => updatePostReaction(id, type, prevType)}
                    onEditPost={() => {}}
                    onPostDeleted={refetch}
                    onPinToggled={refetch}
                  />
                ))}
              </div>
            )}
          </PullToRefresh>
        </section>
      </div>

      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          schoolName={school.name}
          schoolLogo={school.logo_url ?? undefined}
          onMarkRead={markRead}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </main>
  )
}
