'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'

type SCActionRowProps = {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  right?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  as?: 'button' | 'div'
}

export default function SCActionRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled = false,
  as = 'button',
}: SCActionRowProps) {
  const isButton = as === 'button'
  const Component: any = isButton ? 'button' : 'div'

  return (
    <Component
      type={isButton ? 'button' : undefined}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className="sc-action-row"
      style={{
        width: '100%',
        minHeight: 58,
        border: 'none',
        borderBottom: '1px solid var(--sc-border-soft)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 2px',
        cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
        opacity: disabled ? 0.55 : 1,
        fontFamily: 'inherit',
        textAlign: 'left',
        color: 'var(--sc-ink)',
      }}
    >
      {icon ? (
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 14,
            background: 'var(--sc-soft)',
            color: 'var(--sc-muted-accent)',
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
        <span
          style={{
            display: 'block',
            fontSize: 13.5,
            fontWeight: 560,
            color: 'var(--sc-ink)',
            lineHeight: 1.22,
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            style={{
              display: 'block',
              marginTop: 3,
              fontSize: 12.3,
              fontWeight: 450,
              color: 'var(--sc-muted-accent)',
              lineHeight: 1.28,
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </span>

      {right ?? (
        <ChevronRight
          size={17}
          strokeWidth={2}
          color="var(--sc-muted-accent)"
          style={{ flexShrink: 0, marginRight: 4 }}
        />
      )}
    </Component>
  )
}
