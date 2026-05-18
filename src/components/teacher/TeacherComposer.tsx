// @ts-nocheck
'use client'

import { useRef, useState } from 'react'
import { X, Image as ImageIcon, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
  red:    '#EF4444',
}

interface Props {
  teacherName:  string
  grade:        string
  className:    string | null
  onClose:      () => void
  onPosted:     () => void
}

export function TeacherComposer({ teacherName, grade, className, onClose, onPosted }: Props) {
  const [body,        setBody]        = useState('')
  const [images,      setImages]      = useState<{ url: string; uploading?: boolean }[]>([])
  const [posting,     setPosting]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const audience = `${grade}${className ? ` · ${className}` : ''}`

  const onFiles = async (files: FileList) => {
    const list = Array.from(files).slice(0, 6 - images.length)
    for (const file of list) {
      // Optimistic placeholder
      const tempId = Math.random().toString(36)
      setImages(prev => [...prev, { url: tempId, uploading: true }])

      try {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/teacher/post-image', { method: 'POST', body: form })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'upload failed')

        // Replace placeholder with real URL
        setImages(prev => prev.map(im =>
          im.url === tempId ? { url: json.url } : im
        ))
      } catch (e: any) {
        toast.error(e.message || 'Upload failed')
        setImages(prev => prev.filter(im => im.url !== tempId))
      }
    }
  }

  const removeImage = (url: string) => {
    setImages(prev => prev.filter(im => im.url !== url))
  }

  const submit = async () => {
    const text = body.trim()
    const photos = images.filter(im => !im.uploading).map(im => im.url)
    if (!text && photos.length === 0) {
      toast.error('Write something or add a photo'); return
    }
    if (images.some(im => im.uploading)) {
      toast.error('Wait for uploads to finish'); return
    }

    setPosting(true)
    const tid = toast.loading('Posting…')
    try {
      const res = await fetch('/api/teacher/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body:       text,
          image_urls: photos,
          type:       'update',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'failed')
      toast.success('Posted to your class', { id: tid })
      onPosted()
    } catch (e: any) {
      toast.error(e.message || 'Failed', { id: tid })
      setPosting(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, background: T.white,
        borderRadius: '20px 20px 0 0',
        animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                         letterSpacing: '-0.02em', margin: 0 }}>
              Post to your class
            </h3>
            <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
              {audience} · only parents in your class will see this
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.ink3,
          }}>
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={`Share something with your class…`}
            autoFocus
            rows={5}
            style={{
              width: '100%', padding: '4px 0', fontSize: 16,
              border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'inherit', color: T.ink, background: 'transparent',
              boxSizing: 'border-box',
            }}
          />

          {/* Image previews */}
          {images.length > 0 && (
            <div style={{
              display: 'flex', gap: 8, flexWrap: 'wrap',
              marginTop: 12,
            }}>
              {images.map(im => (
                <div key={im.url} style={{
                  width: 84, height: 84, borderRadius: 12,
                  background: im.uploading
                    ? '#F0F0F2'
                    : `url(${im.url}) center/cover`,
                  position: 'relative', flexShrink: 0,
                }}>
                  {im.uploading && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%',
                                    border: `2px solid ${T.border}`, borderTopColor: T.ink,
                                    animation: 'spin 0.7s linear infinite' }} />
                    </div>
                  )}
                  {!im.uploading && (
                    <button onClick={() => removeImage(im.url)} style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.white,
                    }}>
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 20px 16px',
          borderTop: `1px solid ${T.border}`,
        }}>
          <button onClick={() => fileRef.current?.click()}
            disabled={images.length >= 6}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 10,
              background: 'none', border: `1px solid ${T.border}`,
              cursor: images.length >= 6 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, color: T.ink2,
              fontFamily: 'inherit',
              opacity: images.length >= 6 ? 0.5 : 1,
            }}>
            <ImageIcon size={14} strokeWidth={1.8} />
            {images.length > 0 ? `${images.length}/6` : 'Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files) onFiles(e.target.files)
              e.target.value = ''
            }} />

          <div style={{ flex: 1 }} />

          <button onClick={submit} disabled={posting} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 18px', borderRadius: 999,
            background: T.ink, color: T.white, border: 'none',
            fontSize: 14, fontWeight: 600,
            cursor: posting ? 'wait' : 'pointer',
            opacity: posting ? 0.6 : 1,
            fontFamily: 'inherit',
          }}>
            <Send size={13} strokeWidth={2.2} />
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}
