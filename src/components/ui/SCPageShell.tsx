'use client'

import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  scroll?: boolean
}

export default function SCPageShell({ children, className = '', style, scroll = true }: Props) {
  return (
    <div
      className={`sc-page-shell sc-screen-enter ${className}`.trim()}
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        background: 'var(--sc-bg)',
        color: 'var(--sc-ink)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <main
        className="sc-page-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: scroll ? 'auto' : 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>
    </div>
  )
}
