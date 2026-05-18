// @ts-nocheck
'use client'

import { useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  onRefresh: () => Promise<void> | void
  children:  React.ReactNode
}

const TRIGGER  = 72
const MAX_PULL = 108

export function PullToRefresh({ onRefresh, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const startY  = useRef<number | null>(null)
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)

  const getScrollTop = () => {
    const w = wrapRef.current
    const scrollEl = w?.closest('[data-scroll-container]') as HTMLElement | null
    return scrollEl ? scrollEl.scrollTop : window.scrollY
  }

  const onTouchStart = (e: React.TouchEvent) => {
    if (busy) return
    if (getScrollTop() > 4) return
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || busy) return
    if (getScrollTop() > 4) {
      startY.current = null
      setPull(0)
      return
    }

    const dy = e.touches[0].clientY - startY.current
    if (dy <= 0) return

    const damped = Math.min(MAX_PULL, dy * 0.52)
    setPull(damped)
  }

  const onTouchEnd = async () => {
    if (startY.current === null) return
    startY.current = null

    if (pull >= TRIGGER) {
      setBusy(true)
      setPull(54)
      try { await onRefresh() } catch {}
      window.setTimeout(() => {
        setBusy(false)
        setPull(0)
      }, 160)
    } else {
      setPull(0)
    }
  }

  const indicatorOpacity = Math.min(1, pull / TRIGGER)
  const indicatorRotation = pull * 4

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ position: 'relative', minHeight: 1 }}
    >
      <div style={{
        position: 'absolute',
        top: -8,
        left: 0,
        right: 0,
        height: pull,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        opacity: indicatorOpacity,
        transition: busy ? 'none' : 'opacity 0.18s ease',
        zIndex: 1,
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
        }}>
          <RefreshCw
            size={18}
            color="#1A1A1A"
            strokeWidth={2}
            style={{
              transform: busy ? 'none' : `rotate(${indicatorRotation}deg)`,
              animation: busy ? 'spin 0.7s linear infinite' : 'none',
              transition: busy ? 'none' : 'transform 0.04s linear',
            }}
          />
        </div>
      </div>

      <div style={{
        transform: `translate3d(0, ${pull}px, 0)`,
        transition: pull === 0 || busy
          ? 'transform 0.26s cubic-bezier(0.22,1,0.36,1)'
          : 'none',
        willChange: pull > 0 ? 'transform' : 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}
