// @ts-nocheck
'use client'
// readable-content-typography-restore-v1

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Info, Send, X, Paperclip } from 'lucide-react'
import { AttachmentCard, AttachmentPreviewTray, updateAttachment, type AttachmentDraft } from '@/components/messages/MessageAttachment'
import { MessageBubble } from '@/components/messages/MessageBubble'
import { BackIcon } from '@/components/ui/BackIcon'
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


interface Props {
  teacherId: string
  publicMode?: boolean
}


type ThreadItem =
  | { kind: 'message'; created_at: string; data: any }
  | { kind: 'report'; created_at: string; data: any }

export function TeacherProfileClient({ teacherId, publicMode = false }: Props) {
  const router = useRouter()
  const [hydrated, setHydrated] = useState(false)
  const [teacher, setTeacher] = useState<any>(null)
  const [joinStatus, setJoinStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none')
  const [canMessage, setCanMessage] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [classSpaceTab, setClassSpaceTab] = useState<'life' | 'messages' | 'reports'>('life')
  const [classLifePosts, setClassLifePosts] = useState<any[]>([])
  const [classLifeLoading, setClassLifeLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
const [showJoin, setShowJoin] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState<AttachmentDraft | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageLandingRef = useRef(false)
  const messageLandingDoneRef = useRef(false)
  const messageUserInteractedRef = useRef(false)
  const composerDockRef = useRef<HTMLDivElement | null>(null)
  const scrollRafRef = useRef<number | null>(null)
  const previousThreadCountRef = useRef(0)
  const messageScrollReadyRef = useRef(false)

  const isMessageListNearBottom = () => {
    const el = threadScrollRef.current
    if (!el) return true

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    return distance < 180
  }

  const scrollToLatestMessage = (
  reason = 'latest',
  behavior: ScrollBehavior = 'auto',
  force = true,
) => {
  // parent-message-scroll-freedom-v1:
  // Background scroll control disabled.
  // Messages use one-time landing only, then user scroll is free.
}

  // scroll-anchor-disabled-v1
  useEffect(() => {
    previousThreadCountRef.current = 0
  }, [teacherId])

  useEffect(() => {
    if (!hydrated || !canMessage || classSpaceTab !== 'messages') return
    scrollToLatestMessage('messages-tab-open', 'auto', true)
  }, [classSpaceTab, canMessage, teacherId])

  useEffect(() => {
    if (!hydrated || !canMessage || classSpaceTab !== 'messages') return
    if (threadLoading) return

    const totalItems = (updates?.length || 0)
    const firstThreadLoad = previousThreadCountRef.current === 0 && totalItems > 0
    const countChanged = previousThreadCountRef.current !== totalItems

    if (firstThreadLoad || countChanged || isMessageListNearBottom()) {
      scrollToLatestMessage(
        'thread-items-ready',
        'auto',
        firstThreadLoad || isMessageListNearBottom()
      )
    }

    previousThreadCountRef.current = totalItems
  }, [
    updates.length,
    threadLoading,
    canMessage,
    classSpaceTab,
    teacherId,
  ])

  useEffect(() => {
    if (classSpaceTab !== 'messages') return

    const el = threadScrollRef.current
    if (!el) return

    const onMediaLoad = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      if (target.tagName === 'IMG' && isMessageListNearBottom()) {
        scrollToLatestMessage('media-loaded', 'auto', false)
      }
    }

    el.addEventListener('load', onMediaLoad, true)

    return () => {
      el.removeEventListener('load', onMediaLoad, true)
    }
  }, [classSpaceTab, updates.length])

  useEffect(() => {
    if (classSpaceTab !== 'messages') return

    const dock = composerDockRef.current
    if (!dock || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (isMessageListNearBottom()) {
        scrollToLatestMessage('composer-resized', 'auto', false)
      }
    })

    observer.observe(dock)

    return () => observer.disconnect()
  }, [classSpaceTab])


  // parent-composer-smooth-v1: using the simpler teacher-style scroll behaviour.

  const threadScrollRef = useRef<HTMLDivElement>(null)

  const forceScrollToBottom = (smooth = false) => {
    const run = () => {
      const el = threadScrollRef.current
      if (!el) return

      const top = Math.max(0, el.scrollHeight - el.clientHeight)
      if (typeof el.scrollTo === 'function') {
        el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' })
      } else {
        el.scrollTop = top
      }
    }

    requestAnimationFrame(run)
  }

  // parent-message-scroll-freedom-reset-v1
  useEffect(() => {
    if (classSpaceTab !== 'messages') {
      messageLandingDoneRef.current = false
      messageUserInteractedRef.current = false
    }
  }, [classSpaceTab, teacherId])


  // parent-class-space-hydration-guard-v1
  useEffect(() => {
    setHydrated(true)
  }, [])

  const loadClassLife = async (id = teacherId) => {
    setClassLifeLoading(true)

    try {
      const res = await fetch(`/api/parent/class-life?teacher_id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({ posts: [] }))

      if (res.ok) {
        setClassLifePosts(json.posts ?? [])
      } else {
        setClassLifePosts([])
      }
    } catch {
      setClassLifePosts([])
    }

    setClassLifeLoading(false)
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
    // parent-message-fast-load-v1:
    // Load the teacher profile first, then show the page immediately.
    // Messages load as an inline thread state instead of blocking the whole screen.
    setLoading(true)
    setThreadLoading(false)
try {
      const res = await fetch(`/api/teachers/${teacherId}/profile${publicMode ? '?public=1' : ''}`, { cache: 'no-store' })
      const json = await res.json()

      if (res.status === 401) {
        if (publicMode) {
          setCanMessage(false)
          setJoinStatus('none')
          throw new Error('Could not load public class invite')
        }

        window.location.href = '/auth/login'
        return
      }

      if (!res.ok) throw new Error(json.error || 'Could not load teacher')

      setTeacher(json.teacher)
      setJoinStatus(json.join_status || (json.is_my_teacher ? 'approved' : 'none'))
      setCanMessage(!!json.is_my_teacher)
      setReports(json.reports ?? [])

      // Stop the full-page spinner as soon as the teacher/profile data is ready.
      setLoading(false)

      if (json.is_my_teacher) {
        loadThread(json.teacher.id)
      } else {
        setUpdates([])
}
    } catch (e: any) {
      setLoading(false)
      toast.error(e.message || 'Could not load teacher')
    }
  }

  const loadThread = async (id = teacherId) => {
    // parent-thread-fast-open-v2:
    // Do not keep a blocking loader while positioning the thread.
    // The useLayoutEffect below scrolls the internal message container before paint.
    setThreadLoading(true)

    try {
      const res = await fetch(`/api/updates?teacher_id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()

      if (res.ok) {
        const list = json.updates ?? []
        setUpdates(list)
        setCanMessage(!!json.can_message)

        try { await markThreadSeen(id) } catch {}
      }
    } catch {
    } finally {
      setThreadLoading(false)
    }
  }
  useEffect(() => { load() }, [teacherId, publicMode])
  // parent-thread-fast-open-v2:
  // Keep the thread feeling instant. When messages arrive, useLayoutEffect
  // positions the internal message container before the browser paints.
  useLayoutEffect(() => {
    if (loading || threadLoading || !canMessage || classSpaceTab !== 'messages') return
    if (messageLandingDoneRef.current) return

    messageLandingDoneRef.current = true

    requestAnimationFrame(() => {
      forceScrollToBottom(false)
    })
  }, [loading, threadLoading, canMessage, classSpaceTab, teacherId])

  // parent-composer-auto-expand-v1
  useEffect(() => {
    const el = messageTextareaRef.current
    if (!el) return

    el.style.height = 'auto'
    const nextHeight = Math.min(el.scrollHeight, 92)
    el.style.height = `${Math.max(nextHeight, 22)}px`
  }, [message, classSpaceTab])


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
    forceScrollToBottom(false)
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

      forceScrollToBottom(false)
    } catch (e: any) {
      setUpdates(prev => prev.filter((item: any) => item.id !== tempId))
      setMessage(text)
      setAttachment(currentAttachment)
      toast.error(e.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }


  if (!hydrated) {
    return <ParentTeacherPageSkeleton />
  }

  if (loading) {
    return <ParentTeacherPageSkeleton />
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

  // remove-reports-from-messages-only-v1
  // Reports now stay in the Reports tab only. The message thread shows messages only.
  const threadItems: ThreadItem[] = sortMessagesOldestFirst(updates).map((u: any) => ({
    kind: 'message' as const,
    created_at: u.created_at,
    data: u,
  }))

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
        padding: 'calc(4px + env(safe-area-inset-top)) 14px 5px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <button
            onClick={() => {
              try { sessionStorage.setItem('feed-left', '1') } catch {}
              router.back()
            }}
            aria-label="Back"
            style={{
                width: 20,
                height: 24,
                borderRadius: 0,
                border: 'none',
                background: 'transparent',
                color: T.ink2,
                padding: 0,
                marginRight: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
          >
            <BackIcon size={15} />
          </button>

          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            overflow: 'hidden',
            background: teacher.photo_url
              ? `url(${teacher.photo_url}) center/cover`
              : '#F0F0F4',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13.8,
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
              fontSize: 13.8,
              color: T.ink3,
              margin: '-2px 0 0',
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
                fontSize: 13.8,
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
                  fontSize: 13.8,
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
          <ClassSpaceTabs
            active={classSpaceTab}
            onChange={setClassSpaceTab}
            reportsCount={reports.length}
          />

          {classSpaceTab === 'life' && (
            <ClassLifePanel
              teacher={teacher}
              posts={classLifePosts}
              loading={classLifeLoading}
              reports={reports}
              onOpenMessages={() => setClassSpaceTab('messages')}
              onOpenReports={() => setClassSpaceTab('reports')}
            />
          )}

          {classSpaceTab === 'reports' && (
            <ReportsPanel
              teacher={teacher}
              reports={reports}
              onOpenMessages={() => setClassSpaceTab('messages')}
            />
          )}

          {classSpaceTab === 'messages' && (
            <>
              <MessageSpaceIntro
                teacher={teacher}
                reportsCount={reports.length}
                onOpenLife={() => setClassSpaceTab('life')}
                onOpenReports={() => setClassSpaceTab('reports')}
              />

          <div ref={threadScrollRef}
            onTouchStart={() => { messageUserInteractedRef.current = true }}
            onWheel={() => { messageUserInteractedRef.current = true }}
            style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            overscrollBehavior: 'contain',
            padding: '4px 0 calc(var(--sc-thread-bottom, 42px) + env(safe-area-inset-bottom))',
          }}>
            {threadLoading && threadItems.length === 0 ? (
              <ConversationLoading />
            ) : threadItems.length === 0 ? (
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

          <div ref={composerDockRef} style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 30,
            background: 'rgba(252,252,255,0.92)',
            borderTop: 'none',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: '3px 10px calc(var(--sc-compose-bottom, 0px) + env(safe-area-inset-bottom))',
          }}>
            <AttachmentPreviewTray
              attachment={attachment}
              onRemove={() => setAttachment(null)}
            />

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 5,
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: '3px 5px 3px 8px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
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
                  width: 27,
                  height: 27,
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
                <Paperclip size={13} strokeWidth={2.1} />
              </button>

              <textarea
                ref={messageTextareaRef}
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
                  lineHeight: 1.45,
                  minHeight: 22,
                  maxHeight: 92,
                  overflowY: 'auto',
                  fontFamily: 'inherit',
                  padding: '5px 0',
                }}
              />

              <button
                onClick={sendMessage}
                disabled={(!message.trim() && !attachment) || sending}
                aria-label="Send"
                style={{
                  width: 27,
                  height: 27,
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
                <Send size={13} strokeWidth={2.2} />
              </button>
            </div>
          </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function MessageSpaceIntro({ teacher, reportsCount = 0, onOpenLife, onOpenReports }: any) {
  const { hidden, dismiss } = useDismissibleClassGuide(`sc-messages-guide:${teacher?.id || 'unknown'}`)

  if (hidden) return null

  return (
    <section style={{
      margin: '8px 14px 8px',
      padding: 10,
      borderRadius: 16,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
          color: T.ink2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13.2,
          fontWeight: 850,
          flexShrink: 0,
          marginTop: 1,
        }}>
          {!teacher.photo_url && teacher.name?.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13.2,
            fontWeight: 850,
            color: T.ink,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            Private teacher inbox
          </p>
          <p style={{
            fontSize: 13.2,
            color: T.ink3,
            margin: '-2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} stays connected to class life.
          </p>
        </div>

        <GuideDismissButton onClick={dismiss} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: reportsCount > 0 ? '1fr 1fr' : '1fr',
        gap: 7,
        marginTop: 9,
      }}>
        <button type="button" onClick={onOpenLife} style={messageMiniActionBtn}>
          View Class Life
        </button>

        {reportsCount > 0 && (
          <button type="button" onClick={onOpenReports} style={messageMiniActionBtn}>
            Reports {reportsCount}
          </button>
        )}
      </div>
    </section>
  )
}

const messageMiniActionBtn: any = {
  height: 38,
  borderRadius: 999,
  border: `1px solid ${T.border}`,
  background: '#F8F8FB',
  color: T.ink2,
  fontSize: 13.8,
  fontWeight: 850,
  cursor: 'pointer',
  fontFamily: 'inherit',
}


function useDismissibleClassGuide(key: string) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === '1')
    } catch {}
  }, [key])

  const dismiss = () => {
    setHidden(true)
    try { localStorage.setItem(key, '1') } catch {}
  }

  return { hidden, dismiss }
}

function GuideDismissButton({ onClick }: any) {
  return (
    <button
      type="button"
      aria-label="Hide guide"
      onClick={onClick}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `1px solid ${T.border}`,
        background: '#F8F8FB',
        color: T.ink3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        fontFamily: 'inherit',
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  )
}


function ClassSpaceTabs({ active, onChange, reportsCount = 0 }: any) {
  const tabs = [
    { key: 'life', label: 'Class Life' },
    { key: 'messages', label: 'Messages' },
    { key: 'reports', label: reportsCount > 0 ? `Reports ${reportsCount}` : 'Reports' },
  ]

  return (
    <div style={{
      flexShrink: 0,
      padding: '6px 14px 7px',
      background: 'rgba(252,252,255,0.98)',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        padding: 3,
        borderRadius: 999,
        background: '#F4F4F6',
      }}>
        {tabs.map((tab: any) => {
          const selected = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              style={{
                height: 38,
                borderRadius: 999,
                border: 'none',
                background: selected ? T.white : 'transparent',
                color: selected ? T.ink : T.ink3,
                fontSize: 13.2,
                fontWeight: selected ? 850 : 750,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: selected ? '0 5px 14px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ClassLifePanel({ teacher, posts, loading, reports, onOpenMessages, onOpenReports }: any) {
  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '10px 14px calc(var(--sc-bottom-extra, 12px) + env(safe-area-inset-bottom))',
    }}>
      <ClassSpaceWelcome
        teacher={teacher}
        reports={reports}
        onOpenMessages={onOpenMessages}
        onOpenReports={onOpenReports}
      />

      {loading ? (
        <ClassLifeSkeleton />
      ) : posts.length === 0 ? (
        <ClassLifeEmpty teacher={teacher} onOpenMessages={onOpenMessages} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map((post: any) => (
            <ClassLifePostCard key={post.id} post={post} teacher={teacher} />
          ))}
        </div>
      )}

      <PoweredByBar />
    </div>
  )
}

function ClassSpaceWelcome({ teacher, reports, onOpenMessages, onOpenReports }: any) {
  const { hidden, dismiss } = useDismissibleClassGuide(`sc-class-life-guide:${teacher?.id || 'unknown'}`)

  if (hidden) return null

  return (
    <section style={{
      padding: 12,
      borderRadius: 18,
      background: T.white,
      border: `1px solid ${T.border}`,
      marginBottom: 10,
      boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13.2,
            fontWeight: 850,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            Today in {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
          </p>

          <p style={{
            fontSize: 13.8,
            color: T.ink3,
            margin: '2px 0 10px',
            lineHeight: 1.45,
          }}>
            Class memories, teacher updates, reports and communication stay together here.
          </p>
        </div>

        <GuideDismissButton onClick={dismiss} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        <button type="button" onClick={onOpenMessages} style={classSpaceActionBtn}>
          Message teacher
        </button>
        <button type="button" onClick={onOpenReports} style={classSpaceActionBtn}>
          Reports {reports?.length ? `(${reports.length})` : ''}
        </button>
      </div>
    </section>
  )
}

function ClassLifePostCard({ post, teacher }: any) {
  const images = Array.isArray(post.image_urls)
    ? post.image_urls
    : post.image_url
      ? [post.image_url]
      : []

  const typeLabel =
    post.type === 'event' ? 'Event' :
    post.type === 'moment' ? 'Moment' :
    post.type === 'document' ? 'Document' :
    'Update'

  return (
    <article style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
    }}>
      <div style={{ padding: 12 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: post.body ? 8 : 0,
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
            color: T.ink2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13.8,
            fontWeight: 850,
            flexShrink: 0,
          }}>
            {!teacher.photo_url && teacher.name?.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13.8,
              fontWeight: 850,
              color: T.ink,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {teacher.name}
            </p>
            <p style={{
              fontSize: 13.2,
              color: T.ink3,
              margin: '-2px 0 0',
            }}>
              {typeLabel} · {relTime(post.created_at || post.published_at)}
            </p>
          </div>
        </div>

        {post.body && (
          <p style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: T.ink2,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {post.body}
          </p>
        )}
      </div>

      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: images.length > 1 ? '1fr 1fr' : '1fr',
        }}>
          {images.slice(0, 4).map((url: string, index: number) => (
            <img
              key={`${url}-${index}`}
              src={url}
              alt=""
              loading="lazy"
              style={{
                width: '100%',
                height: images.length > 1 ? 150 : 220,
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ))}
        </div>
      )}
    </article>
  )
}

function ReportsPanel({ teacher, reports, onOpenMessages }: any) {
  const latest = reports?.length ? reports[reports.length - 1] : null
  const { hidden: reportsGuideHidden, dismiss: dismissReportsGuide } = useDismissibleClassGuide(`sc-reports-guide:${teacher?.id || 'unknown'}`)

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      padding: '10px 14px calc(var(--sc-bottom-extra, 12px) + env(safe-area-inset-bottom))',
    }}>
      {!reportsGuideHidden && (
      <section style={{
        padding: 12,
        borderRadius: 18,
        background: T.white,
        border: `1px solid ${T.border}`,
        marginBottom: 10,
        boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#F0F4FF',
            color: T.blue,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <FileText size={15} strokeWidth={1.8} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13.2,
              fontWeight: 850,
              color: T.ink,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              Reports and progress
            </p>
            <p style={{
              fontSize: 13.2,
              color: T.ink3,
              margin: '-2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''} · child progress record
            </p>
          </div>

          <GuideDismissButton onClick={dismissReportsGuide} />
        </div>

        {latest && (
          <div style={{
            marginTop: 10,
            padding: '9px 10px',
            borderRadius: 14,
            background: '#F8F8FB',
            border: `1px solid ${T.border}`,
          }}>
            <p style={{
              fontSize: 13.2,
              fontWeight: 850,
              color: T.ink,
              margin: 0,
            }}>
              Latest report ready
            </p>
            <p style={{
              fontSize: 13.2,
              color: T.ink3,
              margin: '-1px 0 0',
            }}>
              {formatWeek(latest.week_starting || latest.created_at || latest.published_at)}
            </p>
          </div>
        )}
      </section>
      )}

      {reports.length === 0 ? (
        <section style={{
          padding: '46px 24px',
          textAlign: 'center',
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 18,
          boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
        }}>
          <FileText size={22} color={T.ink3} strokeWidth={1.6} />
          <p style={{
            fontSize: 13.2,
            color: T.ink,
            fontWeight: 850,
            margin: '10px 0 4px',
          }}>
            No reports yet
          </p>
          <p style={{
            fontSize: 13.8,
            color: T.ink3,
            lineHeight: 1.45,
            margin: 0,
          }}>
            Reports from {teacher.name} will appear here when they are published.
          </p>
          <button type="button" onClick={onOpenMessages} style={{
            ...classSpaceActionBtn,
            width: '100%',
            marginTop: 14,
          }}>
            Message teacher
          </button>
        </section>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...reports].reverse().map((report: any, index: number) => (
            <ClassSpaceReportCard
              key={`report-card-${report.id || index}`}
              report={report}
              teacher={teacher}
            />
          ))}
        </div>
      )}

      <PoweredByBar />
    </div>
  )
}

function ClassSpaceReportCard({ report, teacher }: any) {
  const scoreValues = Object.values(report.scores || {})
  const avg = scoreValues.length
    ? scoreValues.reduce((a: number, b: any) => a + Number(b || 0), 0) / scoreValues.length
    : 0

  const scoreLabel =
    avg >= 4 ? 'Strong progress' :
    avg >= 3 ? 'On track' :
    avg > 0 ? 'Needs support' :
    'Progress update'

  return (
    <article style={{
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      padding: 12,
      boxShadow: '0 8px 22px rgba(0,0,0,0.035)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 36,
          height: 40,
          borderRadius: '50%',
          background: '#F0F4FF',
          color: T.blue,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <FileText size={16} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13.8,
            fontWeight: 850,
            color: T.ink,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            Weekly Report
          </p>
          <p style={{
            fontSize: 13.2,
            color: T.ink3,
            margin: '-2px 0 0',
          }}>
            {formatWeek(report.week_starting || report.created_at || report.published_at)}
          </p>
        </div>

        <div style={{
          minWidth: 44,
          height: 38,
          padding: '0 9px',
          borderRadius: 999,
          background: '#F8F8FB',
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.ink,
          fontSize: 13.8,
          fontWeight: 900,
          flexShrink: 0,
        }}>
          {avg ? avg.toFixed(1) : '—'}
        </div>
      </div>

      <div style={{
        display: 'inline-flex',
        marginTop: 10,
        padding: '5px 9px',
        borderRadius: 999,
        background: '#F4F6FB',
        color: T.ink2,
        fontSize: 13.2,
        fontWeight: 850,
      }}>
        {scoreLabel}
      </div>

      {report.comment && (
        <p style={{
          fontSize: 13.2,
          color: T.ink2,
          lineHeight: 1.48,
          margin: '9px 0 0',
        }}>
          {report.comment}
        </p>
      )}

      <button
        type="button"
        onClick={() => { window.location.href = '/reports' }}
        style={{
          width: '100%',
          height: 40,
          marginTop: 11,
          border: 'none',
          borderRadius: 999,
          background: T.ink,
          color: T.white,
          fontSize: 13.2,
          fontWeight: 850,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        View full report
      </button>
    </article>
  )
}


function ClassLifeEmpty({ teacher, onOpenMessages }: any) {
  return (
    <section style={{
      padding: '46px 24px',
      textAlign: 'center',
      background: T.white,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
    }}>
      <div style={{
        width: 46,
        height: 46,
        borderRadius: '50%',
        background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : '#F0F0F4',
        margin: '0 auto 12px',
      }} />
      <p style={{
        fontSize: 14.2,
        color: T.ink,
        fontWeight: 850,
        margin: '0 0 4px',
      }}>
        Class Life will appear here
      </p>
      <p style={{
        fontSize: 13.8,
        color: T.ink3,
        lineHeight: 1.45,
        margin: 0,
      }}>
        Updates, memories and documents from {teacher.name} will live here.
      </p>
      <button type="button" onClick={onOpenMessages} style={{
        ...classSpaceActionBtn,
        width: '100%',
        marginTop: 14,
      }}>
        Message teacher
      </button>
    </section>
  )
}

function ClassLifeSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{
          padding: 12,
          borderRadius: 18,
          background: T.white,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <SkeletonBlock style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <SkeletonBlock style={{ width: '42%', height: 10, borderRadius: 999, marginBottom: 7 }} />
              <SkeletonBlock style={{ width: '28%', height: 8, borderRadius: 999 }} />
            </div>
          </div>
          <SkeletonBlock style={{ width: '92%', height: 10, borderRadius: 999, marginTop: 14 }} />
          <SkeletonBlock style={{ width: '68%', height: 10, borderRadius: 999, marginTop: 7 }} />
          {i === 1 && (
            <SkeletonBlock style={{ width: '100%', height: 150, borderRadius: 14, marginTop: 12 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function PoweredByBar() {
  return (
    <p style={{
      fontSize: 13.8,
      color: T.ink3,
      textAlign: 'center',
      margin: '14px 0 0',
      paddingBottom: 0,
      opacity: 0.7,
    }}>
      Powered by School Connect
    </p>
  )
}

const classSpaceActionBtn: any = {
  height: 38,
  borderRadius: 999,
  border: `1px solid ${T.border}`,
  background: '#F8F8FB',
  color: T.ink2,
  fontSize: 13.2,
  fontWeight: 850,
  cursor: 'pointer',
  fontFamily: 'inherit',
}


function MessageRow({ update, teacher }: any) {
  const teacherInitials = teacher.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <MessageBubble
      update={update}
      perspective="parent"
      teacherName={teacher.name}
      teacherPhotoUrl={teacher.photo_url}
      teacherInitials={teacherInitials}
      parentInitial="Y"
    />
  )
}


function ReplyBubble({ reply, teacher }: any) {
  const isTeacher = !!reply.teacher_id
  return (
    <div style={{
      marginTop: 6,
      padding: '7px 9px',
      borderRadius: '50%',
      background: isTeacher ? '#F0F4FF' : '#F4F4F6',
      color: T.ink2,
    }}>
      <p style={{ fontSize: 13.8, fontWeight: 700, margin: '0 0 2px' }}>
        {isTeacher ? teacher.name : 'You'}
      </p>
      <p style={{ fontSize: 13.8, lineHeight: 1.48, margin: 0, whiteSpace: 'pre-wrap' }}>
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
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
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
              fontSize: 13.8,
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
              fontSize: 13.8,
              color: T.ink3,
              margin: '-2px 0 0',
            }}>
              {formatWeek(report.week_starting)} · {avg.toFixed(1)}/5
            </p>
          </div>
        </div>

        {report.comment && (
          <p style={{
            fontSize: 13.2,
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
            fontSize: 13.8,
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


function SkeletonBlock({ style = {} }: any) {
  return (
    <div
      className="sc-skeleton-block"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(90deg, #F1F1F5 0%, #F7F7FA 45%, #F1F1F5 100%)',
        backgroundSize: '220% 100%',
        animation: 'scSkeleton 1.25s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

function MessageGhostRows() {
  return (
    <div style={{ padding: '8px 16px 20px' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const mine = i % 2 === 1
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: mine ? 'row-reverse' : 'row',
              gap: 8,
              marginBottom: 14,
            }}
          >
            <SkeletonBlock style={{
              width: 30,
              height: 38,
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: 2,
            }} />

            <div style={{
              width: i === 2 ? '58%' : mine ? '62%' : '70%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: mine ? 'flex-end' : 'flex-start',
            }}>
              <SkeletonBlock style={{
                width: '100%',
                height: i === 3 ? 74 : 42,
                borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }} />
              <SkeletonBlock style={{
                width: 42,
                height: 8,
                borderRadius: 999,
                marginTop: 6,
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ParentTeacherPageSkeleton() {
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
      <div style={{
        flexShrink: 0,
        background: 'rgba(252,252,255,0.98)',
        padding: 'calc(7px + env(safe-area-inset-top)) 16px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <SkeletonBlock style={{ width: 30, height: 38, borderRadius: 999 }} />
          <SkeletonBlock style={{ width: 29, height: 29, borderRadius: 10 }} />
          <div style={{ flex: 1 }}>
            <SkeletonBlock style={{ width: '48%', height: 12, borderRadius: 999, marginBottom: 8 }} />
            <SkeletonBlock style={{ width: '34%', height: 9, borderRadius: 999 }} />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', paddingTop: 10 }}>
        <div style={{ padding: '8px 16px 20px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: i % 2 === 1 ? 'row-reverse' : 'row',
              gap: 8,
              marginBottom: 14,
            }}>
              <SkeletonBlock style={{ width: 30, height: 38, borderRadius: '50%', flexShrink: 0 }} />
              <SkeletonBlock style={{
                width: i % 2 === 1 ? '62%' : '70%',
                height: i === 2 ? 74 : 42,
                borderRadius: i % 2 === 1 ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flexShrink: 0,
        padding: '3px 10px calc(var(--sc-compose-bottom, 0px) + env(safe-area-inset-bottom))',
        background: 'rgba(252,252,255,0.96)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 18,
          padding: '5px 6px 5px 9px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}>
          <SkeletonBlock style={{ width: 29, height: 29, borderRadius: '50%', flexShrink: 0 }} />
          <SkeletonBlock style={{ height: 14, borderRadius: 999, flex: 1 }} />
          <SkeletonBlock style={{ width: 29, height: 29, borderRadius: '50%', flexShrink: 0 }} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes scSkeleton {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>
    </div>
  )
}


function ConversationLoading() {
  return (
    <div style={{ paddingTop: 12 }}>
      <MessageGhostRows />
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
        fontSize: 16,
        color: T.ink,
        fontWeight: 750,
        margin: '0 0 5px',
      }}>
        Message teacher
      </p>
      <p style={{
        fontSize: 13.8,
        color: T.ink3,
        margin: 0,
        lineHeight: 1.5,
      }}>
        Send a note to {teacher.name}. Class Life, Reports and messages stay together in this space.
      </p>
    </div>
  )
}

function JoinClassModal({ teacher, onClose, onSubmitted }: any) {
  const [parentFirstName, setParentFirstName] = useState('')
  const [parentLastName, setParentLastName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [childFirstName, setChildFirstName] = useState('')
  const [childLastName, setChildLastName] = useState('')
  const [relationship, setRelationship] = useState('Parent/Guardian')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    const parent_first_name = parentFirstName.trim()
    const parent_last_name = parentLastName.trim()
    const parent_phone = parentPhone.trim()
    const child_first_name = childFirstName.trim()
    const child_last_name = childLastName.trim()

    if (!parent_first_name || !parent_last_name || !parent_phone) {
      toast.error('Enter parent name and phone number')
      return
    }

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
          parent_first_name,
          parent_last_name,
          parent_phone,
          child_first_name,
          child_last_name,
          relationship,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not send request')

      toast.success(json.already_pending ? 'Request already pending' : 'Request sent to teacher')
      onSubmitted?.()
    } catch (e: any) {
      toast.error(e.message || 'Could not send request')
    }
    setSending(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.32)',
      zIndex: 80,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: 14,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: T.white,
        borderRadius: 24,
        padding: 18,
        boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
        animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
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
            <p style={{ fontSize: 13.8, color: T.ink3, margin: '-2px 0 0' }}>
              Add your details so the teacher can confirm your child.
            </p>
          </div>

          <button onClick={onClose} style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: '#FAFAFC',
            color: T.ink3,
            cursor: 'pointer',
          }}>
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>

        <p style={{
          fontSize: 13.2,
          fontWeight: 850,
          color: T.ink,
          margin: '0 0 7px',
        }}>
          Parent details
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            value={parentFirstName}
            onChange={e => setParentFirstName(e.target.value)}
            placeholder="Parent first name"
            style={joinInputStyle}
          />
          <input
            value={parentLastName}
            onChange={e => setParentLastName(e.target.value)}
            placeholder="Parent surname"
            style={joinInputStyle}
          />
        </div>

        <input
          value={parentPhone}
          onChange={e => setParentPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
          inputMode="tel"
          style={{ ...joinInputStyle, marginTop: 10 }}
        />

        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          style={{ ...joinInputStyle, marginTop: 10 }}
        >
          <option>Parent/Guardian</option>
          <option>Mother</option>
          <option>Father</option>
          <option>Guardian</option>
        </select>

        <p style={{
          fontSize: 13.2,
          fontWeight: 850,
          color: T.ink,
          margin: '14px 0 7px',
        }}>
          Child details
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            autoFocus
            value={childFirstName}
            onChange={e => setChildFirstName(e.target.value)}
            placeholder="Child first name"
            style={joinInputStyle}
          />
          <input
            value={childLastName}
            onChange={e => setChildLastName(e.target.value)}
            placeholder="Child surname"
            style={joinInputStyle}
          />
        </div>

        <button
          onClick={submit}
          disabled={sending}
          style={{
            width: '100%',
            height: 46,
            borderRadius: 999,
            border: 'none',
            background: T.ink,
            color: T.white,
            marginTop: 16,
            fontSize: 14,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: sending ? 'wait' : 'pointer',
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? 'Sending…' : 'Send request'}
        </button>

        <p style={{
          fontSize: 13.8,
          color: T.ink3,
          textAlign: 'center',
          lineHeight: 1.45,
          margin: '10px 6px 0',
        }}>
          The teacher will approve your request before messages, reports and class updates open.
        </p>
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
