'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type SCBottomSheetProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}

export default function SCBottomSheet({ open, onClose, children, maxWidth = 520 }: SCBottomSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="sc-sheet-overlay"
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.22)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 12px env(safe-area-inset-bottom)',
      }}
    >
      <div
        className="sc-bottom-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '88dvh',
          overflow: 'auto',
          borderRadius: '26px 26px 0 0',
          background: 'var(--sc-surface)',
          border: '1px solid var(--sc-border)',
          boxShadow: '0 -18px 60px rgba(0,0,0,.10)',
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
