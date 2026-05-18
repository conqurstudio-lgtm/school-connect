// @ts-nocheck
'use client'

import { useState, useRef } from 'react'
import { X, Camera, LogOut, Trash2, Eye, EyeOff, ChevronRight, School, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { School as SchoolType, Profile } from '@/lib/types'

interface SettingsPanelProps {
  school:    SchoolType
  profile:   Profile
  isSchool:  boolean
  onClose:   () => void
  onSignOut: () => void
}

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
  red:    '#E8281E',
}

const input: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: 14,
  border: `1px solid ${T.border}`, borderRadius: 10,
  background: T.bg, color: T.ink, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: T.ink3, marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3, textTransform: 'uppercase',
                  letterSpacing: '0.06em', margin: '0 0 10px' }}>{title}</p>
      {children}
    </div>
  )
}

function SchoolSettings({ school }: { school: SchoolType }) {
  const [name,    setName]    = useState(school.name)
  const [tagline, setTagline] = useState(school.tagline ?? '')
  const [phone,   setPhone]   = useState(school.phone   ?? '')
  const [email,   setEmail]   = useState(school.email   ?? '')
  const [website, setWebsite] = useState(school.website ?? '')
  const [address, setAddress] = useState(school.address ?? '')
  const [logoUrl, setLogoUrl] = useState(school.logo_url ?? '')
  const [saving,  setSaving]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return }
    // Show preview instantly
    const preview = URL.createObjectURL(file)
    setLogoUrl(preview)
    window.dispatchEvent(new CustomEvent('school-updated', { detail: { logo_url: preview } }))
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `schools/${school.owner_id}/logo.${ext}`
    const { error } = await supabase.storage.from('school-assets').upload(path, file, { upsert: true })
    if (error) { toast.error('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('school-assets').getPublicUrl(path)
    const bustUrl = `${publicUrl}?t=${Date.now()}`
    setLogoUrl(bustUrl)
    await supabase.from('schools').update({ logo_url: publicUrl }).eq('id', school.id)
    toast.success('Logo updated')
    setUploading(false)
  }

  const save = async () => {
    if (!name.trim()) { toast.error('School name required'); return }
    setSaving(true)
    const { error } = await supabase.from('schools').update({
      name: name.trim(), tagline: tagline.trim() || null,
      phone: phone.trim() || null, email: email.trim() || null,
      website: website.trim() || null, address: address.trim() || null,
    }).eq('id', school.id)
    if (error) { toast.error('Failed to save'); setSaving(false); return }
    toast.success('Saved')
    setSaving(false)
    window.dispatchEvent(new Event('school-updated'))
  }

  return (
    <div>
      <Sect title="Logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, overflow: 'hidden',
              border: `1px solid ${T.border}`, background: T.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logoUrl
                ? <img key={logoUrl} src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <School style={{ width: 24, height: 24, color: T.ink3 }} strokeWidth={1.3} />
              }
            </div>
            <button onClick={() => logoRef.current?.click()} style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: '50%',
              background: T.ink, border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Camera style={{ width: 10, height: 10, color: '#fff' }} />
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
            {uploading ? 'Uploading…' : 'PNG or JPG, max 2 MB'}
          </p>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
        </div>
      </Sect>

      <Sect title="School details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={input} /></div>
          <div><label style={lbl}>Tagline</label>
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Excellence in every learner" style={input} /></div>
          <div><label style={lbl}>Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} style={input} /></div>
        </div>
      </Sect>

      <Sect title="Contact">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={input} /></div>
          <div><label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} /></div>
          <div><label style={lbl}>Website</label>
            <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" style={input} /></div>
        </div>
      </Sect>

      <button onClick={save} disabled={saving} style={{
        width: '100%', padding: '12px 0', borderRadius: 12,
        background: saving ? '#CCC' : T.ink, color: '#fff', border: 'none',
        fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

function AccountSettings({ profile, onSignOut }: { profile: Profile; onSignOut: () => void }) {
  const [showPw,  setShowPw]  = useState(false)
  const [newPw,   setNewPw]   = useState('')
  const [showNew, setShowNew] = useState(false)
  const [saving,  setSaving]  = useState(false)

  const updatePassword = async () => {
    if (newPw.length < 8) { toast.error('Min 8 characters'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) toast.error(error.message)
    else { toast.success('Password updated'); setShowPw(false); setNewPw('') }
    setSaving(false)
  }

  return (
    <div>
      <Sect title="Profile">
        <div style={{
          background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}>
          {[
            { label: 'Name',  value: profile.full_name  ?? '—' },
            { label: 'Role',  value: profile.role         },
            ...(profile.child_name  ? [{ label: 'Child', value: profile.child_name  }] : []),
            ...(profile.child_grade ? [{ label: 'Grade', value: profile.child_grade }] : []),
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <span style={{ fontSize: 13, color: T.ink3 }}>{row.label}</span>
              <span style={{ fontSize: 13, color: T.ink, fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </Sect>

      <Sect title="Security">
        <button onClick={() => setShowPw(v => !v)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
        }}>
          <span style={{ fontSize: 14, color: T.ink }}>Change password</span>
          <ChevronRight style={{ width: 14, height: 14, color: T.ink3,
            transform: showPw ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showPw && (
          <div style={{
            padding: 14, background: T.bg, borderRadius: 12,
            border: `1px solid ${T.border}`, marginBottom: 10,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ position: 'relative' }}>
              <label style={lbl}>New password</label>
              <input type={showNew ? 'text' : 'password'} value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 8 characters"
                style={{ ...input, paddingRight: 40 }} />
              <button onClick={() => setShowNew(v => !v)} style={{
                position: 'absolute', right: 10, bottom: 10,
                background: 'none', border: 'none', cursor: 'pointer', color: T.ink3,
                display: 'flex', alignItems: 'center',
              }}>
                {showNew ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
            <button onClick={updatePassword} disabled={saving} style={{
              padding: '10px 0', borderRadius: 10, background: saving ? '#CCC' : T.ink,
              color: '#fff', border: 'none', fontSize: 13, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </div>
        )}
      </Sect>

      <Sect title="Account">
        <button onClick={onSignOut} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
        }}>
          <LogOut style={{ width: 15, height: 15, color: T.ink3 }} />
          <span style={{ fontSize: 14, color: T.ink }}>Sign out</span>
        </button>
        <button onClick={() => toast.error('Contact support to delete your account.')} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: '#FFF1F2', border: '1px solid #FECDD3',
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Trash2 style={{ width: 15, height: 15, color: T.red }} />
          <span style={{ fontSize: 14, color: T.red }}>Delete account</span>
        </button>
      </Sect>
    </div>
  )
}

export function SettingsPanel({ school, profile, isSchool, onClose, onSignOut }: SettingsPanelProps) {
  const [tab, setTab] = useState<'school' | 'account'>(isSchool ? 'school' : 'account')

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>

      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: T.white, borderRadius: 20,
        maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 0', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>
            Settings
          </span>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.bg, cursor: 'pointer', color: T.ink3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', padding: '0 20px', marginTop: 4,
          borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          {isSchool && (
            <button onClick={() => setTab('school')} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '10px 16px 10px 0', fontSize: 13,
              fontWeight: tab === 'school' ? 600 : 400,
              color: tab === 'school' ? T.ink : T.ink3,
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === 'school' ? T.ink : 'transparent'}`,
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              <School style={{ width: 13, height: 13 }} strokeWidth={1.5} /> School
            </button>
          )}
          <button onClick={() => setTab('account')} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '10px 16px 10px 0', fontSize: 13,
            fontWeight: tab === 'account' ? 600 : 400,
            color: tab === 'account' ? T.ink : T.ink3,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === 'account' ? T.ink : 'transparent'}`,
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            <User style={{ width: 13, height: 13 }} strokeWidth={1.5} /> Account
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 28px' }}>
          {tab === 'school'  && isSchool && <SchoolSettings  school={school}   />}
          {tab === 'account'            && <AccountSettings profile={profile} onSignOut={onSignOut} />}
        </div>
      </div>
    </div>
  )
}
