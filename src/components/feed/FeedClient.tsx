// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth }                  from '@/lib/hooks/useAuth'
import { useNotifications }         from '@/lib/hooks/useNotifications'
import { useFeed }                  from '@/lib/hooks/useFeed'
import { FeedHeader }               from '@/components/feed/FeedHeader'
import { FilterBar }                from '@/components/feed/FilterBar'
import { TeachersStrip }            from '@/components/feed/TeachersStrip'
import { FeedSkeleton }             from '@/components/feed/PostSkeleton'
import { TeacherFeedFab }           from '@/components/feed/TeacherFeedFab'
import { EmptyState }               from '@/components/feed/EmptyState'
import { PullToRefresh }            from '@/components/feed/PullToRefresh'
import { PostCard }                 from '@/components/feed/PostCard'
import { PostComposer }             from '@/components/composer/PostComposer'
import { NotificationPanel }        from '@/components/layout/NotificationPanel'
import { SchoolProfileSheet }       from '@/components/profile/SchoolProfileSheet'
import { TeacherPanel }             from '@/components/teachers/TeacherPanel'
import type { Post }                from '@/lib/types'

function useTeacherCookie() {
  const [hasTeacher, setHasTeacher] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/teacher-session')
      .then(async r => {
        if (!alive || !r.ok) return
        const j = await r.json()
        if (j.teacher?.id) setHasTeacher(true)
      })
      .catch(() => {})

    return () => { alive = false }
  }, [])

  return hasTeacher
}

export function FeedClient() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reenter, setReenter] = useState(false)

  const { authUser, loading: authLoading, signOut, isSchool, school } = useAuth()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(authUser?.id)
  const isTeacher = useTeacherCookie()
  const {
    posts,
    loading: feedLoading,
    filter,
    changeFilter,
    refetch,
    updatePostReaction,
    addOptimisticPost,
    removeOptimisticPost,
    optimisticIds,
  } = useFeed(school?.id, authUser?.id)

  const [showComposer, setShowComposer] = useState(false)
  const [editPost,     setEditPost]     = useState<Post | null>(null)
  const [showNotifs,   setShowNotifs]   = useState(false)
  const [showProfile,  setShowProfile]  = useState(false)
  const [showTeachers, setShowTeachers] = useState(false)
  const [teachersPending, setTeachersPending] = useState(0)

  // Native-like re-entry animation when returning from child pages.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('feed-left') === '1') {
        setReenter(true)
        sessionStorage.removeItem('feed-left')
        window.setTimeout(() => setReenter(false), 280)
      }
    } catch {}
  }, [])

  // Restore and persist the feed scroll position.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    try {
      const saved = sessionStorage.getItem('feed-scroll-y')
      if (saved) {
        const y = parseInt(saved, 10)
        requestAnimationFrame(() => { el.scrollTop = y })
      }
    } catch {}

    let t: ReturnType<typeof setTimeout> | null = null
    const onScroll = () => {
      if (t) clearTimeout(t)
      t = setTimeout(() => {
        try { sessionStorage.setItem('feed-scroll-y', String(el.scrollTop)) } catch {}
      }, 120)
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (t) clearTimeout(t)
      try { sessionStorage.setItem('feed-scroll-y', String(el.scrollTop)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !authUser) window.location.href = '/auth/login'
  }, [authLoading, authUser])

  // Fetch pending teacher count for badge.
  useEffect(() => {
    if (!school?.id || !isSchool) return
    let alive = true

    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', school.id)
        .eq('status', 'pending')
        .then(({ count }: any) => { if (alive) setTeachersPending(count ?? 0) })
        .catch(() => {})
    })

    return () => { alive = false }
  }, [school?.id, isSchool, showTeachers])

  if (authLoading) return (
    <div className="app-root app-center">
      <div style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: '2px solid #E8E8E8',
        borderTopColor: '#1A1A1A',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )

  if (!authUser) return null

  if (!school) return (
    <div className="app-root app-center" style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 8px' }}>
        No school linked
      </p>
      <p style={{ fontSize: 14, color: '#9A9A9A', lineHeight: 1.5, margin: 0 }}>
        {isSchool ? 'Finish setting up your school.' : 'Ask your school for an invite link.'}
      </p>
    </div>
  )

  const openReports = () => {
    try { sessionStorage.setItem('feed-left', '1') } catch {}
    router.push('/reports')
  }

  return (
    <div className={`app-root ${reenter ? 'feed-reenter' : ''}`}>
      <div className="feed-scroll" ref={scrollRef} data-scroll-container>
        <div className="topbar">
          <FeedHeader
            profile={authUser.profile}
            school={school}
            isSchool={isSchool}
            unreadCount={unreadCount}
            onBellClick={() => { setShowNotifs(true); if (unreadCount > 0) markAllRead() }}
            onSignOut={signOut}
            onProfileOpen={() => setShowProfile(true)}
            onTeachersOpen={() => setShowTeachers(true)}
            teachersPending={teachersPending}
            primaryActionType={isSchool ? 'post' : isTeacher ? null : 'reports'}
            onPrimaryAction={() => {
              if (isSchool) {
                setEditPost(null)
                setShowComposer(true)
              } else {
                try { sessionStorage.setItem('feed-left', '1') } catch {}
                router.push('/reports')
              }
            }}
          />
        </div>

        {!(feedLoading && posts.length === 0) && <TeachersStrip />}
        {!(feedLoading && posts.length === 0) && <FilterBar active={filter} onChange={changeFilter} />}

        <PullToRefresh onRefresh={refetch}>
          {feedLoading && posts.length === 0 ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState filter={filter} isSchool={isSchool} />
          ) : (
            <div aria-busy={feedLoading ? 'true' : 'false'}>
              {posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={i}
                  isSchool={isSchool}
                  userId={authUser.id}
                  schoolId={school.id}
                  schoolName={school.name}
                  schoolLogoUrl={school.logo_url ?? undefined}
                  isOptimistic={optimisticIds.includes(post.id)}
                  onReactionChange={(id, type, prevType) => updatePostReaction(id, type, prevType)}
                  onEditPost={(p) => { setEditPost(p); setShowComposer(true) }}
                  onPostDeleted={refetch}
                  onPinToggled={refetch}
                />
              ))}
            </div>
          )}
        </PullToRefresh>

        <TeacherFeedFab />
      </div>

      {!isTeacher && (
        <button
          className="fab"
          onClick={() => {
            if (isSchool) { setEditPost(null); setShowComposer(true) }
            else openReports()
          }}
          aria-label={isSchool ? 'New post' : 'Weekly reports'}
        >
          {isSchool ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          )}
        </button>
      )}

      {showComposer && isSchool && (
        <PostComposer
          schoolId={school.id}
          authorId={authUser.id}
          post={editPost ?? undefined}
          onPublished={() => { setEditPost(null) }}
          onClose={() => { setShowComposer(false); setEditPost(null) }}
          onOptimistic={(draft) => addOptimisticPost(draft)}
          onRemoveOptimistic={(id) => { removeOptimisticPost(id); refetch() }}
        />
      )}

      {showTeachers && isSchool && (
        <TeacherPanel
          schoolId={school.id}
          onClose={() => setShowTeachers(false)}
        />
      )}

      {showProfile && (
        <SchoolProfileSheet
          school={school}
          profile={authUser.profile}
          isSchool={isSchool}
          userId={authUser.id}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          schoolName={school.name}
          schoolLogo={school.logo_url ?? undefined}
          onMarkRead={markRead}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </div>
  )
}
