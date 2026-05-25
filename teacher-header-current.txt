// @ts-nocheck
'use client'

import { LogOut } from 'lucide-react'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  white:  '#FFFFFF',
}

interface Props {
  teacher: { name: string; photo_url: string | null; grade: string; class_name: string | null }
  school:  { name: string; logo_url: string | null }
  onUploadPhoto: () => void
}

export function TeacherHeader({ teacher, school, onUploadPhoto }: Props) {
  const initials = teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const signOut = async () => {
    if (!confirm('Sign out? You\'ll need your link to come back.')) return
    await fetch('/api/teacher-session', { method: 'POST' })
    window.location.href = '/teacher'
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '20px 20px 14px',
    }}>
      {/* Teacher avatar with school logo badge */}
      <div onClick={onUploadPhoto} style={{
        position: 'relative', width: 56, height: 56, flexShrink: 0,
        cursor: 'pointer',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: teacher.photo_url
            ? `url(${teacher.photo_url}) center/cover`
            : '#F0F0F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 600, color: T.ink2,
        }}>
          {!teacher.photo_url && initials}
        </div>

        {/* School logo badge bottom-right */}
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 22, height: 22, borderRadius: '50%',
          background: school.logo_url ? `url(${school.logo_url}) center/cover` : '#E8E8EC',
          border: `2px solid ${T.white}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!school.logo_url && (
            <span style={{ fontSize: 9, fontWeight: 700, color: T.ink3 }}>
              {school.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Name + grade */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: T.ink,
                     letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
                     overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {teacher.name}
        </h1>
        <p style={{ fontSize: 12, color: T.ink3, margin: '3px 0 0' }}>
          {teacher.grade}{teacher.class_name ? ` · ${teacher.class_name}` : ''}
          {' · '}
          {school.name}
        </p>
      </div>

      {/* Sign out icon */}
      <button onClick={signOut} aria-label="Sign out" style={{
        width: 36, height: 36, borderRadius: 999,
        background: 'none', border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: T.ink3, flexShrink: 0,
      }}>
        <LogOut size={14} strokeWidth={1.8} />
      </button>
    </div>
  )
}
