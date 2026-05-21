// @ts-nocheck
'use client'
// teacher-pending-requests-full-shared-v2
// teacher-request-buttons-shared-controls-v1
// shared-tabs-restore-and-apply-v3
// teacher-request-buttons-shape-fix-v1
// shared-ui-architecture-pass-v1
// teacher-ui-unified-structure-v1
// composer-send-button-balance-v1
// teacher-bell-header-cleanup-v1
// teacher-button-shape-pass-v1
// readable-content-typography-restore-v1

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Camera, LogOut, Plus, MoreHorizontal,
  Pencil, Trash2, X, Check, Users, MessageCircle, Send, Megaphone,
  Paperclip, FileText,
  Info} from 'lucide-react'
import toast from 'react-hot-toast'
import { PhotoCropper } from './PhotoCropper'
import { AttachmentCard, AttachmentPreviewTray, updateAttachment, type AttachmentDraft } from '@/components/messages/MessageAttachment'
import { MessageBubble } from '@/components/messages/MessageBubble'
import { BackIcon } from '@/components/ui/BackIcon'
import { createClient } from '@/lib/supabase/client'
import { PostCard } from '@/components/feed/PostCard'
import { PullToRefresh } from '@/components/feed/PullToRefresh'
import { ClassSpaceTabs as SharedClassSpaceTabs, ClassSpaceButton } from '@/components/class-space/ClassSpacePrimitives'


function sortMessagesOldestFirst(list: any[]) {
  return [...(list || [])].sort((a: any, b: any) =>
    new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
  )
}

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  red:    '#EF4444',
  blue:   '#78A6FE',
}


type Tab = 'class' | 'updates' | 'broadcast'

interface Props {
  teacherId: string
  initialSession?: any
  initialToken?: string
}

export function TeacherSelfProfile({ teacherId, initialSession = null, initialToken }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [session,  setSession]  = useState<any>(initialSession)
  const [loading,  setLoading]  = useState(!initialSession)
  const [tab,      setTab]      = useState<Tab>('class')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [reportChild, setReportChild] = useState<any>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showClassComposer, setShowClassComposer] = useState(false)
  const [postRefreshKey, setPostRefreshKey] = useState(0)
  const [unread,     setUnread]     = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const token = initialToken || searchParams.get('token')
      const res = await fetch(token ? `/api/teacher-session?token=${encodeURIComponent(token)}` : '/api/teacher-session')
      const json = await res.json()
      if (res.ok && json.teacher?.id) {
        if (json.teacher.id !== teacherId) {
          const suffix = token ? `?edit=1&token=${encodeURIComponent(token)}` : '?edit=1'
          router.replace(`/teachers/${json.teacher.id}${suffix}`)
          return
        }
        setSession(json)
        return
      }
    } catch {}
    setLoading(false)
  }
  useEffect(() => {
    if (initialSession?.teacher?.id) {
      setSession(initialSession)
      setLoading(false)
    }
  }, [initialSession])

  useEffect(() => {
    load()
  }, [teacherId])

  // Unread bell count — refreshed on tab focus & every 30s
  useEffect(() => {
    let alive = true
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/teacher/notifications')
        if (!res.ok) return
        const j = await res.json()
        const fallbackCount = Array.isArray(j.items)
          ? j.items.filter((item: any) => item.unread).length
          : 0
        const apiCount = typeof j.unread_count === 'number' ? j.unread_count : fallbackCount
        if (alive) setUnread(apiCount)
      } catch {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 15_000)
    const onFocus = () => fetchCount()
    window.addEventListener('focus', onFocus)
    return () => { alive = false; clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  const [teacherClassSpaceTab, setTeacherClassSpaceTab] = useState<'life' | 'messages' | 'children'>('life')

  const goToFeed = () => router.push('/feed')

  if (loading) {
    return <TeacherPageSkeleton />
  }

  if (!session) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: T.bg,
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          maxWidth: 360,
          textAlign: 'center',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: 28,
        }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            color: T.ink,
            margin: '0 0 8px',
            letterSpacing: '-0.03em',
          }}>
            Need your teacher link
          </h1>
          <p style={{
            fontSize: 14,
            color: T.ink3,
            lineHeight: 1.5,
            margin: 0,
          }}>
            Open the private teacher link shared by your school admin. If the link was reset, ask the school to copy a new one.
          </p>
        </div>
      </div>
    )
  }

  const { teacher, school, children } = session
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
      setSession((s: any) => ({ ...s, teacher: {
        ...s.teacher, photo_url: `${json.photo_url}?t=${Date.now()}` } }))
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }
  }

  const signOut = async () => {
    if (!confirm("Sign out? You'll need your link to come back.")) return
    await fetch('/api/teacher-session', { method: 'POST' })
    window.location.href = '/teacher'
  }

  const copyClassLink = async () => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${base}/class/${teacher.id}`

    try {
      await navigator.clipboard.writeText(link)
      toast.success('Class link copied')
    } catch {
      toast.error('Could not copy class link')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', height: 'auto',
      overflowY: 'visible', WebkitOverflowScrolling: 'auto',
      background: T.bg, maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingTop: 0,
      paddingBottom: 96,
    }}>

      {/* Compact teacher header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '18px 18px 14px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        background: 'rgba(252,252,255,0.98)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: 'none',
      }}>
        <button onClick={() => fileRef.current?.click()} aria-label="Change profile photo" style={{
          position: 'relative',
          width: 29,
          height: 29,
          borderRadius: '50%',
          border: 'none',
          padding: 0,
          overflow: 'visible',
          background: teacher.photo_url
            ? `url(${teacher.photo_url}) center/cover`
            : '#F0F0F4',
          color: T.ink2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          {!teacher.photo_url && initials}
          <span style={{
            position: 'absolute',
            right: -7,
            bottom: -7,
            width: 19,
            height: 19,
            borderRadius: '50%',
            background: T.ink,
            color: T.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${T.bg}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}>
            <Camera size={10} strokeWidth={2.2} />
          </span>
        </button>

        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) setCropFile(f)
            e.target.value = ''
          }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 14,
            lineHeight: 1.2,
            fontWeight: 500,
            color: T.ink,
            letterSpacing: '0em',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {teacher.name}
          </h1>
          <p style={{
            fontSize: 13.8,
            fontWeight: 500,
            color: T.ink3,
            letterSpacing: '0.02em',
            margin: '-2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}{children?.length ? ` · ${children.length} ${children.length === 1 ? 'child' : 'children'}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button
            type="button"
            onClick={copyClassLink}
            aria-label="Copy class invite link"
            title="Copy class invite link"
            style={{
              height: 29,
              minWidth: 46,
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink2,
              padding: '0 10px',
              fontSize: 13.8,
              fontWeight: 850,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Link
          </button>
<button
            onClick={() => setShowClassComposer(true)}
            aria-label="Create"
            style={{ ...iconBtn, background: T.ink, color: T.white, border: 'none' }}
          >
            <Plus size={15} strokeWidth={2.1} />
          </button>
        </div>
      </div>

      <TeacherClassSpaceTabs
        active={teacherClassSpaceTab}
        onChange={setTeacherClassSpaceTab}
        childrenCount={children?.length || 0}
            unreadCount={unread}
          />

      {teacherClassSpaceTab === 'life' && (
        <TeacherOwnClassFeed teacher={teacher} school={school} refreshKey={postRefreshKey} />
      )}

      {teacherClassSpaceTab === 'messages' && (
        <UpdatesInbox teacher={teacher} />
      )}

      {teacherClassSpaceTab === 'children' && (
        <>
          <div style={{ padding: '14px 20px 0' }}>
            <ClassInviteCard teacher={teacher} school={school} kids={children} />
          </div>
          <ClassRoster kids={children} onChanged={load} />
        </>
      )}

      {showNotifs && (
        <NotificationsSheet
          teacher={teacher}
          onClose={() => setShowNotifs(false)}
        />
      )}

      {reportChild && (
        <QuickReportSheet
          child={reportChild}
          onClose={() => setReportChild(null)}
          onSaved={() => setReportChild(null)}
        />
      )}

      {showClassComposer && (
        <UniversalClassComposer
          teacher={teacher}
          onClose={() => setShowClassComposer(false)}
          onCreated={() => {
            setShowClassComposer(false)
            setPostRefreshKey((v: number) => v + 1)
          }}
        />
      )}

      {/* Cropper */}
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


function TeacherClassSpaceTabs({ active, onChange, childrenCount = 0, unreadCount = 0 }: any) {
  const tabs = [
    { key: 'life', label: 'Class Life' },
    { key: 'messages', label: 'Messages', badge: unreadCount },
    { key: 'children', label: childrenCount ? `Children ${childrenCount}` : 'Children' },
  ]

  return (
    <SharedClassSpaceTabs
      tabs={tabs}
      active={active}
      onChange={onChange}
      columns={3}
      stickyTop={57}
    />
  )
}

const iconBtn: any = {
  width: 29, height: 29, borderRadius: 999,
  background: 'none', border: `1px solid ${T.border}`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: T.ink2,
}

function TabPill({ active, onClick, label, icon }: any) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 999,
      background: active ? T.ink : 'transparent',
      color: active ? T.white : T.ink3,
      border: active ? 'none' : `1px solid ${T.border}`,
      fontSize: 13.8, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    }}>
      {icon} {label}
    </button>
  )
}


/* ────────────────────────────────────────
   POSTS TAB — official class posts
   ──────────────────────────────────────── */
function ClassPosts({ teacher }: any) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/feed?scope=class&filter=all', { cache: 'no-store' })
      const json = await res.json()
      setPosts(json.posts ?? [])
    } catch {
      toast.error('Could not load class posts')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const removePost = async (postId: string) => {
    if (!confirm('Delete this class post?')) return
    const tid = toast.loading('Deleting…')
    try {
      const res = await fetch(`/api/teacher/post?id=${encodeURIComponent(postId)}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not delete post')
      toast.success('Post deleted', { id: tid })
      load()
    } catch (e: any) {
      toast.error(e.message || 'Could not delete post', { id: tid })
    }
  }

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: '#F4F6FB',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
        marginBottom: 14,
      }}>
        <Megaphone size={14} color={T.blue} strokeWidth={1.8}
          style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13.8, color: T.ink2, margin: 0, lineHeight: 1.5 }}>
          These are official class updates. Approved parents can view them, but only you can post here.
        </p>
      </div>

      <button onClick={() => setShowCreate(true)} style={{
        width: '100%',
        minHeight: 46,
        padding: '13px 14px',
        borderRadius: 999,
        border: 'none',
        background: T.ink,
        color: T.white,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 800,
        marginBottom: 14,
      }}>
        <Plus size={14} strokeWidth={2.4} />
        Create class post
      </button>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `2px solid ${T.border}`,
            borderTopColor: T.ink,
            animation: 'spin 0.7s linear infinite',
          }} />
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          padding: '32px 20px',
          textAlign: 'center',
          border: `1px dashed ${T.border}`,
          borderRadius: 14,
        }}>
          <Megaphone size={20} color={T.ink3} strokeWidth={1.5}
            style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, color: T.ink, fontWeight: 700, margin: '0 0 4px' }}>
            No class posts yet
          </p>
          <p style={{ fontSize: 13.8, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Post class updates, moments or events for approved parents to see.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map((post: any) => (
            <TeacherClassPostCard
              key={post.id}
              post={post}
              onDelete={() => removePost(post.id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <ClassPostComposer
          teacher={teacher}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function TeacherClassPostCard({ post, onDelete }: any) {
  const images = Array.isArray(post.image_urls) ? post.image_urls : []
  const typeLabel =
    post.type === 'event' ? 'Event' :
    post.type === 'moment' ? 'Moment' :
    post.type === 'document' ? 'Document' :
    'Update'

  return (
    <article style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{ padding: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: post.body || post.event_date || images.length ? 8 : 0,
        }}>
          <div>
            <span style={{
              display: 'inline-flex',
              padding: '3px 8px',
              borderRadius: 999,
              background: '#F0F4FF',
              color: T.blue,
              fontSize: 13.8,
              fontWeight: 800,
            }}>
              {typeLabel}
            </span>
            <span style={{ marginLeft: 8, fontSize: 13.8, color: T.ink3 }}>
              {relTime(post.created_at)}
            </span>
          </div>

          <button onClick={onDelete} style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.red,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trash2 size={13} strokeWidth={1.9} />
          </button>
        </div>

        {post.body && (
          <p style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: T.ink,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {post.body}
          </p>
        )}

        {post.type === 'event' && (post.event_date || post.event_time || post.event_location) && (
          <div style={{
            marginTop: 9,
            padding: '9px 10px',
            borderRadius: '50%',
            background: '#F4F6FB',
            fontSize: 13.8,
            color: T.ink2,
            lineHeight: 1.5,
          }}>
            {post.event_date && <div><strong>Date:</strong> {post.event_date}</div>}
            {post.event_time && <div><strong>Time:</strong> {post.event_time}</div>}
            {post.event_location && <div><strong>Place:</strong> {post.event_location}</div>}
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gap: 6, padding: '0 14px 14px' }}>
          {images.slice(0, 4).map((url: string, i: number) => (
            <img
              key={`${url}-${i}`}
              src={url}
              alt=""
              style={{
                width: '100%',
                maxHeight: 260,
                objectFit: 'cover',
                display: 'block',
                borderRadius: 13,
              }}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function ClassPostComposer({ teacher, onClose, onCreated }: any) {
  const [type, setType] = useState<'update' | 'moment' | 'event'>('update')
  const [body, setBody] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  const canSubmit =
    body.trim() ||
    files.length > 0 ||
    (type === 'event' && (eventDate || eventTime || eventLocation))

  const uploadImages = async () => {
    const urls: string[] = []

    for (const file of files) {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/teacher/post-image', {
        method: 'POST',
        body: form,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not upload image')
      urls.push(json.url)
    }

    return urls
  }

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    const tid = toast.loading('Publishing…')

    try {
      const image_urls = files.length > 0 ? await uploadImages() : []

      const res = await fetch('/api/teacher/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          body: body.trim(),
          image_urls,
          event_date: type === 'event' ? eventDate : null,
          event_time: type === 'event' ? eventTime : null,
          event_location: type === 'event' ? eventLocation.trim() : null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not publish post')

      toast.success('Class post published', { id: tid })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Could not publish post', { id: tid })
    }

    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 240,
      background: 'rgba(0,0,0,0.38)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        background: T.white,
        borderRadius: '22px 22px 0 0',
        padding: 20,
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '88dvh',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              color: T.ink,
              letterSpacing: '-0.025em',
              margin: 0,
            }}>
              Create class post
            </h3>
            <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
              {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
            </p>
          </div>

          <button onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink3,
            cursor: 'pointer',
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 12,
        }}>
          {[
            ['update', 'Update'],
            ['moment', 'Moment'],
            ['event', 'Event'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setType(value as any)}
              style={{
                padding: '9px 8px',
                borderRadius: 999,
                border: type === value ? 'none' : `1px solid ${T.border}`,
                background: type === value ? T.ink : '#FAFAFC',
                color: type === value ? T.white : T.ink3,
                fontSize: 13.8,
                fontWeight: 800,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          placeholder={
            type === 'event'
              ? 'What should parents know about this event?'
              : type === 'moment'
                ? 'Share what happened in class...'
                : 'Write a class update...'
          }
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 13px',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink,
            fontSize: 16,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />

        {type === 'event' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 10,
          }}>
            <input
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              placeholder="Event date"
              type="date"
              style={classPostInputStyle}
            />
            <input
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
              placeholder="Event time"
              type="time"
              style={classPostInputStyle}
            />
            <input
              value={eventLocation}
              onChange={e => setEventLocation(e.target.value)}
              placeholder="Location"
              style={{ ...classPostInputStyle, gridColumn: '1 / -1' }}
            />
          </div>
        )}

        <label style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 10,
          padding: '11px 13px',
          borderRadius: 14,
          border: `1px dashed ${T.border}`,
          background: '#FAFAFC',
          color: T.ink2,
          cursor: 'pointer',
          fontSize: 11.3,
          fontWeight: 760,
        }}>
          <Camera size={14} strokeWidth={1.9} />
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => {
              const picked = Array.from(e.target.files || [])
              setFiles(picked.slice(0, 4))
              e.target.value = ''
            }}
          />
        </label>

        {files.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 10,
          }}>
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} style={{
                borderRadius: '50%',
                overflow: 'hidden',
                height: 58,
                background: '#F0F0F4',
              }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || saving}
          style={{
            width: '100%',
            marginTop: 14,
            minHeight: 46,
            padding: '14px 16px',
            borderRadius: 999,
            border: 'none',
            background: !canSubmit || saving ? '#D4D4D8' : T.ink,
            color: T.white,
            fontSize: 15,
            fontWeight: 800,
            cursor: !canSubmit || saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Publishing…' : 'Publish class post'}
        </button>
      </div>
    </div>
  )
}

const classPostInputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: '#FAFAFC',
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}


/* ────────────────────────────────────────
   SIMPLE TEACHER SPACE — class feed + one composer
   ──────────────────────────────────────── */

function TeacherOwnClassFeed({ teacher, school, refreshKey }: any) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/feed?scope=class&filter=all', { cache: 'no-store' })
      const json = await res.json()
      setPosts(json.posts ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [refreshKey])

  // Keep mirrored teacher posts in sync with the main feed.
  // Parent reactions/comments happen on the parent feed, so the teacher page
  // must listen for engagement changes and reload the affected class posts.
  useEffect(() => {
    if (!teacher?.id || !teacher?.school_id) return

    const sb = createClient()

    const refreshIfOwnPost = (payload: any) => {
      const row = payload?.new || payload?.old || {}
      const postId = row.post_id

      if (!postId) {
        load()
        return
      }

      setPosts(prev => {
        const exists = prev.some((post: any) => post.id === postId)
        if (exists) window.setTimeout(() => load(), 0)
        return prev
      })
    }

    const ch = sb
      .channel(`teacher-mirrored-engagement:${teacher.id}:${teacher.school_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `school_id=eq.${teacher.school_id}`,
      }, refreshIfOwnPost)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `school_id=eq.${teacher.school_id}`,
      }, refreshIfOwnPost)
      .subscribe()

    const onFocus = () => load()
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
      sb.removeChannel(ch)
    }
  }, [teacher?.id, teacher?.school_id])

  const updatePostReaction = (postId: string, type: any, prevType: any) => {
    setPosts(prev => prev.map((post: any) => {
      if (post.id !== postId) return post
      const counts = { ...(post.reaction_counts || {}) }
      if (prevType && counts[prevType] > 0) counts[prevType] -= 1
      if (prevType && counts[prevType] === 0) delete counts[prevType]
      if (type) counts[type] = (counts[type] || 0) + 1
      const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)
      return { ...post, my_reaction: type, reaction_counts: counts, reaction_count: total }
    }))
  }

  const deleteLocal = (postId: string) => {
    setPosts(prev => prev.filter((post: any) => post.id !== postId))
  }

  const pinLocal = (postId: string, pinned: boolean) => {
    setPosts(prev => prev.map((post: any) => post.id === postId ? { ...post, is_pinned: pinned } : post))
  }

  if (loading) {
    return (
      <section style={{ padding: '18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.ink, animation: 'spin 0.7s linear infinite' }} />
        </div>
      </section>
    )
  }

  if (posts.length === 0) {
    return (
      <section style={{ padding: '8px 20px 24px' }}>
        <div style={{ padding: '28px 0', textAlign: 'center' }}>
          <Megaphone size={18} color={T.ink3} strokeWidth={1.5} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: T.ink, margin: '0 0 4px' }}>Nothing shared yet</p>
          <p style={{ fontSize: 13.8, color: T.ink3, margin: 0, lineHeight: 1.5 }}>Tap + to share with parents.</p>
        </div>
      </section>
    )
  }

  return (
    <PullToRefresh onRefresh={load}>
      <section style={{ padding: '0 0 24px' }}>
        {posts.map((post: any, index: number) => (
          <PostCard
          key={post.id}
          index={index}
          post={post}
          isSchool={true}
          canManagePost={false}
          reactionEndpoint="/api/teacher/post-reaction"
          userId={teacher.id}
          schoolId={teacher.school_id}
          schoolName={teacher.name}
          schoolLogoUrl={teacher.photo_url || undefined}
          authorOverride={{
            id: teacher.id,
            name: teacher.name,
            photo_url: teacher.photo_url,
            grade: teacher.grade,
            class_name: teacher.class_name,
          }}
          onReactionChange={updatePostReaction}
          onEditPost={() => {}}
          onPostDeleted={deleteLocal}
          onPinToggled={pinLocal}
          />
        ))}
      </section>
    </PullToRefresh>
  )
}

function UniversalClassComposer({ teacher, onClose, onCreated }: any) {
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showEvent, setShowEvent] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [saving, setSaving] = useState(false)

  const hasEvent = showEvent && (eventDate || eventTime || eventLocation.trim())
  const canSubmit = body.trim() || files.length > 0 || hasEvent

  const inferred =
    hasEvent ? 'Event'
    : files.length > 0 ? 'Moment'
    : 'Update'

  const uploadImages = async () => {
    const urls: string[] = []

    for (const file of files) {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/teacher/post-image', {
        method: 'POST',
        body: form,
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not upload photo')
      urls.push(json.url)
    }

    return urls
  }

  const submit = async () => {
    if (!canSubmit || saving) return

    setSaving(true)
    const tid = toast.loading('Publishing…')

    try {
      const image_urls = files.length > 0 ? await uploadImages() : []

      const res = await fetch('/api/teacher/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          image_urls,
          event_date: hasEvent ? eventDate : null,
          event_time: hasEvent ? eventTime : null,
          event_location: hasEvent ? eventLocation.trim() : null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not publish')

      toast.success('Published', { id: tid })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Could not publish', { id: tid })
    }

    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 240,
      background: 'rgba(0,0,0,0.38)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        background: T.white,
        borderRadius: '22px 22px 0 0',
        padding: 20,
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '88dvh',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 850,
              color: T.ink,
              letterSpacing: '-0.035em',
              margin: 0,
            }}>
              Create
            </h3>
            <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
              {inferred} · {teacher.grade}{teacher.class_name ? ` ${teacher.class_name}` : ''}
            </p>
          </div>

          <button onClick={onClose} aria-label="Close" style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink3,
            cursor: 'pointer',
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={5}
          placeholder="Share with your class..."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '12px 13px',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink,
            fontSize: 16,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />

        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 10,
        }}>
          <label style={composerActionStyle}>
            <Camera size={14} strokeWidth={1.9} />
            Photo
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => {
                const picked = Array.from(e.target.files || [])
                setFiles(picked.slice(0, 4))
                e.target.value = ''
              }}
            />
          </label>

          <button
            onClick={() => setShowEvent(!showEvent)}
            style={{
              ...composerActionStyle,
              background: showEvent ? '#F0F4FF' : '#FAFAFC',
              color: showEvent ? T.blue : T.ink2,
              border: showEvent ? `1px solid ${T.blue}` : `1px solid ${T.border}`,
            }}
          >
            Event
          </button>
        </div>

        {files.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
            marginTop: 10,
          }}>
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} style={{
                borderRadius: '50%',
                overflow: 'hidden',
                height: 58,
                background: '#F0F0F4',
              }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {showEvent && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginTop: 10,
          }}>
            <input
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              type="date"
              style={simpleInputStyle}
            />
            <input
              value={eventTime}
              onChange={e => setEventTime(e.target.value)}
              type="time"
              style={simpleInputStyle}
            />
            <input
              value={eventLocation}
              onChange={e => setEventLocation(e.target.value)}
              placeholder="Place"
              style={{ ...simpleInputStyle, gridColumn: '1 / -1' }}
            />
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit || saving}
          style={{
            width: '100%',
            marginTop: 14,
            minHeight: 46,
            padding: '14px 16px',
            borderRadius: 999,
            border: 'none',
            background: !canSubmit || saving ? '#D4D4D8' : T.ink,
            color: T.white,
            fontSize: 15,
            fontWeight: 850,
            cursor: !canSubmit || saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

const composerActionStyle: any = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '10px 12px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: '#FAFAFC',
  color: T.ink2,
  cursor: 'pointer',
  fontSize: 13.8,
  fontWeight: 850,
  fontFamily: 'inherit',
}

const simpleInputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: '#FAFAFC',
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}

/* ────────────────────────────────────────
   CLASS TAB — roster
   ──────────────────────────────────────── */


function weekStartToday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function QuickReportSheet({ child, onClose, onSaved }: any) {
  const defaultSubjects = ['Mathematics', 'English Home Language', 'Life Skills', 'Behaviour']
  const [week, setWeek] = useState(weekStartToday())
  const [scores, setScores] = useState<Record<string, number>>({
    Mathematics: 3,
    'English Home Language': 3,
    'Life Skills': 3,
    Behaviour: 3,
  })
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const setScore = (subject: string, score: number) => {
    setScores(prev => ({ ...prev, [subject]: score }))
  }

  const save = async () => {
    if (saving) return

    setSaving(true)
    const tid = toast.loading('Publishing report...')

    try {
      const res = await fetch('/api/teacher/child-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: child.id,
          week_starting: week,
          scores,
          comment: note.trim(),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not publish report')

      toast.success('Report published', { id: tid })
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Could not publish report', { id: tid })
    }

    setSaving(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 260,
      background: 'rgba(0,0,0,0.38)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        background: T.white,
        borderRadius: '22px 22px 0 0',
        padding: 20,
        maxHeight: '90dvh',
        overflowY: 'auto',
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: child.photo_url ? `url(${child.photo_url}) center/cover` : '#F0F0F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.ink2,
            fontSize: 13.8,
            fontWeight: 800,
            flexShrink: 0,
          }}>
            {!child.photo_url && String(child.name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 17,
              color: T.ink,
              fontWeight: 850,
              margin: 0,
              letterSpacing: '-0.03em',
            }}>
              Report
            </h3>
            <p style={{
              fontSize: 13.8,
              color: T.ink3,
              margin: '-2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {child.name}
            </p>
          </div>

          <button onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink3,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
          }}>
            ×
          </button>
        </div>

        <label style={{
          display: 'block',
          fontSize: 13.8,
          fontWeight: 800,
          color: T.ink3,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          Week
        </label>
        <input
          type="date"
          value={week}
          onChange={e => setWeek(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px 12px',
            borderRadius: 13,
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink,
            fontSize: 16,
            outline: 'none',
            fontFamily: 'inherit',
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {defaultSubjects.map(subject => (
            <div key={subject}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginBottom: 8,
              }}>
                <p style={{
                  fontSize: 13.8,
                  color: T.ink,
                  fontWeight: 650,
                  margin: 0,
                }}>
                  {subject}
                </p>
                <span style={{
                  fontSize: 13.8,
                  color: T.ink3,
                  fontWeight: 800,
                }}>
                  {scores[subject].toFixed(1)}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 6,
              }}>
                {[1, 2, 3, 4, 5].map(score => {
                  const active = scores[subject] === score
                  return (
                    <button
                      key={score}
                      onClick={() => setScore(subject, score)}
                      style={{
                        height: 38,
                        borderRadius: 999,
                        border: active ? 'none' : `1px solid ${T.border}`,
                        background: active ? T.ink : '#FAFAFC',
                        color: active ? T.white : T.ink2,
                        fontSize: 13.8,
                        fontWeight: 850,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {score}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={4}
          placeholder="Optional note. Leave empty to auto-generate a comment."
          style={{
            width: '100%',
            boxSizing: 'border-box',
            marginTop: 16,
            padding: '12px 13px',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink,
            fontSize: 16,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
          }}
        />

        <button
          onClick={save}
          disabled={saving}
          style={{
            width: '100%',
            marginTop: 14,
            minHeight: 46,
            padding: '14px 16px',
            borderRadius: 999,
            border: 'none',
            background: saving ? '#D4D4D8' : T.ink,
            color: T.white,
            fontSize: 15,
            fontWeight: 850,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}


function ClassInviteCard({ teacher, school, kids }: any) {
  const list = Array.isArray(kids) ? kids : []
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const classLabel = `${teacher.grade}${teacher.class_name ? ` · ${teacher.class_name}` : ''}`
  const classLink = origin ? `${origin}/class/${teacher.id}` : `/class/${teacher.id}`
  const totalChildren = list.length
  const claimedChildren = list.filter((child: any) => Number(child.guardian_count || 0) > 0).length
  const unclaimedChildren = Math.max(totalChildren - claimedChildren, 0)
  const allClaimed = totalChildren > 0 && unclaimedChildren === 0

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(classLink)
      toast.success('Class link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <section style={{
      marginBottom: 12,
      padding: 13,
      borderRadius: 20,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.035)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13.8,
            fontWeight: 850,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Class invite link
          </p>

          <p style={{
            fontSize: 13.2,
            color: T.ink3,
            margin: '2px 0 0',
            lineHeight: 1.45,
          }}>
            Share this with {classLabel} parents. They request access, then you approve them here.
          </p>
        </div>

        <span style={{
          flexShrink: 0,
          padding: '6px 9px',
          borderRadius: 999,
          background: allClaimed ? '#F0FDF4' : '#F4F6FB',
          color: allClaimed ? '#15803D' : T.ink2,
          fontSize: 13.2,
          fontWeight: 850,
          whiteSpace: 'nowrap',
        }}>
          {allClaimed ? 'All claimed' : `${unclaimedChildren} unclaimed`}
        </span>
      </div>

      <div style={{
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 8,
        alignItems: 'center',
      }}>
        <div style={{
          minWidth: 0,
          height: 38,
          borderRadius: 999,
          background: '#FAFAFC',
          border: `1px solid ${T.border}`,
          color: T.ink3,
          fontSize: 13.8,
          display: 'flex',
          alignItems: 'center',
          padding: '0 11px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {classLink}
        </div>

        <button
          type="button"
          onClick={copyLink}
          style={{
            height: 38,
            borderRadius: 999,
            border: 'none',
            background: T.ink,
            color: T.white,
            padding: '0 13px',
            fontSize: 13.2,
            fontWeight: 850,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Copy
        </button>
      </div>

      <div style={{
        marginTop: 11,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 7,
      }}>
        <ClassInviteStat label="Children" value={totalChildren} />
        <ClassInviteStat label="Claimed" value={claimedChildren} />
        <ClassInviteStat label="Pending" value="Review" />
      </div>

      {allClaimed && (
        <p style={{
          fontSize: 13.8,
          color: T.ink3,
          margin: '10px 0 0',
          lineHeight: 1.48,
        }}>
          Every child has at least one linked parent. Keep the link available for extra guardians or new children.
        </p>
      )}
    </section>
  )
}

function ClassInviteStat({ label, value }: any) {
  return (
    <div style={{
      padding: '8px 9px',
      borderRadius: 14,
      background: '#F8F8FB',
      border: `1px solid ${T.border}`,
      minWidth: 0,
    }}>
      <p style={{
        fontSize: 14,
        fontWeight: 900,
        color: T.ink,
        margin: 0,
        lineHeight: 1,
      }}>
        {value}
      </p>
      <p style={{
        fontSize: 13.8,
        color: T.ink3,
        margin: '3px 0 0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </p>
    </div>
  )
}

function ClassChildrenSummary({ kids, onReport }: any) {
  const list = Array.isArray(kids) ? kids : []
  const preview = list.slice(0, 10)
  const [open, setOpen] = useState(false)

  const openReport = (child: any) => {
    if (onReport) onReport(child)
    else toast(`${child.name || 'Child'} report is next`)
  }

  return (
    <div style={{
      background: 'transparent',
      border: 'none',
      padding: '0 0 8px',
      marginBottom: 6,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10,
      }}>
        <p style={{
          fontSize: 13.8,
          fontWeight: 700,
          color: T.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          Children
        </p>

        <button
          onClick={() => setOpen(v => !v)}
          aria-label={open ? 'Hide children' : 'View children'}
          title={open ? 'Hide' : 'View all'}
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            border: 'none',
            background: 'rgba(0,0,0,0.04)',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: open ? 'scale(0.98)' : 'scale(1)',
            transition: 'transform 0.16s ease, background 0.16s ease',
          }}
        >
          <Users size={16} strokeWidth={1.8} />
        </button>
      </div>

      {preview.length > 0 && (
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}>
          {preview.map((child: any) => {
            const initials = String(child.name || '?')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <button
                key={child.id}
                onClick={() => openReport(child)}
                title="Report"
                style={{
                  flex: '0 0 auto',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  overflow: 'hidden',
                  background: child.photo_url
                    ? `url(${child.photo_url}) center/cover`
                    : '#F0F0F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  fontWeight: 800,
                  color: T.ink2,
                }}>
                  {!child.photo_url && initials}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {open && (
        <div style={{
          marginTop: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {list.length === 0 ? (
            <p style={{ fontSize: 13.8, color: T.ink3, margin: 0 }}>
              No children have been added yet.
            </p>
          ) : (
            list.map((child: any) => {
              const initials = String(child.name || '?')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              return (
                <button
                  key={child.id}
                  onClick={() => openReport(child)}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: child.photo_url
                      ? `url(${child.photo_url}) center/cover`
                      : '#F0F0F4',
                    color: T.ink2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13.8,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    {!child.photo_url && initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13.8,
                      fontWeight: 600,
                      color: T.ink,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {child.name}
                    </p>
                    <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
                      {child.guardian_count === 0 ? 'No parents linked'
                      : child.guardian_count === 1 ? '1 parent linked'
                      : `${child.guardian_count} parents linked`}
                    </p>
                  </div>

                  <span style={{
                    border: 'none',
                    background: 'rgba(0,0,0,0.04)',
                    color: T.ink2,
                    borderRadius: 999,
                    padding: '7px 11px',
                    fontSize: 13.8,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}>
                    Report
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function ClassRoster({ kids, onChanged }: any) {
  const [showAdd,  setShowAdd]  = useState(false)
  const [editing,  setEditing]  = useState<any>(null)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const addChild = async (name: string) => {
    const tid = toast.loading('Adding…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success(`${name} added`, { id: tid })
      onChanged(); setShowAdd(false)
    } catch (e: any) { toast.error(e.message || 'Failed', { id: tid }) }
  }
  const renameChild = async (id: string, name: string) => {
    const tid = toast.loading('Saving…')
    try {
      const res = await fetch('/api/teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      if (!res.ok) throw new Error()
      toast.success('Renamed', { id: tid })
      setEditing(null); onChanged()
    } catch { toast.error('Failed', { id: tid }) }
  }
  const removeChild = async (id: string, name: string) => {
    setOpenMenu(null)
    if (!confirm(`Remove ${name} from your class?`)) return
    const tid = toast.loading('Removing…')
    try {
      const res = await fetch(`/api/teacher?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(`${name} removed`, { id: tid })
      onChanged()
    } catch { toast.error('Failed', { id: tid }) }
  }

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <PendingClassRequests onChanged={onChanged} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 13.8, color: T.ink3, margin: 0 }}>
          {kids.length === 0
            ? 'No children yet'
            : `${kids.length} ${kids.length === 1 ? 'child' : 'children'} in your class`}
        </p>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 12px', borderRadius: 999,
          background: T.ink, color: T.white, border: 'none',
          fontSize: 13.8, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <Plus size={12} strokeWidth={2.4} /> Add child
        </button>
      </div>

      {kids.length === 0 ? (
        <div style={{
          padding: '32px 20px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 14,
        }}>
          <Users size={20} color={T.ink3} strokeWidth={1.5}
            style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13.8, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Add children so parents can claim them when they join.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {kids.map((c: any) => (
            <div key={c.id} style={{
              padding: '12px 14px', borderRadius: 16,
              background: T.white, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative',
            }}>
              <div style={{
                width: 29, height: 29, borderRadius: '50%',
                background: '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 13.8, color: T.ink2, fontWeight: 600,
              }}>
                {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              {editing?.id === c.id ? (
                <InlineRename value={editing.name}
                  onCancel={() => setEditing(null)}
                  onSave={v => renameChild(c.id, v)} />
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink,
                              margin: 0, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </p>
                  <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
                    {c.guardian_count === 0 ? 'No parents yet'
                    : c.guardian_count === 1 ? '1 parent linked'
                    : `${c.guardian_count} parents linked`}
                  </p>
                </div>
              )}
              {!editing && (
                <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                  aria-label="Options" style={{
                    width: 38, height: 38, borderRadius: 999,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.ink3,
                  }}>
                  <MoreHorizontal size={14} strokeWidth={1.8} />
                </button>
              )}
              {openMenu === c.id && (
                <div className="dropdown-in" style={{
                  position: 'absolute', right: 10, top: 46, zIndex: 10,
                  background: T.white, borderRadius: 14,
                  border: `1px solid ${T.border}`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  padding: '4px 0', minWidth: 150,
                }}>
                  <button onClick={() => { setOpenMenu(null); setEditing(c) }}
                    style={menuItemStyle}>
                    <Pencil size={13} strokeWidth={1.8} /> Rename
                  </button>
                  <button onClick={() => removeChild(c.id, c.name)}
                    style={{ ...menuItemStyle, color: T.red }}>
                    <Trash2 size={13} strokeWidth={1.8} /> Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddChildOverlay onAdd={addChild} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

/* ────────────────────────────────────────
   UPDATES TAB — parent thread inbox
   ──────────────────────────────────────── */
function UpdatesInbox({ teacher }: any) {
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openThread, setOpenThread] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/parents')
      const json = await res.json()
      setParents(json.parents ?? [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  return (
    <div style={{ padding: '0 20px 24px' }}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%',
                        border: `2px solid ${T.border}`, borderTopColor: T.ink,
                        animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : parents.length === 0 ? (
        <div style={{
          padding: '32px 20px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 14,
        }}>
          <MessageCircle size={20} color={T.ink3} strokeWidth={1.5}
            style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, color: T.ink, fontWeight: 600,
                      margin: '0 0 4px' }}>No parent threads yet</p>
          <p style={{ fontSize: 13.8, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Parent messages appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parents.map((p: any) => (
            <button key={p.id} onClick={() => setOpenThread(p)}
              style={{
                padding: '13px 2px',
                borderRadius: 0,
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
              <div style={{
                width: 29, height: 29, borderRadius: '50%',
                background: '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 13.8, color: T.ink2, fontWeight: 600,
              }}>
                {(p.name || 'P').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: T.ink,
                            margin: 0, letterSpacing: '-0.005em',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' }}>
                  {p.name}
                </p>
                <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
                  {p.child_names.join(', ')}
                </p>
                {p.latest_update && (
                  <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', maxWidth: 240 }}>
                    {p.latest_update.author_kind === 'teacher' ? 'You: ' : ''}
                    {p.latest_update.body || '[photo]'}
                  </p>
                )}
              </div>
              {p.latest_update && (
                <p style={{ fontSize: 13.8, color: T.ink3, flexShrink: 0 }}>
                  {relTime(p.latest_update.created_at)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {openThread && (
        <ParentThreadSheet
          parent={openThread}
          teacher={teacher}
          onClose={() => { setOpenThread(null); load() }}
        />
      )}
    </div>
  )
}

/* Parent thread bottom sheet */

/* teacher-message-ux-polish: applied */
function ParentThreadSheet({ parent, teacher, onClose }: any) {
  const [updates, setUpdates] = useState<any[]>([])
  const [reply,   setReply]   = useState('')
  const [attachment, setAttachment] = useState<AttachmentDraft | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadScrollRef = useRef<HTMLDivElement>(null)

  const forceScrollToBottom = (smooth = true) => {
    const run = () => {
      const el = threadScrollRef.current

      if (el) {
        const top = el.scrollHeight + 9999
        if (typeof el.scrollTo === 'function') {
          el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
        } else {
          el.scrollTop = top
        }
      }

      bottomRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
        inline: 'nearest',
      })
    }

    run()
    window.requestAnimationFrame(run)
    window.setTimeout(run, 80)
    window.setTimeout(run, 240)
    window.setTimeout(run, 600)
  }


  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/updates?parent_id=${parent.id}`)
      const json = await res.json()
      setUpdates(json.updates ?? [])
      forceScrollToBottom(false)
      try {
        await fetch('/api/teacher/thread-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: parent.id }),
        })
      } catch {}
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [parent.id])

  // scroll-after-loading: the message list renders after loading becomes false.
  // This makes the thread open directly at the latest message.
  useLayoutEffect(() => {
    if (loading) return
    forceScrollToBottom(false)
  }, [loading, updates.length, parent.id])


  const handlePickAttachment = async (file?: File | null) => {
    if (!file) return

    setUploadingAttachment(true)
    const tid = toast.loading('Attaching…')

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/updates/attachment', {
        method: 'POST',
        body: form,
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not attach file')

      setAttachment(json.attachment)
      toast.success('Attachment ready', { id: tid })
    } catch (e: any) {
      toast.error(e.message || 'Could not attach file', { id: tid })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const sendText = async (text: string) => {
    const clean = text.trim()
    const currentAttachment = attachment
    if ((!clean && !currentAttachment) || sending) return

    const tempId = `optimistic-teacher-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      parent_id: parent.id,
      teacher_id: teacher.id,
      body: clean,
      image_url: null,
      attachment_url: currentAttachment?.url || null,
      attachment_name: currentAttachment?.name || null,
      attachment_type: currentAttachment?.type || null,
      author_kind: 'teacher',
      created_at: new Date().toISOString(),
      _optimistic: true,
    }

    setReply('')
    setAttachment(null)
    setUpdates(prev => [...prev, optimisticMessage])
    forceScrollToBottom(true)
    setSending(true)

    try {
      const res = await fetch('/api/teacher/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_ids: [parent.id],
          body: clean,
          image_url: null,
          attachment_url: currentAttachment?.url || null,
          attachment_name: currentAttachment?.name || null,
          attachment_type: currentAttachment?.type || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not send')

      if (Array.isArray(json.updates) && json.updates[0]?.id) {
        const saved = json.updates[0]
        setUpdates(prev => prev.map((item: any) =>
          item.id === tempId ? { ...saved, image_url: saved?.attachment_url ? null : saved?.image_url } : item
        ))
      } else {
        await load()
      }

      forceScrollToBottom(true)
    } catch (e: any) {
      setUpdates(prev => prev.filter((item: any) => item.id !== tempId))
      setReply(clean)
      setAttachment(currentAttachment)
      toast.error(e.message || 'Could not send')
    } finally {
      setSending(false)
    }
  }

  const parentInitial = (parent.name || 'P').charAt(0).toUpperCase()
  const childLine = Array.isArray(parent.child_names)
    ? parent.child_names.join(', ')
    : parent.child_name || ''

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 270,
      background: T.bg,
      display: 'flex',
      justifyContent: 'center',
      animation: 'fadeIn 0.16s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: T.bg,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 'calc(7px + env(safe-area-inset-top)) 16px 8px',
          background: 'rgba(252,252,255,0.98)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <button onClick={onClose} aria-label="Back" style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: '#F0F0F4',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13.8,
            fontWeight: 800,
            flexShrink: 0,
          }}>
            {parentInitial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: 14,
              color: T.ink,
              fontWeight: 650,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {parent.name || 'Parent'}
            </h3>
            <p style={{
              fontSize: 13.8,
              color: T.ink3,
              margin: '-2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {childLine || 'Parent message'}
            </p>
          </div>
        </div>

        <div ref={threadScrollRef} style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          overscrollBehavior: 'contain',
          padding: '10px 0 190px',
        }}>
          {loading ? (
            <SoftConversationLoader />
          ) : updates.length === 0 ? (
            <div style={{ padding: '70px 28px', textAlign: 'center' }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: '#F0F0F4',
                color: T.ink2,
                margin: '0 auto 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
              }}>
                {parentInitial}
              </div>
              <p style={{
                fontSize: 16,
                color: T.ink,
                fontWeight: 700,
                margin: '0 0 5px',
              }}>
                No messages yet
              </p>
              <p style={{
                fontSize: 13.8,
                color: T.ink3,
                margin: 0,
                lineHeight: 1.5,
              }}>
                Send a quick reply or use one of the shortcuts below.
              </p>
            </div>
          ) : (
            sortMessagesOldestFirst(updates).map((u: any) => (
              <TeacherThreadMessageRow
                key={u.id}
                update={u}
                teacher={teacher}
                parentInitial={parentInitial}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 30,
          background: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          padding: '8px 12px 14px',
        }}>
          


          <AttachmentPreviewTray
            attachment={attachment}
            onRemove={() => setAttachment(null)}
          />

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 7,
            background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 22,
            padding: '6px 7px 6px 11px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.055)',
          }}>
                        <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handlePickAttachment(f)
                e.currentTarget.value = ''
              }}
            />

            <button
              type="button"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAttachment}
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                border: 'none',
                background: attachment ? '#EAF1FF' : '#F4F4F6',
                color: attachment ? T.blue : T.ink2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploadingAttachment ? 'wait' : 'pointer',
                flexShrink: 0,
              }}
            >
              <Paperclip size={16} strokeWidth={2.1} />
            </button>
            


<textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendText(reply)
                }
              }}
              rows={1}
              placeholder="Message..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                color: T.ink,
                fontSize: 16,
                lineHeight: 1.45,
                maxHeight: 90,
                fontFamily: 'inherit',
                padding: '8px 0',
              }}
            />

            <button onClick={() => sendText(reply)} disabled={(!reply.trim() && !attachment) || sending} style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              background: (reply.trim() || attachment) && !sending ? T.ink : '#D4D4D8',
              color: T.white,
              border: 'none',
              cursor: (reply.trim() || attachment) && !sending ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Send size={16} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


/* ────────────────────────────────────────
   BROADCAST TAB — compose to many parents
   ──────────────────────────────────────── */
function BroadcastCompose({ teacher }: any) {
  const [parents,   setParents]   = useState<any[]>([])
  const [picked,    setPicked]    = useState<Set<string>>(new Set())
  const [body,      setBody]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/teacher/parents').then(r => r.json())
      .then(j => setParents(j.parents ?? []))
      .finally(() => setLoading(false))
  }, [])

  const toggleAll = () => {
    if (picked.size === parents.length) setPicked(new Set())
    else setPicked(new Set(parents.map((p: any) => p.id)))
  }
  const togglePick = (id: string) => {
    const next = new Set(picked)
    if (next.has(id)) next.delete(id); else next.add(id)
    setPicked(next)
  }

  const send = async () => {
    if (picked.size === 0) { toast.error('Pick at least one parent'); return }
    if (!body.trim()) { toast.error('Write something'); return }
    setSending(true)
    try {
      const res = await fetch('/api/teacher/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_ids: Array.from(picked),
          body: body.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error()
      toast.success(`Sent to ${json.count} ${json.count === 1 ? 'parent' : 'parents'}`)
      setBody(''); setPicked(new Set())
    } catch { toast.error('Could not send') }
    setSending(false)
  }

  return (
    <div style={{ padding: '0 20px 24px' }}>
      <div style={{
        padding: '12px 14px', borderRadius: 14,
        background: '#F4F6FB',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        marginBottom: 18,
      }}>
        <Megaphone size={14} color={T.blue} strokeWidth={1.8}
          style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13.8, color: T.ink2, margin: 0, lineHeight: 1.5 }}>
          Broadcast sends a private message to selected parents.
          It doesn't appear on the public feed.
        </p>
      </div>

      <textarea value={body} onChange={e => setBody(e.target.value)}
        rows={4}
        placeholder="Write your message…"
        style={{
          width: '100%', minHeight: 46, padding: '12px 14px', fontSize: 16,
          border: `1px solid ${T.border}`, borderRadius: 14,
          background: T.white, color: T.ink, outline: 'none',
          fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
          lineHeight: 1.5,
        }} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 18, marginBottom: 10,
      }}>
        <p style={{ fontSize: 13.8, fontWeight: 600, color: T.ink3,
                    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          To · {picked.size} of {parents.length}
        </p>
        {parents.length > 0 && (
          <button onClick={toggleAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13.8, fontWeight: 600, color: T.blue,
            fontFamily: 'inherit', padding: 0,
          }}>
            {picked.size === parents.length ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%',
                        border: `2px solid ${T.border}`, borderTopColor: T.ink,
                        animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : parents.length === 0 ? (
        <p style={{ fontSize: 13.8, color: T.ink3, textAlign: 'center', padding: '20px 0' }}>
          No parents linked yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {parents.map((p: any) => {
            const isPicked = picked.has(p.id)
            return (
              <button key={p.id} onClick={() => togglePick(p.id)}
                style={{
                  padding: '10px 12px', borderRadius: 999,
                  background: isPicked ? '#F0F4FF' : T.white,
                  border: isPicked ? `1px solid ${T.blue}` : `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: isPicked ? T.blue : T.white,
                  border: isPicked ? 'none' : `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isPicked && <Check size={11} color={T.white} strokeWidth={3} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.8, fontWeight: 500, color: T.ink,
                              margin: 0, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
                    {p.child_names.join(', ')}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <button onClick={send} disabled={sending || !body.trim() || picked.size === 0}
        style={{
          width: '100%', minHeight: 46, padding: '14px 16px', marginTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderRadius: 999,
          background: !body.trim() || picked.size === 0 ? '#E0E0E4' : T.ink,
          color: T.white, border: 'none',
          fontSize: 14, fontWeight: 600,
          cursor: sending || !body.trim() || picked.size === 0 ? 'not-allowed' : 'pointer',
          opacity: sending ? 0.6 : 1, fontFamily: 'inherit',
        }}>
        <Send size={15} strokeWidth={2.2} />
        {sending ? 'Sending…' : 'Send broadcast'}
      </button>
    </div>
  )
}

/* ────────────────────────────────────────
   Shared helpers
   ──────────────────────────────────────── */
const menuItemStyle: any = {
  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
  padding: '9px 12px', background: 'none', border: 'none',
  cursor: 'pointer', fontSize: 13.8, fontWeight: 500,
  color: T.ink, fontFamily: 'inherit', textAlign: 'left',
}

function InlineRename({ value, onCancel, onSave }: any) {
  const [v, setV] = useState(value)
  return (
    <div style={{ flex: 1, display: 'flex', gap: 6 }}>
      <input value={v} onChange={e => setV(e.target.value)} autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(v.trim())
          if (e.key === 'Escape') onCancel()
        }}
        style={{ flex: 1, padding: '7px 10px', fontSize: 13.8,
          border: `1px solid ${T.border}`, borderRadius: 14,
          fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => onSave(v.trim())} style={{
        width: 38, height: 38, borderRadius: 999,
        background: T.ink, color: T.white, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Check size={12} strokeWidth={2.4} /></button>
      <button onClick={onCancel} style={{
        width: 38, height: 38, borderRadius: 999,
        background: 'none', border: `1px solid ${T.border}`, cursor: 'pointer',
        color: T.ink3, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}><X size={12} strokeWidth={1.8} /></button>
    </div>
  )
}


function TeacherSkeletonBlock({ style = {} }: any) {
  return (
    <div
      className="sc-teacher-skeleton-block"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(90deg, #F1F1F5 0%, #F7F7FA 45%, #F1F1F5 100%)',
        backgroundSize: '220% 100%',
        animation: 'scTeacherSkeleton 1.25s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

function TeacherMessageGhostRows() {
  return (
    <div style={{ padding: '10px 16px 24px' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const mine = i % 2 === 1
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: mine ? 'row-reverse' : 'row',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <TeacherSkeletonBlock style={{
              width: 42,
              height: 42,
              borderRadius: 999,
              flexShrink: 0,
              marginTop: 2,
            }} />

            <div style={{
              width: i === 2 ? '58%' : mine ? '62%' : '70%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: mine ? 'flex-end' : 'flex-start',
            }}>
              <TeacherSkeletonBlock style={{
                width: '100%',
                height: i === 3 ? 74 : 42,
                borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }} />
              <TeacherSkeletonBlock style={{
                width: 42,
                height: 8,
                borderRadius: 999,
                marginTop: 6,
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TeacherPageSkeleton() {
  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flexShrink: 0,
        background: 'rgba(252,252,255,0.98)',
        padding: 'calc(7px + env(safe-area-inset-top)) 20px 8px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <TeacherSkeletonBlock style={{ width: 29, height: 29, borderRadius: 999 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <TeacherSkeletonBlock style={{ width: 29, height: 29, borderRadius: 999 }} />
            <TeacherSkeletonBlock style={{ width: 29, height: 29, borderRadius: 999 }} />
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
        }}>
          <TeacherSkeletonBlock style={{ width: 38, height: 38, borderRadius: 999, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <TeacherSkeletonBlock style={{ width: '48%', height: 12, borderRadius: 999, marginBottom: 8 }} />
            <TeacherSkeletonBlock style={{ width: '34%', height: 9, borderRadius: 999 }} />
          </div>
        </div>
      </div>

      <div style={{
        padding: '8px 20px 14px',
        display: 'flex',
        gap: 8,
      }}>
        <TeacherSkeletonBlock style={{ width: 86, height: 32, borderRadius: 999 }} />
        <TeacherSkeletonBlock style={{ width: 92, height: 32, borderRadius: 999 }} />
        <TeacherSkeletonBlock style={{ width: 104, height: 32, borderRadius: 999 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <TeacherMessageGhostRows />
      </div>

      <div style={{
        flexShrink: 0,
        padding: '10px 12px 14px',
        background: 'rgba(252,252,255,0.96)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 20,
          padding: '7px 7px 7px 10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        }}>
          <TeacherSkeletonBlock style={{ width: 29, height: 29, borderRadius: '50%', flexShrink: 0 }} />
          <TeacherSkeletonBlock style={{ height: 14, borderRadius: 999, flex: 1 }} />
          <TeacherSkeletonBlock style={{ width: 29, height: 29, borderRadius: '50%', flexShrink: 0 }} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes scTeacherSkeleton {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>
    </div>
  )
}

function TeacherThreadSkeleton() {
  return (
    <div style={{ paddingTop: 12 }}>
      <TeacherMessageGhostRows />
    </div>
  )
}

function PendingClassRequests({ onChanged }: any) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/class-requests?status=pending')
      const json = await res.json()
      setRequests(json.requests ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    setBusyId(requestId)
    const tid = toast.loading(action === 'approve' ? 'Approving request…' : 'Rejecting request…')

    try {
      const res = await fetch('/api/teacher/class-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not review request')

      toast.success(action === 'approve'
        ? 'Parent approved and child linked'
        : 'Request rejected',
        { id: tid }
      )

      await load()
      onChanged?.()
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }

    setBusyId(null)
  }

  if (loading || requests.length === 0) return null

  return (
    <section style={{
      marginBottom: 16,
      padding: 14,
      borderRadius: 18,
      background: '#F7F8FC',
      border: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}>
        <div>
          <p style={{
            fontSize: 13.8,
            fontWeight: 850,
            color: T.ink,
            letterSpacing: '-0.01em',
            margin: '0 0 3px',
          }}>
            Parent join requests
          </p>

          <p style={{
            fontSize: 13.2,
            color: T.ink3,
            margin: 0,
            lineHeight: 1.45,
          }}>
            Review parents who asked to link a child to your class.
          </p>
        </div>

        <span style={{
          minWidth: 26,
          height: 24,
          padding: '0 8px',
          borderRadius: 999,
          background: T.white,
          border: `1px solid ${T.border}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.ink,
          fontSize: 12,
          fontWeight: 850,
          flexShrink: 0,
        }}>
          {requests.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requests.map((request: any) => {
          const childName = (
            request.child_full_name ||
            `${request.child_first_name || ''} ${request.child_last_name || ''}`
          ).trim().replace(/\s+/g, ' ') || 'Child'

          const parentName = request.parent?.full_name || 'Parent'
          const parentPhone = request.parent?.phone || ''
          const relationship = request.relationship || 'Parent/Guardian'
          const submittedAt = request.created_at
            ? new Date(request.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
            : ''

          const initials = childName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          const busy = busyId === request.id

          return (
            <article key={request.id} style={{
              padding: 14,
              borderRadius: 18,
              background: T.white,
              border: `1px solid ${T.border}`,
              boxShadow: '0 10px 26px rgba(0,0,0,0.045)',
            }}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  background: '#F0F0F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: T.ink2,
                  fontSize: 13.8,
                  fontWeight: 850,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 14.5,
                    color: T.ink,
                    fontWeight: 800,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}>
                    {childName}
                  </p>

                  <p style={{
                    fontSize: 13.2,
                    color: T.ink3,
                    margin: '2px 0 0',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {parentName}{parentPhone ? ` · ${parentPhone}` : ''}
                  </p>

                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                    marginTop: 8,
                  }}>
                    <span style={requestChipStyle}>{relationship}</span>
                    {submittedAt && <span style={requestChipStyle}>{submittedAt}</span>}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 12,
              }}>
                <ClassSpaceButton
                  type="button"
                  compact
                  variant="danger"
                  disabled={busy}
                  onClick={() => review(request.id, 'reject')}
                >
                  <X size={14} strokeWidth={2.2} />
                  Reject
                </ClassSpaceButton>

                <ClassSpaceButton
                  type="button"
                  compact
                  variant="primary"
                  disabled={busy}
                  onClick={() => review(request.id, 'approve')}
                >
                  <Check size={14} strokeWidth={2.4} />
                  Approve
                </ClassSpaceButton>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const requestChipStyle: any = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 23,
  padding: '0 8px',
  borderRadius: 999,
  background: '#F4F4F6',
  color: T.ink3,
  fontSize: 13.2,
  fontWeight: 750,
}


function AddChildOverlay({ onAdd, onClose }: any) {
  const [name, setName] = useState('')
  const submit = () => { const n = name.trim(); if (n) onAdd(n) }
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0', padding: 24,
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink,
                     letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          Add a child
        </h3>
        <input autoFocus value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit() }}
          placeholder="Child full name"
          style={{
            width: '100%', padding: '12px 14px', fontSize: 16,
            border: `1px solid ${T.border}`, borderRadius: 14,
            background: T.white, color: T.ink, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        <button onClick={submit} style={{
          width: '100%', marginTop: 12, padding: '14px',
          borderRadius: 999, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Add child</button>
      </div>
    </div>
  )
}


/* ────────────────────────────────────────
   NOTIFICATIONS SHEET — bell content
   ──────────────────────────────────────── */


/* GROUPED TEACHER NOTIFICATIONS */

function NotificationGhostRows() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{
          padding: '12px 12px',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
        }}>
          <TeacherSkeletonBlock style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
          }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <TeacherSkeletonBlock style={{
              width: i % 2 === 0 ? '58%' : '44%',
              height: 12,
              borderRadius: 999,
              marginBottom: 8,
            }} />
            <TeacherSkeletonBlock style={{
              width: i === 2 ? '70%' : '86%',
              height: 10,
              borderRadius: 999,
              marginBottom: 8,
            }} />
            <TeacherSkeletonBlock style={{
              width: 42,
              height: 8,
              borderRadius: 999,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}


function SoftLoaderDots() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      marginLeft: 6,
    }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: T.ink3,
            opacity: 0.45,
            animation: `softDot 1.05s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

function SoftNotificationLoader() {
  return (
    <div style={{
      padding: '42px 18px 30px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        background: '#F4F6FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <MessageCircle size={18} color={T.ink3} strokeWidth={1.7} />
      </div>

      <p style={{
        fontSize: 13.8,
        fontWeight: 750,
        color: T.ink,
        margin: 0,
      }}>
        Checking notifications
        <SoftLoaderDots />
      </p>

      <p style={{
        fontSize: 13.8,
        color: T.ink3,
        margin: '6px 0 0',
        lineHeight: 1.45,
      }}>
        We’re bringing the latest parent messages forward.
      </p>

      <style jsx global>{`
        @keyframes softDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-4px); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

function SoftConversationLoader() {
  return (
    <div style={{
      padding: '58px 24px 34px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 16,
        background: '#F4F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <MessageCircle size={19} color={T.ink3} strokeWidth={1.7} />
      </div>

      <p style={{
        fontSize: 13.8,
        fontWeight: 750,
        color: T.ink,
        margin: 0,
      }}>
        Opening conversation
        <SoftLoaderDots />
      </p>

      <p style={{
        fontSize: 13.8,
        color: T.ink3,
        margin: '6px 0 0',
        lineHeight: 1.45,
      }}>
        Messages will appear here in a moment.
      </p>
    </div>
  )
}

function TeacherThreadMessageRow({ update, teacher, parentInitial }: any) {
  const teacherInitials = teacher.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <MessageBubble
      update={update}
      perspective="teacher"
      teacherName={teacher.name}
      teacherPhotoUrl={teacher.photo_url}
      teacherInitials={teacherInitials}
      parentInitial={parentInitial}
    />
  )
}


function NotificationsSheet({ teacher, onClose }: any) {
  const [items, setItems] = useState<any[]>([])
  const [parents, setParents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openThread, setOpenThread] = useState<any>(null)

  const load = async () => {
    // teacher-notifications-fast-load-v1:
    // Do not wait for parents before showing notifications.
    // Notifications are the screen's main content; parent details can hydrate in the background.
    setLoading(true)

    try {
      const notifRes = await fetch('/api/teacher/notifications')
      const notifJson = await notifRes.json().catch(() => ({ items: [] }))
      setItems(notifJson.items ?? [])
      setLoading(false)

      // Background hydrate parent details for child labels/thread fallback.
      fetch('/api/teacher/parents')
        .then(r => r.json())
        .then(j => setParents(j.parents ?? []))
        .catch(() => {})
    } catch {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markOpenedMessagesRead = async (group: any) => {
    const groupItems = Array.isArray(group.items) ? group.items : [group]
    const ids = groupItems.map((item: any) => item.id).filter(Boolean)

    // Move this conversation from New to Read instantly in the UI.
    setItems(prev => prev.map((item: any) => {
      if (ids.includes(item.id)) return { ...item, unread: false }
      return item
    }))

    // Current backend marks teacher notifications as read through this endpoint.
    // This clears the bell dot while we keep the UI grouped locally.
}

  const openMessageThread = async (group: any) => {
    const source = Array.isArray(group.items) ? group.latest : group
    await markOpenedMessagesRead(group)

    const parentId = source?.parent_id || source?.parentId || source?.parent?.id || group.parent_id
    const parentName = source?.parent_name || source?.author_name || source?.name || group.parent_name

    const found = parents.find((p: any) =>
      (parentId && p.id === parentId) ||
      (parentName && p.name === parentName)
    )

    if (found) {
      setOpenThread(found)
      return
    }

    if (parentId || parentName) {
      setOpenThread({
        id: parentId,
        name: parentName || 'Parent',
        child_names: source?.child_names || source?.children || group.child_names || [],
      })
      return
    }

    toast('Open Messages to reply')
  }

  const messages = items.filter((item: any) => item.kind === 'message')
  const unreadMessages = messages.filter((item: any) => item.unread)
  const readMessages = messages.filter((item: any) => !item.unread)

  const requests = items.filter((item: any) => item.kind === 'request' || item.kind === 'class_request')
  const replies = items.filter((item: any) => item.kind === 'reply')
  const reactions = items.filter((item: any) => item.kind === 'reaction')
  const other = items.filter((item: any) =>
    !['message', 'request', 'class_request', 'reply', 'reaction'].includes(item.kind)
  )

  if (openThread) {
    return (
      <ParentThreadSheet
        parent={openThread}
        teacher={teacher}
        onClose={() => {
          setOpenThread(null)
          load()
        }}
      />
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 250,
      background: T.bg,
      display: 'flex',
      justifyContent: 'center',
      animation: 'fadeIn 0.16s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: T.bg,
      }}>
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 18px 12px',
          background: 'rgba(252,252,255,0.98)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 750,
              color: T.ink,
              letterSpacing: '-0.025em',
              margin: 0,
            }}>
              Notifications
            </h3>
            <p style={{
              fontSize: 13.8,
              color: T.ink3,
              margin: '-2px 0 0',
            }}>
              Messages move to Read after you open them
            </p>
          </div>

          <button onClick={onClose} aria-label="Close" style={{
            width: 34,
            height: 34,
            borderRadius: 999,
            background: 'rgba(0,0,0,0.04)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={17} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          overscrollBehavior: 'contain',
          padding: '8px 16px 28px',
        }}>
          {loading ? (
            <SoftNotificationLoader />
          ) : items.length === 0 ? (
            <div style={{ padding: '70px 24px', textAlign: 'center' }}>
              <MessageCircle size={22} color={T.ink3} strokeWidth={1.5} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: T.ink, fontWeight: 700, margin: '0 0 5px' }}>
                You're all caught up
              </p>
              <p style={{ fontSize: 13.8, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
                New parent messages, requests and reactions will appear here.
              </p>
            </div>
          ) : (
            <>
              <MessageGroups title="New messages" messages={unreadMessages} parents={parents} onOpen={openMessageThread} unread />
              <MessageGroups title="Read messages" messages={readMessages} parents={parents} onOpen={openMessageThread} />
              <NotifSection title="Requests" items={requests} onOpen={() => toast('Class requests are shown on your teacher page')} />
              <NotifSection title="Replies" items={replies} onOpen={() => toast('Replies are linked to post activity')} />
              <NotifSection title="Reactions" items={reactions} onOpen={() => toast('Reaction received')} />
              <NotifSection title="Other" items={other} onOpen={() => {}} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}


function normalizeChildNames(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean).map((v: any) => String(v))
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
  }
  return []
}

function parentChildLabel(source: any): string {
  const names = normalizeChildNames(
    source?.child_names ||
    source?.children ||
    source?.child_name ||
    source?.childName
  )

  if (names.length === 1) return `Parent of ${names[0]}`
  if (names.length === 2) return `Parent of ${names[0]} and ${names[1]}`
  if (names.length > 2) return `Parent of ${names[0]} +${names.length - 1}`

  return source?.parent_name || source?.author_name || source?.name || 'Parent'
}

function groupMessagesByParent(messages: any[], parents: any[] = []) {
  const map = new Map<string, any>()

  for (const item of messages) {
    const key = item.parent_id || item.parentId || item.parent_name || item.author_name || 'unknown-parent'

    const matchedParent = parents.find((p: any) =>
      (item.parent_id && p.id === item.parent_id) ||
      (item.parentId && p.id === item.parentId) ||
      (item.parent_name && p.name === item.parent_name) ||
      (item.author_name && p.name === item.author_name)
    )

    const parentName = matchedParent?.name || item.parent_name || item.author_name || 'Parent'
    const itemChildNames = normalizeChildNames(item.child_names || item.children || item.child_name)
    const matchedChildNames = normalizeChildNames(matchedParent?.child_names || matchedParent?.children || matchedParent?.child_name)
    const uniqueChildNames = Array.from(new Set([...itemChildNames, ...matchedChildNames].filter(Boolean)))

    if (!map.has(key)) {
      map.set(key, {
        parent_id: item.parent_id || item.parentId || item.parent?.id || matchedParent?.id,
        parent_name: parentName,
        child_names: uniqueChildNames,
        latest: item,
        items: [],
        unread: false,
      })
    }

    const group = map.get(key)
    group.items.push(item)
    group.parent_name = group.parent_name || parentName
    group.child_names = Array.from(new Set([...(group.child_names || []), ...uniqueChildNames]))

    if (item.unread) group.unread = true

    const currentTime = new Date(group.latest?.created_at || 0).getTime()
    const itemTime = new Date(item.created_at || 0).getTime()
    if (itemTime >= currentTime) group.latest = item
  }

  return Array.from(map.values())
    .sort((a, b) => new Date(b.latest?.created_at || 0).getTime() - new Date(a.latest?.created_at || 0).getTime())
}

function MessageGroups({ title, messages, parents = [], onOpen, unread = false }: any) {
  const groups = groupMessagesByParent(messages, parents)

  if (groups.length === 0) return null

  return (
    <section style={{ marginBottom: 18 }}>
      <p style={{
        fontSize: 13.8,
        fontWeight: 800,
        color: T.ink3,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: '10px 2px 8px',
      }}>
        {title} · {groups.length}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.map((group: any) => (
          <MessageGroupRow
            key={group.parent_id || group.parent_name}
            group={group}
            unread={unread || group.unread}
            onOpen={() => onOpen(group)}
          />
        ))}
      </div>
    </section>
  )
}


function MessageGroupRow({ group, unread, onOpen }: any) {
  const count = group.items?.length || 0
  const latest = group.latest || {}
  const label = parentChildLabel(group)
  const preview = latest.preview || latest.body || latest.post_preview || ''
  const showCountBadge = false // teacher-notification-count-badge-removed

  return (
    <button onClick={onOpen} style={{
      width: '100%',
      padding: '12px 12px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      background: unread ? '#F4F6FB' : T.white,
      border: `1px solid ${unread ? 'rgba(120,166,254,0.28)' : T.border}`,
      borderRadius: 16,
      cursor: 'pointer',
      fontFamily: 'inherit',
      textAlign: 'left',
      position: 'relative', // count badge anchor
    }}>
      {showCountBadge && (
        <span
          aria-label={`${count} unread messages`}
          style={{
            position: 'absolute',
            top: 9,
            right: 9,
            minWidth: 20,
            height: 20,
            padding: '0 6px',
            borderRadius: 999,
            background: T.red,
            color: T.white,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13.8,
            fontWeight: 850,
            lineHeight: 1,
            border: `2px solid ${unread ? '#F4F6FB' : T.white}`,
          }}
        >
          {count}
        </span>
      )}

      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#F0F0F4',
        color: T.ink2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 13.8,
        fontWeight: 800,
      }}>
        {(label || 'P').replace('Parent of ', '').charAt(0).toUpperCase()}
      </div>

      <div style={{
        flex: 1,
        minWidth: 0,
        paddingRight: showCountBadge ? 28 : 0,
      }}>
        <p style={{
          fontSize: 13.8,
          fontWeight: 700,
          color: T.ink,
          margin: 0,
          letterSpacing: '-0.005em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </p>

        {preview && (
          <p style={{
            fontSize: 13.8,
            color: T.ink3,
            margin: '-2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 320,
            lineHeight: 1.48,
          }}>
            {preview}
          </p>
        )}

        <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
          {relTime(latest.created_at)}
        </p>
      </div>

      {unread && !showCountBadge && (
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: T.red,
          marginTop: 4,
          flexShrink: 0,
        }} />
      )}
    </button>
  )
}


function NotifSection({ title, items, onOpen }: any) {
  if (!items || items.length === 0) return null

  return (
    <section style={{ marginBottom: 18 }}>
      <p style={{
        fontSize: 13.8,
        fontWeight: 800,
        color: T.ink3,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        margin: '10px 2px 8px',
      }}>
        {title} · {items.length}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item: any) => (
          <NotifRow
            key={item.id || `${item.kind}-${item.created_at}`}
            item={item}
            onOpen={() => onOpen(item)}
          />
        ))}
      </div>
    </section>
  )
}

function NotifRow({ item, onOpen }: any) {
  const isClickable = item.kind === 'request' || item.kind === 'class_request'

  const title =
    item.kind === 'reaction' ? `${item.author_name || 'Someone'} reacted to your post` :
    item.kind === 'reply'    ? `${item.author_name || 'Someone'} replied to your post` :
    item.kind === 'request' || item.kind === 'class_request' ? 'Class request' :
    'Notification'

  const icon =
    item.kind === 'reaction'
      ? (item.type === 'love' ? '❤️' : item.type === 'like' ? '👍' : item.type === 'celebrate' ? '🎉' : '👏') :
    item.kind === 'reply' ? '💭' :
    item.kind === 'request' || item.kind === 'class_request' ? '👤' :
    '🔔'

  return (
    <button onClick={onOpen} disabled={!isClickable} style={{
      width: '100%',
      padding: '12px 12px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      background: item.unread ? '#F4F6FB' : T.white,
      border: `1px solid ${item.unread ? 'rgba(120,166,254,0.28)' : T.border}`,
      borderRadius: 16,
      cursor: isClickable ? 'pointer' : 'default',
      fontFamily: 'inherit',
      textAlign: 'left',
      opacity: isClickable ? 1 : 0.95,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: '#F0F0F4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 16,
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13.8,
          fontWeight: 700,
          color: T.ink,
          margin: 0,
          letterSpacing: '-0.005em',
        }}>
          {title}
        </p>

        {(item.preview || item.post_preview) && (
          <p style={{
            fontSize: 13.8,
            color: T.ink3,
            margin: '-2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 320,
            lineHeight: 1.48,
          }}>
            {item.kind === 'reaction' ? `"${item.post_preview}..."` : (item.preview || item.post_preview)}
          </p>
        )}

        <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
          {relTime(item.created_at)}
        </p>
      </div>

      {item.unread && (
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: T.red,
          marginTop: 4,
          flexShrink: 0,
        }} />
      )}
    </button>
  )
}


function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
