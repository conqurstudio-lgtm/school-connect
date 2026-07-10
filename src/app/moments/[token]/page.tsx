// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { ParentMomentsPage } from '@/components/parents/ParentMomentsPage'
import { ParentBottomHoverMenu } from '@/components/parents/ParentBottomHoverMenu'

export default function MomentsPage({ params }: { params: { token: string } }) {
  const token = params.token || ''

  useEffect(() => {
    // moments-route-shell-lock-v1
    // Keep the shared Moments route feeling like the saved-to-home-screen app,
    // not like a normal website page.
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
      className="sc-parent-moments-route-app-shell-v1"
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
        className="sc-parent-moments-route-scroll-v1"
        style={{
          height: '100%',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          background: '#FFFFFF',
          paddingBottom: 'calc(92px + env(safe-area-inset-bottom))',
        }}
      >
        <ParentMomentsPage token={token} />
      </div>

      <ParentBottomHoverMenu token={token} active="moments" />
    </main>
  )
}
