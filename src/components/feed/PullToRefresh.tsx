// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  onRefresh: () => Promise<void> | void
  children:  React.ReactNode
}

const TRIGGER  = 70   // px pull distance to trigger refresh
const MAX_PULL = 110  // capped visible pull

export function PullToRefresh({ onRefresh, children }: Props) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const startY     = useRef<number | null>(null)
  const [pull, setPull]   = useState(0)
  const [busy, setBusy]   = useState(false)

  const onTouchStart = (e: React.TouchEvent) => {
    // Only start tracking if we're at the very top of the page
    const w = wrapRef.current
    if (!w) return
    const scrollEl = w.closest('[data-scroll-container]') as HTMLElement | null || window
    const scrollTop = scrollEl instanceof Window ? window.scrollY : scrollEl.scrollTop
    if (scrollTop > 4) return
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || busy) return
    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) return
    // dampen the pull — feels rubber-band
    const damped = Math.min(MAX_PULL, dy * 0.55)
    setPull(damped)
  }

  const onTouchEnd = async () => {
    if (startY.current === null) return
    startY.current = null
    if (pull >= TRIGGER) {
      setBusy(true)
      setPull(56)
      try { await onRefresh() } catch {}
      setBusy(false)
      setPull(0)
    } else {
      setPull(0)
    }
  }

  const indicatorOpacity = Math.min(1, pull / TRIGGER)
  const indicatorRotation = pull * 4  // rotates as the user pulls

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Pull indicator */}
      <div style={{
        position: 'absolute', top: -10, left: 0, right: 0,
        height: pull, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        opacity: indicatorOpacity,
        transition: busy ? 'none' : 'opacity 0.2s',
      }}>
        <RefreshCw
          size={20}
          color="#1A1A1A"
          strokeWidth={2}
          style={{
            transform: busy
              ? 'none'
              : `rotate(${indicatorRotation}deg)`,
            animation: busy ? 'spin 0.7s linear infinite' : 'none',
            transition: busy ? 'none' : 'transform 0.05s linear',
          }}
        />
      </div>

      {/* Content shifts down on pull */}
      <div style={{
        transform: `translateY(${pull}px)`,
        transition: pull === 0 || busy
          ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'
          : 'none',
      }}>
        {children}
      </div>
    </div>
  )
}
