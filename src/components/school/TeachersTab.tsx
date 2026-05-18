// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, MoreVertical, RotateCw, Slash, Trash2, GraduationCap, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  ink4:   '#D8D8D8',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  red:    '#EF4444',
  green:  '#22C55E',
}

interface Teacher {
  id:            string
  name:          string
  email:         string | null
  photo_url:     string | null
  grade:         string
  class_name:    string | null
  access_token:  string
  status:        'active' | 'revoked'
  last_seen_at:  string | null
  created_at:    string
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never opened'
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)         return 'Just now'
  if (min < 60)        return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)         return `${hr}h ago`
  const d = Math.floor(hr / 24)
  if (d < 7)           return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}

function teacherLink(token: string): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/teacher/${token}`
}

export function TeachersTab() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/teachers')
      const json = await res.json()
      setTeachers(json.teachers ?? [])
    } catch (e) {
      toast.error('Could not load teachers')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const copyLink = async (teacher: Teacher) => {
    const url = teacherLink(teacher.access_token)
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(teacher.id)
      toast.success('Link copied')
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const updateTeacher = async (id: string, action: string) => {
    setOpenMenu(null)
    const tid = toast.loading(action === 'rotate' ? 'Generating new link…' : 'Updating…')
    try {
      const res = await fetch('/api/teachers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success(
        action === 'revoke'     ? 'Access revoked' :
        action === 'reactivate' ? 'Reactivated'    :
        action === 'rotate'     ? 'New link issued' : 'Saved',
        { id: tid }
      )
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }
  }

  const deleteTeacher = async (id: string) => {
    setOpenMenu(null)
    if (!confirm('Delete this teacher? This cannot be undone.')) return
    const tid = toast.loading('Deleting…')
    try {
      const res = await fetch(`/api/teachers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('failed')
      toast.success('Teacher deleted', { id: tid })
      load()
    } catch {
      toast.error('Could not delete', { id: tid })
    }
  }

  return (
    <div style={{ padding: '24px 20px 60px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      margin: '0 0 4px' }}>
            Teachers
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.025em', margin: 0 }}>
            Your team
          </h2>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 999,
          background: T.ink, color: T.white, border: 'none',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <Plus size={14} strokeWidth={2.4} />
          Add teacher
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%',
                        border: `2px solid ${T.border}`, borderTopColor: T.ink,
                        animation: 'spin 0.7s linear infinite',
                        margin: '0 auto' }} />
        </div>
      ) : teachers.length === 0 ? (
        <div style={{
          padding: '48px 20px', textAlign: 'center',
          border: `1px dashed ${T.border}`, borderRadius: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: '#F0F0F4',
            margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={22} color={T.ink3} strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: 15, color: T.ink, fontWeight: 600, margin: '0 0 4px' }}>
            No teachers yet
          </p>
          <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 16px', lineHeight: 1.5 }}>
            Add your first teacher to get started.
          </p>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '8px 14px', borderRadius: 999,
            background: T.ink, color: T.white, border: 'none',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Add teacher
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {teachers.map(t => (
            <TeacherRow
              key={t.id}
              teacher={t}
              copiedId={copiedId}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              onCopy={copyLink}
              onRevoke={() => updateTeacher(t.id, 'revoke')}
              onReactivate={() => updateTeacher(t.id, 'reactivate')}
              onRotate={() => updateTeacher(t.id, 'rotate')}
              onDelete={() => deleteTeacher(t.id)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddTeacherModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); load() }}
        />
      )}
    </div>
  )
}

function TeacherRow({ teacher, copiedId, openMenu, setOpenMenu,
                      onCopy, onRevoke, onReactivate, onRotate, onDelete }: any) {
  const t        = teacher as Teacher
  const isMenu   = openMenu === t.id
  const isCopied = copiedId === t.id
  const isActive = t.status === 'active'

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: T.white, border: `1px solid ${T.border}`,
      position: 'relative',
      opacity: isActive ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: t.photo_url ? `url(${t.photo_url}) center/cover` : '#F0F0F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontSize: 14, color: T.ink2, fontWeight: 600,
        }}>
          {!t.photo_url && t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        {/* Name + class */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: T.ink,
                      letterSpacing: '-0.005em', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </p>
          <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
            {t.grade}{t.class_name ? ` · ${t.class_name}` : ''}
            {' · '}
            {isActive ? (
              <span style={{ color: T.green, fontWeight: 500 }}>Active</span>
            ) : (
              <span style={{ color: T.red, fontWeight: 500 }}>Revoked</span>
            )}
          </p>
        </div>

        {/* Menu */}
        <button onClick={() => setOpenMenu(isMenu ? null : t.id)}
          aria-label="Options"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
          <MoreVertical size={16} strokeWidth={1.8} />
        </button>

        {isMenu && (
          <div className="dropdown-in" style={{
            position: 'absolute', right: 12, top: 56, zIndex: 10,
            background: T.white, borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            padding: '4px 0', minWidth: 180,
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
      </div>

      {/* Magic link row */}
      {isActive && (
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', background: '#FAFAFC', borderRadius: 10,
        }}>
          <code style={{
            flex: 1, fontSize: 11, color: T.ink3,
            fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            /teacher/{t.access_token.slice(0, 8)}…{t.access_token.slice(-4)}
          </code>
          <button onClick={() => onCopy(t)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '6px 10px', borderRadius: 8,
            background: T.ink, color: T.white, border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            {isCopied
              ? <><Check size={12} strokeWidth={2.4} /> Copied</>
              : <><Copy  size={12} strokeWidth={2.4} /> Copy link</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, Icon, label, danger }: any) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: 'none', border: 'none',
      cursor: 'pointer', fontSize: 13, fontWeight: 500,
      color: danger ? T.red : T.ink, fontFamily: 'inherit',
      textAlign: 'left',
    }}>
      <Icon size={14} strokeWidth={1.8} />
      {label}
    </button>
  )
}

function AddTeacherModal({ onClose, onCreated }: any) {
  const [name,       setName]       = useState('')
  const [grade,      setGrade]      = useState('')
  const [className,  setClassName]  = useState('')
  const [email,      setEmail]      = useState('')
  const [saving,     setSaving]     = useState(false)

  const submit = async () => {
    if (!name.trim() || !grade.trim()) {
      toast.error('Name and grade are required'); return
    }
    setSaving(true)
    const tid = toast.loading('Creating teacher…')
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       name.trim(),
          grade:      grade.trim(),
          class_name: className.trim() || null,
          email:      email.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success(`${name} added`, { id: tid })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
    }
    setSaving(false)
  }

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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.02em', margin: 0 }}>
            Add a teacher
          </h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Teacher's name" value={name} onChange={setName}
            placeholder="Mrs. Khumalo" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Grade" value={grade} onChange={setGrade}
              placeholder="Grade 4" />
            <Field label="Class (optional)" value={className} onChange={setClassName}
              placeholder="4B" />
          </div>
          <Field label="Email (optional)" value={email} onChange={setEmail}
            placeholder="teacher@school.com" type="email" />
        </div>

        <button onClick={submit} disabled={saving} style={{
          width: '100%', marginTop: 20, padding: '14px',
          borderRadius: 12, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.6 : 1, fontFamily: 'inherit',
        }}>
          {saving ? 'Creating…' : 'Create teacher'}
        </button>

        <p style={{ fontSize: 12, color: T.ink3, margin: '12px 0 0',
                    textAlign: 'center', lineHeight: 1.5 }}>
          You'll get a shareable link to send to the teacher.
        </p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: any) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block', fontSize: 11, fontWeight: 600, color: T.ink3,
        letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '11px 14px', fontSize: 15,
          border: `1px solid ${T.border}`, borderRadius: 12,
          background: T.white, color: T.ink, outline: 'none',
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </label>
  )
}
