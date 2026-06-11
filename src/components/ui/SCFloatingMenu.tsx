'use client'

import React, { useEffect, useRef } from 'react'

type SCFloatingMenuProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  align?: 'right' | 'left'
  width?: number
}

export default function SCFloatingMenu({
  open,
  onClose,
  children,
  align = 'right',
  width = 168,
}: SCFloatingMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const closeOnMovement = () => onClose()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', closeOnMovement, true)
    window.addEventListener('resize', closeOnMovement)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', closeOnMovement, true)
      window.removeEventListener('resize', closeOnMovement)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="sc-floating-menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        [align]: 0,
        width,
        borderRadius: 16,
        background: 'var(--sc-surface)',
        border: '1px solid var(--sc-border)',
        boxShadow: '0 10px 26px rgba(0,0,0,.08)',
        padding: 6,
        zIndex: 60,
      }}
    >
      {children}
    </div>
  )
}
