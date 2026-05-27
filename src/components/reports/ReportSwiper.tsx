// @ts-nocheck
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ReportCard } from '@/components/reports/ReportCard'

const T = {
  ink: '#252525',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  accent: '#8FA6A1',
  soft: '#F7F7F8',
  bg: '#FFFFFF',
}

function getReports(props: any) {
  if (Array.isArray(props?.reports)) return props.reports
  if (Array.isArray(props?.items)) return props.items
  if (Array.isArray(props?.data)) return props.data
  if (props?.report) return [props.report]
  return []
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function ReportSwiper(props: any) {
  const reports = getReports(props)
  const total = reports.length

  const initialIndex = Number.isFinite(Number(props?.initialIndex))
    ? Number(props.initialIndex)
    : 0

  const [activeIndex, setActiveIndex] = useState(() => clamp(initialIndex, 0, Math.max(0, total - 1)))
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [directionLocked, setDirectionLocked] = useState<'x' | 'y' | null>(null)

  const startRef = useRef({
    x: 0,
    y: 0,
    started: false,
  })

  useEffect(() => {
    setActiveIndex(current => clamp(current, 0, Math.max(0, total - 1)))
  }, [total])

  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex < total - 1

  const translate = useMemo(() => {
    return `translate3d(calc(${-activeIndex * 100}% + ${dragX}px), 0, 0)`
  }, [activeIndex, dragX])

  const moveTo = (nextIndex: number) => {
    setActiveIndex(clamp(nextIndex, 0, Math.max(0, total - 1)))
    setDragX(0)
    setIsDragging(false)
    setDirectionLocked(null)
    startRef.current.started = false
  }

  const handlePointerDown = (event: any) => {
    if (total <= 1) return

    startRef.current = {
      x: event.clientX ?? 0,
      y: event.clientY ?? 0,
      started: true,
    }

    setIsDragging(true)
    setDirectionLocked(null)
    setDragX(0)

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId)
    } catch {}
  }

  const handlePointerMove = (event: any) => {
    if (!startRef.current.started || total <= 1) return

    const currentX = event.clientX ?? 0
    const currentY = event.clientY ?? 0

    const dx = currentX - startRef.current.x
    const dy = currentY - startRef.current.y

    if (!directionLocked) {
      if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return

      const nextLock = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y'
      setDirectionLocked(nextLock)

      if (nextLock === 'y') {
        setIsDragging(false)
        setDragX(0)
        return
      }
    }

    if (directionLocked === 'y') return

    event.preventDefault?.()

    let nextDrag = dx

    if ((!canGoPrev && dx > 0) || (!canGoNext && dx < 0)) {
      nextDrag = dx * 0.22
    }

    setDragX(nextDrag)
  }

  const handlePointerEnd = () => {
    if (!startRef.current.started || total <= 1) return

    const threshold = 58

    if (directionLocked === 'x') {
      if (dragX <= -threshold && canGoNext) {
        moveTo(activeIndex + 1)
        return
      }

      if (dragX >= threshold && canGoPrev) {
        moveTo(activeIndex - 1)
        return
      }
    }

    moveTo(activeIndex)
  }

  const handleKeyDown = (event: any) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveTo(activeIndex - 1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveTo(activeIndex + 1)
    }
  }

  if (!total) {
    return (
      <div style={{
        minHeight: 260,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 24,
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 560, color: T.ink, margin: '0 0 5px' }}>
            No reports yet
          </p>
          <p style={{ fontSize: 13, color: T.ink3, lineHeight: 1.5, margin: 0 }}>
            Weekly reports will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <section
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: '1fr auto',
        background: T.bg,
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          minHeight: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          touchAction: directionLocked === 'x' ? 'none' : 'pan-y',
          userSelect: isDragging ? 'none' : 'auto',
          cursor: total > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: `${total * 100}%`,
            height: '100%',
            transform: translate,
            transition: isDragging && directionLocked === 'x'
              ? 'none'
              : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          }}
        >
          {reports.map((report: any, index: number) => (
            <article
              key={report?.id || report?.created_at || index}
              aria-hidden={index !== activeIndex}
              style={{
                width: `${100 / total}%`,
                height: '100%',
                minWidth: 0,
                flex: '0 0 auto',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                padding: '0 0 10px',
              }}>
                <ReportCard
                  {...props}
                  report={report}
                  reports={reports}
                  activeIndex={activeIndex}
                  index={index}
                  total={total}
                  isActive={index === activeIndex}
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      {total > 1 && (
        <footer style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          minHeight: 34,
          padding: '4px 0 2px',
          background: T.bg,
        }}>
          {reports.map((report: any, index: number) => {
            const active = index === activeIndex

            return (
              <button
                key={report?.id || report?.created_at || index}
                type="button"
                aria-label={`View report ${index + 1}`}
                onClick={() => moveTo(index)}
                style={{
                  width: active ? 18 : 6,
                  height: 6,
                  borderRadius: 999,
                  border: 'none',
                  background: active ? T.accent : 'rgba(0,0,0,0.14)',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'width 180ms ease, background 180ms ease',
                }}
              />
            )
          })}
        </footer>
      )}
    </section>
  )
}

export default ReportSwiper
