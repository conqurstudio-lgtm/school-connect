'use client'

import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: number
}

export default function SCBottomSheet({ open, onClose, children, maxWidth = 430 }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="sc-bottom-sheet-backdrop" onClick={onClose}>
      <div
        className="sc-bottom-sheet"
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          width: '100%',
          maxWidth,
          transform: 'translateX(-50%)',
          borderRadius: '28px 28px 0 0',
          padding: '18px 18px calc(18px + env(safe-area-inset-bottom))',
          animation: 'scSheetIn .22s var(--sc-ease-standard) both',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 999, background: '#D8DDE1', margin: '0 auto 14px' }} />
        {children}
      </div>
    </div>,
    document.body
  )
}
