'use client'

import type { ReactNode } from 'react'

type Props = {
  show: boolean
  imageUrl?: string | null
  initials?: string
  children?: ReactNode
}

export default function SCStartupLoader({ show, imageUrl, initials = 'SC', children }: Props) {
  return (
    <div
      className={show ? 'sc-startup-loader is-visible' : 'sc-startup-loader'}
      aria-hidden={!show}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'var(--sc-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: 26,
          background: 'var(--sc-soft)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sc-ink)',
          fontSize: 20,
          fontWeight: 650,
          letterSpacing: '-.02em',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          initials
        )}
      </div>
      {children}
    </div>
  )
}
