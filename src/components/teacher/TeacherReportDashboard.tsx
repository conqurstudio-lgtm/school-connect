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
