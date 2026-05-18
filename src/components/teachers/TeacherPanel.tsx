// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Check, ChevronDown, UserX, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Teacher, PostType } from '@/lib/types'

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
  green:  '#22C55E',
  red:    '#E8281E',
}

const ALL_TYPES: { type: PostType; label: string }[] = [
  { type: 'update',   label: 'Updates'   },
  { type: 'moment',   label: 'Moments'   },
  { type: 'event',    label: 'Events'    },
  { type: 'document', label: 'Documents' },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    pending:  { bg: '#FFF7ED', color: '#C2410C' },
    approved: { bg: '#F0FFF4', color: '#15803D' },
    rejected: { bg: '#FFF1F2', color: '#BE123C' },
  }
  const s = map[status] ?? map.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 20, background: s.bg, color: s.color,
      textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

function PermissionsEditor({
  teacher, onSave,
}: { teacher: Teacher; onSave: (types: PostType[]) => void }) {
  const [selected, setSelected] = useState<PostType[]>(teacher.allowed_types || [])
  const [saving,   setSaving]   = useState(false)

  const toggle = (t: PostType) => {
    setSelected(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    )
  }

  const save = async () => {
    setSaving(true)
    await onSave(selected)
    setSaving(false)
  }

  return (
    <div style={{
      marginTop: 10, padding: '12px 14px',
      background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3,
                  textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
        Allowed post types
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {ALL_TYPES.map(({ type, label }) => {
          const on = selected.includes(type)
          return (
            <button key={type} onClick={() => toggle(type)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: `1px solid ${on ? T.ink : T.border}`,
              background: on ? T.ink : T.white,
              color: on ? T.white : T.ink2,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {label}
            </button>
          )
        })}
      </div>
      <button onClick={save} disabled={saving} style={{
        width: '100%', padding: '9px 0', borderRadius: 10,
        background: saving ? '#CCC' : T.ink, color: T.white,
        border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
      }}>
        {saving ? 'Saving…' : 'Save permissions'}
      </button>
    </div>
  )
}

export function TeacherPanel({ schoolId, onClose }: TeacherPanelProps) {
  const [teachers,  setTeachers]  = useState<Teacher[]>([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState<string | null>(null)
  const [tab,       setTab]       = useState<'pending' | 'approved' | 'all'>('pending')

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('teachers')
      .select('*, profile:profiles(*)')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
    setTeachers((data as Teacher[]) || [])
    setLoading(false)
  }, [schoolId])

  useEffect(() => { fetch() }, [fetch])

  const approve = async (teacher: Teacher) => {
    const { error } = await supabase.from('teachers').update({
      status:      'approved',
      approved_at: new Date().toISOString(),
      allowed_types: ['moment', 'update'], // default permissions
    }).eq('id', teacher.id)

    if (error) { toast.error('Failed to approve'); return }

    // Update profile role to teacher
    await supabase.from('profiles')
      .update({ role: 'teacher' })
      .eq('id', teacher.profile_id)

    toast.success(`${teacher.profile?.full_name ?? 'Teacher'} approved`)
    fetch()
  }

  const reject = async (teacher: Teacher) => {
    await supabase.from('teachers').update({ status: 'rejected' }).eq('id', teacher.id)
    await supabase.from('profiles').update({ role: 'parent' }).eq('id', teacher.profile_id)
    toast.success('Teacher rejected')
    fetch()
  }

  const revoke = async (teacher: Teacher) => {
    if (!confirm('Revoke teacher access?')) return
    await supabase.from('teachers').update({ status: 'rejected' }).eq('id', teacher.id)
    await supabase.from('profiles').update({ role: 'parent' }).eq('id', teacher.profile_id)
    toast.success('Access revoked')
    fetch()
  }

  const savePermissions = async (teacher: Teacher, types: PostType[]) => {
    await supabase.from('teachers')
      .update({ allowed_types: types })
      .eq('id', teacher.id)
    toast.success('Permissions updated')
    fetch()
  }

  const filtered = teachers.filter(t =>
    tab === 'all' ? true : t.status === tab
  )

  const pendingCount = teachers.filter(t => t.status === 'pending').length

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>

      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        background: T.white, borderRadius: 20,
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.ink,
                        letterSpacing: '-0.02em', margin: '0 0 2px' }}>
              Teachers
            </p>
            <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
              {teachers.length} total · {pendingCount} pending
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${T.border}`, background: T.bg,
            cursor: 'pointer', color: T.ink3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0, padding: '0 20px',
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          {(['pending', 'approved', 'all'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? T.ink : T.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t ? T.ink : 'transparent'}`,
              fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s',
            }}>
              {t}{t === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: T.ink3, fontSize: 13 }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <BookOpen style={{ width: 28, height: 28, color: '#DDD', margin: '0 auto 10px', display: 'block' }} strokeWidth={1.4} />
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
                {tab === 'pending' ? 'No pending requests' : 'No teachers yet'}
              </p>
            </div>
          ) : (
            filtered.map(teacher => (
              <div key={teacher.id} style={{
                marginBottom: 8, background: T.bg,
                borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden',
              }}>
                {/* Teacher row */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Avatar */}
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: '#E8E8E8', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 15, fontWeight: 600, color: T.ink3,
                    }}>
                      {(teacher.profile?.full_name ?? 'T').charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>
                          {teacher.profile?.full_name ?? 'Unknown'}
                        </span>
                        <StatusBadge status={teacher.status} />
                      </div>
                      {teacher.subject && (
                        <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
                          {teacher.subject}
                        </p>
                      )}
                      {teacher.status === 'approved' && teacher.allowed_types?.length > 0 && (
                        <p style={{ fontSize: 11, color: T.ink3, margin: '3px 0 0' }}>
                          {teacher.allowed_types.join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {teacher.status === 'pending' && (
                        <>
                          <button onClick={() => approve(teacher)} style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: '#F0FFF4', border: '1px solid #BBF7D0',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check style={{ width: 14, height: 14, color: T.green }} />
                          </button>
                          <button onClick={() => reject(teacher)} style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: '#FFF1F2', border: '1px solid #FECDD3',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <X style={{ width: 14, height: 14, color: T.red }} />
                          </button>
                        </>
                      )}
                      {teacher.status === 'approved' && (
                        <>
                          <button onClick={() => setExpanded(expanded === teacher.id ? null : teacher.id)} style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: T.white, border: `1px solid ${T.border}`,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <ChevronDown style={{
                              width: 14, height: 14, color: T.ink3,
                              transform: expanded === teacher.id ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s',
                            }} />
                          </button>
                          <button onClick={() => revoke(teacher)} style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: '#FFF1F2', border: '1px solid #FECDD3',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <UserX style={{ width: 14, height: 14, color: T.red }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Permissions editor */}
                  {expanded === teacher.id && (
                    <PermissionsEditor
                      teacher={teacher}
                      onSave={(types) => savePermissions(teacher, types)}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
