'use client'

import React from 'react'

type SCStartupLoaderProps = {
  imageUrl?: string | null
  initials?: string
  visible?: boolean
}

export default function SCStartupLoader({ imageUrl, initials = 'SC', visible = true }: SCStartupLoaderProps) {
  if (!visible) return null

  return (
    <div
      className="sc-startup-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'var(--sc-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity .34s cubic-bezier(.22,.61,.36,1)',
      }}
    >
      <div
        style={{
          width: 82,
          height: 82,
          borderRadius: 26,
          background: imageUrl ? `url(${imageUrl}) center/cover` : 'var(--sc-soft)',
          color: 'var(--sc-muted-accent)',
          border: '1px solid var(--sc-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 620,
          boxShadow: '0 16px 42px rgba(0,0,0,.07)',
          animation: 'scIdentityPulse 1.7s ease-in-out infinite',
        }}
      >
        {imageUrl ? null : initials}
      </div>
    </div>
  )
}
