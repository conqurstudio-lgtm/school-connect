// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, MoreVertical, Plus, RotateCw, Slash, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

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

export function TeachersTab() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/teachers')
      const json = await res.json()
      setTeachers(json.teachers ?? [])
    } catch {
      toast.error('Could not load teachers')
    }

    setLoading(false)
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
    setOpenMenu(null)

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
    setOpenMenu(null)

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

  if (loading) {
    return (
      <div style={{ padding: '34px 0', textAlign: 'center' }}>
        <style>{`
          @keyframes schoolDotBounce {
            0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 24,
        }}>
          {[0, 1, 2].map(dot => (
            <span key={dot} style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: dot === 1 ? T.accent : '#D8DFDD',
              animation: 'schoolDotBounce 1.05s ease-in-out infinite',
              animationDelay: `${dot * 0.14}s`,
              display: 'block',
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      paddingTop: teachers.length ? 4 : 10,
      background: T.white,
      overflow: 'visible',
      position: 'relative',
      zIndex: 30,
    }}>
      {teachers.length === 0 ? (
        <div style={{
          padding: '30px 16px',
          textAlign: 'center',
          border: `1px dashed ${T.border}`,
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

          <button type="button" onClick={() => setShowAdd(true)} style={{
            ...primaryButton,
            minHeight: 38,
          }}>
            <Plus size={14} strokeWidth={2} />
            Add teacher
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'visible', position: 'relative', zIndex: 30 }}>
          {teachers.map((teacher, index) => (
            <TeacherRow
              key={teacher.id}
              teacher={teacher}
              isLast={index === teachers.length - 1}
              copiedId={copiedId}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              onCopy={copyLink}
              onRevoke={() => updateTeacher(teacher.id, 'revoke')}
              onReactivate={() => updateTeacher(teacher.id, 'reactivate')}
              onRotate={() => updateTeacher(teacher.id, 'rotate')}
              onDelete={() => deleteTeacher(teacher.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddTeacherSheet
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
  openMenu,
  setOpenMenu,
  onCopy,
  onRevoke,
  onReactivate,
  onRotate,
  onDelete,
}: any) {
  const t = teacher as Teacher
  const isMenu = openMenu === t.id
  const isCopied = copiedId === t.id
  const isActive = t.status === 'active'

  return (
    <article style={{
      padding: '12px 0',
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      position: 'relative',
      overflow: 'visible',
      zIndex: isMenu ? 80 : 1,
      opacity: isActive ? 1 : 0.62,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: 14,
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
          fontSize: 13.8,
          fontWeight: 540,
          color: T.ink,
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {t.name}
        </p>

        <p style={{
          fontSize: 12.2,
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
            width: 34,
            height: 34,
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
        onClick={() => setOpenMenu(isMenu ? null : t.id)}
        aria-label="Teacher options"
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
        <MoreVertical size={15} strokeWidth={1.8} />
      </button>

      {isMenu && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 42,
          zIndex: 9999,
          background: T.white,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: '0 14px 38px rgba(0,0,0,0.10)',
          padding: 6,
          minWidth: 178,
          transform: 'translateY(2px)',
          transform: 'translateY(2px)',
        }}>
          <MenuItem onClick={onRotate} Icon={RotateCw} label="Issue new link" />
          {isActive ? (
            <MenuItem onClick={onRevoke} Icon={Slash} label="Revoke access" danger />
          ) : (
            <MenuItem onClick={onReactivate} Icon={Check} label="Reactivate" />
          )}
          <MenuItem onClick={onDelete} Icon={Trash2} label="Delete" danger />
        </div>
      )}
    </article>
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

function AddTeacherSheet({ onClose, onCreated }: any) {
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
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      background: 'rgba(0,0,0,0.30)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '90dvh',
        overflowY: 'auto',
        background: T.white,
        borderRadius: '24px 24px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -18px 48px rgba(0,0,0,0.10)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>
              Add teacher
            </h2>
            <p style={{ fontSize: 13, color: T.ink3, margin: '3px 0 0' }}>
              Create one private teacher link.
            </p>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Teacher name" value={name} onChange={setName} placeholder="Mrs. Khumalo" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Grade" value={grade} onChange={setGrade} placeholder="Grade 4" />
            <Field label="Class optional" value={className} onChange={setClassName} placeholder="4B" />
          </div>

          <Field label="Email optional" value={email} onChange={setEmail} placeholder="teacher@school.com" type="email" />

          <button
            type="button"
            onClick={submit}
            disabled={saving}
            style={{
              ...primaryButton,
              width: '100%',
              marginTop: 4,
              opacity: saving ? 0.65 : 1,
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Creating...' : 'Create teacher'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  )
}
