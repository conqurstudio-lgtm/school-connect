// @ts-nocheck
'use client'

/**
 * SmartImage — applies the strategy big apps use:
 *  1. IntersectionObserver — only load when scrolled near viewport (200px ahead)
 *  2. Native lazy loading as fallback
 *  3. Soft grey placeholder until image decodes
 *  4. Fade-in when ready — feels like content was already there
 *  5. Above-the-fold images load eagerly (priority prop)
 */

import { useEffect, useRef, useState } from 'react'

interface Props {
  src:      string
  alt?:     string
  priority?: boolean      // load immediately (first card, hero images)
  style?:   any
  className?: string
  onClick?: () => void
  draggable?: boolean
}

export function SmartImage({
  src, alt = '', priority = false, style = {},
  className, onClick, draggable,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView,  setInView]  = useState(priority)  // priority = load instantly
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    if (priority || inView) return
    if (!ref.current) return

    const io = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px 0px' }  // start loading 200px before it enters view
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [priority, inView])

  return (
    <div ref={ref} onClick={onClick} className={className} style={{
      position: 'relative',
      background: '#F0F0F2',
      ...style,
    }}>
      {inView && (
        <img
          src={src}
          alt={alt}
          draggable={draggable}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%', height: '100%',
            display: 'block', objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease-out',
          }}
        />
      )}
    </div>
  )
}
