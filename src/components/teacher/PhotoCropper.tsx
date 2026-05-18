// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Check } from 'lucide-react'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
}

interface Props {
  file:     File
  onClose:  () => void
  onSave:   (blob: Blob) => void
}

const CANVAS_SIZE = 320   // preview circle diameter
const OUTPUT_SIZE = 512   // final exported size (square)

export function PhotoCropper({ file, onClose, onSave }: Props) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const [scale,  setScale]  = useState(1)        // 1 = fit, can zoom higher
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imgNat, setImgNat] = useState({ w: 0, h: 0 })
  const [saving, setSaving] = useState(false)

  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    const img = new Image()
    img.onload = () => setImgNat({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Initial scale: ensure the image fully covers the circle (cover-fit)
  useEffect(() => {
    if (!imgNat.w) return
    const minScale = Math.max(CANVAS_SIZE / imgNat.w, CANVAS_SIZE / imgNat.h)
    setScale(minScale)
    setOffset({ x: 0, y: 0 })
  }, [imgNat])

  const onStart = (x: number, y: number) => {
    drag.current = { x, y, ox: offset.x, oy: offset.y }
  }
  const onMove = (x: number, y: number) => {
    if (!drag.current) return
    setOffset({
      x: drag.current.ox + (x - drag.current.x),
      y: drag.current.oy + (y - drag.current.y),
    })
  }
  const onEnd = () => { drag.current = null }

  const save = async () => {
    setSaving(true)
    try {
      // Render the visible circle into a canvas at OUTPUT_SIZE
      const canvas = document.createElement('canvas')
      canvas.width  = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!

      // Background (in case image has transparency)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      // Map the preview coordinates to output coordinates
      const ratio = OUTPUT_SIZE / CANVAS_SIZE
      const renderedW = imgNat.w * scale * ratio
      const renderedH = imgNat.h * scale * ratio
      const cx = OUTPUT_SIZE / 2 + offset.x * ratio
      const cy = OUTPUT_SIZE / 2 + offset.y * ratio

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imgSrc
      await new Promise((r) => { img.onload = r })
      ctx.drawImage(
        img,
        cx - renderedW / 2,
        cy - renderedH / 2,
        renderedW,
        renderedH,
      )

      canvas.toBlob((blob) => {
        if (blob) onSave(blob)
        setSaving(false)
      }, 'image/jpeg', 0.9)
    } catch (e) {
      setSaving(false)
      console.error(e)
    }
  }

  // Compute the displayed image position in the preview
  const displayedW = imgNat.w * scale
  const displayedH = imgNat.h * scale

  // Sliders: min = cover-fit scale, max = 3x that
  const minScale = imgNat.w ? Math.max(CANVAS_SIZE / imgNat.w, CANVAS_SIZE / imgNat.h) : 1
  const maxScale = minScale * 3

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0', padding: 24,
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.ink,
                       letterSpacing: '-0.02em', margin: 0 }}>
            Position your photo
          </h3>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 20px', lineHeight: 1.5 }}>
          Drag to move your face into the circle, then pinch or use the slider to zoom.
        </p>

        {/* Preview */}
        <div style={{
          width: CANVAS_SIZE, height: CANVAS_SIZE,
          margin: '0 auto 20px', position: 'relative',
          borderRadius: '50%', overflow: 'hidden',
          background: '#F0F0F4',
          userSelect: 'none', touchAction: 'none',
          cursor: drag.current ? 'grabbing' : 'grab',
        }}
          onMouseDown ={e => onStart(e.clientX, e.clientY)}
          onMouseMove ={e => onMove (e.clientX, e.clientY)}
          onMouseUp   ={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove ={e => onMove (e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd  ={onEnd}
        >
          {imgSrc && imgNat.w > 0 && (
            <img src={imgSrc} alt="" draggable={false}
              style={{
                position: 'absolute',
                width:  displayedW,
                height: displayedH,
                left:   (CANVAS_SIZE - displayedW) / 2 + offset.x,
                top:    (CANVAS_SIZE - displayedH) / 2 + offset.y,
                pointerEvents: 'none',
              }} />
          )}
        </div>

        {/* Zoom slider */}
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, color: T.ink3,
            letterSpacing: '0.05em', textTransform: 'uppercase',
            margin: '0 0 8px',
          }}>
            Zoom
          </p>
          <input
            type="range"
            min={minScale}
            max={maxScale}
            step={0.01}
            value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: T.ink,
            }}
          />
        </div>

        <button onClick={save} disabled={saving} style={{
          width: '100%', padding: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          borderRadius: 12, background: T.ink, color: T.white, border: 'none',
          fontSize: 15, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.6 : 1, fontFamily: 'inherit',
        }}>
          {saving
            ? 'Uploading…'
            : (<><Check size={16} strokeWidth={2.2} /> Use this photo</>)}
        </button>
      </div>
    </div>
  )
}
