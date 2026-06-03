'use client'

import { useMemo, useRef, useState } from 'react'
import { ReportCard } from './ReportCard'

const T = {
  ink: '#252525',
  trackBg: '#D9DDDC',
}

type Props = {
  reports: any[]
  childName?: string
}

type Gesture = 'none' | 'horizontal' | 'vertical'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function ReportSwiper({ reports = [], childName }: Props) {
  const visualReports = useMemo(() => {
    return (reports || [])
      .slice()
      .sort((a: any, b: any) => {
        const aDate = new Date(a.week_starting || a.published_at || a.created_at || 0).getTime()
        const bDate = new Date(b.week_starting || b.published_at || b.created_at || 0).getTime()
        return bDate - aDate
      })
  }, [reports])

  const total = visualReports.length

  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [animationRound, setAnimationRound] = useState(0)

  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const deltaX = useRef(0)
  const deltaY = useRef(0)
  const gesture = useRef<Gesture>('none')

  const moveTo = (nextIndex: number) => {
    const safeIndex = clamp(nextIndex, 0, Math.max(0, total - 1))
    setIndex(safeIndex)
    setAnimationRound(round => round + 1)
  }

  const onStart = (x: number, y: number) => {
    startX.current = x
    startY.current = y
    deltaX.current = 0
    deltaY.current = 0
    gesture.current = 'none'
    setDrag(0)
  }

  const onMove = (x: number, y: number) => {
    if (startX.current === null || startY.current === null) return

    const dx = x - startX.current
    const dy = y - startY.current

    deltaX.current = dx
    deltaY.current = dy

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (gesture.current === 'none' && (absX > 4 || absY > 4)) {
      gesture.current = absX >= absY * 0.55 ? 'horizontal' : 'vertical'
    }

    if (gesture.current !== 'horizontal') return

    const atFirst = index === 0 && dx > 0
    const atLast = index === total - 1 && dx < 0
    const resistance = atFirst || atLast ? 0.28 : 1

    setDrag(dx * resistance)
  }

  const onEnd = () => {
    if (gesture.current === 'horizontal') {
      const threshold = 56 // report-swipe-direction-inverted-v245

      // Inverted report history direction:
      // if the previous direction felt reversed on-device, this flips the gesture decision.
      if (deltaX.current > threshold && index < total - 1) {
        moveTo(index + 1)
      }

      if (deltaX.current < -threshold && index > 0) {
        moveTo(index - 1)
      }
    }

    startX.current = null
    startY.current = null
    deltaX.current = 0
    deltaY.current = 0
    gesture.current = 'none'
    setDrag(0)
  }

  if (!total) {
    return null
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        maxWidth: '100%',
        overflowX: 'hidden',
        overflowY: 'hidden',
        position: 'relative',
        overscrollBehavior: 'none',
        touchAction: 'pan-y',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 0,
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'hidden',
          touchAction: 'pan-y',
          userSelect: 'none',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        onTouchStart={event => onStart(event.touches[0].clientX, event.touches[0].clientY)}
        onTouchMove={event => {
          onMove(event.touches[0].clientX, event.touches[0].clientY)

          if (gesture.current === 'horizontal') {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onTouchEnd={onEnd}
        onTouchCancel={onEnd}
        onMouseDown={event => onStart(event.clientX, event.clientY)}
        onMouseMove={event => {
          if (startX.current !== null) {
            onMove(event.clientX, event.clientY)
          }
        }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
            transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
            transition: drag === 0
              ? 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
            willChange: 'transform',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {visualReports.map((report: any, slideIndex: number) => {
            const isActive = slideIndex === index

            return (
              <div
                key={report.id || slideIndex}
                style={{
                  flex: '0 0 100%',
                  height: '100%',
                  width: '100%',
                  maxWidth: '100%',
                  overflowX: 'hidden',
                  overflowY: 'hidden',
                  boxSizing: 'border-box',
                  padding: '0 22px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                }}
              >
                <div
                  data-report-slide="true"
                  style={{
                    width: '100%',
                    maxWidth: 430,
                    height: '100%',
                    maxHeight: '100%',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorY: 'contain',
                    paddingBottom: '104px',
                    boxSizing: 'border-box',
                    opacity: isActive ? 1 : 0.48,
                    filter: isActive ? 'none' : 'grayscale(1)',
                    transition: 'opacity 0.25s ease, filter 0.25s ease',
                  }}
                >
                  <ReportCard
                    key={isActive ? `${report.id || slideIndex}-active-${animationRound}` : `${report.id || slideIndex}-idle`}
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
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'calc(26px + env(safe-area-inset-bottom, 0px))',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            minHeight: 18,
            padding: 0,
            pointerEvents: 'none',
          }}
        >
          {visualReports.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => moveTo(dotIndex)}
              aria-label={`Report ${dotIndex + 1}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: dotIndex === index ? T.ink : T.trackBg,
                border: 'none',
                opacity: dotIndex === index ? 1 : 0.72,
                pointerEvents: 'auto',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.25s ease, opacity 0.25s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
