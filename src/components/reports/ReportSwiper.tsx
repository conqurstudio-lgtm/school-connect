// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ReportCard } from './ReportCard'

const T = {
  ink:     '#1A1A1A',
  ink3:    '#9A9A9A',
  ink4:    '#D8D8D8',
  trackBg: '#EFEFF2',
}

interface Props {
  reports:   any[]
  childName: string
}

export function ReportSwiper({ reports, childName }: Props) {
  const [index, setIndex] = useState(Math.max(0, reports.length - 1))  // start at newest
  const startX  = useRef<number | null>(null)
  const deltaX  = useRef(0)
  const [drag, setDrag] = useState(0)

  // First-visit swipe hint — using a separate offset so it doesn't fight the index transform
  const [hintOffset, setHintOffset] = useState(0)
  useEffect(() => {
    if (reports.length > 1) {
      try {
        const seen = sessionStorage.getItem('reports-hint-seen')
        if (!seen) {
          sessionStorage.setItem('reports-hint-seen', '1')
          // Choreograph: pause → slide left → hold → return
          setTimeout(() => setHintOffset(-40), 600)
          setTimeout(() => setHintOffset(0),   1700)
        }
      } catch {}
    }
  }, [reports.length])

  const total = reports.length
  const clamp = (n: number) => Math.max(0, Math.min(total - 1, n))

  const onStart = (x: number) => { startX.current = x; deltaX.current = 0 }
  const onMove  = (x: number) => {
    if (startX.current === null) return
    deltaX.current = x - startX.current
    setDrag(deltaX.current)
  }
  const onEnd = () => {
    if (startX.current === null) return
    const threshold = 60
    if (deltaX.current < -threshold && index < total - 1) setIndex(i => i + 1)
    else if (deltaX.current > threshold && index > 0)     setIndex(i => i - 1)
    startX.current = null
    deltaX.current = 0
    setDrag(0)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{ overflow: 'hidden', touchAction: 'pan-y' }}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove ={e => onMove (e.touches[0].clientX)}
        onTouchEnd  ={onEnd}
        onMouseDown ={e => onStart(e.clientX)}
        onMouseMove ={e => { if (startX.current !== null) onMove(e.clientX) }}
        onMouseUp   ={onEnd}
        onMouseLeave={onEnd}
      >
        <div style={{
          display: 'flex',
          transform: `translateX(calc(${-index * 100}% + ${drag + hintOffset}px))`,
          transition: drag === 0
            ? 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
          willChange: 'transform',
        }}>
          {reports.map(report => (
            <div key={report.id} style={{
              flex: '0 0 100%', padding: '0 24px',
              userSelect: 'none',
            }}>
              <ReportCard report={report} childName={childName} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      {total > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, marginTop: 24,
        }}>
          {reports.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} aria-label={`Week ${i + 1}`}
              style={{
                width: i === index ? 18 : 6, height: 6, borderRadius: 3,
                background: i === index ? T.ink : T.trackBg,
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'all 0.25s',
              }} />
          ))}
        </div>
      )}

      {/* Arrows (desktop) */}
      {total > 1 && (
        <>
          {index > 0 && (
            <button onClick={() => setIndex(i => clamp(i - 1))}
              aria-label="Previous report"
              style={{
                position: 'absolute', left: 6, top: 'calc(50% - 60px)',
                transform: 'translateY(-50%)',
                width: 36, height: 36,
                background: 'none', border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
              <ChevronLeft size={26} color="#1A1A1A" strokeWidth={2} />
            </button>
          )}
          {index < total - 1 && (
            <button onClick={() => setIndex(i => clamp(i + 1))}
              aria-label="Next report"
              style={{
                position: 'absolute', right: 6, top: 'calc(50% - 60px)',
                transform: 'translateY(-50%)',
                width: 36, height: 36,
                background: 'none', border: 'none', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
              <ChevronRight size={26} color="#1A1A1A" strokeWidth={2} />
            </button>
          )}
        </>
      )}
    </div>
  )
}
