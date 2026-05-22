// @ts-nocheck
'use client'
// school-home-icon-life-view-v6
// school-logo-home-settings-flow-v7
// school-logo-home-onboarding-cues-v8
// school-home-simple-empty-state-v9
// school-logo-static-blue-setup-dot-v10
// school-home-empty-card-match-teachers-v11
// school-home-empty-card-theme-standard-v12
// school-home-empty-card-transparent-v13
// school-logo-adjust-crop-v14
// school-profile-clean-light-card-v4
// school-profile-spacing-icon-cleanup-v5

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Home,
  Building2,
  Camera,
  ChevronDown,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { School, Profile } from '@/lib/types'
import { TeachersTab } from './TeachersTab'

interface SchoolProfilePageProps {
  school:   School
  profile:  Profile
  isAdmin:  boolean
  userId:   string
}

type SchoolView = 'home' | 'profile' | 'classes' | 'settings'

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#8E8E93',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  soft:   '#F4F4F6',
  soft2:  '#F8F8FB',
  white:  '#FFFFFF',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  fontSize: 16,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  background: T.white,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 650,
  color: T.ink3,
  textTransform: 'uppercase',
  letterSpacing: '0.055em',
  margin: '0 0 6px',
}

const quietButton: React.CSSProperties = {
  height: 38,
  borderRadius: 999,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 650,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 13px',
}

const primaryButton: React.CSSProperties = {
  ...quietButton,
  border: 'none',
  background: T.ink,
  color: T.white,
}

function initialsFrom(name?: string | null) {
  return String(name || 'S')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}


function formatShortDate(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function SectionCard({ children, style = {} }: any) {
  return (
    <section style={{
      margin: '0 14px 10px',
      padding: 14,
      borderRadius: 22,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 10px 28px rgba(0,0,0,0.028)',
      ...style,
    }}>
      {children}
    </section>
  )
}

function SectionTitle({ eyebrow, title, subtitle }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      {eyebrow && (
        <p style={{
          fontSize: 11,
          fontWeight: 650,
          color: T.ink3,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          margin: '0 0 4px',
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{
        fontSize: 16,
        fontWeight: 650,
        color: T.ink,
        letterSpacing: '-0.02em',
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: 13,
          color: T.ink3,
          lineHeight: 1.45,
          margin: '4px 0 0',
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function AccordionCard({ title, subtitle, icon, children, defaultOpen = false }: any) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      borderRadius: 20,
      background: T.white,
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      boxShadow: '0 8px 22px rgba(0,0,0,0.022)',
    }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: T.white,
          border: 'none',
          padding: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: T.soft,
          color: T.ink2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14,
            fontWeight: 650,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{
              fontSize: 12.5,
              color: T.ink3,
              margin: '2px 0 0',
              lineHeight: 1.35,
            }}>
              {subtitle}
            </p>
          )}
        </div>

        <ChevronDown
          size={16}
          strokeWidth={1.9}
          style={{
            color: T.ink3,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.16s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          padding: '3px 13px 13px',
          background: T.white,
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function DetailLine({ label, value }: any) {
  if (!value) return null

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 14,
      padding: '12px 0',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{
        fontSize: 12.5,
        color: T.ink3,
        fontWeight: 500,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        color: T.ink2,
        fontWeight: 500,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '62%',
      }}>
        {value}
      </span>
    </div>
  )
}

function EditSchoolDetails({ school, onCancel, onSaved }: any) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(school.name || '')
  const [tagline, setTagline] = useState(school.tagline || '')
  const [address, setAddress] = useState(school.address || '')
  const [province, setProvince] = useState(school.province || '')
  const [phone, setPhone] = useState(school.phone || '')
  const [email, setEmail] = useState(school.email || '')
  const [website, setWebsite] = useState(school.website || '')

  const save = async () => {
    if (!name.trim()) {
      toast.error('School name is required')
      return
    }

    setSaving(true)
    const updates = {
      name: name.trim(),
      tagline: tagline.trim() || null,
      address: address.trim() || null,
      province: province.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      website: website.trim() || null,
    }

    const { error } = await supabase.from('schools').update(updates).eq('id', school.id)
    setSaving(false)

    if (error) {
      toast.error('Could not save school details')
      return
    }

    toast.success('School details saved')
    onSaved(updates)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 10 }}>
      <div>
        <label style={labelStyle}>School name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Short tagline</label>
        <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Together we grow" style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={labelStyle}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="011 000 0000" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@school.co.za" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Location</label>
        <input value={province || address} onChange={e => {
          setProvince(e.target.value)
          if (!address) setAddress(e.target.value)
        }} placeholder="Johannesburg, Gauteng" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Website</label>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={inputStyle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 2 }}>
        <button type="button" onClick={onCancel} style={quietButton}>
          <X size={14} strokeWidth={2} />
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={save} style={{
          ...primaryButton,
          opacity: saving ? 0.6 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}>
          <Save size={14} strokeWidth={2} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}




function LogoAdjustModal({ draft, onCancel, onApply, uploading }: any) {
  const [zoom, setZoom] = useState(1.18)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<any>(null)

  const cropSize = 230
  const outputSize = 512

  useEffect(() => {
    return () => {
      dragRef.current = null
    }
  }, [])

  const startDrag = (event: any) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialX: offset.x,
      initialY: offset.y,
    }
  }

  const moveDrag = (event: any) => {
    if (!dragRef.current) return
    const nextX = dragRef.current.initialX + (event.clientX - dragRef.current.startX)
    const nextY = dragRef.current.initialY + (event.clientY - dragRef.current.startY)
    const max = 64
    setOffset({
      x: Math.max(-max, Math.min(max, nextX)),
      y: Math.max(-max, Math.min(max, nextY)),
    })
  }

  const stopDrag = () => {
    dragRef.current = null
  }

  const createCroppedBlob = async () => {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = draft.previewUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not prepare logo image')

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputSize, outputSize)

    const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight)
    const scale = baseScale * zoom
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    const outputOffsetX = offset.x * (outputSize / cropSize)
    const outputOffsetY = offset.y * (outputSize / cropSize)

    const dx = (outputSize - drawWidth) / 2 + outputOffsetX
    const dy = (outputSize - drawHeight) / 2 + outputOffsetY

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Could not crop logo'))
        else resolve(blob)
      }, 'image/png', 0.94)
    })
  }

  const apply = async () => {
    const blob = await createCroppedBlob()
    await onApply(blob)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      background: 'rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      padding: '18px 12px calc(18px + env(safe-area-inset-bottom, 0px))',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: T.white,
        borderRadius: 24,
        border: `1px solid ${T.border}`,
        boxShadow: '0 24px 70px rgba(0,0,0,0.18)',
        padding: 16,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 650, color: T.ink, margin: 0 }}>
            Adjust school logo
          </p>
          <p style={{ fontSize: 12.8, color: T.ink3, lineHeight: 1.45, margin: '4px 0 0' }}>
            Zoom and drag until it fits the circle.
          </p>
        </div>

        <div style={{
          width: cropSize,
          height: cropSize,
          borderRadius: 999,
          overflow: 'hidden',
          margin: '0 auto',
          background: T.soft,
          border: `1px dashed ${T.border}`,
          position: 'relative',
          touchAction: 'none',
          cursor: 'grab',
        }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <img
            src={draft.previewUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: 'center',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 12.4, color: T.ink3, fontWeight: 600 }}>Zoom</span>
            <button type="button" onClick={() => {
              setZoom(1.18)
              setOffset({ x: 0, y: 0 })
            }} style={{
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink2,
              borderRadius: 999,
              padding: '5px 9px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}>
              Reset
            </button>
          </div>

          <input
            type="range"
            min="1"
            max="2.8"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 9,
          marginTop: 16,
        }}>
          <button type="button" onClick={onCancel} disabled={uploading} style={{
            height: 40,
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.ink2,
            fontSize: 13,
            fontWeight: 650,
            cursor: uploading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}>
            Cancel
          </button>

          <button type="button" onClick={apply} disabled={uploading} style={{
            height: 40,
            borderRadius: 999,
            border: 'none',
            background: T.ink,
            color: T.white,
            fontSize: 13,
            fontWeight: 650,
            cursor: uploading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            opacity: uploading ? 0.72 : 1,
          }}>
            {uploading ? 'Saving...' : 'Apply logo'}
          </button>
        </div>
      </div>
    </div>
  )
}


function ActivityCard({ post }: any) {
  const images = Array.isArray(post.image_urls) ? post.image_urls : []
  const context = [post.audience_grade, post.audience_class].filter(Boolean).join(' · ')
  const body = post.body || post.title || post.caption || ''

  return (
    <article style={{
      padding: 14,
      borderRadius: 22,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 10px 28px rgba(0,0,0,0.026)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.2, fontWeight: 600, color: T.ink, margin: 0, letterSpacing: '-0.01em' }}>
            {post.posted_by_kind === 'teacher' ? 'Class update' : 'School update'}
          </p>
          <p style={{
            fontSize: 12.2,
            color: T.ink3,
            margin: '2px 0 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {context || post.type || 'Activity'}
          </p>
        </div>

        <span style={{ fontSize: 11.5, color: T.ink3, flexShrink: 0, paddingTop: 1 }}>
          {formatShortDate(post.created_at)}
        </span>
      </div>

      {body && (
        <p style={{
          fontSize: 13.4,
          color: T.ink2,
          lineHeight: 1.48,
          margin: '11px 0 0',
          whiteSpace: 'pre-wrap',
        }}>
          {body}
        </p>
      )}

      {images.length > 0 && (
        <div style={{
          marginTop: 11,
          display: 'grid',
          gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr',
          gap: 6,
        }}>
          {images.slice(0, 4).map((src: string, index: number) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt=""
              style={{
                width: '100%',
                height: images.length === 1 ? 180 : 110,
                objectFit: 'cover',
                borderRadius: 16,
                border: `1px solid ${T.border}`,
              }}
            />
          ))}
        </div>
      )}

      {(post.event_date || post.event_time || post.event_location) && (
        <div style={{
          marginTop: 11,
          padding: '10px 0 0',
          borderTop: `1px solid ${T.border}`,
          fontSize: 12.5,
          color: T.ink3,
          lineHeight: 1.45,
        }}>
          {[post.event_date, post.event_time, post.event_location].filter(Boolean).join(' · ')}
        </div>
      )}
    </article>
  )
}

export function SchoolProfilePage({ school: initialSchool, profile, isAdmin, userId }: SchoolProfilePageProps) {
  const router = useRouter()
  const [school, setSchool] = useState(initialSchool)
  const [tab, setTab] = useState<SchoolView>('home')
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [teacherCount, setTeacherCount] = useState(0)
  const [teacherCountLoading, setTeacherCountLoading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [logoDraft, setLogoDraft] = useState<any>(null)

  const setupCueActive = !postsLoading && !teacherCountLoading && posts.length === 0 && teacherCount === 0


  useEffect(() => {
    if (tab !== 'home') return

    let alive = true

    const loadPosts = async () => {
      setPostsLoading(true)
      setPostsError('')

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('school_id', school.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(30)

      if (!alive) return

      if (error) {
        setPostsError(error.message || 'Could not load activity')
        setPosts([])
      } else {
        setPosts(data || [])
      }

      setPostsLoading(false)
    }

    const loadTeacherCount = async () => {
      setTeacherCountLoading(true)

      const { count, error } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', school.id)

      if (!alive) return

      if (!error) {
        setTeacherCount(count || 0)
      }

      setTeacherCountLoading(false)
    }

    loadTeacherCount()

    loadPosts()

    return () => {
      alive = false
    }
  }, [tab, school.id])

  const uploadAdjustedLogo = async (blob: Blob) => {
    setUploading(true)
    const toastId = toast.loading('Updating logo...')

    try {
      const path = `schools/${school.owner_id || userId}/logo.png`
      const file = new File([blob], 'logo.png', { type: 'image/png' })

      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(path, file, { upsert: true, contentType: 'image/png' })

      if (uploadError) {
        toast.error('Logo upload failed', { id: toastId })
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(path)

      await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id)

      const finalUrl = `${publicUrl}?t=${Date.now()}`
      setSchool((s: any) => ({ ...s, logo_url: finalUrl }))
      window.dispatchEvent(new CustomEvent('school-updated', { detail: { logo_url: finalUrl } }))
      toast.success('Logo updated', { id: toastId })

      if (logoDraft?.previewUrl) {
        URL.revokeObjectURL(logoDraft.previewUrl)
      }
      setLogoDraft(null)
    } finally {
      setUploading(false)
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLogoDraft({ file, previewUrl })
  }

  const cancelLogoAdjust = () => {
    if (logoDraft?.previewUrl) {
      URL.revokeObjectURL(logoDraft.previewUrl)
    }
    setLogoDraft(null)
  }

const signOut = async () => {
    if (!confirm('Sign out of School Connect?')) return
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const renderSchoolProfileCard = () => (
    <SectionCard style={{ padding: 16 }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 78,
            height: 78,
            borderRadius: 24,
            background: school.logo_url ? T.white : T.soft,
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {school.logo_url ? (
              <img
                src={school.logo_url}
                alt={school.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0 }}
              />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 600, color: T.ink3 }}>
                {initialsFrom(school.name)}
              </span>
            )}
          </div>

          {isAdmin && (
            <>
              <button type="button" onClick={() => logoRef.current?.click()} style={{
                position: 'absolute',
                right: -4,
                bottom: -4,
                width: 30,
                height: 30,
                borderRadius: 999,
                border: `2px solid ${T.white}`,
                background: T.ink,
                color: T.white,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'wait' : 'pointer',
              }}>
                {uploading ? (
                  <span style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: T.white,
                    animation: 'spin 0.7s linear infinite',
                  }} />
                ) : (
                  <Camera size={13} strokeWidth={2} />
                )}
              </button>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
            </>
          )}
        </div>

        <h1 style={{
          fontSize: 18,
          fontWeight: 600,
          color: T.ink,
          margin: '12px 0 0',
          letterSpacing: '-0.02em',
        }}>
          {school.name}
        </h1>

        <p style={{
          fontSize: 13.2,
          color: T.ink3,
          lineHeight: 1.42,
          margin: '5px 0 0',
          maxWidth: 320,
        }}>
          {school.tagline || 'A simple school space for teachers, classes and official school communication.'}
        </p>

        {(school.province || school.address || school.phone || school.email) && (
          <div style={{
            width: '100%',
            marginTop: 14,
            borderTop: `1px solid ${T.border}`,
            paddingTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            alignItems: 'center',
          }}>
            {(school.province || school.address || school.phone) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
                width: '100%',
              }}>
                {(school.province || school.address) && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.6,
                    color: T.ink3,
                    lineHeight: 1.35,
                  }}>
                    <MapPin size={13} strokeWidth={1.7} />
                    <span>{school.province || school.address}</span>
                  </div>
                )}

                {school.phone && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.6,
                    color: T.ink3,
                    lineHeight: 1.35,
                  }}>
                    <Phone size={13} strokeWidth={1.7} />
                    <span>{school.phone}</span>
                  </div>
                )}
              </div>
            )}

            {school.email && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.6,
                color: T.ink3,
                lineHeight: 1.35,
              }}>
                <Mail size={13} strokeWidth={1.7} />
                <span>{school.email}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
        <style>{`
          @keyframes schoolSettingsDotPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.45); opacity: 0.72; }
          }
        `}</style>

      {logoDraft && (
        <LogoAdjustModal
          draft={logoDraft}
          uploading={uploading}
          onCancel={cancelLogoAdjust}
          onApply={uploadAdjustedLogo}
        />
      )}

      <div style={{
        maxWidth: 520,
        height: '100dvh',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
      }}>
        <header style={{
          flexShrink: 0,
          padding: 'calc(6px + env(safe-area-inset-top, 0px)) 14px 8px',
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}>
            <button type="button" onClick={() => setTab('home')} aria-label="Home" style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              border: `1px solid ${tab === 'home' ? 'rgba(37,99,235,0.42)' : T.border}`,
              background: tab === 'home'
                ? 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(34,197,94,0.10))'
                : T.white,
              color: T.ink,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
              position: 'relative',
              overflow: 'visible',
              boxShadow: tab === 'home' ? '0 8px 20px rgba(37,99,235,0.10)' : 'none',
            }}>
              <span style={{
                width: 31,
                height: 31,
                borderRadius: 999,
                background: school.logo_url ? T.white : T.soft,
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: T.ink2,
                fontSize: 10.5,
                fontWeight: 600,
              }}>
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', padding: 0, display: 'block' }}
                  />
                ) : (
                  initialsFrom(school.name)
                )}
              </span>

              <span style={{
                position: 'absolute',
                right: 3,
                bottom: 3,
                width: 7,
                height: 7,
                borderRadius: 999,
                background: tab === 'home' ? '#2563EB' : '#D1D1D6',
                border: `1.5px solid ${T.white}`,
              }} />
            </button>

            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <p style={{
                fontSize: 14,
                fontWeight: 650,
                color: T.ink,
                margin: 0,
                letterSpacing: '-0.015em',
              }}>
                {school.name || 'School'}
              </p>
              <p style={{
                fontSize: 11.5,
                color: T.ink3,
                margin: '1px 0 0',
              }}>
                {tab === 'home' ? 'Latest activity' : 'Profile, classes and teachers'}
              </p>
            </div>

            <button type="button" onClick={() => { setTab('profile'); setEditing(false) }} aria-label="Customize school" style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
            }}>
              <Settings size={16} strokeWidth={1.9} />
              {setupCueActive && (
                <span style={{
                  position: 'absolute',
                  right: 5,
                  top: 5,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: '#2563EB',
                  border: `1.5px solid ${T.white}`,
                }} />
              )}
            </button>
          </div>

          {isAdmin && (
            <nav style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginTop: 10,
            }}>
              {[
                ['profile', 'Profile'],
                ['classes', 'Classes'],
                ['settings', 'Settings'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTab(key as SchoolView); setEditing(false) }}
                  style={{
                    height: 34,
                    borderRadius: 999,
                    border: `1px solid ${tab === key ? T.ink : T.border}`,
                    background: tab === key ? T.ink : T.white,
                    color: tab === key ? T.white : T.ink2,
                    fontSize: 12,
                    fontWeight: 650,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    padding: '0 6px',
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '10px 0 calc(18px + env(safe-area-inset-bottom, 0px))',
        }}>

          {tab === 'home' && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {postsLoading ? (
                <SectionCard style={{ marginLeft: 0, marginRight: 0, textAlign: 'center' }}>
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${T.border}`,
                    borderTopColor: T.ink,
                    animation: 'spin 0.7s linear infinite',
                    margin: '0 auto',
                  }} />
                </SectionCard>
              ) : postsError ? (
                <SectionCard style={{ marginLeft: 0, marginRight: 0 }}>
                  <p style={{ fontSize: 13, color: T.ink2, margin: 0 }}>
                    Could not load latest activity.
                  </p>
                </SectionCard>
              ) : posts.length === 0 ? (
                <div style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  border: `1px dashed ${T.border}`,
                  borderRadius: 16,
                  background: 'transparent',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.72)',
                    border: `1px solid ${T.border}`,
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: T.ink3,
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {initialsFrom(school.name)}
                  </div>

                  <p style={{ fontSize: 15, color: T.ink, fontWeight: 600, margin: '0 0 4px' }}>
                    No activity yet
                  </p>

                  <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 16px', lineHeight: 1.5 }}>
                    Class posts and school updates will appear here.
                  </p>

                  <button type="button" onClick={() => { setTab('classes'); setEditing(false) }} style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: T.ink,
                    color: T.white,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                    Add teachers
                  </button>
                </div>
              ) : (
                posts.map(post => <ActivityCard key={post.id} post={post} />)
              )}
            </div>
          )}

          {tab === 'profile' && (
            <>
              {renderSchoolProfileCard()}

              <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <AccordionCard
                  defaultOpen
                  icon={<Building2 size={17} strokeWidth={1.8} />}
                  title="School details"
                  subtitle="Update profile information."
                >
                  {editing ? (
                    <EditSchoolDetails
                      school={school}
                      onCancel={() => setEditing(false)}
                      onSaved={(updates: any) => {
                        setSchool((s: any) => ({ ...s, ...updates }))
                        setEditing(false)
                        window.dispatchEvent(new Event('school-updated'))
                      }}
                    />
                  ) : (
                    <div>
                      <DetailLine label="School name" value={school.name} />
                      <DetailLine label="Tagline" value={school.tagline} />
                      <DetailLine label="Location" value={school.province || school.address} />
                      <DetailLine label="Phone" value={school.phone} />
                      <DetailLine label="Email" value={school.email} />
                      <DetailLine label="Website" value={school.website} />

                      {isAdmin && (
                        <button type="button" onClick={() => setEditing(true)} style={{ ...primaryButton, width: '100%', marginTop: 12 }}>
                          <Pencil size={14} strokeWidth={2} />
                          Edit profile
                        </button>
                      )}
                    </div>
                  )}
                </AccordionCard>

                <AccordionCard
                  icon={<ShieldCheck size={17} strokeWidth={1.8} />}
                  title="School role"
                  subtitle="The school creates the structure."
                >
                  <p style={{
                    fontSize: 13,
                    color: T.ink3,
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    Add classes and teachers. Teachers then manage parent communication inside their class spaces.
                  </p>
                </AccordionCard>
              </div>
            </>
          )}

          {tab === 'classes' && isAdmin && (
            <div style={{ padding: '0 14px' }}>
              <SectionCard style={{ marginLeft: 0, marginRight: 0, background: T.soft2, boxShadow: 'none' }}>
                <p style={{
                  fontSize: 13.5,
                  fontWeight: 650,
                  color: T.ink,
                  margin: '0 0 3px',
                }}>
                  Classes
                </p>
                <p style={{
                  fontSize: 12.8,
                  color: T.ink3,
                  lineHeight: 1.45,
                  margin: 0,
                }}>
                  Add a class and assign a teacher. Teachers handle parents from their own class space.
                </p>
              </SectionCard>

              <TeachersTab />
            </div>
          )}

          {tab === 'settings' && isAdmin && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionCard style={{ marginLeft: 0, marginRight: 0 }}>
                <SectionTitle
                  eyebrow="Settings"
                  title="Account"
                  subtitle="Simple account actions."
                />

                <button type="button" onClick={signOut} style={{
                  ...quietButton,
                  width: '100%',
                  justifyContent: 'flex-start',
                  height: 44,
                  borderRadius: 16,
                }}>
                  <LogOut size={15} strokeWidth={1.9} />
                  Sign out
                </button>
              </SectionCard>

              <SectionCard style={{ marginLeft: 0, marginRight: 0, background: T.soft2 }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 650,
                  color: T.ink,
                  margin: '0 0 2px',
                }}>
                  Product principle
                </p>
                <p style={{
                  fontSize: 13,
                  color: T.ink3,
                  lineHeight: 1.45,
                  margin: 0,
                }}>
                  The school creates the structure. Teachers run the class spaces.
                </p>
              </SectionCard>
            </div>
          )}

          {!isAdmin && (
            <div style={{ padding: '0 14px' }}>
              <SectionCard style={{ marginLeft: 0, marginRight: 0 }}>
                <SectionTitle
                  eyebrow="School"
                  title="Official school profile"
                  subtitle="This is the school connected to your class space."
                />
                <button type="button" onClick={() => router.push('/feed')} style={{ ...primaryButton, width: '100%', marginTop: 8 }}>
                  Go to feed
                </button>
              </SectionCard>
            </div>
          )}

          <p style={{
            fontSize: 11,
            color: '#C4C4C8',
            textAlign: 'center',
            margin: '16px 0 0',
            letterSpacing: '0.04em',
            fontWeight: 600,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>
    </div>
  )
}
