'use client'

// school-connect-teacher-active-dot-top-v419

import type { MouseEvent } from 'react'
import { Check, Copy, MoreVertical } from 'lucide-react'

type TeacherLike = {
  id: string
  name: string
  photo_url?: string | null
  grade?: string | null
  class_name?: string | null
  status?: 'active' | 'revoked' | string | null
  moment_count?: number | null
  latest_moment_at?: string | null
}

type Props = {
  teacher: TeacherLike
  copied?: boolean
  isLast?: boolean
  onCopy?: (teacher: TeacherLike) => void
  onMenu?: (event: MouseEvent<HTMLButtonElement>, teacher: TeacherLike) => void
  onOpen?: (teacher: TeacherLike) => void
}

function initials(name?: string | null) {
  return String(name || 'T')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SCTeacherRow({ teacher, copied = false, isLast = false, onCopy, onMenu, onOpen }: Props) {
  const isActive = teacher.status !== 'revoked' && teacher.status !== 'inactive'
  const momentCount = Number(teacher.moment_count || 0)
  const hasMoments = momentCount > 0
  const subtitle = [
    teacher.grade,
    teacher.class_name,
    hasMoments ? `${momentCount} moment${momentCount === 1 ? '' : 's'}` : null,
    !isActive ? 'Revoked' : null,
  ].filter(Boolean).join(' · ')

  return (
    <article
      className="sc-list-row"
      onClick={() => onOpen?.(teacher)}
      style={{
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--sc-border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        overflow: 'visible',
        opacity: isActive ? 1 : 0.62,
        cursor: onOpen ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          width: 37,
          height: 37,
          borderRadius: 14,
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : 'var(--sc-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sc-ink-2)',
          fontSize: 12,
          fontWeight: 560,
          flexShrink: 0,
          overflow: 'visible',
          position: 'relative',
        }}
      >
        <span style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : 'var(--sc-soft)',
        }}>
          {!teacher.photo_url ? initials(teacher.name) : null}
        </span>

        {isActive ? (
          <span
            aria-label="Teacher is active"
            title="Teacher is active"
            style={{
              position: 'absolute',
              right: -1,
              top: -1,
              width: 9,
              height: 9,
              borderRadius: 999,
              background: '#24A148',
              boxShadow: '0 0 0 2px #FFFFFF',
            }}
          />
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13.65,
            fontWeight: 560,
            color: 'var(--sc-ink)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
          }}
        >
          {teacher.name}
        </p>

        {subtitle ? (
          <p
            style={{
              fontSize: 12.05,
              color: 'var(--sc-ink-3)',
              margin: '5px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.22,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {isActive && onCopy ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onCopy(teacher)
          }}
          aria-label="Copy teacher link"
          className="sc-icon-button"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: copied ? 'var(--sc-soft)' : 'transparent',
            color: copied ? 'var(--sc-ink-2)' : 'var(--sc-ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={1.9} />}
        </button>
      ) : null}

      {onMenu ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onMenu(event, teacher)
          }}
          aria-label="Teacher options"
          className="sc-icon-button"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: 'var(--sc-ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <MoreVertical size={15} strokeWidth={1.8} />
        </button>
      ) : null}
    </article>
  )
}
