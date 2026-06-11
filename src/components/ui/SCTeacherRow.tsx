'use client'

import { Check, Copy, MoreVertical } from 'lucide-react'

type TeacherLike = {
  id: string
  name: string
  photo_url?: string | null
  grade?: string | null
  class_name?: string | null
  status?: 'active' | 'revoked' | string | null
}

type Props = {
  teacher: TeacherLike
  copied?: boolean
  isLast?: boolean
  onCopy?: (teacher: TeacherLike) => void
  onMenu?: (event: React.MouseEvent<HTMLButtonElement>, teacher: TeacherLike) => void
}

function initials(name?: string | null) {
  return String(name || 'T')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SCTeacherRow({ teacher, copied = false, isLast = false, onCopy, onMenu }: Props) {
  const isActive = teacher.status !== 'revoked'
  const subtitle = [teacher.grade, teacher.class_name, isActive ? 'Active' : 'Revoked'].filter(Boolean).join(' · ')

  return (
    <article
      className="sc-list-row"
      style={{
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--sc-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        position: 'relative',
        overflow: 'visible',
        opacity: isActive ? 1 : 0.62,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 14,
          background: teacher.photo_url ? `url(${teacher.photo_url}) center/cover` : 'var(--sc-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sc-ink-2)',
          fontSize: 12,
          fontWeight: 560,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {!teacher.photo_url ? initials(teacher.name) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13.8,
            fontWeight: 560,
            color: 'var(--sc-ink)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25,
          }}
        >
          {teacher.name}
        </p>

        {subtitle ? (
          <p
            style={{
              fontSize: 12.2,
              color: 'var(--sc-ink-3)',
              margin: '2px 0 0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {isActive && onCopy ? (
        <button
          type="button"
          onClick={() => onCopy(teacher)}
          aria-label="Copy teacher link"
          className="sc-icon-tap"
          style={{
            width: 34,
            height: 34,
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
          onClick={(event) => onMenu(event, teacher)}
          aria-label="Teacher options"
          className="sc-icon-tap"
          style={{
            width: 34,
            height: 34,
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
