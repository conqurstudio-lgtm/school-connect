'use client'

import Link from 'next/link'
import { FileText, Sparkles } from 'lucide-react'

type ParentBottomHoverMenuProps = {
  token: string
  active: 'report' | 'moments'
}

export function ParentBottomHoverMenu({ token, active }: ParentBottomHoverMenuProps) {
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

      <Link
        href={`/moments/${safeToken}`}
        className={active === 'moments' ? 'is-active' : ''}
        aria-current={active === 'moments' ? 'page' : undefined}
      >
        <Sparkles size={17} strokeWidth={2.1} />
        <span>Moments</span>
      </Link>
    </nav>
  )
}
