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
        gap: 11,
        padding: '12px 1px',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.48 : 1,
        fontFamily: 'inherit',
      }}
    >
      {icon ? (
        <span
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
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

      <span style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 560, color: 'var(--sc-ink)', lineHeight: 1.22 }}>
          {title}
        </span>
        {subtitle ? (
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.15, color: 'var(--sc-ink-3)', lineHeight: 1.28 }}>
            {subtitle}
          </span>
        ) : null}
      </span>

      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, color: 'var(--sc-ink-3)', flexShrink: 0 }}>
        {right || (showChevron ? <ChevronRight size={17} strokeWidth={1.9} /> : null)}
      </span>
    </button>
  )
}
