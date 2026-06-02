// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronDown,
  Copy,
  GraduationCap,
  LogOut,
  Plus,
  Settings,
  Eye,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { TeacherMomentComposer } from '@/components/teacher/TeacherMomentComposer'
import { TeacherMomentsPage } from '@/components/teacher/TeacherMomentsPage'
import { SchoolConnectLoader, SchoolConnectPageLoader } from '@/components/ui/SchoolConnectLoader'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  soft2: '#F4F5F5',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
  white: '#FFFFFF',
  red: '#B42318',
  green: '#5B8F7F',
}

function TeacherPhotoAdjustModal({ draft, onCancel, onApply, uploading }: any) {
  const [zoom, setZoom] = useState(1.18)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<any>(null)

  const cropSize = 230
  const outputSize = 512

  useEffect(() => {
    return () => {
      dragRef.current = null
    }
  }, [])

  const startDrag = (event: any) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: offset.x,
      initialY: offset.y,
    }
  }

  const moveDrag = (event: any) => {
    if (!dragRef.current) return

    const nextX = dragRef.current.initialX + (event.clientX - dragRef.current.startX)
    const nextY = dragRef.current.initialY + (event.clientY - dragRef.current.startY)
    const max = 64

    setOffset({
      x: Math.max(-max, Math.min(max, nextX)),
      y: Math.max(-max, Math.min(max, nextY)),
    })
  }

  const stopDrag = () => {
    dragRef.current = null
  }

  const createCroppedBlob = async () => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = draft.previewUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare logo image')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)

    const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight)
    const scale = baseScale * zoom
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const outputOffsetX = offset.x * (outputSize / cropSize)
    const outputOffsetY = offset.y * (outputSize / cropSize)

    const dx = (outputSize - drawWidth) / 2 + outputOffsetX
    const dy = (outputSize - drawHeight) / 2 + outputOffsetY

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Could not crop photo'))
        else resolve(blob)
      }, 'image/jpeg', 0.92)
    })
  }

  const apply = async () => {
    const blob = await createCroppedBlob()
    await onApply(blob)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: 'rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: T.white,
        borderRadius: 24,
        border: 'none',
        padding: 16,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: 0 }}>
            Adjust profile photo
          </p>
          <p style={{ fontSize: 12.8, color: T.ink3, lineHeight: 1.45, margin: '4px 0 0' }}>
            Zoom and drag until it fits the square.
          </p>
        </div>

        <div
          style={{
            width: cropSize,
            height: cropSize,
            borderRadius: 32,
            overflow: 'hidden',
            margin: '0 auto',
            background: T.soft,
            border: `1px dashed ${T.border}`,
            position: 'relative',
            touchAction: 'none',
            cursor: 'grab',
          }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <img
            src={draft.previewUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.4, color: T.ink3, fontWeight: 600 }}>Zoom</span>
            <button type="button" onClick={() => {
              setZoom(1.18)
              setOffset({ x: 0, y: 0 })
            }} style={{
              minHeight: 44,
              border: 'none',
              background: T.soft,
              color: T.ink2,
              borderRadius: 999,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 540,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}>
              Reset
            </button>
          </div>

          <input
            type="range"
            min="1"
            max="2.8"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onCancel} disabled={false} style={{
            ...softButton,
            minHeight: 44,
            opacity: uploading ? 0.65 : 1,
          }}>
            Cancel
          </button>

          <button type="button" onClick={apply} disabled={false} style={{
              minHeight: 44,
            ...primaryButton,
            minHeight: 44,
            opacity: uploading ? 0.65 : 1,
          }}>
            {uploading ? 'Saving...' : 'Apply photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeacherSafeAreaStyle() {
  return (
    <style>{`
      html,
      body,
      #__next,
      [data-nextjs-root] {
        background: #FFFFFF !important;
      }

      body {
        margin: 0;
        overscroll-behavior-y: none;
      }

      .teacher-safe-screen {
        background: #FFFFFF !important;
        isolation: isolate;
      }

      .teacher-safe-screen::before,
      .teacher-safe-screen::after {
        content: '';
        position: fixed;
        left: 0;
        right: 0;
        background: #FFFFFF;
        pointer-events: none;
        z-index: 0;
      }

      .teacher-safe-screen::before {
        top: 0;
        height: env(safe-area-inset-top, 0px);
      }

      .teacher-safe-screen::after {
        bottom: 0;
        height: env(safe-area-inset-bottom, 0px);
      }
    `}</style>
  )
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

const primaryButton: any = {
  minHeight: 42,
  borderRadius: 999,
  border: 'none',
  background: T.ink,
  color: T.white,
  fontSize: 13,
  fontWeight: 560,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 15px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const darkButton: any = {
  ...primaryButton,
  background: T.ink,
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

function initials(name?: string) {
  return String(name || '?')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function weekStartToday() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function formatShortDate(value?: string | null) {
  if (!value) return 'No report yet'
  try {
    return new Date(value).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'No report yet'
  }
}

function formatWeek(value?: string | null) {
  if (!value) return 'No week'
  try {
    return new Date(value).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return String(value)
  }
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isMarkedThisWeek(child: any, weekStart: string) {
  return child.latest_week_starting === weekStart
}

function averageScore(scores: any) {
  const values = Object.values(scores || {}).map(Number).filter(n => Number.isFinite(n))
  if (!values.length) return null
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function TeacherReportDashboard({ initialSession = null, initialToken = '' }: any) {
  const [session, setSession] = useState(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [photoDraft, setPhotoDraft] = useState<any>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showTeacherMoments, setShowTeacherMoments] = useState(false)
  const [showLearnersPage, setShowLearnersPage] = useState(false)
  const [momentSummary, setMomentSummary] = useState({ moments: 0, reactions: 0 })
  const [momentDraft, setMomentDraft] = useState<any>(null)
  const momentFileRef = useRef<HTMLInputElement>(null)
  const [activeChild, setActiveChild] = useState<any>(null)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(weekStartToday())

  const cancelTeacherPhotoAdjust = () => {
    if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)
    setPhotoDraft(null)
  }

  const handleTeacherPhotoSelected = async (file: File) => {
    if (!file) return

    setShowSettings(false)

    if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)

    const previewUrl = URL.createObjectURL(file)
    setPhotoDraft({ file, previewUrl })
  }

  const uploadAdjustedTeacherPhoto = async (blob: Blob) => {
    setUploadingPhoto(true)

    try {
      // The teacher profile-photo API expects a valid image data URL.
      // Send the adjusted canvas blob directly as a JPEG data URL.
      const jpegBlob = blob.type === 'image/jpeg'
        ? blob
        : new Blob([blob], { type: 'image/jpeg' })

      const dataUrl = await blobToDataUrl(jpegBlob)

      if (!dataUrl.startsWith('data:image/')) {
        throw new Error('Invalid photo file')
      }

      const res = await fetch('/api/teacher/profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_url: dataUrl, content_type: 'image/jpeg' }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(json.error || 'Could not update photo')

      setSession((current: any) => {
        if (!current) return current

        return {
          ...current,
          teacher: {
            ...current.teacher,
            photo_url: json.photo_url,
          },
        }
      })

      if (photoDraft?.previewUrl) URL.revokeObjectURL(photoDraft.previewUrl)
      setPhotoDraft(null)
      toast.success('Profile photo updated')
    } catch (error: any) {
      toast.error(error.message || 'Could not update photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const loadStatuses = async (children: any[]) => {
    try {
      const res = await fetch('/api/teacher/report-status', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      const latest = json.latestByChild || {}

      return children.map((child: any) => ({
        ...child,
        ...(latest[child.id] || {}),
      }))
    } catch {
      return children
    }
  }

  const load = async () => {
    try {
      const url = initialToken
        ? `/api/teacher-session?token=${encodeURIComponent(initialToken)}`
        : '/api/teacher-session'

      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json.teacher?.id) {
        setSession(null)
        return
      }

      const mergedChildren = await loadStatuses(json.children || [])

      setSession({
        ...json,
        children: mergedChildren,
      })

      loadMomentSummary()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const signOut = async () => {
    await fetch('/api/teacher-session', { method: 'POST' })
    window.location.href = '/teacher'
  }

  const loadMomentSummary = async () => {
    try {
      const res = await fetch('/api/teacher/moments/list?summary=1', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.summary) {
        setMomentSummary({
          moments: Number(json.summary.moments || 0),
          reactions: Number(json.summary.reactions || 0),
        })
      }
    } catch {
      // Keep dashboard clean if summary is unavailable.
    }
  }

  const handleMomentFileChange = (event: any) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const allowed =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('document')

    if (!allowed) {
      toast.error('Choose an image or document')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Moment file must be under 8 MB')
      return
    }

    setMomentDraft({ file })
  }

  if (loading) return <SchoolConnectPageLoader size="md" />

  if (!session?.teacher?.id) {
    return (
      <main style={centerPage}>
        <section style={emptyCard}>
          <GraduationCap size={28} color={T.ink3} />
          <h1 style={emptyTitle}>Teacher link needed</h1>
          <p style={emptyText}>Open the private teacher link shared by the school admin.</p>
        </section>
      </main>
    )
  }

  const { teacher, school, children = [] } = session
  const classLabel = [teacher.grade, teacher.class_name].filter(Boolean).join(' · ') || 'Your class'
  const hasLearners = children.length > 0
  const completedCount = children.filter((child: any) => isMarkedThisWeek(child, weekStart)).length
  const pendingCount = Math.max(0, children.length - completedCount)
  const pendingChildren = children.filter((child: any) => !isMarkedThisWeek(child, weekStart))
  const sentChildren = children.filter((child: any) => isMarkedThisWeek(child, weekStart))

  const openChild = (child: any) => {
    setActiveChild(child)
  }

  const nextPendingAfter = (child: any) => {
    const currentIndex = children.findIndex((c: any) => c.id === child.id)
    const after = children.slice(currentIndex + 1).find((c: any) => !isMarkedThisWeek(c, weekStart))
    const before = children.slice(0, currentIndex).find((c: any) => !isMarkedThisWeek(c, weekStart))
    return after || before || null
  }

  if (showTeacherMoments) {
    return (
      <TeacherMomentsPage
        teacher={teacher}
        onBack={() => setShowTeacherMoments(false)}
        onChanged={(summary: any) => {
          if (summary) {
            setMomentSummary({
              moments: Number(summary.moments || 0),
              reactions: Number(summary.reactions || 0),
            })
          }
        }}
      />
    )
  }

  if (activeChild) {
    return (
      <TeacherReportWorkspace
        child={activeChild}
        children={children}
        weekStart={weekStart}
        onBack={() => setActiveChild(null)}
        onSaved={async (updatedChild: any) => {
          await load()
          setActiveChild((current: any) => current?.id === updatedChild.id ? { ...current, ...updatedChild } : current)
        }}
        onNext={(currentChild: any) => {
          const next = nextPendingAfter(currentChild)
          if (next) setActiveChild(next)
          else setActiveChild(null)
        }}
      />
    )
  }

  if (showLearnersPage) {
    return (
      <>
        <TeacherLearnersPage
          teacher={teacher}
          school={school}
          classLabel={classLabel}
          children={children}
          completedCount={completedCount}
          pendingCount={pendingCount}
          pendingChildren={pendingChildren}
          sentChildren={sentChildren}
          weekStart={weekStart}
          onBack={() => setShowLearnersPage(false)}
          onAdd={() => setShowAdd(true)}
          onOpen={openChild}
          onDeleted={load}
        />

        {showAdd && (
          <AddLearnerSheet
            onClose={() => setShowAdd(false)}
            onCreated={() => {
              setShowAdd(false)
              setShowLearnersPage(true)
              load()
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="teacher-safe-screen" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.white,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
    }}>
      <TeacherSafeAreaStyle />

      {photoDraft && (
        <TeacherPhotoAdjustModal
          draft={photoDraft}
          uploading={uploadingPhoto}
          onCancel={cancelTeacherPhotoAdjust}
          onApply={uploadAdjustedTeacherPhoto}
        />
      )}

      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.white,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 4px',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'transparent',
        }}>
<button
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: T.white,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Settings size={17} strokeWidth={2.05} />
          </button>
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: T.white,
        }}>
          <section style={{
            textAlign: 'center',
            minHeight: 260,
            padding: '28px 18px 26px',
            borderRadius: 28,
            background: T.white,
            border: 'none',
            marginBottom: 14,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: 32,
              background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              color: T.accent,
              fontSize: 25,
              fontWeight: 560,
              overflow: 'hidden',
            }}>
              {!teacher.photo_url && initials(teacher.name)}
            </div>

            <h1 style={{
              fontSize: 22,
              lineHeight: 1.08,
              fontWeight: 560,
              letterSpacing: '-0.045em',
              color: T.ink,
              margin: '0 0 7px',
            }}>
              {teacher.name || 'Teacher'}
            </h1>

            <p style={{
              fontSize: 12.8,
              color: T.ink3,
              lineHeight: 1.35,
              margin: 0,
            }}>
              {school?.name || 'School'} · {classLabel}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 9,
              width: '100%',
              maxWidth: 260,
              marginTop: 20,
            }}>
              <MiniStat label="Sent" value={completedCount} />
              <MiniStat label="Pending" value={pendingCount} />
            </div>
          </section>

          {!hasLearners ? (
            <section style={{
              padding: '30px 16px',
              textAlign: 'center',
              border: `1px dashed ${T.border}`,
              borderRadius: 20,
              background: 'transparent',
              marginBottom: 14,
            }}>
              <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
                No learners yet
              </p>

              <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 15px' }}>
                Add learners to start weekly reports.
              </p>

              <button type="button" onClick={() => setShowAdd(true)} style={{
                ...primaryButton,
                minHeight: 40,
                padding: '0 16px',
              }}>
                Add
              </button>
            </section>
          ) : (
            <>
              <section style={{
                borderRadius: 24,
                background: T.white,
                border: 'none',
                overflow: 'hidden',
                marginBottom: 14,
              }}>
                <div style={{
                  width: '100%',
                  background: T.white,
                  border: 'none',
                  padding: 15,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}>
                  <button
                    type="button"
                    onClick={() => setShowLearnersPage(true)}
                    aria-label={rosterOpen ? 'Hide checklist' : 'Show checklist'}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      border: 'none',
                      background: T.accentSoft,
                      color: T.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <Users size={18} strokeWidth={1.7} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLearnersPage(true)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 540, color: T.ink, margin: 0 }}>
                      Weekly checklist
                    </p>
                    <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
                      {completedCount}/{children.length} reports sent
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    style={{
                      ...softButton,
                      minHeight: 36,
                      padding: '0 13px',
                      color: T.accent,
                      flexShrink: 0,
                    }}
                  >
                    Add
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowLearnersPage(true)}
                    aria-label={rosterOpen ? 'Hide checklist' : 'Show checklist'}
                    style={{
                      width: 34,
                      height: 34,
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
                    <ChevronDown
                      size={16}
                      strokeWidth={1.9}
                      style={{
                        transform: rosterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.16s ease',
                      }}
                    />
                  </button>
                </div>

                {false && rosterOpen && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: '4px 15px 12px' }}>
                    <ChecklistGroup
                      title="Pending reports"
                      items={pendingChildren}
                      weekStart={weekStart}
                      onOpen={openChild}
                      onDeleted={load}
                    />

                    <ChecklistGroup
                      title="Sent reports"
                      items={sentChildren}
                      weekStart={weekStart}
                      onOpen={openChild}
                      onDeleted={load}
                    />
                  </div>
                )}
              </section>

              <section style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 15px',
                borderRadius: 24,
                background: T.white,
                border: 'none',
                marginBottom: 14,
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  background: T.accentSoft,
                  color: T.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Camera size={17} strokeWidth={1.8} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 540, color: T.ink, margin: 0 }}>
                    Private Moments
                  </p>
                  <p style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.35, margin: '2px 0 0' }}>
                    Share private photo/document updates.
                  </p>
                </div>

                <button type="button" onClick={() => momentFileRef.current?.click()} style={{
                  ...softButton,
                  minHeight: 40,
                  padding: '0 15px',
                  color: T.accent,
                  flexShrink: 0,
                }}>
                  Add
                </button>
              </section>
            </>
          )}

          <p style={{
            fontSize: 10.5,
            color: '#B8B8BC',
            textAlign: 'center',
            margin: '18px 0 0',
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>

      <input
        ref={momentFileRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleMomentFileChange}
      />

      {momentDraft && (
        <TeacherMomentComposer
          draft={momentDraft}
          learners={children}
          onClose={() => setMomentDraft(null)}
          onCreated={() => setMomentDraft(null)}
        />
      )}

      {showAdd && (
        <AddLearnerSheet
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            setShowLearnersPage(true)
            load()
          }}
        />
      )}

      {showSettings && (
        <SettingsSheet
          teacher={teacher}
          school={school}
          classLabel={classLabel}
          onClose={() => setShowSettings(false)}
          onUpdated={(updatedTeacher: any) => {
            setSession((current: any) => ({
              ...current,
              teacher: { ...current.teacher, ...updatedTeacher },
            }))
          }}
          onSignOut={signOut}
          onPhotoSelected={handleTeacherPhotoSelected}
        />
      )}
    </div>
  )
}

function TeacherLearnersPage({
  teacher,
  school,
  classLabel,
  children,
  completedCount,
  pendingCount,
  pendingChildren,
  sentChildren,
  weekStart,
  onBack,
  onAdd,
  onOpen,
  onDeleted,
}: any) {
  const hasLearners = children?.length > 0

  return (
    <div className="teacher-safe-screen" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.white,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
    }}>
      <TeacherSafeAreaStyle />

      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.white,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
        }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: 'none',
              background: T.white,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{
              width: 13,
              height: 13,
              borderLeft: '2.6px solid currentColor',
              borderBottom: '2.6px solid currentColor',
              borderRadius: 1.5,
              transform: 'rotate(45deg) translate(1px, -1px)',
              display: 'block',
            }} />
          </button>

          <button
            type="button"
            onClick={onAdd}
            aria-label="Add learner"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              color: '#252525',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Plus size={20} strokeWidth={2.05} />
          </button>
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: T.white,
        }}>
          <section style={{
            padding: '18px 0 24px',
          }}>
            <h1 style={{
              fontSize: 26,
              lineHeight: 1.05,
              fontWeight: 560,
              letterSpacing: '-0.05em',
              color: T.ink,
              margin: 0,
            }}>
              Reports
            </h1>
          </section>

          {!hasLearners ? (
            <section style={{
              padding: '30px 16px',
              textAlign: 'center',
              border: `1px dashed ${T.border}`,
              borderRadius: 20,
              background: 'transparent',
              marginTop: 0,
            }}>
              <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
                No learners yet
              </p>

              <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 15px' }}>
                Add learners to start weekly reports.
              </p>

              <button type="button" onClick={onAdd} style={{
                ...primaryButton,
                minHeight: 42,
                padding: '0 18px',
              }}>
                Add
              </button>
            </section>
          ) : (
            <section style={{
              borderRadius: 24,
              background: T.white,
              border: 'none',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '4px 15px 12px' }}>
                <ChecklistGroup
                  title="Pending reports"
                  items={pendingChildren}
                  weekStart={weekStart}
                  onOpen={onOpen}
                  onDeleted={onDeleted}
                />

                <ChecklistGroup
                  title="Sent reports"
                  items={sentChildren}
                  weekStart={weekStart}
                  onOpen={onOpen}
                  onDeleted={onDeleted}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: any) {
  return (
    <div style={{
      padding: '10px 8px',
      borderRadius: 17,
      background: T.soft,
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 18, fontWeight: 560, color: T.ink, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: 11.5, color: T.ink3, margin: '2px 0 0' }}>
        {label}
      </p>
    </div>
  )
}

function LoadingScreen() {
  return <SchoolConnectPageLoader size="md" />
}

function EmptyRoster({ onAdd }: any) {
  return (
    <div style={{
      padding: '30px 16px',
      textAlign: 'center',
      border: `1px dashed ${T.border}`,
      borderRadius: 16,
      background: 'transparent',
      marginTop: 10,
    }}>
      <p style={{ fontSize: 14.5, fontWeight: 540, color: T.ink, margin: '0 0 4px' }}>
        No learners yet
      </p>
      <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
        Tap Add to create your roster.
      </p>
    </div>
  )
}

function ChecklistGroup({ title, items, weekStart, onOpen, onDeleted }: any) {
  if (!items?.length) return null

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '4px 0 2px',
      }}>
        <div>
          <p style={{
            fontSize: 12.5,
            fontWeight: 560,
            color: T.ink,
            margin: 0,
          }}>
            {title}
          </p>
        </div>

        <span style={{
          minWidth: 26,
          height: 24,
          borderRadius: 999,
          background: T.soft,
          color: T.ink3,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 560,
        }}>
          {items.length}
        </span>
      </div>

      {items.map((child: any, index: number) => (
        <LearnerRow
          key={child.id}
          child={child}
          weekStart={weekStart}
          isLast={index === items.length - 1}
          onOpen={() => onOpen(child)}
          onDeleted={onDeleted}
        />
      ))}
    </div>
  )
}

function LearnerRow({ child, weekStart, isLast, onOpen, onDeleted }: any) {
  const done = isMarkedThisWeek(child, weekStart)

  const remove = async () => {
    if (!confirm(`Remove ${child.name} from your roster?`)) return

    const tid = toast.loading('Removing learner...')
    try {
      const res = await fetch(`/api/teacher?id=${encodeURIComponent(child.id)}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not remove learner')
      toast.success('Learner removed', { id: tid })
      onDeleted()
    } catch (e: any) {
      toast.error(e.message || 'Could not remove learner', { id: tid })
    }
  }

  return (
    <article style={{
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <button
        type="button"
        onClick={onOpen}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          background: 'transparent',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 14,
          background: done ? T.accentSoft : T.soft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: done ? T.accent : T.ink2,
          fontSize: 12,
          fontWeight: 540,
          flexShrink: 0,
        }}>
          {initials(child.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13.8,
            fontWeight: 540,
            color: T.ink,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {child.name}
          </p>
          <p style={{
            fontSize: 12.2,
            color: done ? T.green : T.ink3,
            margin: '2px 0 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {done ? 'Sent this week' : 'Pending this week'}
          </p>
        </div>
      </button>

      <button type="button" onClick={onOpen} style={{
        ...softButton,
        minHeight: 32,
        padding: '0 12px',
        fontSize: 12.5,
      }}>
        Open
      </button>

      <button type="button" onClick={remove} style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        border: 'none',
        background: T.white,
        color: T.red,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        <Trash2 size={13} strokeWidth={1.8} />
      </button>
    </article>
  )
}

function ReportLinkedSafeAreaStyle() {
  return (
    <style>{`
      html,
      body {
        background: #FFFFFF !important;
      }

      .report-linked-screen {
        background: #FFFFFF;
      }

      .report-linked-screen::before,
      .report-linked-screen::after {
        content: "";
        position: fixed;
        left: 0;
        right: 0;
        background: #FFFFFF;
        pointer-events: none;
        z-index: 0;
      }

      .report-linked-screen::before {
        top: 0;
        height: env(safe-area-inset-top, 0px);
      }

      .report-linked-screen::after {
        bottom: 0;
        height: env(safe-area-inset-bottom, 0px);
      }
    `}</style>
  )
}

function TeacherReportWorkspace({ child, children, weekStart, onBack, onSaved, onNext }: any) {
  const subjects = ['Mathematics', 'English', 'Life Skills', 'Behaviour']
  const [week, setWeek] = useState(weekStart)
  const [scores, setScores] = useState<Record<string, number>>({
    Mathematics: 3,
    English: 3,
    'Life Skills': 3,
    Behaviour: 3,
  })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    setWeek(weekStart)
    setScores({ Mathematics: 3, English: 3, 'Life Skills': 3, Behaviour: 3 })
    setComment('')
    setMagicLink('')
    setHistoryLoading(true)

    fetch(`/api/teacher/report-history?child_id=${encodeURIComponent(child.id)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        setHistory(json.reports || [])
        if (json.magic_link) setMagicLink(json.magic_link)
      })
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [child.id, weekStart])

  const submit = async () => {
    if (saving) return

    setSaving(true)
    const tid = toast.loading('Sending report...')

    try {
      const res = await fetch('/api/teacher/child-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: child.id,
          week_starting: week,
          scores,
          comment: comment.trim(),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not send report')

      if (json.magic_link) setMagicLink(json.magic_link)

      const updatedChild = {
        ...child,
        latest_week_starting: week,
        latest_report_at: new Date().toISOString(),
      }

      toast.success('Report sent', { id: tid })
      await onSaved(updatedChild)

      setHistory((current) => [
        json.report,
        ...current.filter((item) => item.id !== json.report?.id),
      ].filter(Boolean))
    } catch (e: any) {
      toast.error(e.message || 'Could not send report', { id: tid })
    }

    setSaving(false)
  }

  const copyLink = async () => {
    if (!magicLink) {
      toast.error('Save a report first')
      return
    }

    await navigator.clipboard.writeText(magicLink)
    toast.success('Parent link copied')
  }

  return (
    <div className="teacher-safe-screen" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: '#FFFFFF',
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
    }}>
      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px',
          background: T.white,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={onBack} style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: 'none',
              background: '#FFFFFF',
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <ArrowLeft size={16} />
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13.5,
                fontWeight: 560,
                color: T.ink,
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {child.name}
              </p>
              <p style={{ fontSize: 12, color: T.ink3, margin: '1px 0 0' }}>
                Weekly report
              </p>
            </div>
          </div>
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: T.white,
        }}>
          <section style={{
            borderRadius: 28,
            background: '#FFFFFF',
            border: 'none',
            padding: 18,
            marginBottom: 14,
          }}>
            <label>
              <span style={labelStyle}>Week starting</span>
              <input type="date" value={week} onChange={e => setWeek(e.target.value)} style={inputStyle} />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 18 }}>
              {subjects.map(subject => (
                <div key={subject}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 7,
                  }}>
                    <span style={{ fontSize: 13.5, fontWeight: 560, color: T.ink }}>
                      {subject}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 540, color: T.ink3 }}>
                      {scores[subject]}/5
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(score => {
                      const active = scores[subject] === score
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setScores(prev => ({ ...prev, [subject]: score }))}
                          style={{
                            height: 38,
                            borderRadius: 999,
                            border: active ? 'none' : `1px solid ${T.border}`,
                            background: active ? T.accent : T.white,
                            color: active ? T.white : T.ink2,
                            fontSize: 13,
                            fontWeight: 540,
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
          </section>

          <section style={{
            borderRadius: 24,
            background: T.white,
            border: 'none',
            padding: 16,
            marginBottom: 14,
          }}>
            <label>
              <span style={labelStyle}>Teacher note optional</span>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={5}
                placeholder="Add a short note, or leave empty for an automatic comment."
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
              />
            </label>
          </section>

          <section style={{
            borderRadius: 24,
            background: T.white,
            border: 'none',
            padding: 16,
            marginBottom: 14,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              marginBottom: 10,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
                  Previous reports
                </p>
                <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
                  Recent history for this child.
                </p>
              </div>
            </div>

            {historyLoading ? (
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>Loading history...</p>
            ) : history.length === 0 ? (
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>No previous reports yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.slice(0, 4).map((report: any) => (
                  <HistoryCard key={report.id} report={report} />
                ))}
              </div>
            )}
          </section>
        </main>

        <footer style={{
          flexShrink: 0,
          padding: '10px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
          display: 'grid',
          gridTemplateColumns: '1fr 46px',
          gap: 8,
          alignItems: 'center',
          background: T.white,
        }}>
          <button type="button" onClick={submit} disabled={saving} style={{
            ...darkButton,
            width: '100%',
            opacity: saving ? 0.65 : 1,
            cursor: saving ? 'wait' : 'pointer',
          }}>
            {saving ? 'Sending...' : 'Send report'}
          </button>

          <button
            type="button"
            onClick={copyLink}
            aria-label="Copy parent link"
            style={{
              width: 46,
              height: 42,
              borderRadius: 999,
              border: 'none',
              background: T.white,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Copy size={16} strokeWidth={1.8} />
          </button>
        </footer>
      </div>
    </div>
  )
}

function HistoryCard({ report }: any) {
  const avg = averageScore(report.scores)

  return (
    <div style={{
      padding: '10px 0',
      borderTop: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 10,
        alignItems: 'center',
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.2, fontWeight: 540, color: T.ink, margin: 0 }}>
            {formatWeek(report.week_starting)}
          </p>
          <p style={{
            fontSize: 12.2,
            color: T.ink3,
            margin: '2px 0 0',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            maxWidth: 260,
          }}>
            {report.comment || 'Weekly update sent.'}
          </p>
        </div>

        <div style={{
          minWidth: 42,
          height: 28,
          borderRadius: 999,
          background: T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.5,
          fontWeight: 560,
        }}>
          {avg ? avg.toFixed(1) : '-'}
        </div>
      </div>
    </div>
  )
}

function SettingsSheet({ teacher, school, classLabel, onClose, onUpdated, onSignOut, onPhotoSelected }: any) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handlePhoto = async (event: any) => {
    const file = event.target.files?.[0]

    if (!file) return

    event.target.value = ''
    onClose()
    onPhotoSelected?.(file)
  }

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader title="Settings" subtitle="Profile and account" onClose={onClose} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 20,
        background: T.soft,
        marginBottom: 12,
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 560,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {!teacher.photo_url && initials(teacher.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
            {teacher.name || 'Teacher'}
          </p>
          <p style={{
            fontSize: 12.5,
            color: T.ink3,
            margin: '2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {school?.name || 'School'} · {classLabel}
          </p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />

      <button
        type="button"
        disabled={false}
        onClick={() => fileRef.current?.click()}
        style={{
          ...softButton,
          width: '100%',
          justifyContent: 'flex-start',
          height: 44,
          border: 'none',
          background: T.white,
          opacity: uploading ? 0.65 : 1,
        }}
      >
        <Camera size={15} strokeWidth={1.8} />
        Change profile photo
      </button>

      <button
        type="button"
        onClick={onSignOut}
        style={{
          ...softButton,
          width: '100%',
          justifyContent: 'flex-start',
          height: 44,
          border: 'none',
          background: T.white,
          color: T.red,
          marginTop: 8,
        }}
      >
        <LogOut size={15} strokeWidth={1.8} />
        Sign out
      </button>
    </BottomSheet>
  )
}

function AddLearnerSheet({ onClose, onCreated }: any) {
  const [name, setName] = useState('')
  const [parentWhatsapp, setParentWhatsapp] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) return toast.error('Child name is required')
    if (!parentWhatsapp.trim()) return toast.error('Parent WhatsApp number is required')

    setSaving(true)
    const tid = toast.loading('Adding learner...')

    try {
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          parent_whatsapp: parentWhatsapp.trim(),
          parent_email: parentEmail.trim() || null,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not add learner')

      toast.success('Learner added', { id: tid })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Could not add learner', { id: tid })
    }

    setSaving(false)
  }

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader title="Add learner" subtitle="Only the details needed for parent updates." onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <span style={labelStyle}>Child name</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Maya Dlamini" style={inputStyle} />
        </label>

        <label>
          <span style={labelStyle}>Parent WhatsApp number</span>
          <input value={parentWhatsapp} onChange={e => setParentWhatsapp(e.target.value)} placeholder="+27..." style={inputStyle} />
        </label>

        <label>
          <span style={labelStyle}>Parent email optional</span>
          <input value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="parent@email.com" type="email" style={inputStyle} />
        </label>

        <button type="button" onClick={submit} disabled={saving} style={{
          ...darkButton,
          width: '100%',
          marginTop: 4,
          opacity: saving ? 0.65 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}>
          {saving ? 'Saving...' : 'Save learner'}
        </button>
      </div>
    </BottomSheet>
  )
}

function BottomSheet({ children, onClose }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      background: 'rgba(0,0,0,0.30)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '90dvh',
        overflowY: 'auto',
        background: T.white,
        borderRadius: '24px 24px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
      }}>
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ title, subtitle, onClose }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.ink3, margin: '3px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>

      <button type="button" onClick={onClose} style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: 'none',
        background: T.soft,
        color: T.ink3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}>
        <X size={16} />
      </button>
    </div>
  )
}

const centerPage: any = {
  minHeight: '100dvh',
  background: T.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
}

const emptyCard: any = {
  width: '100%',
  maxWidth: 360,
  textAlign: 'center',
  background: T.white,
  border: 'none',
  borderRadius: 24,
  padding: '34px 24px',
}

const emptyTitle: any = {
  fontSize: 20,
  fontWeight: 600,
  color: T.ink,
  margin: '14px 0 6px',
}

const emptyText: any = {
  fontSize: 14,
  color: T.ink3,
  lineHeight: 1.5,
  margin: 0,
}
