// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { ParentBottomHoverMenu } from '@/components/parents/ParentBottomHoverMenu'

type ParentSharedAppShellProps = {
  token: string
  active: 'report' | 'moments'
  children: React.ReactNode
  withBottomMenu?: boolean
  className?: string
}

/**
 * Shared parent public-page app shell.
 *
 * Use this for pages opened from the parent report link:
 * - /report/[token]
 * - /moments/[token]
 *
 * The goal is to make these pages feel like one installed app screen on iPhone,
 * not separate website pages.
 */
export function ParentSharedAppShell({
  token,
  active,
  children,
  withBottomMenu = true,
  className = '',
}: ParentSharedAppShellProps) {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body

    const previous = {
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      htmlBackground: html.style.background,
      bodyOverflow: body.style.overflow,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyBackground: body.style.background,
      bodyTouchAction: body.style.touchAction,
    }

    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    html.style.background = '#FFFFFF'

    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    body.style.background = '#FFFFFF'
    body.style.touchAction = 'pan-y'

    return () => {
      html.style.overflow = previous.htmlOverflow
      html.style.overscrollBehavior = previous.htmlOverscroll
      html.style.background = previous.htmlBackground

      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscroll
      body.style.background = previous.bodyBackground
      body.style.touchAction = previous.bodyTouchAction
    }
  }, [])

  return (
    <main
      className={`sc-parent-shared-app-shell-v1 ${className}`}
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#1A1A1A',
        background: '#FFFFFF',
        position: 'relative',
      }}
    >
      <div
        className="sc-parent-shared-app-scroll-v1"
        style={{
          height: '100%',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          background: '#FFFFFF',
          paddingBottom: withBottomMenu ? 'calc(78px + env(safe-area-inset-bottom, 0px))' : 0,
        }}
      >
        {children}
      </div>

      {withBottomMenu ? (
        <ParentBottomHoverMenu token={token} active={active} />
      ) : null}
    </main>
  )
}
