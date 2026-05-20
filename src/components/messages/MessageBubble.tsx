// @ts-nocheck
'use client'

import { AttachmentCard, updateAttachment } from '@/components/messages/MessageAttachment'

const T = {
  ink: '#1A1A1A',
  ink2: '#4A4A4A',
  ink3: '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white: '#FFFFFF',
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

export function MessageBubble({
  update,
  perspective = 'parent',
  teacherName = 'Teacher',
  teacherPhotoUrl = '',
  teacherInitials = 'T',
  parentInitial = 'Y',
}: any) {
  const isTeacher = update?.author_kind === 'teacher'
  const isMine = perspective === 'teacher' ? isTeacher : !isTeacher
  const attachment = updateAttachment(update)
  const imageOnly = !!attachment
    && (attachment.is_image || attachment.type?.startsWith?.('image/'))
    && !String(update?.body || '').trim()

  const avatarText = isTeacher
    ? (teacherInitials || teacherName?.charAt?.(0) || 'T')
    : (parentInitial || 'P')

  return (
    <article style={{
      display: 'flex',
      gap: 10,
      padding: '8px 16px',
      flexDirection: isMine ? 'row-reverse' : 'row',
    }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        overflow: 'hidden',
        background: isTeacher && teacherPhotoUrl
          ? `url(${teacherPhotoUrl}) center/cover`
          : '#F0F0F4',
        color: T.ink2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 800,
        flexShrink: 0,
        marginTop: 2,
      }}>
        {!(isTeacher && teacherPhotoUrl) && avatarText}
      </div>

      <div style={{
        maxWidth: '74%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isMine ? '#F4F4F6' : T.white,
          color: T.ink,
          border: imageOnly ? 'none' : (isMine ? 'none' : `1px solid ${T.border}`),
          padding: imageOnly ? 0 : '9px 12px',
          overflow: 'hidden',
        }}>
          {update?.body && (
            <p style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {update.body}
            </p>
          )}

          {attachment && <AttachmentCard attachment={attachment} flush={imageOnly} />}
        </div>

        <p style={{
          fontSize: 10,
          color: T.ink3,
          margin: '4px 4px 0',
          textAlign: isMine ? 'right' : 'left',
        }}>
          {relTime(update?.created_at)}
        </p>
      </div>
    </article>
  )
}
