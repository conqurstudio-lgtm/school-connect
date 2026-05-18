// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Bell, Camera, LogOut, Plus, MoreHorizontal,
  Pencil, Trash2, X, Check, Users, MessageCircle, Send, Megaphone
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PhotoCropper } from './PhotoCropper'

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

interface Props { teacherId: string }

export function TeacherSelfProfile({ teacherId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchParams = useSearchParams()
  const [session,  setSession]  = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<Tab>('class')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [unread,     setUnread]     = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    try {
      const token = searchParams.get('token')
      const res = await fetch(token ? `/api/teacher-session?token=${encodeURIComponent(token)}` : '/api/teacher-session')
      const json = await res.json()
      if (res.ok && json.teacher?.id === teacherId) setSession(json)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [teacherId])

  // Unread bell count — refreshed on tab focus & every 30s
  useEffect(() => {
    let alive = true
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/teacher/notifications')
        if (!res.ok) return
        const j = await res.json()
        if (alive) setUnread(j.unread_count ?? 0)
      } catch {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    const onFocus = () => fetchCount()
    window.addEventListener('focus', onFocus)
    return () => { alive = false; clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  const goToFeed = () => router.push('/feed')

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%',
                      border: `2px solid ${T.border}`, borderTopColor: T.ink,
                      animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }
  if (!session) {
    if (typeof window !== 'undefined') {
      router.replace(`/teachers/${teacherId}`)
    }
    return null
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

  return (
    <div style={{
      minHeight: '100dvh', height: 'auto',
      overflowY: 'visible', WebkitOverflowScrolling: 'auto',
      background: T.bg, maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingTop: 0,
      paddingBottom: 96,
    }}>
      {/* ─── Top bar — back, bell, sign out ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 12px',
        position: 'sticky', top: 0, zIndex: 10,
        background: T.bg,
      }}>
        <button onClick={goToFeed} aria-label="Back to feed" style={iconBtn}>
          <ArrowLeft size={16} strokeWidth={1.8} />
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowNotifs(true)} aria-label="Notifications"
            style={{ ...iconBtn, position: 'relative' }}>
            <Bell size={15} strokeWidth={1.7} />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: T.red, border: `2px solid ${T.bg}`,
              }} />
            )}
          </button>
          <button onClick={signOut} aria-label="Sign out" style={iconBtn}>
            <LogOut size={14} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {/* ─── Hero ─── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 20px 24px', textAlign: 'center',
      }}>
        <button onClick={() => fileRef.current?.click()}
          style={{
            position: 'relative', padding: 0, border: 'none',
            background: 'transparent', cursor: 'pointer',
            marginBottom: 14,
          }}>
          <div style={{
            width: 124, height: 124, borderRadius: 36,
            overflow: 'hidden',
            background: teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38, fontWeight: 600, color: T.ink2,
          }}>
            {!teacher.photo_url && initials}
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: -4,
            width: 32, height: 32, borderRadius: '50%',
            background: T.ink, color: T.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${T.bg}`,
          }}>
            <Camera size={14} strokeWidth={2} />
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) setCropFile(f)
            e.target.value = ''
          }} />

        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink,
                     letterSpacing: '-0.025em', margin: 0 }}>
          {teacher.name}
        </h1>
        <p style={{ fontSize: 13, color: T.ink3, margin: '4px 0 0' }}>
          {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} · {school.name}
        </p>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 8,
        padding: '0 20px 20px',
      }}>
        <TabPill active={tab === 'class'} onClick={() => setTab('class')}
          icon={<Users size={13} strokeWidth={1.8} />} label="Class" />
        <TabPill active={tab === 'updates'} onClick={() => setTab('updates')}
          icon={<MessageCircle size={13} strokeWidth={1.8} />} label="Updates" />
        <TabPill active={tab === 'broadcast'} onClick={() => setTab('broadcast')}
          icon={<Megaphone size={13} strokeWidth={1.8} />} label="Broadcast" />
      </div>

      {/* ─── Tab content ─── */}
      {tab === 'class' && (
        <ClassRoster kids={children} onChanged={load} />
      )}
      {tab === 'updates' && <UpdatesInbox teacher={teacher} />}
      {tab === 'broadcast' && <BroadcastCompose teacher={teacher} />}

      {showNotifs && (
        <NotificationsSheet
          teacher={teacher}
          onClose={() => { setShowNotifs(false); setUnread(0) }}
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

const iconBtn: any = {
  width: 36, height: 36, borderRadius: 999,
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
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    }}>
      {icon} {label}
    </button>
  )
}

/* ────────────────────────────────────────
   CLASS TAB — roster
   ──────────────────────────────────────── */
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
          {kids.length === 0
            ? 'No children yet'
            : `${kids.length} ${kids.length === 1 ? 'child' : 'children'} in your class`}
        </p>
        <button onClick={() => setShowAdd(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '7px 12px', borderRadius: 999,
          background: T.ink, color: T.white, border: 'none',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
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
          <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            Add children so parents can claim them when they join.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {kids.map((c: any) => (
            <div key={c.id} style={{
              padding: '12px 14px', borderRadius: 12,
              background: T.white, border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 12, color: T.ink2, fontWeight: 600,
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
                  <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
                    {c.guardian_count === 0 ? 'No parents yet'
                    : c.guardian_count === 1 ? '1 parent linked'
                    : `${c.guardian_count} parents linked`}
                  </p>
                </div>
              )}
              {!editing && (
                <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                  aria-label="Options" style={{
                    width: 30, height: 30, borderRadius: 8,
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
                  background: T.white, borderRadius: 12,
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
          <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
            When parents in your class write to you, threads appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {parents.map((p: any) => (
            <button key={p.id} onClick={() => setOpenThread(p)}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: T.white, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#F0F0F4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 13, color: T.ink2, fontWeight: 600,
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
                <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
                  {p.child_names.join(', ')}
                </p>
                {p.latest_update && (
                  <p style={{ fontSize: 12, color: T.ink3, margin: '4px 0 0',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap', maxWidth: 240 }}>
                    {p.latest_update.author_kind === 'teacher' ? 'You: ' : ''}
                    {p.latest_update.body || '[photo]'}
                  </p>
                )}
              </div>
              {p.latest_update && (
                <p style={{ fontSize: 11, color: T.ink3, flexShrink: 0 }}>
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
function ParentThreadSheet({ parent, teacher, onClose }: any) {
  const [updates, setUpdates] = useState<any[]>([])
  const [reply,   setReply]   = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/updates?parent_id=${parent.id}`)
      const json = await res.json()
      setUpdates(json.updates ?? [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [parent.id])

  const send = async () => {
    const text = reply.trim()
    if (!text) return
    setSending(true)
    try {
      const res = await fetch('/api/teacher/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_ids: [parent.id], body: text }),
      })
      if (!res.ok) throw new Error()
      setReply('')
      load()
    } catch { toast.error('Could not send') }
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                         letterSpacing: '-0.02em', margin: 0 }}>
              {parent.name}
            </h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
              {parent.child_names.join(', ')}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%',
                            border: `2px solid ${T.border}`, borderTopColor: T.ink,
                            animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : updates.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
                No messages yet. Be the first to send an update.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[...updates].reverse().map((u: any) => {
                const isTeacher = u.author_kind === 'teacher'
                return (
                  <div key={u.id} style={{
                    display: 'flex', gap: 8,
                    flexDirection: isTeacher ? 'row-reverse' : 'row',
                  }}>
                    <div style={{
                      maxWidth: '75%', padding: '8px 12px',
                      borderRadius: 14,
                      background: isTeacher ? T.ink : '#F0F0F4',
                      color: isTeacher ? T.white : T.ink,
                    }}>
                      {u.body && (
                        <p style={{ fontSize: 13.5, margin: 0, lineHeight: 1.45,
                                    whiteSpace: 'pre-wrap' }}>{u.body}</p>
                      )}
                      {u.image_url && (
                        <img src={u.image_url} alt="" style={{
                          marginTop: u.body ? 6 : 0, width: '100%',
                          borderRadius: 8, display: 'block',
                        }} />
                      )}
                      <p style={{ fontSize: 10, margin: '4px 0 0',
                                  opacity: 0.6, textAlign: isTeacher ? 'right' : 'left' }}>
                        {relTime(u.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          padding: '10px 12px', borderTop: `1px solid ${T.border}`,
        }}>
          <input value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !sending) send() }}
            placeholder="Write a quick update…"
            style={{
              flex: 1, padding: '9px 14px', fontSize: 13,
              border: `1px solid ${T.border}`, borderRadius: 999,
              background: '#FAFAFC', outline: 'none', fontFamily: 'inherit',
            }} />
          <button onClick={send} disabled={!reply.trim() || sending} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: reply.trim() ? T.ink : '#E0E0E4',
            color: T.white, border: 'none',
            cursor: reply.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={14} strokeWidth={2} />
          </button>
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
        <p style={{ fontSize: 12, color: T.ink2, margin: 0, lineHeight: 1.5 }}>
          Broadcast sends a private update to selected parents.
          It doesn't appear on the public feed.
        </p>
      </div>

      <textarea value={body} onChange={e => setBody(e.target.value)}
        rows={4}
        placeholder="Write your message…"
        style={{
          width: '100%', padding: '12px 14px', fontSize: 14,
          border: `1px solid ${T.border}`, borderRadius: 14,
          background: T.white, color: T.ink, outline: 'none',
          fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box',
          lineHeight: 1.5,
        }} />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 18, marginBottom: 10,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3,
                    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
          To · {picked.size} of {parents.length}
        </p>
        {parents.length > 0 && (
          <button onClick={toggleAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: T.blue,
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
        <p style={{ fontSize: 13, color: T.ink3, textAlign: 'center', padding: '20px 0' }}>
          No parents linked yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {parents.map((p: any) => {
            const isPicked = picked.has(p.id)
            return (
              <button key={p.id} onClick={() => togglePick(p.id)}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: isPicked ? '#F0F4FF' : T.white,
                  border: isPicked ? `1px solid ${T.blue}` : `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', gap: 10,
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
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.ink,
                              margin: 0, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
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
          width: '100%', padding: '14px', marginTop: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderRadius: 12,
          background: !body.trim() || picked.size === 0 ? '#E0E0E4' : T.ink,
          color: T.white, border: 'none',
          fontSize: 14, fontWeight: 600,
          cursor: sending || !body.trim() || picked.size === 0 ? 'not-allowed' : 'pointer',
          opacity: sending ? 0.6 : 1, fontFamily: 'inherit',
        }}>
        <Send size={13} strokeWidth={2.2} />
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
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
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
        style={{ flex: 1, padding: '7px 10px', fontSize: 13,
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => onSave(v.trim())} style={{
        width: 30, height: 30, borderRadius: 8,
        background: T.ink, color: T.white, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Check size={12} strokeWidth={2.4} /></button>
      <button onClick={onCancel} style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'none', border: `1px solid ${T.border}`, cursor: 'pointer',
        color: T.ink3, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}><X size={12} strokeWidth={1.8} /></button>
    </div>
  )
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
          placeholder="Emma Johnson"
          style={{
            width: '100%', padding: '12px 14px', fontSize: 15,
            border: `1px solid ${T.border}`, borderRadius: 12,
            background: T.white, color: T.ink, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }} />
        <button onClick={submit} style={{
          width: '100%', marginTop: 12, padding: '14px',
          borderRadius: 12, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>Add child</button>
      </div>
    </div>
  )
}


/* ────────────────────────────────────────
   NOTIFICATIONS SHEET — bell content
   ──────────────────────────────────────── */
function NotificationsSheet({ teacher, onClose }: any) {
  const [items,   setItems]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/notifications')
      const json = await res.json()
      setItems(json.items ?? [])
      // Mark all read on open
      await fetch('/api/teacher/notifications', { method: 'POST' })
    } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
        }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.02em', margin: 0 }}>
            Notifications
          </h3>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%',
                            border: `2px solid ${T.border}`, borderTopColor: T.ink,
                            animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <Bell size={20} color={T.ink3} strokeWidth={1.5}
                style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
                You're all caught up.
              </p>
            </div>
          ) : (
            items.map(item => (
              <NotifRow key={item.id} item={item} onClose={onClose} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function NotifRow({ item, onClose }: any) {
  return (
    <div style={{
      padding: '12px 20px', display: 'flex', gap: 12,
      alignItems: 'flex-start',
      background: item.unread ? '#F4F6FB' : 'transparent',
      borderBottom: '1px solid rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: '#F0F0F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 16,
      }}>
        {item.kind === 'message' ? '💬'
        : item.kind === 'reaction'
          ? (item.type === 'love' ? '❤️' : item.type === 'like' ? '👍'
            : item.type === 'celebrate' ? '🎉' : '👏')
        : '💭'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: 0,
                    letterSpacing: '-0.005em' }}>
          {item.kind === 'message'  && `${item.parent_name} sent you an update`}
          {item.kind === 'reaction' && `${item.author_name} reacted to your post`}
          {item.kind === 'reply'    && `${item.author_name} replied to your post`}
        </p>
        {(item.preview || item.post_preview) && (
          <p style={{ fontSize: 12, color: T.ink3, margin: '3px 0 0',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', maxWidth: 280, lineHeight: 1.4 }}>
            {item.kind === 'message' && item.preview}
            {item.kind === 'reply'   && item.preview}
            {item.kind === 'reaction' && `"${item.post_preview}…"`}
          </p>
        )}
        <p style={{ fontSize: 11, color: T.ink3, margin: '4px 0 0' }}>
          {relTime(item.created_at)}
        </p>
      </div>
    </div>
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
