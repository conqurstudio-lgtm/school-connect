'use client'

import React from 'react'

type SCPageShellProps = {
  children: React.ReactNode
  maxWidth?: number
  className?: string
}

export default function SCPageShell({ children, maxWidth = 520, className = '' }: SCPageShellProps) {
  return (
    <div
      className={`sc-page-shell sc-screen-enter ${className}`.trim()}
      style={{
        minHeight: '100dvh',
        background: 'var(--sc-bg)',
        color: 'var(--sc-ink)',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth,
          margin: '0 auto',
          padding: 'calc(env(safe-area-inset-top) + 12px) 20px calc(env(safe-area-inset-bottom) + 26px)',
        }}
      >
        {children}
      </main>
    </div>
  )
}
