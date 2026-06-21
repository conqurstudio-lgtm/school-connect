'use client'

import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'

type ParentBottomHoverMenuProps = {
  token: string
  active: 'report' | 'moments'
  onMomentsClick?: () => void
}

export function ParentBottomHoverMenu({ token, active, onMomentsClick }: ParentBottomHoverMenuProps) {
  const safeToken = encodeURIComponent(String(token || ''))

  if (!safeToken) return null

  return (
    <nav className="sc-parent-bottom-hover-menu" aria-label="Parent navigation">
      <Link
        href={`/report/${safeToken}`}
        className={active === 'report' ? 'is-active' : ''}
        aria-current={active === 'report' ? 'page' : undefined}
      >
        <FileText size={17} strokeWidth={2.1} />
        <span>Report</span>
      </Link>

      <button
        type="button"
        onClick={onMomentsClick || (() => { window.location.href = `/moments/${safeToken}` })}
        className={active === 'moments' ? 'is-active' : ''}
        aria-label="Open Moments"
      >
        <Sparkles size={17} strokeWidth={2.1} />
        <span>Moments</span>
      </button>
    </nav>
  )
}
