'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'left' | 'right'
}

export default function SCFloatingMenu({ open, onClose, children, align = 'right' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const close = () => onClose()
    document.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="sc-floating-menu"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: align === 'right' ? 0 : 'auto',
        left: align === 'left' ? 0 : 'auto',
        minWidth: 154,
        border: '1px solid var(--sc-border)',
        borderRadius: 16,
        padding: 6,
        zIndex: 50,
      }}
    >
      {children}
    </div>
  )
}
