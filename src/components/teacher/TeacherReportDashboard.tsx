// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import {
  Copy,
  GraduationCap,
  LogOut,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F8F8F9',
  soft2: '#F4F5F5',
  white: '#FFFFFF',
  red: '#B42318',
}

const inputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: '#FFFFFF',
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: any = {
  display: 'block',
  fontSize: 11,
  fontWeight: 650,
  color: T.ink3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const primaryButton: any = {
  minHeight: 44,
  borderRadius: 999,
  border: 'none',
  background: T.ink,
  color: T.white,
  fontSize: 13,
  fontWeight: 620,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 15px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const softButton: any = {
  minHeight: 40,
  borderRadius: 999,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 620,
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

export function TeacherReportDashboard({ initialSession = null, initialToken = '' }: any) {
  const [session, setSession] = useState(initialSession)
  const [loading, setLoading] = useState(!initialSession)
  const [showAdd, setShowAdd] = useState(false)
  const [reportChild, setReportChild] = useState<any>(null)

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

      setSession(json)
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

  if (loading) return <LoadingScreen />

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

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      color: T.ink,
    }}>
      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 8px',
          background: T.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: T.soft,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: T.ink2,
              fontSize: 13,
              fontWeight: 650,
              flexShrink: 0,
            }}>
              {initials(teacher.name)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13.5,
                fontWeight: 620,
                color: T.ink,
                margin: 0,
                lineHeight: 1.08,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {teacher.name || 'Teacher'}
              </p>
              <p style={{
                fontSize: 11.8,
                color: T.ink3,
                margin: '1px 0 0',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {school?.name || 'School'} · {classLabel}
              </p>
            </div>

            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                border: `1px solid ${T.border}`,
                background: T.white,
                color: T.ink3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <LogOut size={14} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
        }}>
          <section style={{
            padding: '20px 2px 18px',
            textAlign: 'left',
          }}>
            <p style={{
              fontSize: 12,
              color: T.ink3,
              fontWeight: 650,
              letterSpacing: '0.055em',
              textTransform: 'uppercase',
              margin: '0 0 6px',
            }}>
              Weekly reports
            </p>

            <h1 style={{
              fontSize: 26,
              lineHeight: 1.05,
              fontWeight: 650,
              letterSpacing: '-0.055em',
              color: T.ink,
              margin: 0,
            }}>
              Send this week’s updates.
            </h1>

            <p style={{
              fontSize: 13.5,
              color: T.ink3,
              lineHeight: 1.48,
              margin: '9px 0 0',
              maxWidth: 360,
            }}>
              Add learners once, then send a simple private report link to each parent.
            </p>
          </section>

          <div style={{
            display: 'grid',
            gridTemplateColumns: hasLearners ? '1fr 1fr' : '1fr',
            gap: 9,
            marginBottom: 16,
          }}>
            <button type="button" onClick={() => setShowAdd(true)} style={{
              ...primaryButton,
              width: '100%',
            }}>
              <Plus size={14} strokeWidth={2.2} />
              Add learner
            </button>

            {hasLearners && (
              <button type="button" onClick={() => setReportChild(children[0])} style={{
                ...softButton,
                width: '100%',
              }}>
                <Send size={14} strokeWidth={2} />
                Start reports
              </button>
            )}
          </div>

          <section style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div>
              <p style={{
                fontSize: 13.5,
                fontWeight: 620,
                color: T.ink,
                margin: 0,
              }}>
                Class roster
              </p>
              <p style={{
                fontSize: 12.5,
                color: T.ink3,
                margin: '2px 0 0',
              }}>
                {children.length === 0 ? 'No learners yet' : `${children.length} learners`}
              </p>
            </div>
          </section>

          {!hasLearners ? (
            <EmptyRoster onAdd={() => setShowAdd(true)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {children.map((child: any) => (
                <LearnerRow
                  key={child.id}
                  child={child}
                  onReport={() => setReportChild(child)}
                  onDeleted={load}
                />
              ))}
            </div>
          )}

          <p style={{
            fontSize: 10.5,
            color: '#CCCCCC',
            textAlign: 'center',
            margin: '18px 0 0',
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>

      {showAdd && (
        <AddLearnerSheet
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false)
            load()
          }}
        />
      )}

      {reportChild && (
        <WeeklyReportSheet
          child={reportChild}
          onClose={() => setReportChild(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <main style={centerPage}>
      <style>{`
        @keyframes teacherDotBounce {
          0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 24,
          margin: '0 auto 14px',
        }}>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: dot === 1 ? '#8FA6A1' : '#D8DFDD',
                animation: 'teacherDotBounce 1.05s ease-in-out infinite',
                animationDelay: `${dot * 0.14}s`,
                display: 'block',
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: 14, color: T.ink3, margin: 0 }}>Opening class space...</p>
      </div>
    </main>
  )
}

function EmptyRoster({ onAdd }: any) {
  return (
    <div style={{
      padding: '42px 20px',
      textAlign: 'center',
      border: `1px dashed ${T.border}`,
      borderRadius: 18,
      background: 'transparent',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 15,
        background: T.soft,
        border: `1px solid ${T.border}`,
        margin: '0 auto 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.ink3,
      }}>
        <Users size={22} strokeWidth={1.6} />
      </div>

      <p style={{ fontSize: 15, fontWeight: 620, color: T.ink, margin: '0 0 4px' }}>
        No learners yet
      </p>

      <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: '0 0 16px' }}>
        Start by adding your class roster.
      </p>

      <button type="button" onClick={onAdd} style={primaryButton}>
        <Plus size={14} strokeWidth={2.2} />
        Add first learner
      </button>
    </div>
  )
}

function LearnerRow({ child, onReport, onDeleted }: any) {
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
      borderBottom: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 11,
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 14,
        background: T.soft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.ink2,
        fontSize: 12.5,
        fontWeight: 650,
        flexShrink: 0,
      }}>
        {initials(child.name)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14,
          fontWeight: 600,
          color: T.ink,
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {child.name}
        </p>
        <p style={{
          fontSize: 12.4,
          color: T.ink3,
          margin: '2px 0 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          Last: {formatShortDate(child.latest_report_at)}
        </p>
      </div>

      <button type="button" onClick={onReport} style={{
        ...softButton,
        minHeight: 34,
        padding: '0 11px',
      }}>
        <Send size={13} strokeWidth={2} />
        Report
      </button>

      <button type="button" onClick={remove} style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: `1px solid ${T.border}`,
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
          ...primaryButton,
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

function WeeklyReportSheet({ child, onClose, onSaved }: any) {
  const subjects = ['Mathematics', 'English', 'Life Skills', 'Behaviour']
  const [week, setWeek] = useState(weekStartToday())
  const [scores, setScores] = useState<Record<string, number>>({
    Mathematics: 3,
    English: 3,
    'Life Skills': 3,
    Behaviour: 3,
  })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [magicLink, setMagicLink] = useState('')

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

      toast.success('Report ready', { id: tid })
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Could not send report', { id: tid })
    }

    setSaving(false)
  }

  const copyLink = async () => {
    if (!magicLink) return
    await navigator.clipboard.writeText(magicLink)
    toast.success('Parent link copied')
  }

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader title="Weekly report" subtitle={child.name} onClose={onClose} />

      <label>
        <span style={labelStyle}>Week starting</span>
        <input type="date" value={week} onChange={e => setWeek(e.target.value)} style={inputStyle} />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 14 }}>
        {subjects.map(subject => (
          <div key={subject}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 7,
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 620, color: T.ink }}>
                {subject}
              </span>
              <span style={{ fontSize: 13, fontWeight: 620, color: T.ink3 }}>
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
                      background: active ? T.ink : T.white,
                      color: active ? T.white : T.ink2,
                      fontSize: 13,
                      fontWeight: 620,
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

      <label style={{ display: 'block', marginTop: 14 }}>
        <span style={labelStyle}>Teacher note optional</span>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          placeholder="Add a short note, or leave empty for an automatic comment."
          style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
        />
      </label>

      <button type="button" onClick={submit} disabled={saving} style={{
        ...primaryButton,
        width: '100%',
        marginTop: 14,
        opacity: saving ? 0.65 : 1,
        cursor: saving ? 'wait' : 'pointer',
      }}>
        <Send size={14} strokeWidth={2} />
        {saving ? 'Sending...' : 'Send report'}
      </button>

      {magicLink && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 18,
          background: T.soft,
          border: `1px solid ${T.border}`,
        }}>
          <p style={{
            fontSize: 12,
            color: T.ink3,
            fontWeight: 650,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            margin: '0 0 7px',
          }}>
            Parent report link
          </p>

          <a
            href={magicLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              fontSize: 13,
              lineHeight: 1.45,
              color: T.ink,
              wordBreak: 'break-all',
              textDecoration: 'none',
              marginBottom: 10,
            }}
          >
            {magicLink}
          </a>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button type="button" onClick={copyLink} style={softButton}>
              <Copy size={14} />
              Copy
            </button>

            <button type="button" onClick={onClose} style={primaryButton}>
              Done
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function BottomSheet({ children, onClose }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
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
        boxShadow: '0 -24px 70px rgba(0,0,0,0.14)',
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
        <h2 style={{ fontSize: 17, fontWeight: 650, color: T.ink, margin: 0 }}>
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
        border: `1px solid ${T.border}`,
        background: T.white,
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
  background: T.bg,
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
  border: `1px solid ${T.border}`,
  borderRadius: 24,
  padding: '34px 24px',
}

const emptyTitle: any = {
  fontSize: 20,
  fontWeight: 650,
  color: T.ink,
  margin: '14px 0 6px',
}

const emptyText: any = {
  fontSize: 14,
  color: T.ink3,
  lineHeight: 1.5,
  margin: 0,
}
