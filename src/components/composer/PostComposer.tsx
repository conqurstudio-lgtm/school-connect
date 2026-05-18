// @ts-nocheck
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Megaphone, Camera, CalendarDays, FileText, Pin,
         ImageIcon, Paperclip, Plus, ChevronLeft, Send, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { PostType, Post } from '@/lib/types'

interface PostComposerProps {
  schoolId:      string
  authorId:      string
  onPublished:   () => void
  onClose:       () => void
  onOptimistic?: (draft: { type: PostType; body: string; image_urls: string[]; is_pinned: boolean }) => string
  onRemoveOptimistic?: (tempId: string) => void
  post?:         Post
  allowedTypes?: PostType[]
}

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  ink4:   '#C8C8C8',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
}

const POST_TYPES: { type: PostType; label: string; Icon: React.ElementType; placeholder: string }[] = [
  { type: 'update',   label: 'Update',   Icon: Megaphone,    placeholder: 'Share a school announcement…' },
  { type: 'moment',   label: 'Moment',   Icon: Camera,       placeholder: 'Describe this moment…'        },
  { type: 'event',    label: 'Event',    Icon: CalendarDays, placeholder: 'Add event details…'            },
  { type: 'document', label: 'Document', Icon: FileText,      placeholder: 'Add a description…'           },
]

export function PostComposer({
  schoolId, authorId, onPublished, onClose, onOptimistic, onRemoveOptimistic, post, allowedTypes,
}: PostComposerProps) {
  const isEdit = !!post

  const availableTypes = allowedTypes
    ? POST_TYPES.filter(t => allowedTypes.includes(t.type))
    : POST_TYPES

  const [step,          setStep]          = useState<'type' | 'compose'>(isEdit ? 'compose' : 'type')
  const [postType,      setPostType]      = useState<PostType>((post?.type as PostType) ?? availableTypes[0]?.type ?? 'update')
  const [body,          setBody]          = useState(post?.body ?? '')
  const [isPinned,      setIsPinned]      = useState(post?.is_pinned ?? false)
  const [eventDate,     setEventDate]     = useState(post?.event_date ?? '')
  const [eventTime,     setEventTime]     = useState(post?.event_time ?? '')
  const [eventLocation, setEventLocation] = useState(post?.event_location ?? '')
  const [images,        setImages]        = useState<File[]>([])
  const [previews,      setPreviews]      = useState<string[]>(post?.image_urls ?? [])
  const [existingUrls,  setExistingUrls]  = useState<string[]>(post?.image_urls ?? [])
  const [docFile,       setDocFile]       = useState<File | null>(null)
  const [uploading,     setUploading]     = useState(false)

  const imgRef   = useRef<HTMLInputElement>(null)
  const docRef   = useRef<HTMLInputElement>(null)
  const bodyRef  = useRef<HTMLTextAreaElement>(null)

  const selected = POST_TYPES.find(t => t.type === postType) ?? POST_TYPES[0]
  const busy     = uploading

  useEffect(() => {
    if (step === 'compose') {
      setTimeout(() => bodyRef.current?.focus(), 100)
      // Moments — auto open image picker
      if (postType === 'moment' && previews.length === 0 && !isEdit) {
        setTimeout(() => imgRef.current?.click(), 150)
      }
    }
  }, [step])

  const addImages = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024)
    const total = [...images, ...files].slice(0, Math.max(0, 6 - existingUrls.length))
    setImages(total)
    setPreviews([...existingUrls, ...total.map(f => URL.createObjectURL(f))])
    e.target.value = ''
  }, [images, existingUrls])

  const removeImage = (i: number) => {
    if (i < existingUrls.length) {
      const next = existingUrls.filter((_, idx) => idx !== i)
      setExistingUrls(next)
      setPreviews([...next, ...images.map(f => URL.createObjectURL(f))])
    } else {
      const newIdx = i - existingUrls.length
      const next   = images.filter((_, idx) => idx !== newIdx)
      setImages(next)
      setPreviews([...existingUrls, ...next.map(f => URL.createObjectURL(f))])
    }
  }

  const addDoc = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { toast.error('Max 20 MB'); return }
    setDocFile(file)
    e.target.value = ''
  }, [])

  const uploadImages = async () => {
    const urls: string[] = []
    for (const file of images) {
      const ext  = file.name.split('.').pop()
      const path = `${schoolId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('post-images').upload(path, file)
      if (error) { toast.error(`Failed: ${file.name}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(path)
      urls.push(publicUrl)
    }
    return urls
  }

  const uploadDoc = async () => {
    if (!docFile) return null
    const ext  = docFile.name.split('.').pop()
    const path = `${schoolId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('post-documents').upload(path, docFile)
    if (error) { toast.error('Upload failed'); return null }
    const { data: { publicUrl } } = supabase.storage.from('post-documents').getPublicUrl(path)
    return { url: publicUrl, name: docFile.name, size: docFile.size, type: docFile.type }
  }

  const handlePublish = () => {
    if (!body.trim() && previews.length === 0) {
      toast.error('Add some content first')
      return
    }

    // Close composer immediately
    onClose()

    // Add optimistic skeleton post
    const draft = {
      type: postType, body: body.trim(),
      image_urls: previews, is_pinned: isPinned,
    }
    const tempId = onOptimistic?.(draft)

    // Upload and save in background
    const doPublish = async () => {
      const toastId = toast.loading(
        images.length > 0 ? 'Uploading photos…' : isEdit ? 'Saving…' : 'Publishing…'
      )
      try {
        const newUrls   = images.length ? await uploadImages() : []
        const imageUrls = [...existingUrls, ...newUrls]
        const docData   = postType === 'document' ? await uploadDoc() : null

        const payload: Record<string, unknown> = {
          type: postType, body: body.trim() || null,
          is_pinned: isPinned, pinned_at: isPinned ? new Date().toISOString() : null,
          image_urls: imageUrls, edited_at: new Date().toISOString(),
        }

        if (postType === 'event') {
          payload.event_date     = eventDate || null
          payload.event_time     = eventTime || null
          payload.event_location = eventLocation.trim() || null
        }
        if (postType === 'document' && docData) {
          payload.document_url  = docData.url
          payload.document_name = docData.name
          payload.document_size = docData.size
          payload.document_type = docData.type
        }

        if (isEdit && post) {
          const { error } = await supabase.from('posts').update(payload).eq('id', post.id)
          if (error) { toast.error('Failed to save', { id: toastId }); return }
          toast.success('Post updated', { id: toastId })
        } else {
          const { error } = await supabase.from('posts').insert({
            ...payload, school_id: schoolId, author_id: authorId, status: 'published',
          })
          if (error) { toast.error('Failed to publish', { id: toastId }); return }
          toast.success('Published!', { id: toastId })
        }
        // Real-time subscription will update the feed automatically
      } catch {
        toast.error('Something went wrong — please try again.')
      }
    }

    doPublish()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16,
    }}>

      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        background: T.white, borderRadius: 20,
        animation: 'popUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      }}>

        {/* ── Type selection ── */}
        {step === 'type' && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 16px 14px', borderBottom: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>
                New post
              </span>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`,
                background: T.bg, cursor: 'pointer', color: T.ink3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 12 }}>
              {availableTypes.map(({ type, label, Icon, placeholder }) => (
                <button key={type} onClick={() => { setPostType(type); setStep('compose') }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
                    padding: 14, background: T.bg, border: `1px solid ${T.border}`,
                    borderRadius: 14, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}>
                  <div style={{
                    width: 32, height: 32, background: T.white, borderRadius: 9,
                    border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon style={{ width: 15, height: 15, color: T.ink3 }} strokeWidth={1.4} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 2px', letterSpacing: '-0.01em' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 11, color: T.ink3, margin: 0, lineHeight: 1.4 }}>
                      {placeholder}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Compose ── */}
        {step === 'compose' && (
          <>
            {/* Top bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px 12px', borderBottom: `1px solid ${T.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isEdit && (
                  <button onClick={() => setStep('type')} style={{
                    width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`,
                    background: T.bg, cursor: 'pointer', color: T.ink3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <selected.Icon style={{ width: 13, height: 13, color: T.ink3 }} strokeWidth={1.4} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.ink2 }}>
                    {isEdit ? `Edit ${selected.label}` : selected.label}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Pin toggle */}
                <button onClick={() => setIsPinned(v => !v)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', borderRadius: 20,
                  border: `1px solid ${isPinned ? T.ink : T.border}`,
                  background: isPinned ? T.ink : 'none',
                  color: isPinned ? T.white : T.ink3,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  <Pin style={{ width: 10, height: 10 }} strokeWidth={1.6} />
                  {isPinned ? 'Pinned' : 'Pin'}
                </button>
                <button onClick={onClose} style={{
                  width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.bg, cursor: 'pointer', color: T.ink3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>
            </div>

            {/* ── Image strip — top of card ── */}
            {postType !== 'document' && (
              <div style={{
                padding: previews.length > 0 ? '10px 12px 0' : '8px 12px 0',
              }}>
                {previews.length > 0 ? (
                  /* Image thumbnails row */
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{
                        position: 'relative', width: 80, height: 80,
                        borderRadius: 12, overflow: 'hidden', background: T.bg,
                        border: `1px solid ${T.border}`, flexShrink: 0,
                      }}>
                        <img src={src} alt="" style={{
                          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        }} />
                        <button onClick={() => removeImage(i)} style={{
                          position: 'absolute', top: 3, right: 3,
                          width: 18, height: 18, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#fff',
                        }}>
                          <X style={{ width: 9, height: 9 }} />
                        </button>
                      </div>
                    ))}
                    {/* Add more */}
                    {previews.length < 6 && (
                      <button onClick={() => imgRef.current?.click()} style={{
                        width: 80, height: 80, borderRadius: 12,
                        border: `1.5px dashed ${T.border}`, background: T.bg,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        color: T.ink3, flexShrink: 0,
                      }}>
                        <Plus style={{ width: 16, height: 16 }} strokeWidth={1.4} />
                        <span style={{ fontSize: 10, fontFamily: 'inherit' }}>Add</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Empty image prompt — subtle, always visible */
                  <button onClick={() => imgRef.current?.click()} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: T.bg,
                    border: `1px dashed ${T.border}`, borderRadius: 12,
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: T.white,
                      border: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <ImageIcon style={{ width: 14, height: 14, color: T.ink3 }} strokeWidth={1.4} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.ink2, margin: 0 }}>Add photos</p>
                      <p style={{ fontSize: 11, color: T.ink3, margin: '1px 0 0' }}>Up to 6 images, max 5MB each</p>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* ── Body text ── */}
            <div style={{ padding: '10px 16px' }}>
              <textarea
                ref={bodyRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={selected.placeholder}
                rows={4}
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  fontSize: 15, lineHeight: 1.55, color: T.ink,
                  fontFamily: 'inherit', resize: 'none',
                  caretColor: T.ink,
                }}
              />
            </div>

            {/* ── Event fields ── */}
            {postType === 'event' && (
              <div style={{
                margin: '0 12px 8px', padding: '10px 12px',
                background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarDays style={{ width: 12, height: 12, color: T.ink3, flexShrink: 0 }} />
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                               fontSize: 13, color: T.ink, fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock style={{ width: 12, height: 12, color: T.ink3, flexShrink: 0 }} />
                    <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                               fontSize: 13, color: T.ink, fontFamily: 'inherit' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin style={{ width: 12, height: 12, color: T.ink3, flexShrink: 0 }} />
                  <input type="text" value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                    placeholder="Location"
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none',
                             fontSize: 13, color: T.ink, fontFamily: 'inherit' }} />
                </div>
              </div>
            )}

            {/* ── Document upload ── */}
            {postType === 'document' && (
              <div style={{ margin: '0 12px 8px' }}>
                {docFile ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
                  }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.ink, margin: 0,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {docFile.name}
                      </p>
                      <p style={{ fontSize: 11, color: T.ink3, margin: '2px 0 0' }}>
                        {(docFile.size / 1048576).toFixed(1)} MB
                      </p>
                    </div>
                    <button onClick={() => setDocFile(null)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: T.ink3, display: 'flex', alignItems: 'center',
                    }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => docRef.current?.click()} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: T.bg,
                    border: `1.5px dashed ${T.border}`, borderRadius: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <div style={{
                      width: 32, height: 32, background: T.white, borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Paperclip style={{ width: 14, height: 14, color: T.ink3 }} strokeWidth={1.4} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.ink2, margin: 0 }}>Attach document</p>
                      <p style={{ fontSize: 11, color: T.ink3, margin: '1px 0 0' }}>PDF, Word, Excel — max 20 MB</p>
                    </div>
                  </button>
                )}
                <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={addDoc} style={{ display: 'none' }} />
              </div>
            )}

            {/* ── Bottom toolbar ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px 12px',
              borderTop: `1px solid ${T.border}`,
            }}>
              {/* Photo button — only if images already added, show compact icon */}
              {postType !== 'document' && (
                <button onClick={() => imgRef.current?.click()} style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: `1px solid ${T.border}`, background: T.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: previews.length > 0 ? T.ink : T.ink3,
                  position: 'relative',
                }}>
                  <ImageIcon style={{ width: 15, height: 15 }} strokeWidth={1.4} />
                  {previews.length > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 16, height: 16, borderRadius: '50%',
                      background: T.ink, color: T.white,
                      fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${T.white}`,
                    }}>
                      {previews.length}
                    </span>
                  )}
                </button>
              )}

              <input ref={imgRef} type="file" accept="image/*" multiple
                onChange={addImages} style={{ display: 'none' }} />

              <div style={{ flex: 1 }} />

              {/* Publish button */}
              <button onClick={handlePublish} disabled={busy} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 18px', height: 38,
                background: busy ? T.ink4 : T.ink,
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600, color: T.white,
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                cursor: busy ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}>
                {busy ? (
                  <>
                    <div style={{ width: 13, height: 13, borderRadius: '50%',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderTopColor: T.white,
                                  animation: 'spin 0.7s linear infinite' }} />
                    {uploading ? 'Uploading…' : 'Publishing…'}
                  </>
                ) : (
                  <>
                    <Send style={{ width: 13, height: 13 }} />
                    {isEdit ? 'Save' : 'Publish'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
