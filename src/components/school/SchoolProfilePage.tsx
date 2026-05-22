// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  ChevronDown,
  GraduationCap,
  LogOut,
  MapPin,
  Pencil,
  Phone,
  Save,
  Settings,
  ShieldCheck,
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

function SectionCard({ children, style = {} }: any) {
  return (
    <section style={{
      margin: '0 14px 10px',
      padding: 14,
      borderRadius: 22,
      background: T.white,
      border: `1px solid ${T.border}`,
      boxShadow: '0 10px 28px rgba(0,0,0,0.035)',
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
          fontSize: 13.2,
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
      boxShadow: '0 8px 22px rgba(0,0,0,0.03)',
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
            fontWeight: 900,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.015em',
          }}>
            {title}
          </p>
          {subtitle && (
            <p style={{
              fontSize: 12.4,
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
          strokeWidth={2}
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
          padding: 13,
          background: T.soft2,
        }}>
          {children}
        </div>
      )}
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
    </div>
  )
}

export function SchoolProfilePage({ school: initialSchool, profile, isAdmin, userId }: SchoolProfilePageProps) {
  const router = useRouter()
  const [school, setSchool] = useState(initialSchool)
  const [tab, setTab] = useState<'profile' | 'classes' | 'settings'>('profile')
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

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
              }}>
                School
              </p>
              <p style={{
                fontSize: 11.5,
                color: T.ink3,
                margin: '1px 0 0',
              }}>
                Profile, classes and teachers
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
                  onClick={() => { setTab(key as any); setEditing(false) }}
                  style={{
                    height: 34,
                    borderRadius: 999,
                    border: `1px solid ${tab === key ? T.ink : T.border}`,
                    background: tab === key ? T.ink : T.white,
                    color: tab === key ? T.white : T.ink2,
                    fontSize: 12,
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
          <SectionCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  {school.tagline || 'A simple school space for teachers, classes and official school communication.'}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(school.province || school.address) && (
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
                    }}>
                      <MapPin size={12} strokeWidth={1.8} />
                      {school.province || school.address}
                    </span>
                  )}
                  {school.phone && (
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
                    }}>
                      <Phone size={12} strokeWidth={1.8} />
                      {school.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {tab === 'profile' && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AccordionCard
                defaultOpen
                icon={<Building2 size={17} strokeWidth={1.8} />}
                title="School profile"
                subtitle="Edit the public identity parents and teachers see."
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        ['School name', school.name],
                        ['Tagline', school.tagline],
                        ['Location', school.province || school.address],
                        ['Phone', school.phone],
                        ['Email', school.email],
                        ['Website', school.website],
                      ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
                        <div key={label} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 12,
                          padding: '9px 10px',
                          borderRadius: 14,
                          background: T.white,
                          border: `1px solid ${T.border}`,
                        }}>
                          <span style={{ fontSize: 12.4, color: T.ink3, fontWeight: 750 }}>{label}</span>
                          <span style={{
                            fontSize: 12.8,
                            color: T.ink2,
                            fontWeight: 750,
                            textAlign: 'right',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {isAdmin && (
                      <button type="button" onClick={() => setEditing(true)} style={{ ...primaryButton, width: '100%', marginTop: 11 }}>
                        <Pencil size={14} strokeWidth={2} />
                        Edit school profile
                      </button>
                    )}
                  </div>
                )}
              </AccordionCard>

              <AccordionCard
                icon={<ShieldCheck size={17} strokeWidth={1.8} />}
                title="What this page controls"
                subtitle="Keep school setup focused and clean."
              >
                <p style={{
                  fontSize: 13,
                  color: T.ink3,
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  The school account keeps the official profile and creates the school structure.
                  Teachers handle class communication from their own class spaces.
                </p>
              </AccordionCard>
            </div>
          )}

          {tab === 'classes' && isAdmin && (
            <div style={{ padding: '0 14px' }}>
              <SectionCard style={{ marginLeft: 0, marginRight: 0 }}>
                <SectionTitle
                  eyebrow="Build your school structure"
                  title="Add teachers and classes"
                  subtitle="Keep this simple: create the class, assign the teacher, and let the teacher manage their class space."
                />

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 12,
                }}>
                  <div style={{
                    padding: 11,
                    borderRadius: 18,
                    background: T.soft2,
                    border: `1px solid ${T.border}`,
                  }}>
                    <GraduationCap size={17} strokeWidth={1.8} color={T.ink2} />
                    <p style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: T.ink,
                      margin: '8px 0 2px',
                    }}>
                      Classes
                    </p>
                    <p style={{
                      fontSize: 12.2,
                      color: T.ink3,
                      lineHeight: 1.35,
                      margin: 0,
                    }}>
                      Grade/class structure.
                    </p>
                  </div>

                  <div style={{
                    padding: 11,
                    borderRadius: 18,
                    background: T.soft2,
                    border: `1px solid ${T.border}`,
                  }}>
                    <Users size={17} strokeWidth={1.8} color={T.ink2} />
                    <p style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: T.ink,
                      margin: '8px 0 2px',
                    }}>
                      Teachers
                    </p>
                    <p style={{
                      fontSize: 12.2,
                      color: T.ink3,
                      lineHeight: 1.35,
                      margin: 0,
                    }}>
                      Assign class owners.
                    </p>
                  </div>
                </div>
              </SectionCard>

              <TeachersTab />
            </div>
          )}

          {tab === 'settings' && isAdmin && (
            <div style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionCard style={{ marginLeft: 0, marginRight: 0 }}>
                <SectionTitle
                  eyebrow="Settings"
                  title="Account actions"
                  subtitle="Keep this area light. More settings can come later only when they add real value."
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
                <Sparkles size={17} strokeWidth={1.8} color={T.ink2} />
                <p style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: T.ink,
                  margin: '8px 0 2px',
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
                  Parents experience the official class memory through their teacher.
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
            fontWeight: 700,
          }}>
            Powered by School Connect
          </p>
        </main>
      </div>
    </div>
  )
}
