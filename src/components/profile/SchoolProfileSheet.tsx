'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Copy, Check, MapPin, Phone, Mail, Globe, Users, FileText, Heart, Pencil, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { School, Profile } from '@/lib/types'

interface SchoolProfileSheetProps {
  school:   School
  profile:  Profile
  isSchool: boolean
  userId:   string
  onClose:  () => void
}

const supabase = createClient()

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', fontSize: 14,
  border: `1px solid ${T.border}`, borderRadius: 10,
  background: T.bg, color: T.ink, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: T.ink3, marginBottom: 5, textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

interface Stats {
  members: number
  posts:   number
  reactions: number
}

export function SchoolProfileSheet({
  school, profile, isSchool, userId, onClose,
}: SchoolProfileSheetProps) {
  const [tab,        setTab]        = useState<'school' | 'me'>('school')
  const [stats,      setStats]      = useState<Stats>({ members: 0, posts: 0, reactions: 0 })
  const [copied,     setCopied]     = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)

  // Parent edit fields
  const [childName,  setChildName]  = useState(profile.child_name  ?? '')
  const [childGrade, setChildGrade] = useState(profile.child_grade ?? '')
  const [childClass, setChildClass] = useState(profile.child_class ?? '')
  const [phone,      setPhone]      = useState(profile.phone       ?? '')
  const [fullName,   setFullName]   = useState(profile.full_name   ?? '')

  const [inviteUrl, setInviteUrl] = useState(`/join/${school.slug}`)
  useEffect(() => {
    setInviteUrl(`${window.location.origin}/parent-join/${school.slug}`)
  }, [school.slug])

  const fetchStats = useCallback(async () => {
    const [membersRes, postsRes, reactionsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('school_id', school.id).eq('status', 'published'),
      supabase.from('reactions').select('id', { count: 'exact', head: true }).eq('school_id', school.id),
    ])
    setStats({
      members:   membersRes.count  ?? 0,
      posts:     postsRes.count    ?? 0,
      reactions: reactionsRes.count ?? 0,
    })
  }, [school.id])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Invite link copied')
    })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name:   fullName.trim()   || null,
      child_name:  childName.trim()  || null,
      child_grade: childGrade        || null,
      child_class: childClass.trim() || null,
      phone:       phone.trim()      || null,
    }).eq('id', userId)

    if (error) {
      toast.error('Failed to save. Please try again.')
    } else {
      toast.success('Profile updated')
      setEditing(false)
    }
    setSaving(false)
  }

  const StatPill = ({ label, value }: { label: string; value: number }) => (
    <div style={{
      flex: 1, textAlign: 'center', padding: '14px 8px',
      background: T.bg, borderRadius: 14, border: `1px solid ${T.border}`,
    }}>
      <p style={{ fontSize: 20, fontWeight: 600, color: T.ink,
                   letterSpacing: '-0.03em', margin: '0 0 2px' }}>
        {value.toLocaleString()}
      </p>
      <p style={{ fontSize: 11, color: T.ink3, margin: 0 }}>{label}</p>
    </div>
  )

  const InfoRow = ({ Icon, value }: { Icon: React.ElementType; value?: string | null }) => {
    if (!value) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon style={{ width: 14, height: 14, color: T.ink3, flexShrink: 0 }} strokeWidth={1.5} />
        <span style={{ fontSize: 13, color: T.ink2, lineHeight: 1.4 }}>{value}</span>
      </div>
    )
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>

      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 520, margin: '0 auto',
        background: T.white, borderRadius: 20,
        maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
        animation: 'popUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 0 }}>
            {['school', 'me'].map(t => (
              <button key={t} onClick={() => { setTab(t as any); setEditing(false) }} style={{
                padding: '6px 16px', fontSize: 14, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? T.ink : T.ink3,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
                borderBottom: `2px solid ${tab === t ? T.ink : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
                {t === 'school' ? 'School' : 'My profile'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.bg, cursor: 'pointer', color: T.ink3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        <div style={{ height: 1, background: T.border, margin: '12px 0 0' }} />

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 20px 32px' }}>

          {/* ── School tab ── */}
          {tab === 'school' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Logo + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                  overflow: 'hidden', background: T.bg, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {school.logo_url
                    ? <img src={school.logo_url} alt={school.name}
                           style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontSize: 24, fontWeight: 600, color: T.ink3 }}>
                        {school.name.charAt(0)}
                      </span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 600, color: T.ink,
                               letterSpacing: '-0.02em', margin: '0 0 3px',
                               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {school.name}
                  </h2>
                  {school.tagline && (
                    <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.4 }}>
                      {school.tagline}
                    </p>
                  )}
                  {school.province && (
                    <p style={{ fontSize: 12, color: T.ink3, margin: '2px 0 0' }}>
                      {school.province}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 8 }}>
                <StatPill label="Members"   value={stats.members}   />
                <StatPill label="Posts"     value={stats.posts}     />
                <StatPill label="Reactions" value={stats.reactions} />
              </div>

              {/* Contact info */}
              {(school.address || school.phone || school.email || school.website) && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 10,
                  padding: '14px', background: T.bg, borderRadius: 14,
                  border: `1px solid ${T.border}`,
                }}>
                  <InfoRow Icon={MapPin} value={school.address} />
                  <InfoRow Icon={Phone}  value={school.phone}   />
                  <InfoRow Icon={Mail}   value={school.email}   />
                  <InfoRow Icon={Globe}  value={school.website} />
                </div>
              )}

              {/* Invite link — visible to all */}
              <div style={{
                padding: '14px', background: T.bg, borderRadius: 14,
                border: `1px solid ${T.border}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: T.ink3,
                             textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  {isSchool ? 'Parent invite link' : 'School link'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontSize: 12, color: T.ink2, margin: 0, flex: 1,
                               overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                               fontFamily: 'monospace' }}>
                    {inviteUrl}
                  </p>
                  <button onClick={handleCopyInvite} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${T.border}`, background: T.white,
                    fontSize: 12, fontWeight: 500, color: T.ink,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {copied
                      ? <><Check style={{ width: 12, height: 12 }} /> Copied</>
                      : <><Copy style={{ width: 12, height: 12 }} /> Copy</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── My profile tab ── */}
          {tab === 'me' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: T.bg, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 600, color: T.ink3,
                }}>
                  {(profile.full_name ?? 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: T.ink,
                               letterSpacing: '-0.02em', margin: '0 0 2px' }}>
                    {profile.full_name ?? 'Parent'}
                  </p>
                  <p style={{ fontSize: 12, color: T.ink3, margin: 0 }}>
                    {isSchool ? 'School admin' : 'Parent'}
                    {profile.child_grade ? ` · ${profile.child_grade}` : ''}
                  </p>
                </div>
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{
                    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px', borderRadius: 9,
                    border: `1px solid ${T.border}`, background: T.bg,
                    fontSize: 12, fontWeight: 500, color: T.ink2,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    <Pencil style={{ width: 11, height: 11 }} />
                    Edit
                  </button>
                )}
              </div>

              {!editing ? (
                /* View mode */
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: 0,
                  background: T.bg, borderRadius: 14, border: `1px solid ${T.border}`,
                  overflow: 'hidden',
                }}>
                  {[
                    { label: 'Full name',    value: profile.full_name   },
                    { label: "Child's name", value: profile.child_name  },
                    { label: 'Grade',        value: profile.child_grade },
                    { label: 'Class',        value: profile.child_class },
                    { label: 'Phone',        value: profile.phone       },
                  ].filter(r => r.value).map((row, i, arr) => (
                    <div key={row.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 14px',
                      borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <span style={{ fontSize: 12, color: T.ink3 }}>{row.label}</span>
                      <span style={{ fontSize: 14, color: T.ink, fontWeight: 400 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Edit mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full name</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name" style={inputStyle} autoFocus />
                  </div>
                  {!isSchool && (
                    <>
                      <div>
                        <label style={labelStyle}>Child's name</label>
                        <input value={childName} onChange={e => setChildName(e.target.value)}
                          placeholder="Child's full name" style={inputStyle} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={labelStyle}>Grade</label>
                          <select value={childGrade} onChange={e => setChildGrade(e.target.value)}
                            style={{ ...inputStyle, cursor: 'pointer' }}>
                            <option value="">Select</option>
                            {['R','1','2','3','4','5','6','7','8','9','10','11','12'].map(g => (
                              <option key={g} value={`Grade ${g}`}>Grade {g}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={labelStyle}>Class</label>
                          <input value={childClass} onChange={e => setChildClass(e.target.value)}
                            placeholder="e.g. 4B" style={inputStyle} />
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="082 000 0000" style={inputStyle} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => setEditing(false)} style={{
                      flex: 1, padding: '12px 0', borderRadius: 10,
                      border: `1px solid ${T.border}`, background: T.bg,
                      fontSize: 14, fontWeight: 500, color: T.ink2,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveProfile} disabled={saving} style={{
                      flex: 2, padding: '12px 0', borderRadius: 10,
                      border: 'none', background: saving ? '#CCC' : T.ink,
                      fontSize: 14, fontWeight: 600, color: T.white,
                      cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                      {saving ? (
                        <><div style={{ width: 14, height: 14, borderRadius: '50%',
                          border: '2px solid rgba(255,255,255,0.3)', borderTopColor: T.white,
                          animation: 'spin 0.7s linear infinite' }} />Saving…</>
                      ) : 'Save changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
