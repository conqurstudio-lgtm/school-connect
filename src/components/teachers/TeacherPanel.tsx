// @ts-nocheck
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, Copy, Eye, EyeOff, RefreshCw, Trash2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'

interface TeacherPanelProps {
  schoolId: string
  onClose:  () => void
}

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
  green:  '#16A34A',
  red:    '#E8281E',
  blue:   '#78A6FE',
}

type Teacher = {
  id: string
  school_id: string
  name: string
  email?: string | null
  photo_url?: string | null
  grade: string
  class_name?: string | null
  access_token: string
  status: 'active' | 'inactive' | string
  last_seen_at?: string | null
  created_at?: string
  updated_at?: string
}

function token() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replaceAll('-', '')
  }
  return `${Date.now()}${Math.random().toString(36).slice(2)}`
}

function inviteUrl(t: Teacher) {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  const token = encodeURIComponent(t.access_token || '')
  return `${origin}/teacher-link/${token}`
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T'
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      padding: '3px 8px',
      borderRadius: 999,
      background: active ? '#F0FFF4' : '#FFF1F2',
      color: active ? '#15803D' : '#BE123C',
      textTransform: 'capitalize',
    }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function TeacherPanel({ schoolId, onClose }: TeacherPanelProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'active' | 'inactive' | 'all'>('active')
  const [showAdd, setShowAdd] = useState(false)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', schoolId)
      .order('grade', { ascending: true })
      .order('class_name', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      toast.error('Could not load teachers')
      setTeachers([])
    } else {
      setTeachers((data as Teacher[]) || [])
    }
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const filtered = useMemo(() => {
    if (tab === 'all') return teachers
    return teachers.filter(t => t.status === tab)
  }, [teachers, tab])

  const activeCount = teachers.filter(t => t.status === 'active').length
  const inactiveCount = teachers.filter(t => t.status !== 'active').length

  const copyInvite = async (teacher: Teacher) => {
    const url = inviteUrl(teacher)
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Teacher link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const setStatus = async (teacher: Teacher, status: 'active' | 'inactive') => {
    const { error } = await supabase
      .from('teachers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', teacher.id)

    if (error) {
      toast.error('Could not update teacher')
      return
    }
    toast.success(status === 'active' ? 'Teacher activated' : 'Teacher hidden')
    fetchTeachers()
  }

  const resetLink = async (teacher: Teacher) => {
    if (!confirm('Create a new teacher link? The old link will stop working.')) return
    const { error } = await supabase
      .from('teachers')
      .update({ access_token: token(), updated_at: new Date().toISOString() })
      .eq('id', teacher.id)

    if (error) {
      toast.error('Could not reset link')
      return
    }
    toast.success('New teacher link created')
    fetchTeachers()
  }

  const removeTeacher = async (teacher: Teacher) => {
    if (!confirm(`Remove ${teacher.name}? This will hide their class access.`)) return
    await setStatus(teacher, 'inactive')
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 70,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '92dvh',
        background: T.white,
        borderRadius: '24px 24px 0 0',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>
              Teachers
            </p>
            <p style={{ fontSize: 12, color: T.ink3, margin: '3px 0 0' }}>
              {activeCount} active · {inactiveCount} inactive
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(true)} style={{
              height: 34,
              padding: '0 13px',
              borderRadius: 999,
              border: 'none',
              background: T.ink,
              color: T.white,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <Plus size={14} strokeWidth={2.4} />
              Add
            </button>

            <button onClick={onClose} aria-label="Close" style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              background: T.bg,
              color: T.ink3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 20px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          {(['active', 'inactive', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 13px',
              borderRadius: 999,
              border: tab === t ? 'none' : `1px solid ${T.border}`,
              background: tab === t ? T.ink : T.white,
              color: tab === t ? T.white : T.ink3,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'capitalize',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 22px' }}>
          {loading ? (
            <div style={{ padding: '42px 0', textAlign: 'center', color: T.ink3, fontSize: 13 }}>
              Loading teachers…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              padding: '42px 20px',
              textAlign: 'center',
              border: `1px dashed ${T.border}`,
              borderRadius: 16,
              background: T.bg,
            }}>
              <UserRound size={28} color={T.ink3} strokeWidth={1.4}
                style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 14, color: T.ink, fontWeight: 700, margin: '0 0 5px' }}>
                No teachers here yet
              </p>
              <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
                Add teachers and share their private class link.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {filtered.map(teacher => (
                <div key={teacher.id} style={{
                  background: T.bg,
                  border: `1px solid ${T.border}`,
                  borderRadius: 16,
                  padding: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      overflow: 'hidden',
                      background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#ECECF0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: T.ink2,
                      fontSize: 14,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      {!teacher.photo_url && initials(teacher.name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <p style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: T.ink,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {teacher.name}
                        </p>
                        <StatusBadge status={teacher.status} />
                      </div>
                      <p style={{ fontSize: 12, color: T.ink3, margin: '3px 0 0' }}>
                        {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
                        {teacher.email ? ` · ${teacher.email}` : ''}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginTop: 12,
                  }}>
                    <button onClick={() => copyInvite(teacher)} style={actionBtn}>
                      <Copy size={13} strokeWidth={2} />
                      Copy link
                    </button>

                    <button onClick={() => resetLink(teacher)} style={actionBtn}>
                      <RefreshCw size={13} strokeWidth={2} />
                      New link
                    </button>

                    {teacher.status === 'active' ? (
                      <button onClick={() => setStatus(teacher, 'inactive')} style={actionBtn}>
                        <EyeOff size={13} strokeWidth={2} />
                        Hide
                      </button>
                    ) : (
                      <button onClick={() => setStatus(teacher, 'active')} style={actionBtn}>
                        <Eye size={13} strokeWidth={2} />
                        Activate
                      </button>
                    )}

                    <button onClick={() => removeTeacher(teacher)} style={{ ...actionBtn, color: T.red }}>
                      <Trash2 size={13} strokeWidth={2} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAdd && (
          <AddTeacherSheet
            schoolId={schoolId}
            onClose={() => setShowAdd(false)}
            onCreated={() => {
              setShowAdd(false)
              fetchTeachers()
            }}
          />
        )}
      </div>
    </div>
  )
}

const actionBtn: any = {
  height: 34,
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function AddTeacherSheet({ schoolId, onClose, onCreated }: any) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [grade, setGrade] = useState('')
  const [className, setClassName] = useState('')
  const [saving, setSaving] = useState(false)

  const create = async () => {
    if (!name.trim() || !grade.trim()) {
      toast.error('Name and grade are required')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('teachers').insert({
      school_id: schoolId,
      name: name.trim(),
      email: email.trim() || null,
      grade: grade.trim(),
      class_name: className.trim() || null,
      access_token: token(),
      status: 'active',
    })

    setSaving(false)

    if (error) {
      toast.error(error.message || 'Could not add teacher')
      return
    }

    toast.success('Teacher added')
    onCreated()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 120,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        background: T.white,
        borderRadius: '22px 22px 0 0',
        padding: '20px',
        animation: 'slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>
              Add teacher
            </h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '3px 0 0' }}>
              A private class link will be created.
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.ink3,
            cursor: 'pointer',
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Input label="Teacher name" value={name} onChange={setName} placeholder="Mrs Dlamini" autoFocus />
          <Input label="Email optional" value={email} onChange={setEmail} placeholder="teacher@school.co.za" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Input label="Grade" value={grade} onChange={setGrade} placeholder="Grade R" />
            <Input label="Class" value={className} onChange={setClassName} placeholder="Blue" />
          </div>
        </div>

        <button onClick={create} disabled={saving} style={{
          width: '100%',
          marginTop: 14,
          padding: '14px',
          borderRadius: 14,
          background: saving ? '#CFCFD4' : T.ink,
          color: T.white,
          border: 'none',
          fontSize: 15,
          fontWeight: 800,
          cursor: saving ? 'wait' : 'pointer',
          fontFamily: 'inherit',
        }}>
          {saving ? 'Adding…' : 'Add teacher'}
        </button>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, autoFocus = false }: any) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 800,
        color: T.ink3,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {label}
      </span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '12px 13px',
          borderRadius: 13,
          border: `1px solid ${T.border}`,
          background: '#FAFAFC',
          color: T.ink,
          fontSize: 16,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </label>
  )
}
