// @ts-nocheck
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, X, Image as ImageIcon, Send, Heart, MessageCircle, Trash2, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { createBrowserClient } from '@supabase/ssr'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
  red:    '#FF3040',
}

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface Props { teacherId: string }

export function TeacherProfileClient({ teacherId }: Props) {
  const router = useRouter()
  const [teacher,   setTeacher]    = useState<any>(null)
  const [canMessage, setCanMessage] = useState(false)
  const [joinStatus, setJoinStatus] = useState('none')
  const [joinRequest, setJoinRequest] = useState<any>(null)
  const [showJoin, setShowJoin] = useState(false)
  const [classPosts, setClassPosts] = useState<any[]>([])
  const [updates,    setUpdates]   = useState<any[]>([])
  const [loading,    setLoading]   = useState(true)
  const [composing,  setComposing] = useState(false)
  const [closing,    setClosing]   = useState(false)
  const [user,       setUser]      = useState<any>(null)

  const load = async () => {
    try {
      // Get teacher profile
      const profRes = await fetch(`/api/teachers/${teacherId}/profile`)
      const profJson = await profRes.json()
      setTeacher(profJson.teacher)
      setJoinStatus(profJson.join_status || (profJson.is_my_teacher ? 'approved' : 'none'))
      setJoinRequest(profJson.join_request || null)
      setClassPosts(profJson.posts ?? [])

      // Try fetching updates thread
      const updRes = await fetch(`/api/updates?teacher_id=${teacherId}`)
      const updJson = await updRes.json()
      setCanMessage(!!updJson.can_message || !!profJson.is_my_teacher || profJson.join_status === 'approved')
      setUpdates(updJson.updates ?? [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => {
    supabase().auth.getUser().then(({ data }) => setUser(data.user))
    load()
  }, [teacherId])

  const handleBack = () => {
    setClosing(true)
    try { sessionStorage.setItem('feed-left', '1') } catch {}
    setTimeout(() => router.push('/feed'), 280)
  }

  const containerStyle: any = {
    minHeight: '100dvh', height: 'auto',
    overflowY: 'visible', WebkitOverflowScrolling: 'auto',
    background: T.bg, maxWidth: 520, margin: '0 auto',
    paddingTop: 0,
    fontFamily: 'Inter, -apple-system, sans-serif',
    paddingBottom: 96, position: 'relative',
  }

  if (loading) {
    return (
      <div className="card-from-right" style={{
        ...containerStyle, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%',
                      border: `2px solid ${T.border}`, borderTopColor: T.ink,
                      animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }
  if (!teacher) {
    return (
      <div className="card-from-right" style={{
        ...containerStyle, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: T.ink, fontWeight: 600,
                      margin: '0 0 6px' }}>Teacher not found</p>
          <button onClick={handleBack} style={{
            marginTop: 12, padding: '8px 16px', borderRadius: 999,
            background: T.ink, color: T.white, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>Back to feed</button>
        </div>
      </div>
    )
  }

  const initials = teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={closing ? 'card-to-right' : 'card-from-right'} style={containerStyle}>
      {/* Top bar with back */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '20px 20px 12px',
        position: 'sticky', top: 0, zIndex: 10,
        background: T.bg,
      }}>
        <button onClick={handleBack} aria-label="Back" style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'none', border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: T.ink,
        }}>
          <ArrowLeft size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Teacher hero */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 20px 24px', textAlign: 'center',
      }}>
        <div style={{
          width: 124, height: 124, borderRadius: 36,
          overflow: 'hidden',
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, fontWeight: 600, color: T.ink2,
          marginBottom: 14,
        }}>
          {!teacher.photo_url && initials}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.ink,
                     letterSpacing: '-0.025em', margin: 0 }}>
          {teacher.name}
        </h1>
        <p style={{ fontSize: 13, color: T.ink3, margin: '4px 0 0' }}>
          {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} Teacher
        </p>
      </div>
      {/* If NOT my child's teacher → request class access */}
      {!canMessage && (
        <div style={{ padding: '0 20px' }}>
          <div style={{
            padding: '20px 16px',
            borderRadius: 16,
            border: `1px dashed ${T.border}`,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            background: T.white,
          }}>
            <Info size={18} color={T.ink3} strokeWidth={1.6}
              style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, color: T.ink, fontWeight: 700, margin: '0 0 4px' }}>
                {joinStatus === 'pending'
                  ? 'Request sent'
                  : joinStatus === 'rejected'
                    ? 'Request was not approved'
                    : 'Join this class'}
              </p>
              <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
                {joinStatus === 'pending'
                  ? 'Your request is waiting for the teacher to approve that your child is in this class.'
                  : joinStatus === 'rejected'
                    ? 'You can ask the school or send a new request if this was a mistake.'
                    : 'Send your child’s details to the teacher. Once approved, you can see class updates and message privately.'}
              </p>

              {joinStatus !== 'pending' && (
                <button onClick={() => setShowJoin(true)} style={{
                  marginTop: 14,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: T.ink,
                  color: T.white,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 700,
                }}>
                  {joinStatus === 'rejected' ? 'Send new request' : 'Join this class'}
                </button>
              )}
            </div>
          </div>

          {showJoin && (
            <JoinClassModal
              teacher={teacher}
              onClose={() => setShowJoin(false)}
              onSubmitted={() => {
                setShowJoin(false)
                load()
              }}
            />
          )}
        </div>
      )}

      {/* IF my teacher → show thread + FAB */}
      {canMessage && (
        <>
          {/* Quiet hint at the top of the thread */}
          <div style={{
            margin: '0 20px 18px', padding: '12px 14px',
            borderRadius: 14, background: '#F4F6FB',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Info size={14} color={T.blue} strokeWidth={1.8}
              style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: T.ink2, margin: 0, lineHeight: 1.5 }}>
              Class updates from your teacher. Parents can view what is happening in class, but only teachers can post here.
            </p>
          </div>

          {/* Read-only class posts */}
          {classPosts.length === 0 ? (
            <EmptyState />
          ) : (
            <div>
              {classPosts.map((post: any, i: number) => (
                <ClassPostRow
                  key={post.id}
                  post={post}
                  teacher={teacher}
                  index={i}
                />
              ))}
            </div>
          )}
          <div style={{ padding: '4px 20px 18px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: '#FAFAFC',
              border: `1px solid ${T.border}`,
              fontSize: 12,
              color: T.ink3,
              lineHeight: 1.5,
            }}>
              This class page is read-only for parents. Teacher updates, events, moments and reports will appear here.
            </div>
          </div>
              onSent={() => { setComposing(false); load() }}
            />
          )}
        </>
      )}
    </div>
  )
}


function JoinClassModal({ teacher, onClose, onSubmitted }: any) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [relationship, setRelationship] = useState('Parent/Guardian')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const child_first_name = firstName.trim()
    const child_last_name = lastName.trim()

    if (!child_first_name || !child_last_name) {
      toast.error('Enter child name and surname')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/class-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          child_first_name,
          child_last_name,
          relationship,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not send request')

      if (json.already_joined) toast.success('You are already linked to this class')
      else if (json.already_pending) toast.success('Your request is already waiting')
      else toast.success('Request sent to teacher')

      onSubmitted()
    } catch (e: any) {
      toast.error(e.message || 'Could not send request')
    }
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 220,
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
        padding: '20px',
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: '-0.025em', margin: 0 }}>
              Join {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
            </h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '4px 0 0' }}>
              Teacher approval is required before access is granted.
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink3,
            cursor: 'pointer',
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input autoFocus value={firstName} onChange={e => setFirstName(e.target.value)}
            placeholder="Child first name" style={joinInputStyle} />
          <input value={lastName} onChange={e => setLastName(e.target.value)}
            placeholder="Child surname" style={joinInputStyle} />
        </div>

        <select value={relationship} onChange={e => setRelationship(e.target.value)}
          style={{ ...joinInputStyle, marginTop: 10 }}>
          <option>Parent/Guardian</option>
          <option>Mother</option>
          <option>Father</option>
          <option>Guardian</option>
          <option>Other</option>
        </select>

        <button onClick={submit} disabled={sending} style={{
          width: '100%',
          marginTop: 14,
          padding: '14px',
          borderRadius: 14,
          border: 'none',
          background: sending ? '#D4D4D8' : T.ink,
          color: T.white,
          fontSize: 15,
          fontWeight: 800,
          cursor: sending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
        }}>
          {sending ? 'Sending request…' : 'Send request'}
        </button>
      </div>
    </div>
  )
}

const joinInputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: 13,
  border: `1px solid ${T.border}`,
  background: '#FAFAFC',
  color: T.ink,
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
}


function ClassPostRow({ post, teacher, index }: any) {
  const images = Array.isArray(post.image_urls)
    ? post.image_urls
    : post.image_url
      ? [post.image_url]
      : []

  const initials = teacher.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const typeLabel =
    post.type === 'event' ? 'Event' :
    post.type === 'moment' ? 'Moment' :
    post.type === 'document' ? 'Document' :
    'Update'

  return (
    <article>
      <div style={{ display: 'flex', gap: 12, padding: '14px 20px 8px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            flexShrink: 0,
            overflow: 'hidden',
            background: teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid rgba(0,0,0,0.06)`,
            fontSize: 13,
            fontWeight: 600,
            color: T.ink2,
          }}>
            {!teacher.photo_url && initials}
          </div>
          <div style={{
            width: 1,
            flex: 1,
            minHeight: 24,
            marginTop: 6,
            background: 'rgba(0,0,0,0.07)',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.ink, flex: 1 }}>
              {teacher.name}
              <span style={{
                marginLeft: 6,
                padding: '1px 6px',
                background: '#F0F4FF',
                color: T.blue,
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}>
                {typeLabel}
              </span>
            </span>
            <span style={{ fontSize: 12, color: '#B0B0B0', flexShrink: 0 }}>
              {relTime(post.created_at)}
            </span>
          </div>

          {post.title && (
            <p style={{
              fontSize: 15,
              lineHeight: 1.35,
              color: T.ink,
              fontWeight: 700,
              margin: '6px 0 0',
              letterSpacing: '-0.01em',
            }}>
              {post.title}
            </p>
          )}

          {post.body && (
            <p style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: '#2A2A2A',
              margin: '5px 0 0',
              whiteSpace: 'pre-wrap',
            }}>
              {post.body}
            </p>
          )}

          {post.type === 'event' && (post.event_date || post.event_time || post.event_location) && (
            <div style={{
              marginTop: 8,
              padding: '9px 10px',
              borderRadius: 12,
              background: '#F4F6FB',
              color: T.ink2,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {post.event_date && <div><strong>Date:</strong> {post.event_date}</div>}
              {post.event_time && <div><strong>Time:</strong> {post.event_time}</div>}
              {post.event_location && <div><strong>Place:</strong> {post.event_location}</div>}
            </div>
          )}

          {post.document_url && (
            <a
              href={post.document_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                marginTop: 9,
                padding: '8px 11px',
                borderRadius: 999,
                background: '#F4F4F6',
                color: T.ink,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Open document
            </a>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div style={{ padding: '0 20px 8px 70px', display: 'grid', gap: 8 }}>
          {images.slice(0, 4).map((url: string, idx: number) => (
            <img
              key={`${url}-${idx}`}
              src={url}
              alt=""
              style={{
                width: '100%',
                borderRadius: 16,
                display: 'block',
                objectFit: 'cover',
              }}
            />
          ))}
        </div>
      )}

      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
    </article>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, background: '#F0F0F4',
        margin: '0 auto 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <MessageCircle size={22} color={T.ink3} strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 14, color: T.ink, fontWeight: 600,
                  margin: '0 0 4px' }}>No updates yet</p>
      <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
        Your teacher’s class updates will appear here.
      </p>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   One update row — feed-card style with reactions + replies
   ────────────────────────────────────────────────────────── */
function UpdateRow({ update, teacher, user, onChanged, index }: any) {
  const isTeacher = update.author_kind === 'teacher'
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText,    setReplyText]    = useState('')
  const [sending,      setSending]      = useState(false)

  const myReaction = (update.update_reactions ?? []).find((r: any) =>
    user && r.parent_id === user.id
  )
  const reactionCount = (update.update_reactions ?? []).length

  const react = async (type: string) => {
    try {
      await fetch('/api/updates/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: update.id, type }),
      })
      onChanged()
    } catch {}
  }

  const submitReply = async () => {
    const text = replyText.trim()
    if (!text || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/updates/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: update.id, body: text }),
      })
      if (!res.ok) throw new Error()
      setReplyText('')
      setShowReplyBox(false)
      onChanged()
    } catch { toast.error('Could not send reply') }
    setSending(false)
  }

  const deleteUpdate = async () => {
    if (!confirm('Delete this update?')) return
    try {
      await fetch(`/api/updates?id=${update.id}`, { method: 'DELETE' })
      onChanged()
    } catch {}
  }

  const authorInitials = isTeacher
    ? teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
    : (user?.user_metadata?.full_name || 'You').charAt(0).toUpperCase()

  return (
    <article>
      <div style={{ display: 'flex', gap: 12, padding: '14px 20px 8px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            overflow: 'hidden',
            background: isTeacher && teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid rgba(0,0,0,0.06)`,
            fontSize: 13, fontWeight: 600, color: T.ink2,
          }}>
            {!(isTeacher && teacher.photo_url) && authorInitials}
          </div>
          <div style={{ width: 1, flex: 1, minHeight: 24, marginTop: 6,
                        background: 'rgba(0,0,0,0.07)' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: T.ink, flex: 1 }}>
              {isTeacher ? teacher.name : 'You'}
              {isTeacher && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px',
                  background: '#F0F4FF', color: T.blue,
                  borderRadius: 999, fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>Teacher</span>
              )}
            </span>
            <span style={{ fontSize: 12, color: '#B0B0B0', flexShrink: 0 }}>
              {relTime(update.created_at)}
            </span>
            {!isTeacher && (
              <button onClick={deleteUpdate} aria-label="Delete" style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.ink3, padding: 0, marginLeft: 6,
              }}>
                <Trash2 size={12} strokeWidth={1.8} />
              </button>
            )}
          </div>
          {update.body && (
            <p style={{ fontSize: 14, lineHeight: 1.55, color: '#2A2A2A',
                        margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
              {update.body}
            </p>
          )}
        </div>
      </div>

      {update.image_url && (
        <div style={{ padding: '0 20px 8px 70px' }}>
          <img src={update.image_url} alt=""
            style={{ width: '100%', borderRadius: 16, display: 'block' }} />
        </div>
      )}

      {/* Reactions + reply actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '4px 20px 12px 70px',
      }}>
        <button onClick={() => react('love')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: myReaction?.type === 'love' ? '#FFE8EC' : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
          <Heart size={14} strokeWidth={1.8}
            color={myReaction?.type === 'love' ? T.red : T.ink3}
            fill={myReaction?.type === 'love' ? T.red : 'none'} />
          {reactionCount > 0 && (
            <span style={{ fontSize: 12, color: T.ink2 }}>{reactionCount}</span>
          )}
        </button>
        <button onClick={() => setShowReplyBox(v => !v)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <MessageCircle size={14} strokeWidth={1.8} color={T.ink3} />
          {(update.update_replies?.length ?? 0) > 0 && (
            <span style={{ fontSize: 12, color: T.ink2 }}>
              {update.update_replies.length}
            </span>
          )}
        </button>
      </div>

      {/* Replies */}
      {update.update_replies?.length > 0 && (
        <div style={{ padding: '0 20px 8px 70px' }}>
          {update.update_replies.map((r: any) => (
            <ReplyRow key={r.id} reply={r} teacher={teacher} />
          ))}
        </div>
      )}

      {/* Reply input */}
      {showReplyBox && (
        <div style={{
          display: 'flex', gap: 8, padding: '6px 20px 14px 70px',
          alignItems: 'center',
        }}>
          <input value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !sending) submitReply() }}
            placeholder="Write a reply…" autoFocus
            style={{
              flex: 1, padding: '8px 14px', fontSize: 13,
              border: `1px solid ${T.border}`, borderRadius: 999,
              background: '#FAFAFC', outline: 'none', fontFamily: 'inherit',
            }} />
          <button onClick={submitReply} disabled={!replyText.trim() || sending} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: replyText.trim() ? T.ink : '#E0E0E4',
            color: T.white, border: 'none',
            cursor: replyText.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Send size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
    </article>
  )
}

function ReplyRow({ reply, teacher }: any) {
  const isTeacher = !!reply.teacher_id
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0,
        overflow: 'hidden',
        background: isTeacher && teacher.photo_url
          ? `url(${teacher.photo_url}) center/cover`
          : '#F0F0F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 600, color: T.ink2,
      }}>
        {!(isTeacher && teacher.photo_url) && (isTeacher ? teacher.name[0] : 'Y')}
      </div>
      <div style={{
        flex: 1, padding: '6px 10px', borderRadius: 12,
        background: isTeacher ? '#F0F4FF' : '#F4F4F6',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: T.ink2, margin: 0 }}>
          {isTeacher ? `${teacher.name} · Teacher` : 'You'}
        </p>
        <p style={{ fontSize: 13, color: T.ink, margin: '2px 0 0', lineHeight: 1.45,
                    whiteSpace: 'pre-wrap' }}>
          {reply.body}
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Compose modal — text + 1 image
   ────────────────────────────────────────────────────────── */
function ComposeUpdate({ teacher, onClose, onSent }: any) {
  const [body,  setBody]  = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [sending,   setSending]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/updates/image', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setImageUrl(json.url)
    } catch (e: any) {
      toast.error('Upload failed')
    }
    setUploading(false)
  }

  const send = async () => {
    if (!body.trim() && !imageUrl) {
      toast.error('Write something or add a photo'); return
    }
    setSending(true)
    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          body: body.trim(),
          image_url: imageUrl,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('Sent')
      onSent()
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
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                         letterSpacing: '-0.02em', margin: 0 }}>
              Send an update
            </h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
              To {teacher.name} · Quick update, not a chat
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            autoFocus rows={4}
            placeholder="Hi teacher, quick update on..."
            style={{
              width: '100%', padding: 0, fontSize: 16,
              border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'inherit', color: T.ink, background: 'transparent',
              boxSizing: 'border-box',
            }} />

          {imageUrl && (
            <div style={{ marginTop: 10, position: 'relative', width: 100, height: 100,
                          borderRadius: 12, overflow: 'hidden',
                          background: `url(${imageUrl}) center/cover` }}>
              <button onClick={() => setImageUrl(null)} style={{
                position: 'absolute', top: 4, right: 4,
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.white,
              }}>
                <X size={12} strokeWidth={2.4} />
              </button>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px 16px',
          borderTop: `1px solid ${T.border}`,
        }}>
          <button onClick={() => fileRef.current?.click()}
            disabled={uploading || !!imageUrl}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              background: 'none', border: `1px solid ${T.border}`,
              cursor: uploading || imageUrl ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, color: T.ink2,
              fontFamily: 'inherit', opacity: imageUrl ? 0.5 : 1,
            }}>
            <ImageIcon size={14} strokeWidth={1.8} />
            {uploading ? 'Uploading…' : imageUrl ? '1 photo' : 'Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) uploadImage(f)
              e.target.value = ''
            }} />

          <div style={{ flex: 1 }} />

          <button onClick={send} disabled={sending || uploading} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 999,
            background: T.ink, color: T.white, border: 'none',
            fontSize: 14, fontWeight: 600,
            cursor: sending ? 'wait' : 'pointer',
            opacity: sending ? 0.6 : 1, fontFamily: 'inherit',
          }}>
            <Send size={13} strokeWidth={2.2} />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 1)  return 'just now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7)    return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
