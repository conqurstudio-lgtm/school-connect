// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { X, Send, Heart, MessageCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
  red:    '#EF4444',
}

interface Props {
  postId:    string
  initialTab?: 'reactions' | 'comments'
  teacher:   { id: string; name: string; photo_url: string | null }
  onClose:   () => void
  onChanged: () => void
}

export function EngagementSheet({ postId, initialTab = 'reactions', teacher, onClose, onChanged }: Props) {
  const [tab,       setTab]       = useState<'reactions' | 'comments'>(initialTab)
  const [reactions, setReactions] = useState<any[]>([])
  const [comments,  setComments]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [replying,  setReplying]  = useState(false)
  const [reply,     setReply]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/post-engagement?post_id=${postId}`)
      const json = await res.json()
      if (res.ok) {
        setReactions(json.reactions ?? [])
        setComments(json.comments ?? [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [postId])

  const submitReply = async () => {
    const text = reply.trim()
    if (!text) return
    setReplying(true)
    try {
      const res = await fetch('/api/teacher/post-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, body: text }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      setReply('')
      load()
      onChanged()
    } catch (e: any) {
      toast.error(e.message || 'Failed to post')
    }
    setReplying(false)
  }

  const deleteMyComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await fetch(`/api/teacher/post-engagement?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      load(); onChanged()
    } catch { toast.error('Could not delete') }
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
        animation: 'slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Tab header */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${T.border}`,
          position: 'relative',
        }}>
          <TabBtn label={`Reactions · ${reactions.length}`}
            icon={<Heart size={13} strokeWidth={1.8} />}
            active={tab === 'reactions'} onClick={() => setTab('reactions')} />
          <TabBtn label={`Comments · ${comments.length}`}
            icon={<MessageCircle size={13} strokeWidth={1.8} />}
            active={tab === 'comments'} onClick={() => setTab('comments')} />
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', right: 12, top: 12,
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${T.border}`, borderTopColor: T.ink,
                            animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : tab === 'reactions' ? (
            <ReactionsList reactions={reactions} />
          ) : (
            <CommentsList comments={comments} teacher={teacher} onDelete={deleteMyComment} />
          )}
        </div>

        {/* Reply input — only on Comments tab */}
        {tab === 'comments' && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center',
            padding: '10px 12px', borderTop: `1px solid ${T.border}`,
            background: T.white,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: teacher.photo_url
                ? `url(${teacher.photo_url}) center/cover`
                : '#F0F0F4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 12, color: T.ink2, fontWeight: 600,
            }}>
              {!teacher.photo_url && teacher.name.charAt(0).toUpperCase()}
            </div>
            <input value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !replying) submitReply() }}
              placeholder="Reply as the teacher…"
              disabled={replying}
              style={{
                flex: 1, padding: '9px 14px', fontSize: 14,
                border: `1px solid ${T.border}`, borderRadius: 999,
                background: '#FAFAFC', color: T.ink, outline: 'none',
                fontFamily: 'inherit',
              }} />
            <button onClick={submitReply} disabled={replying || !reply.trim()} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: reply.trim() ? T.ink : '#E0E0E4',
              color: T.white, border: 'none',
              cursor: reply.trim() && !replying ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.2s ease',
            }}>
              <Send size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TabBtn({ label, icon, active, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, height: 52, background: 'none', border: 'none',
      borderBottom: active ? `2px solid ${T.ink}` : '2px solid transparent',
      marginBottom: -1,
      color: active ? T.ink : T.ink3,
      fontSize: 13, fontWeight: active ? 600 : 500,
      cursor: 'pointer', fontFamily: 'inherit',
      transition: 'color 0.15s ease',
    }}>
      {icon}
      {label}
    </button>
  )
}

function ReactionsList({ reactions }: { reactions: any[] }) {
  if (reactions.length === 0) {
    return (
      <Empty title="No reactions yet"
        body="Reactions from parents in your class will show here." />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {reactions.map(r => <PersonRow key={r.id} entry={r} trailing={emoji(r.type)} />)}
    </div>
  )
}

function CommentsList({ comments, teacher, onDelete }: any) {
  if (comments.length === 0) {
    return (
      <Empty title="No comments yet"
        body="Replies from parents in your class will show here." />
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {comments.map((c: any) => {
        const isTeacherComment = c.teacher_id === teacher.id
        return (
          <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: isTeacherComment && teacher.photo_url
                ? `url(${teacher.photo_url}) center/cover`
                : '#F0F0F4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 11, color: T.ink2, fontWeight: 600,
            }}>
              {!(isTeacherComment && teacher.photo_url) && (
                (isTeacherComment ? teacher.name : (c.user_name || 'P')).charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                background: isTeacherComment ? '#F0F4FF' : '#F4F4F6',
                borderRadius: 14, padding: '8px 12px',
              }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: T.ink,
                  letterSpacing: '-0.005em', margin: 0,
                }}>
                  {isTeacherComment ? `${teacher.name} · Teacher` : c.user_name}
                  {!isTeacherComment && c.child_name && (
                    <span style={{ fontWeight: 400, color: T.ink3, marginLeft: 6,
                                   fontSize: 11 }}>
                      ({c.child_name}'s parent)
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 13.5, color: T.ink, margin: '3px 0 0',
                            lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                  {c.body}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                            marginTop: 4, paddingLeft: 4 }}>
                <span style={{ fontSize: 11, color: T.ink3 }}>{relTime(c.created_at)}</span>
                {isTeacherComment && (
                  <button onClick={() => onDelete(c.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: T.ink3, padding: 0, fontSize: 11,
                    fontFamily: 'inherit',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    <Trash2 size={10} strokeWidth={1.8} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PersonRow({ entry, trailing }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 8px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: '#F0F0F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 13, color: T.ink2, fontWeight: 600,
      }}>
        {(entry.user_name || 'P').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.ink,
                    letterSpacing: '-0.005em', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.user_name}
        </p>
        {entry.child_name && (
          <p style={{ fontSize: 11, color: T.ink3, margin: '1px 0 0' }}>
            {entry.child_name}'s parent
          </p>
        )}
      </div>
      <div style={{ fontSize: 20, flexShrink: 0 }}>{trailing}</div>
    </div>
  )
}

function Empty({ title, body }: any) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: T.ink, fontWeight: 600,
                  margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontSize: 12, color: T.ink3, margin: 0, lineHeight: 1.5 }}>{body}</p>
    </div>
  )
}

function emoji(type: string) {
  if (type === 'love') return '❤️'
  if (type === 'like') return '👍'
  if (type === 'celebrate') return '🎉'
  return '👏'
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })
}
