// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bell, X, MessageCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageCarousel } from '@/components/feed/ImageCarousel'
import { TeachersStrip } from '@/components/feed/TeachersStrip'
import { TeacherComposer } from './TeacherComposer'
import { PhotoCropper } from './PhotoCropper'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
}

type Filter = 'all' | 'moments' | 'updates' | 'events' | 'documents' | 'pinned'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'moments',   label: 'Moments' },
  { key: 'updates',   label: 'Updates' },
  { key: 'events',    label: 'Events' },
  { key: 'documents', label: 'Documents' },
  { key: 'pinned',    label: 'Pinned' },
]

interface Props { token: string }

export function TeacherFeedClient({ token }: Props) {
  const router = useRouter()
  const [session,  setSession]  = useState<any>(null)
  const [posts,    setPosts]    = useState<any[]>([])
  const [filter,   setFilter]   = useState<Filter>('all')
  const [loading,  setLoading]  = useState(true)
  const [composeSheet, setComposeSheet] = useState(false)
  const [classCompose, setClassCompose] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/teacher-session?token=${encodeURIComponent(token)}`)
      const json = await res.json()
      if (res.ok) setSession(json)
    } catch {}
  }

  const loadPosts = async () => {
    try {
      // Fetch BOTH school posts and class posts; merge by created_at
      const [schoolRes, classRes] = await Promise.all([
        fetch(`/api/teacher/feed?scope=school&filter=${filter}`),
        fetch(`/api/teacher/feed?scope=class&filter=${filter}`),
      ])
      const [schoolJson, classJson] = await Promise.all([schoolRes.json(), classRes.json()])
      const merged = [...(schoolJson.posts ?? []), ...(classJson.posts ?? [])]
      merged.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      setPosts(merged)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadSession() }, [token])
  useEffect(() => { if (session) loadPosts() }, [session, filter])

  if (!session) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${T.border}`, borderTopColor: T.ink,
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  const { teacher, school } = session
  const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()

  const uploadPhoto = async (blob: Blob) => {
    setCropFile(null)
    const tid = toast.loading('Uploading…')
    try {
      const form = new FormData()
      form.append('file', new File([blob], 'photo.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/teacher/photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success('Photo updated', { id: tid })
      setSession((s: any) => ({ ...s, teacher: { ...s.teacher, photo_url: `${json.photo_url}?t=${Date.now()}` } }))
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', height: '100dvh',
      overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingBottom: 100, background: T.bg,
      position: 'relative',
    }}>
      {/* ─── HEADER — school logo left, bell + teacher avatar right ─── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '40px 28px 28px',
      }}>
        {/* School logo */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          background: school.logo_url
            ? `url(${school.logo_url}) center/contain no-repeat #F0F0F0`
            : '#F0F0F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${T.border}`,
        }}>
          {!school.logo_url && (
            <span style={{ fontSize: 26, fontWeight: 600, color: '#AAA' }}>
              {school.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Right cluster: bell + teacher avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 18 }}>
          <button aria-label="Notifications" style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'none', border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.ink2,
          }}>
            <Bell size={15} strokeWidth={1.7} />
          </button>

          {/* Teacher avatar — taps go to self-profile (where they can change photo + manage class) */}
          <button
            onClick={() => router.push(`/teachers/${teacher.id}?edit=1`)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0, padding: 0, border: 'none',
              background: teacher.photo_url
                ? `url(${teacher.photo_url}) center/cover`
                : '#F0F0F4',
              cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: T.ink2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.15s ease',
            }}
            onMouseDown ={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp   ={e => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {!teacher.photo_url && initials}
          </button>
        </div>
      </div>

      {/* ─── Teacher squircles strip ─── */}
      <TeachersStrip />

      {/* ─── Filter bar ─── */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        marginTop: 16, marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          padding: '0 20px', gap: 28,
        }}>
          {FILTERS.map(({ key, label }) => {
            const isActive = key === filter
            return (
              <button key={key} onClick={() => setFilter(key)}
                style={{
                  position: 'relative',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 42, padding: '0 14px',
                  background: 'none', border: 'none',
                  borderBottom: isActive ? '2px solid #1A1A1A' : '2px solid transparent',
                  marginBottom: -1,
                  color: isActive ? '#1A1A1A' : '#9A9A9A',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Posts list ─── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${T.border}`, borderTopColor: T.ink,
                        animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: T.ink, fontWeight: 600, margin: '0 0 6px' }}>
            No posts yet
          </p>
          <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Posts you and your school share will appear here.
          </p>
        </div>
      ) : (
        posts.map((p: any, i: number) => (
          <FeedPostCard
            key={p.id}
            post={p}
            teacher={teacher}
            school={school}
            index={i}
          />
        ))
      )}

      {/* ─── FAB ─── */}
      <button onClick={() => setComposeSheet(true)} className="fab"
        aria-label="Compose">
        <Plus size={22} strokeWidth={1.8} />
      </button>

      {/* Compose sheet */}
      {composeSheet && (
        <ComposeChooser
          onClose={() => setComposeSheet(false)}
          onPickClass={() => { setComposeSheet(false); setClassCompose(true) }}
          onPickBroadcast={() => {
            setComposeSheet(false)
            toast('Broadcast coming next', { icon: '📨' })
          }}
          onPickPersonal={() => {
            setComposeSheet(false)
            toast('Personal update coming next', { icon: '✉️' })
          }}
        />
      )}

      {classCompose && (
        <TeacherComposer
          teacherName={teacher.name}
          grade={teacher.grade}
          className={teacher.class_name}
          onClose={() => setClassCompose(false)}
          onPosted={() => {
            setClassCompose(false)
            loadPosts()
            toast.success('Posted to your class')
          }}
        />
      )}

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          onClose={() => setCropFile(null)}
          onSave={uploadPhoto}
        />
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Compose chooser sheet — picks what kind of compose to open
   ────────────────────────────────────────────────────────── */
function ComposeChooser({ onClose, onPickClass, onPickBroadcast, onPickPersonal }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0', padding: '8px 0 20px',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          width: 36, height: 4, background: '#E0E0E4', borderRadius: 999,
          margin: '6px auto 14px',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 12px',
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.02em', margin: 0 }}>
            What do you want to send?
          </h3>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <ComposeOption
          icon="📢"
          title="Class post"
          subtitle="Share with your whole class on the feed"
          onClick={onPickClass}
        />
        <ComposeOption
          icon="✉️"
          title="Personal update"
          subtitle="Send a private update to one parent"
          onClick={onPickPersonal}
        />
        <ComposeOption
          icon="📨"
          title="Broadcast"
          subtitle="Send a private update to multiple parents"
          onClick={onPickBroadcast}
        />
      </div>
    </div>
  )
}

function ComposeOption({ icon, title, subtitle, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 20px',
      background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left',
      transition: 'background 0.15s ease',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#F7F7F9'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: '#F4F4F8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 20,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.ink,
                    letterSpacing: '-0.005em', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>{subtitle}</p>
      </div>
    </button>
  )
}

/* ──────────────────────────────────────────────────────────
   FeedPostCard — uses PostCard layout from parent feed
   For school posts, avatar = school logo + school name.
   For teacher (class) posts, avatar = teacher photo + teacher name.
   ────────────────────────────────────────────────────────── */
function FeedPostCard({ post, teacher, school, index }: any) {
  const isClassPost = post.posted_by_kind === 'teacher'

  const avatarUrl = isClassPost ? teacher.photo_url : school.logo_url
  const name      = isClassPost ? teacher.name : school.name
  const initials  = isClassPost
    ? teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
    : school.name.charAt(0)
  const objectFit = isClassPost ? 'cover' : 'contain'

  const TRUNCATE = 180
  const body = post.body ?? ''
  const isTrunc = body.length > TRUNCATE
  const [expanded, setExpanded] = useState(false)
  const display = (isTrunc && !expanded) ? body.slice(0, TRUNCATE).trimEnd() : body

  return (
    <article>
      <div style={{ display: 'flex', gap: 12, padding: '18px 20px 10px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            overflow: 'hidden',
            background: avatarUrl
              ? `url(${avatarUrl}) center/${objectFit} no-repeat #F0F0F4`
              : '#F0F0F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(0,0,0,0.06)`,
            fontSize: 13, fontWeight: 600, color: T.ink2,
          }}>
            {!avatarUrl && initials}
          </div>
          <div style={{ width: 1, flex: 1, minHeight: 24, marginTop: 6,
                        background: 'rgba(0,0,0,0.07)' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A',
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
            <span style={{ fontSize: 12, color: '#B0B0B0', flexShrink: 0,
                           whiteSpace: 'nowrap' }}>{relTime(post.created_at)}</span>
          </div>
          {isClassPost && (
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9A9A9A',
                        letterSpacing: '0.02em', margin: '1px 0 0' }}>
              {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
            </p>
          )}

          {body && (
            <p style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.55,
                        color: '#2A2A2A', margin: '4px 0 0',
                        whiteSpace: 'pre-wrap' }}>
              {display}
              {isTrunc && !expanded && (
                <> {'…'} <button onClick={() => setExpanded(true)} style={{
                  color: T.blue, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit',
                  fontWeight: 500,
                }}>more</button></>
              )}
              {isTrunc && expanded && (
                <> <button onClick={() => setExpanded(false)} style={{
                  color: '#9A9A9A', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0, fontSize: 14, fontFamily: 'inherit',
                  fontWeight: 500,
                }}>show less</button></>
              )}
            </p>
          )}
        </div>
      </div>

      {post.image_urls && post.image_urls.length > 0 && (
        <div style={{ padding: '0 20px 0 70px', overflow: 'visible' }}>
          <ImageCarousel
            priority={index < 2}
            images={post.image_urls}
            onTap={() => {}}
            flyEmoji={null}
          />
        </div>
      )}

      {post.reaction_count > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '6px 20px 14px 70px',
        }}>
          {Object.entries(post.reaction_counts || {}).map(([type, count]: any) => (
            <div key={type} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: '#6A6A6A',
            }}>
              <span style={{ fontSize: 14 }}>
                {type === 'love' ? '❤️' : type === 'like' ? '👍' : type === 'celebrate' ? '🎉' : '👏'}
              </span>
              {count}
            </div>
          ))}
        </div>
      )}

      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
    </article>
  )
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
