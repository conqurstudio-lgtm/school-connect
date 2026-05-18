'use client'

import { useState, useRef, useEffect } from 'react'
import { SmartImage } from './SmartImage'

interface ImageCarouselProps {
  priority?: boolean
  images:    string[]
  onTap:     (url: string) => void
  flyEmoji?:  { emoji: string; key: number } | null
}

const GAP = 3

function measureRatio(src: string): Promise<number> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload  = () => resolve(img.naturalWidth / img.naturalHeight)
    img.onerror = () => resolve(1.4)
    img.src = src
  })
}

/*
  Clamp ratio:
  - Portrait max 0.8 → slightly less tall than before (prevents overly long images)
  - Landscape max 1.85 → wide but not panoramic
  This keeps images feeling like natural photos not stretched containers
*/
function clamp(r: number) {
  return Math.min(Math.max(r, 0.65), 1.85)
}


/* Each multi-image card: container sizes to fit the image naturally, no cropping */
function MultiCard({ src, onTap, w }: {
  src: string
  onTap: (url: string) => void
  baseH: number
  w: string
}) {
  return (
    <div
      onClick={() => onTap(src)}
      style={{
        minWidth: w,
        maxWidth: w,
        borderRadius: 20,
        overflow: 'hidden',
        flexShrink: 0,
        cursor: 'pointer',
        background: '#f0f0f0',
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: 'auto',        /* height follows the image's natural ratio — no crop */
          display: 'block',
          objectFit: 'unset',
          maxHeight: 360,        /* prevent very tall portraits dominating */
        }}
      />
    </div>
  )
}

export function ImageCarousel({ images, onTap, flyEmoji, priority = false }: ImageCarouselProps) {
  const imgs  = images.filter(Boolean)
  const count = imgs.length

  const [ratio,   setRatio]   = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)


  const firstImg = imgs[0]
  useEffect(() => {
    if (!firstImg) return
    setRatio(null)
    measureRatio(firstImg).then(r => setRatio(clamp(r)))
  }, [firstImg])

  // ── Multi-image horizontal scroll ───────────────────────────────
  // Uses native browser scroll — same pattern as the teachers strip on the feed.
  // Updates the counter based on which image is mostly visible.

  useEffect(() => {
    if (count <= 1) return
    const el = scrollRef.current
    if (!el) return

    let raf: number | null = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        const left = el.scrollLeft
        const itemWidth = el.scrollWidth / imgs.length
        const idx = Math.round(left / itemWidth)
        setCurrent(Math.max(0, Math.min(idx, imgs.length - 1)))
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [imgs.length])

  if (count === 0) return null

  const FlyEmoji = flyEmoji ? (
    <span
      key={flyEmoji.key}
      className="fly-reaction"
      style={{
        position: 'absolute',
        bottom: 16, left: 16,
        zIndex: 20,
        fontSize: 30,
        lineHeight: 1,
        pointerEvents: 'none',
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, sans-serif',
      }}
    >
      {flyEmoji.emoji}
    </span>
  ) : null

  /* Single image: adaptive shape from real ratio
     Multiple images: fixed compact height so they don't dominate the feed */
  const singleStyle: React.CSSProperties = ratio
    ? { aspectRatio: String(ratio), width: '100%' }
    : { height: 260, width: '100%' }
  const multiStyle: React.CSSProperties = { height: 200, width: '100%' }



  /* ── 1 image ── */
  if (count === 1) {
    return (
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <div onClick={() => onTap(imgs[0])}
             style={{ ...singleStyle, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', background: '#f0f0f0' }}>
          <SmartImage src={imgs[0]} priority={priority}
            style={{ width: '100%', height: '100%' }} />
        </div>
        {FlyEmoji}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      {FlyEmoji}

      {/* Horizontal scroll container — snaps to each image */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          borderRadius: 20,
          background: 'transparent',
        }}>
        {imgs.map((src, i) => (
          <div key={i}
            onClick={() => onTap(src)}
            style={{
              flex: '0 0 100%',
              height: 460,
              borderRadius: 20,
              overflow: 'hidden',
              scrollSnapAlign: 'center',
              background: '#f0f0f0',
              cursor: 'pointer',
            }}>
            <SmartImage src={src}
              priority={i === 0 && priority}
              style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>

      {/* Counter pill — top right */}
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        background: 'rgba(0,0,0,0.42)',
        backdropFilter: 'blur(4px)',
        borderRadius: 20, padding: '3px 9px',
        fontSize: 12, fontWeight: 600, color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
        pointerEvents: 'none',
        letterSpacing: '0.02em',
      }}>
        {current + 1} / {imgs.length}
      </div>
    </div>
  )
}
