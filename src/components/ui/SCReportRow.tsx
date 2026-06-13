'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'

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
    const menuWidth = 158
    const gap = 7
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
      className="sc-report-row sc-list-row"
      style={{
        position: 'relative',
        padding: '12px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--sc-border-soft)',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        overflow: 'visible',
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
          gap: 11,
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
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
              fontSize: 13.65,
              fontWeight: 560,
              color: 'var(--sc-ink)',
              lineHeight: 1.18,
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
              fontSize: 12.05,
              color: 'var(--sc-ink-3)',
              lineHeight: 1.22,
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
        className="sc-pill-button"
        style={{
          minHeight: 31,
          padding: '0 8px',
          borderRadius: 999,
          border: 'none',
          background: 'transparent',
          color: 'var(--sc-ink-2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12.25,
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
          className="sc-icon-button"
          style={{
            width: 31,
            height: 31,
            borderRadius: 999,
            border: 'none',
            background: 'transparent',
            color: 'var(--sc-ink-3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <MoreHorizontal size={16} strokeWidth={1.85} />
        </button>
      ) : null}

      {menuOpen && menuPosition && onRemove ? (
        <>
          <div
            onClick={closeMenu}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9000,
              background: 'transparent',
            }}
          />

          <div
            ref={menuRef}
            role="menu"
            aria-label={`Options for ${title}`}
            className="sc-floating-menu"
            style={{
              position: 'fixed',
              left: menuPosition.left,
              top: menuPosition.top,
              zIndex: 9001,
              minWidth: 178,
              padding: 6,
              borderRadius: 16,
              background: '#FFFFFF',
              border: '1px solid var(--sc-border)',
              boxShadow: '0 12px 34px rgba(15,23,42,0.08)',
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
                minHeight: 36,
                border: 'none',
                borderRadius: 12,
                background: 'transparent',
                color: 'var(--sc-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 9,
                padding: '0 10px',
                fontFamily: 'inherit',
                fontSize: 12.8,
                fontWeight: 520,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textAlign: 'left',
              }}
            >
              <Trash2 size={14} strokeWidth={1.9} />
              {removeLabel}
            </button>
          </div>
        </>
      ) : null}
    </article>
  )
}
