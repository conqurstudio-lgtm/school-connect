// @ts-nocheck
'use client'
import { useRouter } from 'next/navigation'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Camera, Phone, Mail, Globe, MapPin, Users, Copy, Check, Pencil, X, Save, LogOut, Settings } from 'lucide-react'
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

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 15,
  border: `1px solid ${T.border}`, borderRadius: 12,
  background: T.white, color: T.ink, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color 0.14s',
}

function InfoRow({ Icon, label, value, editing, onChange }: {
  Icon: React.ElementType
  label: string
  value?: string | null
  editing?: boolean
  onChange?: (v: string) => void
}) {
  if (!editing && !value) return null
  return (
    <div className="page-in" style={{
      display: 'flex', alignItems: editing ? 'flex-start' : 'center',
      gap: 16, padding: '16px 0',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: T.white, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: editing ? 4 : 0,
      }}>
        <Icon style={{ width: 16, height: 16, color: T.ink3 }} strokeWidth={1.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: T.ink3, margin: '0 0 3px',
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          {label}
        </p>
        {editing ? (
          <input
            value={value ?? ''}
            onChange={e => onChange?.(e.target.value)}
            placeholder={`Add ${label.toLowerCase()}`}
            style={{ ...inputStyle, padding: '8px 12px', fontSize: 14 }}
          />
        ) : (
          <p style={{ fontSize: 15, color: T.ink, margin: 0, wordBreak: 'break-word' }}>
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

export function SchoolProfilePage({ school: initialSchool, profile, isAdmin, userId }: SchoolProfilePageProps) {
  const router = useRouter()
  const [school,   setSchool]   = useState(initialSchool)
  const [tab,      setTab]      = useState<'profile' | 'teachers' | 'settings'>('profile')
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [uploading,setUploading]= useState(false)
  const [copied,   setCopied]   = useState(false)

  // Edit fields
  const [name,    setName]    = useState(school.name)
  const [tagline, setTagline] = useState(school.tagline ?? '')
  const [address, setAddress] = useState(school.address ?? '')
  const [phone,   setPhone]   = useState(school.phone   ?? '')
  const [email,   setEmail]   = useState(school.email   ?? '')
  const [website, setWebsite] = useState(school.website ?? '')

  const logoRef = useRef<HTMLInputElement>(null)

  const [inviteUrl, setInviteUrl] = useState(`/auth/parent-join?slug=${school.slug}`)
  useEffect(() => {
    setInviteUrl(`${window.location.origin}/auth/parent-join?slug=${school.slug}`)
  }, [school.slug])

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return }

    setUploading(true)
    const toastId = toast.loading('Uploading photo…')

    try {
      // 1. Upload to Supabase storage
      const ext  = file.name.split('.').pop()
      const path = `schools/${school.owner_id}/logo.${ext}`
      const { error: upErr } = await supabase.storage
        .from('school-assets').upload(path, file, { upsert: true })
      if (upErr) { toast.error('Upload failed', { id: toastId }); return }

      // 2. Get the real public URL + cache bust
      const { data: { publicUrl } } = supabase.storage.from('school-assets').getPublicUrl(path)
      const finalUrl = `${publicUrl}?t=${Date.now()}`

      // 3. Save to database
      await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id)

      // 4. Pre-load the image in the browser BEFORE updating any UI
      //    This ensures every img tag gets the new photo simultaneously
      await new Promise<void>((resolve) => {
        const img = new Image()
        img.onload  = () => resolve()
        img.onerror = () => resolve() // resolve anyway so we don't get stuck
        img.src = finalUrl
      })

      // 5. Now update everything at once — page + feed header + any other listener
      setSchool(s => ({ ...s, logo_url: finalUrl }))
      window.dispatchEvent(new CustomEvent('school-updated', { detail: { logo_url: finalUrl } }))
      toast.success('Photo updated', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('School name required'); return }
    setSaving(true)
    const updates = {
      name: name.trim(), tagline: tagline.trim() || null,
      address: address.trim() || null, phone: phone.trim() || null,
      email: email.trim() || null, website: website.trim() || null,
    }
    const { error } = await supabase.from('schools').update(updates).eq('id', school.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    setSchool(s => ({ ...s, ...updates }))
    toast.success('Saved')
    setEditing(false)
    setSaving(false)
    window.dispatchEvent(new Event('school-updated'))
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Invite link copied')
  }

  const handleCancel = () => {
    setName(school.name); setTagline(school.tagline ?? '')
    setAddress(school.address ?? ''); setPhone(school.phone ?? '')
    setEmail(school.email ?? ''); setWebsite(school.website ?? '')
    setEditing(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      background: T.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '56px 20px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: T.bg,
      }}>
        <button onClick={() => window.history.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 15, fontWeight: 500, color: T.ink, fontFamily: 'inherit',
        }}>
          <ArrowLeft style={{ width: 18, height: 18 }} strokeWidth={1.8} />
          Profile
        </button>

        {isAdmin && !editing && (
          <button onClick={() => setEditing(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            border: `1px solid ${T.border}`, background: T.white,
            fontSize: 13, fontWeight: 500, color: T.ink2,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Pencil style={{ width: 12, height: 12 }} strokeWidth={1.6} />
            Edit
          </button>
        )}

        {isAdmin && editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCancel} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20,
              border: `1px solid ${T.border}`, background: T.white,
              fontSize: 13, fontWeight: 500, color: T.ink3,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <X style={{ width: 12, height: 12 }} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 20,
              border: 'none', background: saving ? '#CCC' : T.ink,
              fontSize: 13, fontWeight: 600, color: T.white,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              <Save style={{ width: 12, height: 12 }} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Tab bar — only for admin */}
      {isAdmin && (
        <div style={{
          display: 'flex', borderBottom: `1px solid ${T.border}`,
          padding: '0 20px', flexShrink: 0,
        }}>
          {(['profile', 'teachers', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 18px 10px 0', fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? T.ink : T.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t ? T.ink : 'transparent'}`,
              fontFamily: 'inherit', textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}>
              {t === 'profile' ? 'School' : t === 'teachers' ? 'Teachers' : 'Settings'}
            </button>
          ))}
        </div>
      )}

      {/* School logo — centered, large */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 32px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            overflow: 'hidden', background: '#EFEFEF',
            border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {school.logo_url
              ? <img src={school.logo_url} alt={school.name}
                     style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 42, fontWeight: 600, color: '#AAAAAA' }}>
                  {school.name.charAt(0)}
                </span>
            }
          </div>

          {/* Camera button — admin only */}
          {isAdmin && (
            <button onClick={() => logoRef.current?.click()} style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 32, height: 32, borderRadius: '50%',
              background: T.ink, border: '2.5px solid #FCFCFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              {uploading
                ? <div style={{ width: 12, height: 12, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                animation: 'spin 0.7s linear infinite' }} />
                : <Camera style={{ width: 13, height: 13, color: '#fff' }} />
              }
            </button>
          )}
          <input ref={logoRef} type="file" accept="image/*"
                 onChange={handleLogoChange} style={{ display: 'none' }} />
        </div>

        {/* Name */}
        {editing ? (
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ ...inputStyle, textAlign: 'center', fontSize: 20, fontWeight: 600,
                     letterSpacing: '-0.02em', marginTop: 16, maxWidth: 320 }} />
        ) : (
          <h1 style={{ fontSize: 22, fontWeight: 600, color: T.ink,
                       letterSpacing: '-0.025em', margin: '16px 0 0', textAlign: 'center' }}>
            {school.name}
          </h1>
        )}

        {/* Tagline */}
        {editing ? (
          <input value={tagline} onChange={e => setTagline(e.target.value)}
            placeholder="Add a tagline…"
            style={{ ...inputStyle, textAlign: 'center', fontSize: 14, marginTop: 8,
                     color: T.ink3, maxWidth: 320 }} />
        ) : school.tagline ? (
          <p style={{ fontSize: 14, color: T.ink3, margin: '6px 0 0', textAlign: 'center' }}>
            {school.tagline}
          </p>
        ) : null}
      </div>

      {tab === 'profile' && (
      <div style={{ padding: '0 24px', flex: 1 }}>
        <InfoRow Icon={MapPin}  label="Address" value={editing ? address : school.address}
                 editing={editing} onChange={setAddress} />
        <InfoRow Icon={Phone}   label="Phone"   value={editing ? phone   : school.phone}
                 editing={editing} onChange={setPhone} />
        <InfoRow Icon={Mail}    label="Email"   value={editing ? email   : school.email}
                 editing={editing} onChange={setEmail} />
        <InfoRow Icon={Globe}   label="Website" value={editing ? website : school.website}
                 editing={editing} onChange={setWebsite} />

        {/* Invite link — admin only */}
        {isAdmin && !editing && (
          <div style={{ padding: '16px 0', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: T.white, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Users style={{ width: 16, height: 16, color: T.ink3 }} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: T.ink3, margin: '0 0 4px',
                            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Parent invite link
                </p>
                <p style={{ fontSize: 13, color: T.ink2, margin: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontFamily: 'monospace' }}>
                  {inviteUrl}
                </p>
              </div>
              <button onClick={handleCopy} style={{
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                padding: '7px 12px', borderRadius: 20,
                border: `1px solid ${T.border}`, background: T.white,
                fontSize: 12, fontWeight: 500, color: T.ink2,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {copied
                  ? <><Check style={{ width: 11, height: 11 }} /> Copied</>
                  : <><Copy  style={{ width: 11, height: 11 }} /> Copy</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Teachers tab */}
      {tab === 'teachers' && isAdmin && <TeachersTab />}

      {/* Settings tab */}
      {tab === 'settings' && isAdmin && (
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3, textTransform: 'uppercase',
                        letterSpacing: '0.06em', margin: '0 0 10px' }}>Account</p>
            <button onClick={() => {
              if (confirm('Sign out of School Connect?')) {
                const { createClient } = require('@/lib/supabase/client')
                createClient().auth.signOut().then(() => { window.location.href = '/auth/login' })
              }
            }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: T.white,
              border: `1px solid ${T.border}`, borderRadius: 14,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
            }}>
              <LogOut style={{ width: 16, height: 16, color: T.ink3 }} strokeWidth={1.5} />
              <span style={{ fontSize: 14, color: T.ink }}>Sign out</span>
            </button>
          </div>

          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: '#CCCCCC', margin: 0, letterSpacing: '0.04em', fontWeight: 500 }}>
              Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
            </p>
          </div>
        </div>
      )}

      {/* Powered by */}
      <div style={{ textAlign: 'center', padding: '24px 20px 48px' }}>
        <p style={{ fontSize: 11, color: '#CCCCCC', margin: 0, letterSpacing: '0.04em', fontWeight: 500 }}>
          Powered by <span style={{ fontWeight: 600, color: '#AAAAAA' }}>School Connect</span>
        </p>
      </div>

    </div>
  )
}
