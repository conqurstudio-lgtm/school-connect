// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Link2,
  LogOut,
  MapPin,
  Pencil,
  Save,
  Settings,
  Sparkles,
  Users,
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

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  soft:   '#F4F4F6',
  soft2:  '#F8F8FB',
  white:  '#FFFFFF',
  green:  '#16A34A',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  fontSize: 14,
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
  fontWeight: 850,
  color: T.ink3,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  margin: '0 0 6px',
}

const quietButton: React.CSSProperties = {
  height: 38,
  borderRadius: 999,
  border: `1px solid ${T.border}`,
  background: T.white,
  color: T.ink2,
  fontSize: 13,
  fontWeight: 850,
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

function SectionTitle({ eyebrow, title, subtitle }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      {eyebrow && (
        <p style={{
          fontSize: 11,
          fontWeight: 900,
          color: T.ink3,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 4px',
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{
        fontSize: 17,
        fontWeight: 950,
        color: T.ink,
        letterSpacing: '-0.035em',
        margin: 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize: 13.4,
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

function CommandCard({ icon, title, subtitle, action, onClick, muted = false }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        border: `1px solid ${T.border}`,
        background: muted ? T.soft2 : T.white,
        borderRadius: 20,
        padding: 13,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'inherit',
        boxShadow: muted ? 'none' : '0 10px 28px rgba(0,0,0,0.035)',
      }}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 15,
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
          fontWeight: 900,
          color: T.ink,
          margin: 0,
          letterSpacing: '-0.015em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </p>
        <p style={{
          fontSize: 12.6,
          color: T.ink3,
          lineHeight: 1.38,
          margin: '2px 0 0',
        }}>
          {subtitle}
        </p>
      </div>

      {action && (
        <span style={{
          fontSize: 12.2,
          fontWeight: 850,
          color: T.ink2,
          background: T.soft,
          borderRadius: 999,
          padding: '6px 9px',
          flexShrink: 0,
        }}>
          {action}
        </span>
      )}
    </button>
  )
}

function InfoPill({ icon, children }: any) {
  if (!children) return null
  return (
    <span style={{
      minHeight: 28,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '0 9px',
      borderRadius: 999,
      border: `1px solid ${T.border}`,
      background: T.white,
      color: T.ink2,
      fontSize: 12.4,
      fontWeight: 750,
      maxWidth: '100%',
    }}>
      {icon}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
    </span>
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
    <section style={{
      margin: '0 14px 12px',
      padding: 14,
      borderRadius: 22,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
    }}>
      <SectionTitle
        eyebrow="School details"
        title="Keep it simple"
        subtitle="Only add what helps parents trust the official school space."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
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
          <label style={labelStyle}>Location / province</label>
          <input value={province || address} onChange={e => {
            setProvince(e.target.value)
            if (!address) setAddress(e.target.value)
          }} placeholder="Johannesburg, Gauteng" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Website</label>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 13 }}>
        <button type="button" onClick={onCancel} style={quietButton}>
          <X size={14} strokeWidth={2.1} />
          Cancel
        </button>
        <button type="button" disabled={saving} onClick={save} style={{
          ...primaryButton,
          opacity: saving ? 0.6 : 1,
          cursor: saving ? 'wait' : 'pointer',
        }}>
          <Save size={14} strokeWidth={2.1} />
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  )
}

export function SchoolProfilePage({ school: initialSchool, profile, isAdmin, userId }: SchoolProfilePageProps) {
  const router = useRouter()
  const [school, setSchool] = useState(initialSchool)
  const [tab, setTab] = useState<'overview' | 'teachers' | 'join' | 'settings'>('overview')
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  const inviteUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/parent-join/${school.slug}`
    return `${window.location.origin}/parent-join/${school.slug}`
  }, [school.slug])

  const setupItems = [
    {
      key: 'identity',
      label: 'School profile',
      done: Boolean(school.name && (school.logo_url || school.tagline || school.phone || school.email)),
    },
    {
      key: 'teachers',
      label: 'Teachers',
      done: true,
    },
    {
      key: 'join',
      label: 'Parent join link',
      done: Boolean(school.slug),
    },
  ]

  const completed = setupItems.filter(item => item.done).length

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB')
      return
    }

    setUploading(true)
    const toastId = toast.loading('Updating logo…')

    try {
      const ext = file.name.split('.').pop()
      const path = `schools/${school.owner_id || userId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(path, file, { upsert: true })

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
    } finally {
      setUploading(false)
    }
  }

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success('Parent join link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  const openInvite = () => {
    window.open(inviteUrl, '_blank', 'noopener,noreferrer')
  }

  const signOut = async () => {
    if (!confirm('Sign out of School Connect?')) return
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
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
            <button type="button" onClick={() => router.back()} style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <ArrowLeft size={17} strokeWidth={2} />
            </button>

            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <p style={{
                fontSize: 14,
                fontWeight: 950,
                color: T.ink,
                margin: 0,
                letterSpacing: '-0.025em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                School setup
              </p>
              <p style={{
                fontSize: 11.5,
                color: T.ink3,
                margin: '1px 0 0',
              }}>
                Official home for school communication
              </p>
            </div>

            <button type="button" onClick={() => setTab('settings')} style={{
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
            }}>
              <Settings size={16} strokeWidth={1.9} />
            </button>
          </div>

          {isAdmin && (
            <nav style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 6,
              marginTop: 10,
            }}>
              {[
                ['overview', 'Overview'],
                ['teachers', 'Teachers'],
                ['join', 'Parent Join'],
                ['settings', 'Settings'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setTab(key as any); setEditing(false) }}
                  style={{
                    height: 34,
                    borderRadius: 999,
                    border: `1px solid ${tab === key ? T.ink : T.border}`,
                    background: tab === key ? T.ink : T.white,
                    color: tab === key ? T.white : T.ink2,
                    fontSize: 11.5,
                    fontWeight: 850,
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
          <section style={{
            margin: '0 14px 10px',
            padding: 14,
            borderRadius: 24,
            background: T.white,
            border: `1px solid ${T.border}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.045)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: 22,
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
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 7 }}
                    />
                  ) : (
                    <span style={{ fontSize: 23, fontWeight: 950, color: T.ink3 }}>
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

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 18,
                  fontWeight: 950,
                  color: T.ink,
                  margin: 0,
                  letterSpacing: '-0.04em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {school.name}
                </p>

                <p style={{
                  fontSize: 13.2,
                  color: T.ink3,
                  lineHeight: 1.38,
                  margin: '3px 0 8px',
                }}>
                  {school.tagline || 'Your official school memory for updates, documents, class life and parent communication.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <InfoPill icon={<MapPin size={12} strokeWidth={1.8} />}>
                    {school.province || school.address || 'Location not added'}
                  </InfoPill>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginTop: 13,
              }}>
                <button type="button" onClick={() => setEditing(true)} style={quietButton}>
                  <Pencil size={14} strokeWidth={2} />
                  Edit profile
                </button>
                <button type="button" onClick={copyInvite} style={quietButton}>
                  {copied ? <Check size={14} strokeWidth={2.1} /> : <Copy size={14} strokeWidth={2} />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            )}
          </section>

          {editing && (
            <EditSchoolDetails
              school={school}
              onCancel={() => setEditing(false)}
              onSaved={(updates: any) => {
                setSchool((s: any) => ({ ...s, ...updates }))
                setEditing(false)
                window.dispatchEvent(new Event('school-updated'))
              }}
            />
          )}

          {tab === 'overview' && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.white,
                border: `1px solid ${T.border}`,
                boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
              }}>
                <SectionTitle
                  eyebrow="Launch checklist"
                  title="Set up the school in minutes"
                  subtitle="Keep the school simple: identity, teachers, parent link, then class life."
                />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginTop: 12,
                }}>
                  {setupItems.map(item => (
                    <div key={item.key} style={{
                      padding: '10px 8px',
                      borderRadius: 16,
                      background: item.done ? '#F0FDF4' : T.soft2,
                      border: `1px solid ${item.done ? 'rgba(22,163,74,0.18)' : T.border}`,
                      textAlign: 'center',
                    }}>
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        margin: '0 auto 7px',
                        background: item.done ? T.green : '#E5E5EA',
                        color: T.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={13} strokeWidth={2.5} />
                      </div>
                      <p style={{
                        fontSize: 11.5,
                        color: item.done ? '#166534' : T.ink3,
                        fontWeight: 850,
                        lineHeight: 1.2,
                        margin: 0,
                      }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p style={{
                  fontSize: 12.4,
                  color: T.ink3,
                  textAlign: 'center',
                  margin: '10px 0 0',
                }}>
                  {completed} of {setupItems.length} basics ready
                </p>
              </section>

              <CommandCard
                icon={<GraduationCap size={18} strokeWidth={1.8} />}
                title="Teachers and classes"
                subtitle="Add teachers, then connect them to grades/classes."
                action="Open"
                onClick={() => setTab('teachers')}
              />

              <CommandCard
                icon={<Users size={18} strokeWidth={1.8} />}
                title="Parent onboarding"
                subtitle="Share one official school link with parents."
                action="Copy"
                onClick={copyInvite}
              />

              <CommandCard
                icon={<Sparkles size={18} strokeWidth={1.8} />}
                title="School memory"
                subtitle="Class Life becomes the official home for updates, moments, documents and reports."
                action="Preview"
                onClick={() => router.push('/feed')}
                muted
              />
            </div>
          )}

          {tab === 'teachers' && isAdmin && (
            <div style={{ padding: '0 14px' }}>
              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.white,
                border: `1px solid ${T.border}`,
                boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
                marginBottom: 10,
              }}>
                <SectionTitle
                  eyebrow="Teachers"
                  title="Build your school structure"
                  subtitle="Teachers are the bridge between the school memory and each class."
                />
              </section>

              <TeachersTab />
            </div>
          )}

          {tab === 'join' && isAdmin && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.white,
                border: `1px solid ${T.border}`,
                boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
              }}>
                <SectionTitle
                  eyebrow="Parent Join"
                  title="One official link"
                  subtitle="Parents use this link to request access and connect children to the right class."
                />

                <div style={{
                  padding: 12,
                  borderRadius: 18,
                  background: T.soft2,
                  border: `1px solid ${T.border}`,
                  marginTop: 10,
                }}>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: T.ink3,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    margin: '0 0 6px',
                  }}>
                    Parent join link
                  </p>
                  <p style={{
                    fontSize: 12.4,
                    color: T.ink2,
                    margin: 0,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    lineHeight: 1.45,
                  }}>
                    {inviteUrl}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 12 }}>
                  <button type="button" onClick={copyInvite} style={primaryButton}>
                    {copied ? <Check size={14} strokeWidth={2.1} /> : <Copy size={14} strokeWidth={2} />}
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                  <button type="button" onClick={openInvite} style={quietButton}>
                    <ExternalLink size={14} strokeWidth={2} />
                    Preview
                  </button>
                </div>
              </section>

              <CommandCard
                icon={<Link2 size={18} strokeWidth={1.8} />}
                title="Share on WhatsApp"
                subtitle="Copy this link and send it to class groups or parents directly."
                action="Copy"
                onClick={copyInvite}
              />

              <CommandCard
                icon={<Users size={18} strokeWidth={1.8} />}
                title="Review join requests"
                subtitle="Teachers approve parent-child links from their class space."
                action="Teacher"
                muted
              />
            </div>
          )}

          {tab === 'settings' && isAdmin && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.white,
                border: `1px solid ${T.border}`,
                boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
              }}>
                <SectionTitle
                  eyebrow="Settings"
                  title="Keep this light"
                  subtitle="Only the actions needed to manage the school account."
                />

                <button type="button" onClick={signOut} style={{
                  ...quietButton,
                  width: '100%',
                  justifyContent: 'flex-start',
                  marginTop: 8,
                  height: 44,
                  borderRadius: 16,
                }}>
                  <LogOut size={15} strokeWidth={1.9} />
                  Sign out
                </button>
              </section>

              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.soft2,
                border: `1px solid ${T.border}`,
              }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: T.ink,
                  margin: 0,
                }}>
                  School Connect principle
                </p>
                <p style={{
                  fontSize: 13,
                  color: T.ink3,
                  lineHeight: 1.45,
                  margin: '4px 0 0',
                }}>
                  WhatsApp can notify parents, but School Connect remains the official home for updates, documents, reports and class life.
                </p>
              </section>
            </div>
          )}

          {!isAdmin && (
            <div style={{ padding: '0 14px' }}>
              <section style={{
                padding: 14,
                borderRadius: 22,
                background: T.white,
                border: `1px solid ${T.border}`,
                boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
              }}>
                <SectionTitle
                  eyebrow="School"
                  title="Official school profile"
                  subtitle="This is the school connected to your child’s class space."
                />
                <button type="button" onClick={() => router.push('/feed')} style={{ ...primaryButton, width: '100%', marginTop: 8 }}>
                  Go to school feed
                </button>
              </section>
            </div>
          )}

          <p style={{
            fontSize: 11,
            color: '#C4C4C8',
            textAlign: 'center',
            margin: '16px 0 0',
            letterSpacing: '0.04em',
            fontWeight: 700,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>
    </div>
  )
}
