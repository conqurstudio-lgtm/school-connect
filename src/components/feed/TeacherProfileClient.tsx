// @ts-nocheck
'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Info, Send, X, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'


function sortMessagesOldestFirst(list: any[]) {
  return [...(list || [])].sort((a: any, b: any) =>
    new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
  )
}

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
  red:    '#EF4444',
}


function AttachmentPreviewTray({ attachment, onRemove }: any) {
  if (!attachment) return null

  return (
    <div style={{
      padding: '0 2px 8px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      overflowX: 'auto',
      scrollbarWidth: 'none',
    }}>
      <AttachmentCard attachment={attachment} compact onRemove={onRemove} />
    </div>
  )
}

interface Props {
  teacherId: string
}


type AttachmentDraft = {
  url: string
  name: string
  type: string
  is_image?: boolean
}

function updateAttachment(update: any): AttachmentDraft | null {
  if (update?.attachment_url) {
    return {
      url: update.attachment_url,
      name: update.attachment_name || 'Attachment',
      type: update.attachment_type || '',
      is_image: update.attachment_type?.startsWith?.('image/') || false,
    }
  }

  if (update?.image_url) {
    return {
      url: update.image_url,
      name: 'Image',
      type: 'image',
      is_image: true,
    }
  }

  return null
}

function AttachmentCard({ attachment, compact = false, onRemove }: any) {
  if (!attachment) return null

  const isImage = attachment.is_image || attachment.type?.startsWith?.('image/')

  if (isImage) {
    return (
      <div style={{ marginTop: 8, position: 'relative', maxWidth: compact ? 130 : '100%' }}>
        <img
          src={attachment.url}
          alt={attachment.name || 'Attachment'}
          style={{
            width: compact ? 96 : '100%',
            maxHeight: compact ? 96 : 280,
            objectFit: 'cover',
            borderRadius: 14,
            display: 'block',
            border: `1px solid ${T.border}`,
          }}
        />
        {onRemove && (
          <button onClick={onRemove} style={{
            position: 'absolute',
            top: -7,
            right: -7,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={13} strokeWidth={2.1} />
          </button>
        )}
      </div>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: compact ? '8px 9px' : '10px 12px',
        borderRadius: 14,
        background: '#F4F4F6',
        border: `1px solid ${T.border}`,
        color: T.ink,
        textDecoration: 'none',
        maxWidth: compact ? 220 : '100%',
      }}
    >
      <FileText size={17} strokeWidth={1.9} style={{ flexShrink: 0 }} />
      <span style={{
        fontSize: compact ? 12 : 13,
        fontWeight: 700,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
      }}>
        {attachment.name || 'Document'}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onRemove() }}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0,0,0,0.05)',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      )}
    </a>
  )
}

type ThreadItem =
  | { kind: 'message'; created_at: string; data: any }
  | { kind: 'report'; created_at: string; data: any }

export function TeacherProfileClient({ teacherId }: Props) {
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [canMessage, setCanMessage] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoin, setShowJoin] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<AttachmentDraft | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadScrollRef = useRef<HTMLDivElement>(null)

  const forceScrollToBottom = (smooth = true) => {
    const run = () => {
      const el = threadScrollRef.current

      if (el) {
        const top = el.scrollHeight + 9999
        if (typeof el.scrollTo === 'function') {
          el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
        } else {
          el.scrollTop = top
        }
      }

      bottomRef.current?.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
        inline: 'nearest',
      })

      // Fallback for screens where the page itself is the scroll container.
      try {
        window.scrollTo({
          top: document.documentElement.scrollHeight + document.body.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        })
      } catch {}
    }

    run()
    window.requestAnimationFrame(run)
    window.setTimeout(run, 80)
    window.setTimeout(run, 240)
    window.setTimeout(run, 600)
  }


  const markThreadSeen = async (id = teacherId) => {
    try {
      await fetch('/api/thread-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: id }),
      })
      window.dispatchEvent(new CustomEvent('teacher-thread-seen', { detail: { teacherId: id } }))
    } catch {}
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teachers/${teacherId}/profile`, { cache: 'no-store' })
      const json = await res.json()

      if (res.status === 401) {
        window.location.href = '/auth/login'
        return
      }

      if (!res.ok) throw new Error(json.error || 'Could not load teacher')

      setTeacher(json.teacher)
      setJoinStatus(json.join_status || (json.is_my_teacher ? 'approved' : 'none'))
      setCanMessage(!!json.is_my_teacher)
      setReports(json.reports ?? [])

      if (json.is_my_teacher) {
        await loadThread(json.teacher.id)
      } else {
        setUpdates([])
      }
    } catch (e: any) {
      toast.error(e.message || 'Could not load teacher')
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (id = teacherId) => {
    try {
      const res = await fetch(`/api/updates?teacher_id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()

      if (res.ok) {
        const list = json.updates ?? []
        setUpdates(list)
        forceScrollToBottom(false)
        setCanMessage(!!json.can_message)

        try { await markThreadSeen(id) } catch {}
      }
    } catch {}
  }

  useEffect(() => { load() }, [teacherId])

  // scroll-after-loading: the thread is not mounted while the loading screen is showing.
  // So we scroll only after loading becomes false and the real message container exists.
  useLayoutEffect(() => {
    if (loading || !canMessage) return
    forceScrollToBottom(false)
  }, [loading, canMessage, updates.length, reports.length, teacherId])








  useEffect(() => {
    if (!canMessage) return
    const id = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 120)
    return () => window.clearTimeout(id)
  }, [loading, canMessage, updates.length, reports.length])

  const handlePickAttachment = async (file?: File | null) => {
    if (!file) return

    setUploadingAttachment(true)
    const tid = toast.loading('Attaching…')

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/updates/attachment', {
        method: 'POST',
        body: form,
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not attach file')

      setAttachment(json.attachment)
      toast.success('Attachment ready', { id: tid })
    } catch (e: any) {
      toast.error(e.message || 'Could not attach file', { id: tid })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const sendMessage = async () => {
    const text = message.trim()
    const currentAttachment = attachment
    if ((!text && !currentAttachment) || sending || !teacher?.id) return

    const tempId = `optimistic-parent-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      teacher_id: teacher.id,
      body: text,
      image_url: null,
      attachment_url: currentAttachment?.url || null,
      attachment_name: currentAttachment?.name || null,
      attachment_type: currentAttachment?.type || null,
      author_kind: 'parent',
      created_at: new Date().toISOString(),
      _optimistic: true,
    }

    setMessage('')
    setAttachment(null)
    setUpdates(prev => [...prev, optimisticMessage])
    forceScrollToBottom(true)
    setSending(true)

    try {
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacher.id,
          body: text,
          image_url: null,
          attachment_url: currentAttachment?.url || null,
          attachment_name: currentAttachment?.name || null,
          attachment_type: currentAttachment?.type || null,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not send message')

      if (json.update?.id) {
        setUpdates(prev => prev.map((item: any) =>
          item.id === tempId ? { ...json.update, image_url: json.update?.attachment_url ? null : json.update?.image_url } : item
        ))
      } else {
        await loadThread(teacher.id)
      }

      forceScrollToBottom(true)
    } catch (e: any) {
      setUpdates(prev => prev.filter((item: any) => item.id !== tempId))
      setMessage(text)
      setAttachment(currentAttachment)
      toast.error(e.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }


  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${T.border}`,
          borderTopColor: T.ink,
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        fontFamily: 'Inter, -apple-system, sans-serif',
        padding: 24,
      }}>
        <p style={{ fontSize: 14, color: T.ink3, margin: 0 }}>Teacher not found.</p>
      </div>
    )
  }

  const initials = teacher.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const threadItems: ThreadItem[] = [
    ...sortMessagesOldestFirst(updates).map((u: any) => ({
      kind: 'message' as const,
      created_at: u.created_at,
      data: u,
    })),
    ...[...(reports || [])].sort((a: any, b: any) => new Date(a?.published_at || a?.created_at || a?.week_starting || 0).getTime() - new Date(b?.published_at || b?.created_at || b?.week_starting || 0).getTime()).map((r: any) => ({
      kind: 'report' as const,
      created_at: r.published_at || r.created_at || r.week_starting,
      data: r,
    })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        background: 'rgba(252,252,255,0.98)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '14px 16px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <button
            onClick={() => {
              try { sessionStorage.setItem('feed-left', '1') } catch {}
              router.back()
            }}
            aria-label="Back"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: 'transparent',
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} strokeWidth={1.8} />
          </button>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            overflow: 'hidden',
            background: teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}>
            {!teacher.photo_url && initials}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{
              fontSize: 14,
              color: T.ink,
              fontWeight: 600,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {teacher.name}
            </h1>
            <p style={{
              fontSize: 11,
              color: T.ink3,
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {!canMessage ? (
        <div style={{ padding: '20px' }}>
          <div style={{
            padding: '18px 16px',
            borderRadius: 18,
            border: `1px dashed ${T.border}`,
            background: T.white,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <Info size={18} color={T.ink3} strokeWidth={1.6}
              style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 14,
                color: T.ink,
                fontWeight: 750,
                margin: '0 0 4px',
              }}>
                {joinStatus === 'pending'
                  ? 'Request sent'
                  : joinStatus === 'rejected'
                    ? 'Request was not approved'
                    : 'Join this class'}
              </p>
              <p style={{
                fontSize: 13,
                color: T.ink3,
                margin: 0,
                lineHeight: 1.5,
              }}>
                {joinStatus === 'pending'
                  ? 'Your request is waiting for the teacher to approve that your child is in this class.'
                  : joinStatus === 'rejected'
                    ? 'You can ask the school or send a new request if this was a mistake.'
                    : 'Send your child’s details to the teacher. Once approved, this becomes your private teacher conversation space.'}
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
                  fontWeight: 750,
                }}>
                  {joinStatus === 'rejected' ? 'Send new request' : 'Join'}
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
      ) : (
        <>
          <div ref={threadScrollRef} style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            overscrollBehavior: 'contain',
            padding: '10px 0 90px',
          }}>
            {threadItems.length === 0 ? (
              <EmptyConversation teacher={teacher} />
            ) : (
              threadItems.map((item, index) => {
                if (item.kind === 'report') {
                  return (
                    <ReportThreadCard
                      key={`report-${item.data.id}-${index}`}
                      report={item.data}
                      teacher={teacher}
                    />
                  )
                }

                return (
                  <MessageRow
                    key={`msg-${item.data.id}-${index}`}
                    update={item.data}
                    teacher={teacher}
                    onChanged={() => loadThread(teacher.id)}
                  />
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 30,
            background: 'rgba(252,252,255,0.96)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: '10px 12px 14px',
          }}>
            <AttachmentPreviewTray
              attachment={attachment}
              onRemove={() => setAttachment(null)}
            />

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 22,
              padding: '8px 8px 8px 10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handlePickAttachment(f)
                  e.currentTarget.value = ''
                }}
              />

              <button
                type="button"
                aria-label="Attach file"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAttachment}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: attachment ? '#EAF1FF' : '#F4F4F6',
                  color: attachment ? T.blue : T.ink2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingAttachment ? 'wait' : 'pointer',
                  flexShrink: 0,
                }}
              >
                <Paperclip size={15} strokeWidth={2.1} />
              </button>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                rows={1}
                placeholder="Message..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  background: 'transparent',
                  color: T.ink,
                  fontSize: 16,
                  lineHeight: 1.35,
                  maxHeight: 90,
                  fontFamily: 'inherit',
                  padding: '8px 0',
                }}
              />

              <button
                onClick={sendMessage}
                disabled={(!message.trim() && !attachment) || sending}
                aria-label="Send"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: (message.trim() || attachment) && !sending ? T.ink : '#D4D4D8',
                  color: T.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (message.trim() || attachment) && !sending ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
              >
                <Send size={15} strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MessageRow({ update, teacher, onChanged }: any) {
  const isTeacher = update.author_kind === 'teacher'
  const attachment = updateAttachment(update)
  const initials = isTeacher
    ? teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'You'.slice(0, 1)

  return (
    <article style={{
      display: 'flex',
      gap: 10,
      padding: '8px 16px',
      flexDirection: isTeacher ? 'row' : 'row-reverse',
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        overflow: 'hidden',
        background: isTeacher && teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
        color: T.ink2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 800,
        flexShrink: 0,
        marginTop: 2,
      }}>
        {!(isTeacher && teacher.photo_url) && initials}
      </div>

      <div style={{
        maxWidth: '74%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isTeacher ? 'flex-start' : 'flex-end',
      }}>
        <div style={{
          borderRadius: isTeacher ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
          background: isTeacher ? T.white : '#F4F4F6',
          color: T.ink,
          border: isTeacher ? `1px solid ${T.border}` : 'none',
          padding: '9px 12px',
        }}>
          {update.body && (
            <p style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {update.body}
            </p>
          )}
          {update.image_url && !attachment && (
            <img
              src={update.image_url}
              alt=""
              style={{
                width: '100%',
                borderRadius: 10,
                marginTop: update.body ? 8 : 0,
                display: 'block',
              }}
            />
          )}
        </div>

        {attachment && <AttachmentCard attachment={attachment} />}

        <p style={{
          fontSize: 10,
          color: T.ink3,
          margin: '4px 4px 0',
        }}>
          {relTime(update.created_at)}
        </p>

        {update.update_replies?.length > 0 && (
          <div style={{ marginTop: 6, width: '100%' }}>
            {update.update_replies.map((reply: any) => (
              <ReplyBubble key={reply.id} reply={reply} teacher={teacher} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function ReplyBubble({ reply, teacher }: any) {
  const isTeacher = !!reply.teacher_id
  return (
    <div style={{
      marginTop: 6,
      padding: '7px 9px',
      borderRadius: 12,
      background: isTeacher ? '#F0F4FF' : '#F4F4F6',
      color: T.ink2,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 2px' }}>
        {isTeacher ? teacher.name : 'You'}
      </p>
      <p style={{ fontSize: 12, lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>
        {reply.body}
      </p>
    </div>
  )
}

function ReportThreadCard({ report, teacher }: any) {
  const scoreValues = Object.values(report.scores || {})
  const avg = scoreValues.length
    ? scoreValues.reduce((a: number, b: any) => a + Number(b || 0), 0) / scoreValues.length
    : 0

  return (
    <div style={{ padding: '10px 16px' }}>
      <div style={{
        margin: '0 auto',
        maxWidth: 360,
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: '#F0F4FF',
            color: T.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileText size={18} strokeWidth={1.8} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 650,
              color: T.ink,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              Weekly Report
            </p>
            <p style={{
              fontSize: 11,
              color: T.ink3,
              margin: '2px 0 0',
            }}>
              {formatWeek(report.week_starting)} · {avg.toFixed(1)}/5
            </p>
          </div>
        </div>

        {report.comment && (
          <p style={{
            fontSize: 12.5,
            color: T.ink2,
            lineHeight: 1.45,
            margin: '10px 0 0',
          }}>
            {report.comment}
          </p>
        )}

        <button
          onClick={() => { window.location.href = '/reports' }}
          style={{
            width: '100%',
            marginTop: 12,
            border: 'none',
            borderRadius: 999,
            background: T.ink,
            color: T.white,
            padding: '13px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          View report
        </button>
      </div>
    </div>
  )
}

function EmptyConversation({ teacher }: any) {
  return (
    <div style={{
      padding: '70px 28px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 54,
        height: 54,
        borderRadius: 16,
        background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
        margin: '0 auto 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.ink2,
        fontWeight: 800,
      }}>
        {!teacher.photo_url && teacher.name?.charAt(0)}
      </div>
      <p style={{
        fontSize: 15,
        color: T.ink,
        fontWeight: 750,
        margin: '0 0 5px',
      }}>
        Start a private message
      </p>
      <p style={{
        fontSize: 13,
        color: T.ink3,
        margin: 0,
        lineHeight: 1.5,
      }}>
        Send a short note to {teacher.name}. Class posts still stay on the main feed.
      </p>
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
        padding: 20,
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              color: T.ink,
              letterSpacing: '-0.025em',
              margin: 0,
            }}>
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
          <input
            autoFocus
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Child first name"
            style={joinInputStyle}
          />
          <input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Child surname"
            style={joinInputStyle}
          />
        </div>

        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          style={{ ...joinInputStyle, marginTop: 10 }}
        >
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
          {sending ? 'Sending request...' : 'Send request'}
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
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}

function formatWeek(date: string): string {
  if (!date) return 'Report'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
