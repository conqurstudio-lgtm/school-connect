// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReportCard } from './ReportCard'

const T = {
  ink: '#1A1A1A',
  trackBg: '#EFEFF2',
  border: 'rgba(0,0,0,0.07)',
}

interface Props {
  reports: any[]
  childName: string
}

export function ReportSwiper({ reports, childName }: Props) {
  // Parent report page passes newest-first.
  // We reverse only the visual carousel order so older reports sit to the LEFT.
  const visualReports = useMemo(() => {
    return (reports || []).slice().reverse()
  }, [reports])

  const total = Math.max(1, visualReports.length)
  const latestIndex = Math.max(0, total - 1)

  const [index, setIndex] = useState(latestIndex)
  const [drag, setDrag] = useState(0)
  const [animationRound, setAnimationRound] = useState(0)

  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  const gesture = useRef<'none' | 'horizontal' | 'vertical'>('none')

  useEffect(() => {
    setIndex(Math.max(0, total - 1))
    setAnimationRound(round => round + 1)
  }, [total])

  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n))

  const moveTo = (nextIndex: number) => {
    const next = clamp(nextIndex)
    if (next === index) return

    setIndex(next)
    setAnimationRound(round => round + 1)
  }

  const lockPageScroll = () => {
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
  }

  const unlockPageScroll = () => {
    document.documentElement.style.overscrollBehavior = ''
    document.body.style.overscrollBehavior = ''
  }

  const onStart = (x: number, y: number) => {
    startX.current = x
    startY.current = y
    deltaX.current = 0
    deltaY.current = 0
    gesture.current = 'none'
  }

  const onMove = (x: number, y: number) => {
    if (startX.current === null || startY.current === null) return

    deltaX.current = x - startX.current
    deltaY.current = y - startY.current

    const absX = Math.abs(deltaX.current)
    const absY = Math.abs(deltaY.current)

    if (gesture.current === 'none' && (absX > 6 || absY > 6)) {
      if (absX >= absY * 0.72) {
        gesture.current = 'horizontal'
        lockPageScroll()
      } else {
        gesture.current = 'vertical'
      }
    }

    if (gesture.current !== 'horizontal') {
      setDrag(0)
      return
    }

    const atLeftEnd = index === 0 && deltaX.current > 0
    const atRightEnd = index === total - 1 && deltaX.current < 0
    const resistance = atLeftEnd || atRightEnd ? 0.22 : 1

    setDrag(deltaX.current * resistance)
  }

  const onEnd = () => {
    if (startX.current === null) return

    const threshold = 42

    if (gesture.current === 'horizontal') {
      // Older reports are on the LEFT side of the latest report.
      if (deltaX.current > threshold && index > 0) {
        moveTo(index - 1)
      }

      if (deltaX.current < -threshold && index < total - 1) {
        moveTo(index + 1)
      }
    }

    startX.current = null
    startY.current = null
    deltaX.current = 0
    deltaY.current = 0
    gesture.current = 'none'
    setDrag(0)
    unlockPageScroll()
  }

  return (
    <div style={{
      width: '100%',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
      maxWidth: '100%',
      overflowX: 'hidden',
      overflowY: 'visible',
      position: 'relative',
      overscrollBehaviorX: 'none',
      boxSizing: 'border-box',
    }}>
      <div
        style={{
          width: '100%',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'visible',
          touchAction: 'none',
          userSelect: 'none',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => {
          onMove(e.touches[0].clientX, e.touches[0].clientY)

          if (gesture.current === 'horizontal') {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        onMouseDown={e => onStart(e.clientX, e.clientY)}
        onMouseMove={e => {
          if (startX.current !== null) onMove(e.clientX, e.clientY)
        }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
          transition: drag === 0
            ? 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
          willChange: 'transform',
          width: '100%',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
          maxWidth: '100%',
        }}>
          {(visualReports.length ? visualReports : []).map((report: any, slideIndex: number) => {
            const isActive = slideIndex === index

            return (
              <div key={report.id} style={{
                flex: '0 0 100%',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
                width: '100%',
                maxWidth: '100%',
                overflowX: 'hidden',
                overflowY: 'visible',
                boxSizing: 'border-box',
                padding: '0 22px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}>
                <div data-report-slide="true" style={{
                  width: '100%',
              scrollSnapAlign: 'center',
              scrollSnapStop: 'always',
                  maxWidth: 430,
                  overflowX: 'hidden',
                  overflowY: 'visible',
                }}>
                  <ReportCard
                    key={isActive ? `${report.id}-active-${animationRound}` : `${report.id}-idle`}
                    report={report}
                    childName={childName}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {total > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
            zIndex: 40,
            pointerEvents: 'none',
          minHeight: 34,
          padding: '2px 0 10px',
        }}>
          {visualReports.map((_, i) => (
            <button
              key={i}
              onClick={() => moveTo(i)}
              aria-label={`Report ${i + 1}`}
              style={{
                width: i === index ? 18 : 6,
                height: 36,
                borderRadius: 999,
                background: i === index ? T.ink : T.trackBg,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
      )}

      {total > 1 && index > 0 && (
        <button
          onClick={() => moveTo(index - 1)}
          aria-label="Older report"
          style={arrowStyle('left')}
        >
          <ChevronLeft size={23} color={T.ink} strokeWidth={2} />
        </button>
      )}

      {total > 1 && index < total - 1 && (
        <button
          onClick={() => moveTo(index + 1)}
          aria-label="Newer report"
          style={arrowStyle('right')}
        >
          <ChevronRight size={23} color={T.ink} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

function arrowStyle(side: 'left' | 'right'): any {
  return {
    position: 'fixed',
    [side]: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.90)',
    border: `1px solid ${T.border}`,
    boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 30,
  }
}
