// @ts-nocheck
// school-flat-restore-v346
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, FileText, Heart, MoreVertical, Plus, RotateCw, Slash, Smile, ThumbsUp, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { SCBottomSheet, SCButton, SCInput, SCTeacherRow, SCTopBar, SCIconButton, SCEmptyState } from '@/components/ui'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.035)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  soft2: '#F4F5F5',
  accent: '#717171',
  accentSoft: '#F5F5F5',
  white: '#FFFFFF',
  red: '#B42318',
}

interface Teacher {
  id: string
  name: string
  email: string | null
  photo_url: string | null
  grade: string
  class_name: string | null
  access_token: string
  status: 'active' | 'revoked'
  last_seen_at: string | null
  created_at: string
}

const inputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: any = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: T.ink3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const softButton: any = {
  minHeight: 38,
  borderRadius: 999,
  border: 'none',
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 540,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const primaryButton: any = {
  ...softButton,
  background: T.ink,
  color: T.white,
}

function initials(name?: string | null) {
  return String(name || 'T')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function teacherLink(token: string): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/teacher-link/${token}`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

const TEACHERS_CACHE_KEY = 'school-connect:teachers:list:v1'

function readCachedTeachers(): Teacher[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(TEACHERS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed?.teachers) ? parsed.teachers : []
  } catch {
    return []
  }
}

function writeCachedTeachers(teachers: Teacher[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      TEACHERS_CACHE_KEY,
      JSON.stringify({ teachers, saved_at: new Date().toISOString() })
    )
  } catch {
    // Caching should never block the page.
  }
}

function announceTeachersReady(teachers: Teacher[]) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('school-connect-teachers-ready', {
    detail: { count: Array.isArray(teachers) ? teachers.length : 0 },
  }))
}

function SheetPortal({ children }: any) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}

export function TeachersTab() {
  const [teachers, setTeachers] = useState<Teacher[]>(() => readCachedTeachers())
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [floatingMenu, setFloatingMenu] = useState<any>(null)
  const [selectedTeacherMoments, setSelectedTeacherMoments] = useState<Teacher | null>(null)

  const load = async () => {
    setLoading(true)
    let nextTeachers: Teacher[] | null = null

    try {
      const res = await fetch('/api/teachers')
      const json = await res.json()
      nextTeachers = json.teachers ?? []
      setTeachers(nextTeachers)
      writeCachedTeachers(nextTeachers)
      announceTeachersReady(nextTeachers)
    } catch {
      const cached = readCachedTeachers()
      if (cached.length) {
        setTeachers(cached)
        announceTeachersReady(cached)
      } else {
        announceTeachersReady([])
        toast.error('Could not load teachers')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const openAdd = () => setShowAdd(true)
    window.addEventListener('school-connect-open-add-teacher', openAdd)

    return () => {
      window.removeEventListener('school-connect-open-add-teacher', openAdd)
    }
  }, [])

  useEffect(() => {
    if (!floatingMenu) return

    const close = () => setFloatingMenu(null)

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [floatingMenu])

  const copyLink = async (teacher: Teacher) => {
    const url = teacherLink(teacher.access_token)

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(teacher.id)
      toast.success('Teacher link copied')
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const updateTeacher = async (id: string, action: string) => {
    setFloatingMenu(null)

    const tid = toast.loading(action === 'rotate' ? 'Generating new link...' : 'Updating...')

    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')

      toast.success(
        action === 'revoke'
          ? 'Access revoked'
          : action === 'reactivate'
            ? 'Reactivated'
            : action === 'rotate'
              ? 'New link issued'
              : 'Saved',
        { id: tid }
      )

      load()
    } catch (error: any) {
      toast.error(error.message || 'Failed', { id: tid })
    }
  }

  const deleteTeacher = async (id: string) => {
    setFloatingMenu(null)

    if (!confirm('Delete this teacher? This cannot be undone.')) return

    const tid = toast.loading('Deleting...')

    try {
      const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')

      toast.success('Teacher deleted', { id: tid })
      load()
    } catch {
      toast.error('Could not delete teacher', { id: tid })
    }
  }

  const openTeacherMenu = (event: any, teacher: Teacher) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 184
    const menuHeight = 126

    const left = clamp(rect.right - menuWidth, 12, window.innerWidth - menuWidth - 12)
    let top = rect.bottom + 8

    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 8
    }

    setFloatingMenu({
      teacher,
      left,
      top: clamp(top, 12, window.innerHeight - menuHeight - 12),
    })
  }

  if (loading && teachers.length === 0) {
    return <div aria-hidden="true" style={{ height: 1 }} />
  }

  return (
    <div style={{
      paddingTop: teachers.length ? 0 : 10,
      background: T.white,
      overflow: 'visible',
      position: 'relative',
      zIndex: 30,
    }}>
      {teachers.length === 0 ? (
        <div style={{
          padding: '28px 16px',
          textAlign: 'center',
          border: `1px dashed rgba(0,0,0,0.055)`,
          borderRadius: 16,
          background: 'transparent',
          marginTop: 10,
        }}>
          <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
            No teachers yet
          </p>

          <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 14px' }}>
            Add teachers and share their private link.
          </p>

          <button
          type="button"
          onClick={() => setShowAdd(true)}
          aria-label="Add teacher"
          style={{
            minHeight: 38,
            borderRadius: 999,
            border: 'none',
            background: T.ink,
            color: T.white,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '0 14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 540,
          }}
        >
          <Plus size={15} strokeWidth={2.1} />
          Add
        </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          position: 'relative',
          zIndex: 30,
        }}>
          {teachers.map((teacher, index) => (
            <SCTeacherRow
              key={teacher.id}
              teacher={teacher}
              isLast={index === teachers.length - 1}
              copied={copiedId === teacher.id}
              onCopy={(item: any) => copyLink(item as Teacher)}
              onMenu={(event: any, item: any) => openTeacherMenu(event, item as Teacher)}
              onOpen={(item: any) => setSelectedTeacherMoments(item as Teacher)}
            />
          ))}
        </div>
      )}

      {floatingMenu && (
        <FloatingTeacherMenu
          menu={floatingMenu}
          onClose={() => setFloatingMenu(null)}
          onCopy={() => {
            const teacher = floatingMenu.teacher as Teacher
            setFloatingMenu(null)
            copyLink(teacher)
          }}
          onRotate={() => updateTeacher(floatingMenu.teacher.id, 'rotate')}
          onRevoke={() => updateTeacher(floatingMenu.teacher.id, 'revoke')}
          onReactivate={() => updateTeacher(floatingMenu.teacher.id, 'reactivate')}
          onDelete={() => deleteTeacher(floatingMenu.teacher.id)}
        />
      )}

      {selectedTeacherMoments && (
        <AdminTeacherMomentsScreen
          teacher={selectedTeacherMoments}
          onClose={() => setSelectedTeacherMoments(null)}
        />
      )}

      {showAdd && (
        <AddTeacherSheet
          open={showAdd}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function TeacherRow({
  teacher,
  isLast,
  copiedId,
  onCopy,
  onMenu,
}: any) {
  const t = teacher as Teacher
  const isCopied = copiedId === t.id
  const isActive = t.status === 'active'

  return (
    <article style={{
      padding: '14px 0',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      position: 'relative',
      overflow: 'visible',
      opacity: isActive ? 1 : 0.62,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 15,
        background: t.photo_url ? `url(${t.photo_url}) center/cover` : T.accentSoft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.accent,
        fontSize: 12,
        fontWeight: 540,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {!t.photo_url && initials(t.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14.2,
          fontWeight: 560,
          color: T.ink,
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {t.name}
        </p>

        <p style={{
          fontSize: 12.7,
          color: T.ink3,
          margin: '2px 0 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {[t.grade, t.class_name, isActive ? 'Active' : 'Revoked'].filter(Boolean).join(' · ')}
        </p>
      </div>

      {isActive && (
        <button
          type="button"
          onClick={() => onCopy(t)}
          aria-label="Copy teacher link"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: 'none',
            background: isCopied ? T.accentSoft : T.white,
            color: isCopied ? T.accent : T.ink3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isCopied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.9} />}
        </button>
      )}

      <button
        type="button"
        onClick={(event) => onMenu(event, t)}
        aria-label="Teacher options"
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          border: 'none',
          background: T.white,
          color: T.ink3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <MoreVertical size={15} strokeWidth={1.8} />
      </button>
    </article>
  )
}

function FloatingTeacherMenu({ menu, onClose, onCopy, onRotate, onRevoke, onReactivate, onDelete }: any) {
  const teacher = menu.teacher as Teacher
  const isActive = teacher.status === 'active'

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          background: 'transparent',
        }}
      />

      <div style={{
        position: 'fixed',
        left: menu.left,
        top: menu.top,
        zIndex: 9001,
        background: T.white,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        boxShadow: '0 12px 34px rgba(15,23,42,0.08)',
        padding: 6,
        minWidth: 192,
      }}>
        {isActive ? (
          <MenuItem onClick={onCopy} Icon={Copy} label="Copy invite link" />
        ) : null}

        <MenuItem onClick={onRotate} Icon={RotateCw} label="Issue new link" />

        {isActive ? (
          <MenuItem onClick={onRevoke} Icon={Slash} label="Revoke access" />
        ) : (
          <MenuItem onClick={onReactivate} Icon={Check} label="Reactivate" />
        )}

        <div style={{ height: 1, background: 'var(--sc-border-soft)', margin: '5px 6px' }} />

        <MenuItem onClick={onDelete} Icon={Trash2} label="Remove teacher" danger />
      </div>
    </>
  )
}

function MenuItem({ onClick, Icon, label, danger }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
        fontSize: 12.8,
        fontWeight: 520,
        color: danger ? T.red : T.ink2,
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <Icon size={14} strokeWidth={1.8} />
      {label}
    </button>
  )
}

function AddTeacherSheet({ open, onClose, onCreated }: any) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [className, setClassName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim() || !grade.trim()) {
      toast.error('Name and grade are required')
      return
    }

    setSaving(true)
    const tid = toast.loading('Creating teacher...')

    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          grade: grade.trim(),
          class_name: className.trim() || null,
          email: email.trim() || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')

      toast.success(`${name} added`, { id: tid })
      onCreated()
    } catch (error: any) {
      toast.error(error.message || 'Failed', { id: tid })
    }

    setSaving(false)
  }

  return (
    <SCBottomSheet open={open} onClose={onClose} maxWidth={520}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 18,
      }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 620,
            color: 'var(--sc-ink)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Add teacher
          </h2>
          <p style={{
            fontSize: 13,
            color: 'var(--sc-ink-3)',
            lineHeight: 1.45,
            margin: '4px 0 0',
          }}>
            Create one private link for this teacher.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close add teacher"
          className="sc-icon-button sc-tap"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: 'none',
            background: 'var(--sc-soft)',
            color: 'var(--sc-ink-3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        <Field label="Teacher name" value={name} onChange={setName} placeholder="Mrs. Khumalo" autoFocus />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Grade" value={grade} onChange={setGrade} placeholder="Grade 4" />
          <Field label="Class" value={className} onChange={setClassName} placeholder="4B" />
        </div>

        <Field label="Email" value={email} onChange={setEmail} placeholder="teacher@school.com" type="email" inputMode="email" />

        <div style={{
          marginTop: 2,
          padding: '12px 13px',
          borderRadius: 18,
          background: 'var(--sc-soft)',
          color: 'var(--sc-ink-3)',
          fontSize: 12.8,
          lineHeight: 1.45,
        }}>
          The teacher link can be copied from the teacher row after creating them.
        </div>

        <SCButton
          type="button"
          onClick={submit}
          disabled={saving}
          fullWidth
          style={{ minHeight: 48, marginTop: 2 }}
        >
          {saving ? 'Creating...' : 'Create teacher'}
        </SCButton>
      </div>
    </SCBottomSheet>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', autoFocus = false, inputMode }: any) {
  return (
    <SCInput
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      inputMode={inputMode}
    />
  )
}

function formatMomentTime(value?: string | null) {
  if (!value) return ''

  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return ''

  const diff = Math.max(0, Date.now() - then)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return 'now'
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`
  if (diff < day) return `${Math.floor(diff / hour)}h ago`
  if (diff < week) return `${Math.floor(diff / day)}d ago`

  return new Date(value).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
  })
}


function reactionLabel(reaction: string) {
  if (reaction === 'heart') return 'Loved'
  if (reaction === 'like') return 'Liked'
  if (reaction === 'smile') return 'Smiled'
  return 'Reacted'
}

function reactionIcon(reaction: string) {
  if (reaction === 'heart') return '♡'
  if (reaction === 'like') return '👍'
  if (reaction === 'smile') return '😊'
  return '•'
}

function AdminTeacherMomentsScreen({ teacher, onClose }: any) {
  const [loading, setLoading] = useState(true)
  const [moments, setMoments] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [openImage, setOpenImage] = useState('')
  const [reactionMoment, setReactionMoment] = useState<any>(null)
  const [renderLimit, setRenderLimit] = useState(3)

  useEffect(() => {
    let cancelled = false

    async function loadTeacherMoments() {
      setLoading(true)

      try {
        const res = await fetch(`/api/school/teacher-moments?teacher_id=${encodeURIComponent(teacher.id)}&_=${Date.now()}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Could not load teacher Moments')

        if (!cancelled) {
          setMoments(json.moments || [])
          setSummary(json.summary || null)
        }
      } catch (error: any) {
        if (!cancelled) toast.error(error.message || 'Could not load teacher Moments')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTeacherMoments()

    return () => {
      cancelled = true
    }
  }, [teacher?.id])



  // admin-moments-progressive-v427
  useEffect(() => {
    setRenderLimit(3)
  }, [teacher?.id, moments.length])

  useEffect(() => {
    if (loading || renderLimit >= moments.length) return

    const id = window.setTimeout(() => {
      setRenderLimit(value => Math.min(value + 2, moments.length))
    }, 180)

    return () => window.clearTimeout(id)
  }, [loading, renderLimit, moments.length])

  const renderedAdminMoments = moments.slice(0, renderLimit)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <main
      className="sc-screen-enter sc-admin-teacher-moments-screen-v418"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9200,
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        background: T.bg,
        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
        color: T.ink,
        overscrollBehavior: 'none',
      }}
    >
      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <SCTopBar
          title="Moments"
          align="left"
          compact
          left={
            <SCIconButton label="Back" onClick={onClose} tone="quiet" size={38}>
              <span style={{
                width: 13,
                height: 13,
                borderLeft: '2.6px solid currentColor',
                borderBottom: '2.6px solid currentColor',
                borderRadius: 1.5,
                transform: 'rotate(45deg) translate(1px, -1px)',
                display: 'block',
              }} />
            </SCIconButton>
          }
          right={
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 28,
              padding: '0 10px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--sc-ink-3)',
              fontSize: 11.5,
              fontWeight: 560,
              whiteSpace: 'nowrap',
            }}>
              Admin view
            </span>
          }
        />

        <section
          data-admin-teacher-moments-scroll-v418="true"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 16px calc(20px + env(safe-area-inset-bottom, 0px))',
            background: T.bg,
            overscrollBehavior: 'contain',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[0, 1].map((item) => (
                <div key={item} style={{ display: 'grid', gridTemplateColumns: '38px 1fr', gap: 10 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 14, background: T.accentSoft }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', width: '44%', height: 12, borderRadius: 999, background: T.soft }} />
                    <span style={{ display: 'block', width: '28%', height: 9, borderRadius: 999, background: T.soft, marginTop: 8 }} />
                    <span style={{ display: 'block', width: '100%', height: 210, borderRadius: 18, background: T.soft, marginTop: 14 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : moments.length === 0 ? (
            <SCEmptyState
              title="No Moments shared yet"
              text="When this teacher shares a Moment with parents, it will appear here for school review."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {renderedAdminMoments.map((moment, index) => (
                <AdminTeacherMomentPost
                  key={moment.id}
                  moment={moment}
                  teacher={teacher}
                  isLast={index === renderedAdminMoments.length - 1}
                  onImage={setOpenImage}
                  onReactions={() => setReactionMoment(moment)}
                  imageIndex={index}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {reactionMoment && (
        <AdminReactionSheet
          moment={reactionMoment}
          onClose={() => setReactionMoment(null)}
        />
      )}

      {openImage && createPortal(
        <div
          data-admin-moments-fullscreen-lightbox-v427="true"
          onClick={() => setOpenImage('')}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            width: '100vw',
            height: '100dvh',
            background: 'rgba(2, 6, 23, 0.94)',
            backdropFilter: 'blur(7px)',
            WebkitBackdropFilter: 'blur(7px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'calc(18px + env(safe-area-inset-top, 0px)) 14px calc(18px + env(safe-area-inset-bottom, 0px))',
            boxSizing: 'border-box',
            overscrollBehavior: 'contain',
            touchAction: 'none',
          }}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={(event) => {
              event.stopPropagation()
              setOpenImage('')
            }}
            style={{
              position: 'fixed',
              top: 'calc(12px + env(safe-area-inset-top, 0px))',
              right: 14,
              width: 38,
              height: 38,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2147483001,
            }}
          >
            <X size={18} />
          </button>

          <img
            src={openImage}
            alt=""
            decoding="async"
            onClick={event => event.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              maxWidth: '100vw',
              maxHeight: '100dvh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>,
        document.body
      )}
    </main>,
    document.body
  )
}

function AdminTeacherMomentPost({ moment, teacher, isLast, onImage, onReactions, imageIndex = 0 }: any) {
  const teacherName = teacher?.name || 'Teacher'
  const isPrivate = moment.share_mode === 'child'
  const isImage = moment.file_type === 'image'
  const reactionTotal = Number(moment.reaction_count || 0)
  // admin-image-fade-v427
  const [imageReady, setImageReady] = useState(false)

  return (
    <article style={{
      display: 'grid',
      gridTemplateColumns: '38px 1fr',
      gap: 10,
      padding: '0 0 22px',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      background: 'transparent',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: teacher?.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 560,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {!teacher?.photo_url && initials(teacherName)}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <p style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.8,
            fontWeight: 560,
            color: T.ink,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {teacherName}
            <span style={{ color: T.ink3, fontSize: 11.5, fontWeight: 520, marginLeft: 5 }}>
              · {isPrivate ? 'Shared with parent' : 'Shared with class'}
            </span>
          </p>

          <span style={{ fontSize: 10.8, color: T.ink3, fontWeight: 520, whiteSpace: 'nowrap', lineHeight: 1.4, marginTop: 1 }}>
            {formatMomentTime(moment.created_at)}
          </span>
        </div>

        {moment.note ? (
          <p style={{ fontSize: 13.6, color: T.ink2, lineHeight: 1.5, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>
            {moment.note}
          </p>
        ) : null}

        <div style={{ marginTop: 12 }}>
          {isImage ? (
            <button
              type="button"
              onClick={() => onImage(moment.file_url)}
              style={{
                display: 'inline-flex',
                width: 'fit-content',
                maxWidth: '100%',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'zoom-in',
                fontFamily: 'inherit',
                textAlign: 'left',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
              }}
            >
              <img
                src={moment.file_url}
                alt=""
                loading={imageIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setImageReady(true)}
                style={{
                  width: 'auto',
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 360,
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  display: 'block',
                  borderRadius: 18,
                  background: 'transparent',
                  opacity: imageReady ? 1 : 0,
                  transition: 'opacity 220ms ease',
                }}
              />
            </button>
          ) : (
            <a
              href={moment.file_url}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                maxWidth: 390,
                padding: 13,
                borderRadius: 20,
                background: T.soft,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: T.ink,
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                background: T.accentSoft,
                color: T.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <FileText size={19} strokeWidth={1.8} />
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13.5, fontWeight: 560, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {moment.file_name || 'Document'}
                </p>
                <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
                  Open document
                </p>
              </div>
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onReactions}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 13,
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
            color: T.ink3,
          }}
        >
          <AdminReactionCount Icon={Heart} value={moment.reaction_counts?.heart || 0} active={moment.reaction_counts?.heart > 0} tone="#E25563" />
          <AdminReactionCount Icon={ThumbsUp} value={moment.reaction_counts?.like || 0} active={moment.reaction_counts?.like > 0} tone="#3B82F6" />
          <AdminReactionCount Icon={Smile} value={moment.reaction_counts?.smile || 0} active={moment.reaction_counts?.smile > 0} tone="#F59E0B" fillOpacity={0.18} />

          <span style={{ fontSize: 12.2, color: T.ink3, marginLeft: 2 }}>
            {reactionTotal > 0 ? `${reactionTotal} reactions` : ''}
          </span>
        </button>
      </div>
    </article>
  )
}

function AdminReactionSheet({ moment, onClose }: any) {
  const reactions = moment.reactions || []

  return (
    <SCBottomSheet open={true} onClose={onClose} maxWidth={520}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 620, color: 'var(--sc-ink)', margin: 0 }}>
            Reactions
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--sc-ink-3)', margin: '3px 0 0' }}>
            Parents who reacted to this Moment.
          </p>
        </div>

        <button type="button" onClick={onClose} aria-label="Close" className="sc-icon-button" style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          border: 'none',
          background: 'var(--sc-soft)',
          color: 'var(--sc-ink-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}>
          <X size={16} />
        </button>
      </div>

      {reactions.length === 0 ? (
        <SCEmptyState title="No reactions yet" text="Parent reactions will appear here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reactions.map((item: any, index: number) => (
            <div key={`${item.child_id}-${item.reaction}-${index}`} style={{
              padding: '12px 0',
              borderBottom: index === reactions.length - 1 ? 'none' : '1px solid var(--sc-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 14,
                background: 'var(--sc-soft-2)',
                color: 'var(--sc-ink-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 560,
                flexShrink: 0,
              }}>
                {initials(item.child?.name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13.8,
                  fontWeight: 540,
                  color: 'var(--sc-ink)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.child?.name || 'Parent'}
                </p>

                <p style={{
                  fontSize: 12.2,
                  color: 'var(--sc-ink-3)',
                  margin: '2px 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.parent_whatsapp || item.parent_email || 'Parent contact hidden'}
                </p>
              </div>

              <span style={{
                minHeight: 30,
                borderRadius: 999,
                background: 'var(--sc-soft)',
                color: 'var(--sc-ink-2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '0 10px',
                fontSize: 12.2,
                fontWeight: 540,
                flexShrink: 0,
              }}>
                <span>{reactionIcon(item.reaction)}</span>
                {reactionLabel(item.reaction)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SCBottomSheet>
  )
}

function AdminReactionCount({ Icon, value, active, tone = T.accent, fillOpacity = 1 }: any) {
  return (
    <span style={{
      minWidth: 40,
      height: 40,
      borderRadius: 999,
      border: 'none',
      background: 'transparent',
      color: active ? tone : T.ink3,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      padding: '0 7px',
      fontSize: 13,
      fontWeight: 560,
    }}>
      <Icon
        size={19}
        strokeWidth={active ? 2.25 : 2}
        fill={active ? tone : 'none'}
        fillOpacity={active ? fillOpacity : 1}
      />
      {Number(value) > 0 ? <span>{value}</span> : null}
    </span>
  )
}
