'use client'

import type { CSSProperties, ReactNode } from 'react'

type Props = {
  title?: string
  subtitle?: string
  subtitleNode?: ReactNode
  left?: ReactNode
  right?: ReactNode
  compact?: boolean
  leftWidth?: number
  rightWidth?: number
  align?: 'center' | 'left'
  sticky?: boolean
  style?: CSSProperties
}

export default function SCTopBar({
  title,
  subtitle,
  subtitleNode,
  left,
  right,
  compact = false,
  leftWidth,
  rightWidth,
  align = 'center',
  sticky = false,
  style,
}: Props) {
  const hasSubtitle = Boolean(subtitle || subtitleNode)
  const height = hasSubtitle ? 64 : compact ? 50 : 56
  const sideWidth = leftWidth ?? (align === 'left' ? 38 : 44)
  const endWidth = rightWidth ?? 44

  return (
    <header
      className="sc-top-bar"
      style={{
        minHeight: height,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: align === 'left' ? 8 : 12,
        padding: 'calc(6px + env(safe-area-inset-top, 0px)) 16px 4px',
        background: 'var(--sc-bg)',
        position: sticky ? 'sticky' : 'relative',
        top: sticky ? 0 : undefined,
        zIndex: sticky ? 20 : 1,
        ...style,
      }}
    >
      <div
        className="sc-top-bar-left"
        style={{
          width: sideWidth,
          minWidth: sideWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {left}
      </div>

      <div
        className="sc-top-bar-title-wrap"
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: align === 'left' ? 'left' : 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: align === 'left' ? 'flex-start' : 'center',
          paddingRight: align === 'left' ? 4 : 0,
        }}
      >
        {title ? (
          <div
            className="sc-top-bar-title"
            style={{
              width: '100%',
              fontSize: 15.5,
              fontWeight: 620,
              color: 'var(--sc-ink)',
              letterSpacing: '-0.018em',
              lineHeight: 1.18,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        ) : null}

        {subtitleNode ? (
          <div
            className="sc-top-bar-subtitle-node"
            style={{
              width: '100%',
              marginTop: 4,
              minHeight: 13,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {subtitleNode}
          </div>
        ) : subtitle ? (
          <div
            className="sc-top-bar-subtitle"
            style={{
              width: '100%',
              marginTop: 3,
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--sc-muted)',
              lineHeight: 1.2,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      <div
        className="sc-top-bar-right"
        style={{
          width: endWidth,
          minWidth: endWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {right}
      </div>
    </header>
  )
}
