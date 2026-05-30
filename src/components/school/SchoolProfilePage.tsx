// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  LogOut,
  Pencil,
  Save,
  Settings,
  Users,
  User,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { School, Profile } from '@/lib/types'
import { TeachersTab } from './TeachersTab'

interface SchoolProfilePageProps {
  school: School
  profile: Profile
  isAdmin: boolean
  userId: string
}

const supabase = createClient()

const T = {
  ink: '#252525',
  ink2: '#5F6268',
  ink3: '#9A9CA3',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  soft2: '#F4F5F5',
  accent: '#8FA6A1',
  accentSoft: '#EEF3F1',
  white: '#FFFFFF',
  red: '#B42318',
}

const inputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 13px',
  borderRadius: 14,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle: any = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: T.ink3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const primaryButton: any = {
  minHeight: 42,
  borderRadius: 999,
  border: 'none',
  background: T.ink,
  color: T.white,
  fontSize: 13,
  fontWeight: 560,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 15px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const softButton: any = {
  minHeight: 38,
  borderRadius: 999,
  border: 'none',
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 540,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '0 13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function SchoolSafeAreaStyle() {
  return (
    <style>{`
      html,
      body {
        background: #FFFFFF !important;
      }

      .school-safe-screen {
        background: #FFFFFF;
      }

      .school-safe-screen::before,
      .school-safe-screen::after {
        content: "";
        position: fixed;
        left: 0;
        right: 0;
        background: #FFFFFF;
        pointer-events: none;
        z-index: 0;
      }

      .school-safe-screen::before {
        top: 0;
        height: env(safe-area-inset-top, 0px);
      }

      .school-safe-screen::after {
        bottom: 0;
        height: env(safe-area-inset-bottom, 0px);
      }

      @keyframes schoolDotBounce {
        0%, 80%, 100% { transform: scale(0.72); opacity: 0.45; }
        40% { transform: scale(1); opacity: 1; }
      }
    `}</style>
  )
}

function initialsFrom(name?: string | null) {
  return String(name || 'S')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

function schoolLocation(school: any) {
  return [school?.address, school?.province].filter(Boolean).join(' · ')
}

function websiteHref(value?: string | null) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

function SectionCard({ children, style = {} }: any) {
  return (
    <section style={{
      borderRadius: 28,
      background: T.white,
      border: 'none',
      padding: 16,
      ...style,
    }}>
      {children}
    </section>
  )
}

function MiniStat({ label, value }: any) {
  return (
    <div style={{
      padding: '10px 8px',
      borderRadius: 17,
      background: T.soft,
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: 18,
        fontWeight: 560,
        color: T.ink,
        margin: 0,
        minHeight: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11.5, color: T.ink3, margin: '2px 0 0' }}>
        {label}
      </p>
    </div>
  )
}

function BottomSheet({ children, onClose }: any) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      zIndex: 5000,
      background: 'rgba(0,0,0,0.28)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '90dvh',
        overflowY: 'auto',
        background: T.white,
        borderRadius: '24px 24px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
      }}>
        {children}
      </div>
    </div>
  )
}

function SheetHeader({ title, subtitle, onClose }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    }}>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink, margin: 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.ink3, margin: '3px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>

      <button type="button" onClick={onClose} style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: 'none',
        background: T.soft,
        color: T.ink3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}>
        <X size={16} />
      </button>
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

    const { error } = await supabase
      .from('schools')
      .update(updates)
      .eq('id', school.id)

    setSaving(false)

    if (error) {
      toast.error(error.message || 'Could not save school details')
      return
    }

    toast.success('School details saved')
    onSaved(updates)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label>
        <span style={labelStyle}>School name</span>
        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
      </label>

      <label>
        <span style={labelStyle}>Short tagline</span>
        <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Together we grow" style={inputStyle} />
      </label>

      <label>
        <span style={labelStyle}>Address</span>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street or area" style={inputStyle} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label>
          <span style={labelStyle}>Province</span>
          <select value={province} onChange={e => setProvince(e.target.value)} style={inputStyle}>
            <option value="">Select province</option>
            {SOUTH_AFRICAN_PROVINCES.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <label>
          <span style={labelStyle}>Phone</span>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="011 000 0000" style={inputStyle} />
        </label>

        <label>
          <span style={labelStyle}>Email</span>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="info@school.co.za" style={inputStyle} />
        </label>
      </div>

      <label>
        <span style={labelStyle}>Website</span>
        <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={inputStyle} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={softButton}>
          Cancel
        </button>

        <button type="button" disabled={saving} onClick={save} style={{
          ...primaryButton,
          opacity: saving ? 0.65 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}>
          <Save size={14} strokeWidth={1.8} />
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
      zIndex: 4000,
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
        border: 'none',
        padding: 16,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: T.ink, margin: 0 }}>
            Adjust school logo
          </p>
          <p style={{ fontSize: 12.8, color: T.ink3, lineHeight: 1.45, margin: '4px 0 0' }}>
            Zoom and drag until it fits the square.
          </p>
        </div>

        <div
          style={{
            width: cropSize,
            height: cropSize,
            borderRadius: 32,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.4, color: T.ink3, fontWeight: 600 }}>Zoom</span>
            <button type="button" onClick={() => {
              setZoom(1.18)
              setOffset({ x: 0, y: 0 })
            }} style={{
              border: 'none',
              background: T.soft,
              color: T.ink2,
              borderRadius: 999,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 540,
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onCancel} disabled={uploading} style={{
            ...softButton,
            height: 40,
            opacity: uploading ? 0.65 : 1,
          }}>
            Cancel
          </button>

          <button type="button" onClick={apply} disabled={uploading} style={{
            ...primaryButton,
            height: 40,
            opacity: uploading ? 0.65 : 1,
          }}>
            {uploading ? 'Saving...' : 'Apply logo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TeachersAccordion({ teacherCount, teacherCountLoading, onAddTeacher }: any) {
  return (
    <SectionCard style={{ padding: 0, overflow: 'visible', position: 'relative', zIndex: 20 }}>
      <div style={{
        width: '100%',
        background: T.white,
        border: 'none',
        padding: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        fontFamily: 'inherit',
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Users size={18} strokeWidth={1.7} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 540, color: T.ink, margin: 0 }}>
            Teachers & classes
          </p>
          <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0' }}>
            {teacherCountLoading ? 'Loading teachers...' : `${teacherCount || 0} teachers`}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddTeacher}
          style={{
            minWidth: 54,
            height: 34,
            borderRadius: 999,
            border: 'none',
            background: T.accent,
            color: T.white,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12.5,
            fontWeight: 540,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          Add
        </button>
      </div>

      <div style={{
        borderTop: `1px solid ${T.border}`,
        padding: '0 14px 12px',
        background: T.white,
      }}>
        <TeachersTab />
      </div>
    </SectionCard>
  )
}

function SettingsSheet({ school, isAdmin, onClose, onEditProfile, onLogoClick, uploading, onSignOut }: any) {
  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader title="Settings" subtitle="School profile and account" onClose={onClose} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 20,
        background: T.soft,
        marginBottom: 12,
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          background: school.logo_url ? `url(${school.logo_url}) center/cover` : T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          fontWeight: 560,
          overflow: 'visible',
          flexShrink: 0,
        }}>
          {!school.logo_url && initialsFrom(school.name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 560, color: T.ink, margin: 0 }}>
            {school.name || 'School'}
          </p>
          <p style={{ fontSize: 12.5, color: T.ink3, margin: '2px 0 0', overflow: 'visible', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {schoolLocation(school) || 'School profile'}
          </p>
        </div>
      </div>

      {isAdmin && (
        <>
          <button type="button" onClick={onLogoClick} disabled={uploading} style={{
            ...softButton,
            width: '100%',
            justifyContent: 'flex-start',
            height: 44,
            background: T.white,
            opacity: uploading ? 0.65 : 1,
          }}>
            <Camera size={15} strokeWidth={1.8} />
            {uploading ? 'Uploading logo...' : 'Change school logo'}
          </button>

          <button type="button" onClick={onEditProfile} style={{
            ...softButton,
            width: '100%',
            justifyContent: 'flex-start',
            height: 44,
            background: T.white,
            marginTop: 8,
          }}>
            <Pencil size={15} strokeWidth={1.8} />
            Edit school details
          </button>
        </>
      )}

      <button type="button" onClick={onSignOut} style={{
        ...softButton,
        width: '100%',
        justifyContent: 'flex-start',
        height: 44,
        background: T.white,
        color: T.red,
        marginTop: 8,
      }}>
        <LogOut size={15} strokeWidth={1.8} />
        Sign out
      </button>
    </BottomSheet>
  )
}

export function SchoolProfilePage({ school: initialSchool, profile, isAdmin, userId }: SchoolProfilePageProps) {
  const [school, setSchool] = useState(initialSchool)
  const [teacherCount, setTeacherCount] = useState(0)
  const [teacherCountLoading, setTeacherCountLoading] = useState(false)
  const [teachersOpen, setTeachersOpen] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsSeen, setSettingsSeen] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.localStorage.getItem('school-connect-settings-seen') === 'yes'
  })
  const [showEditDetails, setShowEditDetails] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoDraft, setLogoDraft] = useState<any>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true

    const loadTeacherCount = async () => {
      setTeacherCountLoading(true)

      const { count, error } = await supabase
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', school.id)

      if (!alive) return

      if (!error) setTeacherCount(count || 0)
      setTeacherCountLoading(false)
    }

    loadTeacherCount()

    return () => {
      alive = false
    }
  }, [school.id])

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
        toast.error(uploadError.message || 'Logo upload failed', { id: toastId })
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('school-assets')
        .getPublicUrl(path)

      await supabase
        .from('schools')
        .update({ logo_url: publicUrl })
        .eq('id', school.id)

      const finalUrl = `${publicUrl}?t=${Date.now()}`

      setSchool((current: any) => ({ ...current, logo_url: finalUrl }))
      window.dispatchEvent(new CustomEvent('school-updated', { detail: { logo_url: finalUrl } }))
      toast.success('Logo updated', { id: toastId })

      if (logoDraft?.previewUrl) URL.revokeObjectURL(logoDraft.previewUrl)
      setLogoDraft(null)
    } finally {
      setUploading(false)
    }
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLogoDraft({ file, previewUrl })
  }

  const cancelLogoAdjust = () => {
    if (logoDraft?.previewUrl) URL.revokeObjectURL(logoDraft.previewUrl)
    setLogoDraft(null)
  }

  const signOut = async () => {
    if (!confirm('Sign out of School Connect?')) return
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  const openSettings = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('school-connect-settings-seen', 'yes')
    }

    setSettingsSeen(true)
    setShowSettings(true)
  }

  const triggerAddTeacher = () => {
    setTeachersOpen(true)

    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('school-connect-open-add-teacher'))

      const buttons = Array.from(document.querySelectorAll('button'))
      const addButton = buttons.find((button: any) =>
        /add teacher|create teacher/i.test(String(button.textContent || ''))
      ) as HTMLButtonElement | undefined

      addButton?.click()
    }, 120)
  }

  const location = schoolLocation(school)
  const href = websiteHref(school.website)

  return (
    <div className="school-safe-screen" style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'visible',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
      <SchoolSafeAreaStyle />

      {logoDraft && (
        <LogoAdjustModal
          draft={logoDraft}
          uploading={uploading}
          onCancel={cancelLogoAdjust}
          onApply={uploadAdjustedLogo}
        />
      )}

      <input
        ref={logoRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLogoChange}
      />

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
          padding: 'calc(8px + env(safe-area-inset-top, 0px)) 16px 4px',
          background: 'transparent',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={openSettings}
            aria-label="Settings"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: 'none',
              background: T.white,
              color: T.ink2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            
              position: 'relative',}}
          >
            <Settings size={17} strokeWidth={2.05} />
          
            {!settingsSeen && (
              <span
                className="school-settings-attention-dot"
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: '#D92D20',
                  border: `1.5px solid ${T.white}`,
                }}
              />
            )}
</button>
        </header>

        <main style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
          background: T.bg,
        }}>
          <SectionCard style={{
            minHeight: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            marginBottom: 14,
            padding: '28px 18px 26px',
          }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: 32,
              background: school.logo_url ? `url(${school.logo_url}) center/cover` : T.accentSoft,
              color: T.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 25,
              fontWeight: 560,
              overflow: 'hidden',
              marginBottom: 18,
            }}>
              {!school.logo_url && initialsFrom(school.name)}
            </div>

            <h1 style={{
              fontSize: 22,
              lineHeight: 1.08,
              fontWeight: 560,
              letterSpacing: '-0.045em',
              color: T.ink,
              margin: '0 0 7px',
            }}>
              {school.name || 'School'}
            </h1>

            <p style={{
              maxWidth: 310,
              fontSize: 13,
              color: T.ink3,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {school.tagline || 'School Connect keeps your school structure simple and organized.'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 9,
              width: '100%',
              maxWidth: 260,
              marginTop: 20,
            }}>
              <MiniStat label="Teachers" value={teacherCountLoading ? '...' : teacherCount} />
              <MiniStat label="Admin" value={<User size={18} strokeWidth={2.25} />} />
            </div>
          </SectionCard>

          {isAdmin && (
            <TeachersAccordion
              teacherCount={teacherCount}
              teacherCountLoading={teacherCountLoading}
              onAddTeacher={triggerAddTeacher}
            />
          )}

          

          <p style={{
            fontSize: 10.5,
            color: '#B8B8BC',
            textAlign: 'center',
            margin: '18px 0 0',
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>

      {showSettings && (
        <SettingsSheet
          school={school}
          isAdmin={isAdmin}
          uploading={uploading}
          onClose={() => setShowSettings(false)}
          onLogoClick={() => logoRef.current?.click()}
          onEditProfile={() => {
            setShowSettings(false)
            setShowEditDetails(true)
          }}
          onSignOut={signOut}
        />
      )}

      {showEditDetails && (
        <BottomSheet onClose={() => setShowEditDetails(false)}>
          <SheetHeader
            title="School details"
            subtitle="Keep the school profile simple and useful."
            onClose={() => setShowEditDetails(false)}
          />

          <EditSchoolDetails
            school={school}
            onCancel={() => setShowEditDetails(false)}
            onSaved={(updates: any) => {
              setSchool((current: any) => ({ ...current, ...updates }))
              setShowEditDetails(false)
              window.dispatchEvent(new Event('school-updated'))
            }}
          />
        </BottomSheet>
      )}
    </div>
  )
}
