'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

type Props = {
  initials: string
  title: string
  subtitle: string
  actionLabel: string
  isLast?: boolean
  onOpen: () => void
  onAction?: () => void
  onRemove?: () => void
  removeLabel?: string
}

export default function SCReportRow({
  initials,
  title,
  subtitle,
  actionLabel,
  isLast = false,
  onOpen,
  onAction,
  onRemove,
  removeLabel = 'Remove learner',
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const closeMenu = () => {
    setMenuOpen(false)
    setMenuPosition(null)
  }

  const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 154
    const gap = 8
    const left = Math.min(
      Math.max(12, rect.right - menuWidth),
      Math.max(12, window.innerWidth - menuWidth - 12)
    )

    setMenuPosition({
      top: rect.top + rect.height + gap,
      left,
    })
    setMenuOpen((value) => !value)
  }

  useEffect(() => {
    if (!menuOpen) return

    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      closeMenu()
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    const close = () => closeMenu()

    document.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)

    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menuOpen])

  return (
    <article
      className="sc-report-row"
      style={{
        position: 'relative',
        padding: '13px 0',
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.045)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          background: 'transparent',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 39,
            height: 39,
            borderRadius: 15,
            background: 'var(--sc-soft)',
            color: 'var(--sc-ink-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 560,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>

        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 13.8,
              fontWeight: 560,
              color: 'var(--sc-ink)',
              lineHeight: 1.17,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>

          <span
            style={{
              display: 'block',
              marginTop: 3,
              fontSize: 12.2,
              color: 'var(--sc-ink-3)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={onAction || onOpen}
        style={{
          minHeight: 32,
          padding: '0 5px 0 10px',
          borderRadius: 999,
          border: 'none',
          background: 'transparent',
          color: 'var(--sc-ink-2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.4,
          fontWeight: 540,
          fontFamily: 'inherit',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {actionLabel}
      </button>

      {onRemove ? (
        <button
          ref={buttonRef}
          type="button"
          aria-label={`More options for ${title}`}
          onClick={toggleMenu}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: 'var(--sc-ink-3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.9} />
        </button>
      ) : null}

      {menuOpen && menuPosition && onRemove ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Options for ${title}`}
          className="sc-floating-menu"
          style={{
            position: 'fixed',
            left: menuPosition.left,
            top: menuPosition.top,
            zIndex: 140,
            minWidth: 154,
            padding: 6,
            borderRadius: 16,
            background: 'var(--sc-surface)',
            border: '1px solid rgba(0,0,0,0.055)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.065)',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              closeMenu()
              onRemove()
            }}
            style={{
              width: '100%',
              minHeight: 38,
              border: 'none',
              borderRadius: 12,
              background: 'transparent',
              color: '#B42318',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '0 10px',
              fontFamily: 'inherit',
              fontSize: 12.4,
              fontWeight: 540,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {removeLabel}
          </button>
        </div>
      ) : null}
    </article>
  )
}
