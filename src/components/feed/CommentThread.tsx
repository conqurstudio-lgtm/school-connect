'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatFeedDate } from '@/lib/utils'
import { Send, Lock, Globe, Check, ThumbsUp, MessageCircle, X } from 'lucide-react'
import type { Comment, Profile } from '@/lib/types'
import toast from 'react-hot-toast'

interface CommentThreadProps {
  postId:   string
  schoolId: string
  userId:   string
  isSchool: boolean
}

interface CommentWithProfile extends Comment {
  profile?: Profile
  replies?: (Comment & { profile?: Profile })[]
}

const supabase = createClient()

const T = {
  ink:     '#1A1A1A',
  ink2:    '#4A4A4A',
  ink3:    '#9A9A9A',
  border:  'rgba(0,0,0,0.07)',
  bg:      '#FAFAFA',
  blue:    '#2B8EE8',
  green:   '#22C55E',
  red:     '#E8281E',
  white:   '#FFFFFF',
}

function btn(active = false, color = T.blue) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 500,
    padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
    border: 'none', fontFamily: 'inherit',
    background: active ? `${color}18` : 'transparent',
    color: active ? color : T.ink3,
    transition: 'all 0.12s',
  } as React.CSSProperties
}

export function CommentThread({ postId, schoolId, userId, isSchool }: CommentThreadProps) {
  const [comments,   setComments]   = useState<CommentWithProfile[]>([])
  const [loading,    setLoading]    = useState(true)
  const [body,       setBody]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody,  setReplyBody]  = useState('')

  const parentRef = useRef<HTMLInputElement>(null)
  const replyRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isSchool) setTimeout(() => parentRef.current?.focus(), 120)
  }, [isSchool])

  useEffect(() => {
    if (replyingTo) setTimeout(() => replyRef.current?.focus(), 120)
  }, [replyingTo])

  const fetchComments = useCallback(async () => {
    try {
    if (isSchool) {
      const { data: raw } = await supabase
        .from('comments').select('*, profiles(*)')
        .eq('post_id', postId).eq('is_school_reply', false)
        .order('created_at', { ascending: true })
      if (!raw) { setLoading(false); return }

      const { data: replies } = await supabase
        .from('comments').select('*, profiles(*)')
        .eq('post_id', postId).eq('is_school_reply', true)
        .order('created_at', { ascending: true })

      const rMap: Record<string, (Comment & { profile?: Profile })[]> = {}
      replies?.forEach(r => {
        if (r.parent_id) {
          rMap[r.parent_id] = rMap[r.parent_id] || []
          rMap[r.parent_id].push({ ...r, profile: r.profiles })
        }
      })
      setComments(raw.map(c => ({ ...c, profile: c.profiles, replies: rMap[c.id] || [] })))
    } else {
      const { data: raw } = await supabase
        .from('comments').select('*, profiles(*)')
        .eq('post_id', postId).eq('is_school_reply', false)
        .or(`author_id.eq.${userId},visibility.eq.public`)
        .order('created_at', { ascending: true })
      if (!raw) { setLoading(false); return }

      const ids = raw.map(c => c.id)
      const rMap: Record<string, (Comment & { profile?: Profile })[]> = {}
      if (ids.length > 0) {
        const { data: replies } = await supabase
          .from('comments').select('*, profiles(*)')
          .in('parent_id', ids).eq('is_school_reply', true)
          .order('created_at', { ascending: true })
        replies?.forEach(r => {
          if (r.parent_id) {
            rMap[r.parent_id] = rMap[r.parent_id] || []
            rMap[r.parent_id].push({ ...r, profile: r.profiles })
          }
        })
      }
      setComments(raw.map(c => ({ ...c, profile: c.profiles, replies: rMap[c.id] || [] })))
    }
    setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [postId, userId, isSchool])

  useEffect(() => { fetchComments() }, [fetchComments])

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId, school_id: schoolId, author_id: userId,
      body: body.trim(), is_school_reply: false, visibility: 'private',
    })
    if (error) toast.error('Failed to send.')
    else { setBody(''); await fetchComments() }
    setSubmitting(false)
  }

  const handleReply = async (commentId: string) => {
    if (!replyBody.trim() || submitting) return
    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId, school_id: schoolId, parent_id: commentId,
      author_id: userId, body: replyBody.trim(), is_school_reply: true, visibility: 'private',
    })
    if (!error) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        await supabase.from('notifications').insert({
          recipient_id: comment.author_id, school_id: schoolId,
          type: 'comment_reply', post_id: postId, comment_id: commentId,
          message: 'The school replied to your question.',
        })
      }
      setReplyBody(''); setReplyingTo(null); await fetchComments()
    } else toast.error('Failed to send reply.')
    setSubmitting(false)
  }

  const handleAcknowledge = async (id: string, current: boolean) => {
    await supabase.from('comments')
      .update({ is_acknowledged: !current, acknowledged_at: !current ? new Date().toISOString() : null })
      .eq('id', id)
    await fetchComments()
  }

  const handleTogglePublic = async (id: string, vis: string) => {
    const next = vis === 'private' ? 'public' : 'private'
    await supabase.from('comments')
      .update({ visibility: next, made_public_at: next === 'public' ? new Date().toISOString() : null })
      .eq('id', id)
    toast.success(next === 'public' ? 'Now visible to all parents' : 'Set to private')
    await fetchComments()
  }

  return (
    <div style={{ background: T.bg, borderTop: `1px solid ${T.border}` }}>

      {/* Privacy notice */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderBottom: `1px solid ${T.border}`,
      }}>
        <Lock style={{ width: 11, height: 11, color: T.ink3, flexShrink: 0 }} />
        <p style={{ fontSize: 11, color: T.ink3, margin: 0, lineHeight: 1.4 }}>
          {isSchool
            ? 'Parent questions are private. You can make select ones public.'
            : 'Your question is private — only you and the school can see it.'}
        </p>
      </div>

      {/* Comments */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EBEBEB', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 11, width: '40%', background: '#EBEBEB', borderRadius: 4, marginBottom: 6 }} />
                <div style={{ height: 11, width: '75%', background: '#EBEBEB', borderRadius: 4 }} />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <MessageCircle style={{ width: 24, height: 24, color: '#DDDDDD', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
              {isSchool ? 'No questions yet.' : 'Ask the school a question.'}
            </p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id}>
              {/* Comment bubble */}
              <div style={{
                background: T.white, borderRadius: 12,
                border: `1px solid ${T.border}`, padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {/* Avatar initial */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: '#E8E8E8', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 600, color: T.ink3,
                  }}>
                    {(comment.profile?.full_name ?? 'P').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
                        {comment.profile?.full_name ?? 'Parent'}
                      </span>
                      {comment.profile?.child_grade && (
                        <span style={{ fontSize: 11, color: T.ink3 }}>
                          · {comment.profile.child_grade}
                        </span>
                      )}
                      {comment.visibility === 'public' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2,
                                       fontSize: 10, fontWeight: 600, color: T.green }}>
                          <Globe style={{ width: 9, height: 9 }} /> Public
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: T.ink3, marginLeft: 'auto' }}>
                        {formatFeedDate(comment.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.ink2, margin: '3px 0 0', lineHeight: 1.5 }}>
                      {comment.body}
                    </p>
                  </div>
                </div>

                {/* School action row */}
                {isSchool && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                    marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}`,
                  }}>
                    <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            style={btn(replyingTo === comment.id, T.blue)}>
                      <MessageCircle style={{ width: 11, height: 11 }} />
                      Reply
                    </button>
                    <button onClick={() => handleAcknowledge(comment.id, comment.is_acknowledged)}
                            style={btn(comment.is_acknowledged, T.blue)}>
                      <ThumbsUp style={{ width: 11, height: 11 }} />
                      {comment.is_acknowledged ? 'Liked' : 'Like'}
                    </button>
                    <button onClick={() => handleTogglePublic(comment.id, comment.visibility)}
                            style={btn(comment.visibility === 'public', T.green)}>
                      {comment.visibility === 'public'
                        ? <><Globe style={{ width: 11, height: 11 }} /> Public</>
                        : <><Lock style={{ width: 11, height: 11 }} /> Make public</>
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Reply input */}
              {isSchool && replyingTo === comment.id && (
                <div style={{ marginTop: 6, marginLeft: 20, display: 'flex', gap: 8 }}>
                  <input
                    ref={replyRef}
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(comment.id) } }}
                    placeholder="Reply to parent…"
                    style={{
                      flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 10,
                      border: `1px solid ${T.border}`, background: T.white,
                      outline: 'none', fontFamily: 'inherit', color: T.ink,
                    }}
                  />
                  <button onClick={() => handleReply(comment.id)} disabled={!replyBody.trim() || submitting}
                          style={{
                            width: 36, height: 36, borderRadius: 10, border: 'none',
                            background: replyBody.trim() ? '#1A1A1A' : '#E8E8E8',
                            color: replyBody.trim() ? T.white : T.ink3,
                            cursor: replyBody.trim() ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                    <Send style={{ width: 14, height: 14 }} />
                  </button>
                  <button onClick={() => { setReplyingTo(null); setReplyBody('') }}
                          style={{
                            width: 36, height: 36, borderRadius: 10, border: 'none',
                            background: 'transparent', color: T.ink3, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}

              {/* School replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: 6, marginLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {comment.replies.map(reply => (
                    <div key={reply.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      background: `${T.blue}0D`, borderRadius: 12,
                      border: `1px solid ${T.blue}22`, padding: '8px 12px',
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: '#1A1A1A', display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: T.white }}>S</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: T.blue }}>School</span>
                          <Check style={{ width: 10, height: 10, color: T.blue }} />
                          <span style={{ fontSize: 10, color: T.ink3, marginLeft: 'auto' }}>
                            {formatFeedDate(reply.created_at)}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: T.ink2, margin: '2px 0 0', lineHeight: 1.5 }}>
                          {reply.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Parent input */}
      {!isSchool && (
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: T.white, borderRadius: 12, padding: '8px 12px',
            border: `1px solid ${T.border}`,
          }}>
            <input
              ref={parentRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Ask the school a question…"
              style={{
                flex: 1, fontSize: 13, background: 'none',
                border: 'none', outline: 'none', fontFamily: 'inherit', color: T.ink,
              }}
              autoComplete="off"
            />
            <button
              onClick={handleSubmit}
              disabled={!body.trim() || submitting}
              style={{
                width: 32, height: 32, borderRadius: 9, border: 'none', flexShrink: 0,
                background: body.trim() ? '#1A1A1A' : '#EBEBEB',
                color: body.trim() ? T.white : T.ink3,
                cursor: body.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {submitting
                ? <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: T.white, animation: 'spin 0.7s linear infinite' }} />
                : <Send style={{ width: 13, height: 13 }} />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
