'use client'

import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

type Props = {
  icon?: ReactNode
  title: string
  subtitle?: string
  right?: ReactNode
  onClick?: () => void
  disabled?: boolean
  showChevron?: boolean
}

export default function SCActionRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled = false,
  showChevron = true,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="sc-action-row"
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 2px',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? (
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            background: 'var(--sc-soft)',
            color: 'var(--sc-ink-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      ) : null}

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 560, color: 'var(--sc-ink)', lineHeight: 1.25 }}>
          {title}
        </span>
        {subtitle ? (
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, color: 'var(--sc-ink-3)', lineHeight: 1.35 }}>
            {subtitle}
          </span>
        ) : null}
      </span>

      {right || (showChevron ? <ChevronRight size={18} strokeWidth={2} color="var(--sc-ink-3)" /> : null)}
    </button>
  )
}
