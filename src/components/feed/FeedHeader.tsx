'use client'
import { useRouter } from 'next/navigation'

import { useState } from 'react'
import { LogOut, Settings, GraduationCap } from 'lucide-react'
import type { Profile, School } from '@/lib/types'

interface FeedHeaderProps {
  profile:       Profile
  school:        School
  isSchool:      boolean
  unreadCount:   number
  onBellClick:   () => void
  onSignOut:     () => void
  onProfileOpen:   () => void
  onTeachersOpen:  () => void
  teachersPending?: number
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
  )
}

function MoreDotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="5"  r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="19" r="1.4" fill="currentColor" />
    </svg>
  )
}

const circleBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  border: '1px solid rgba(0,0,0,0.06)',
  background: 'transparent',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#3D3D3D',
}


function FadingImg({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img src={src} alt={alt}
      onLoad={() => setLoaded(true)}
      style={{
        width: '100%', height: '100%', objectFit: 'contain',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
      }} />
  )
}

export function FeedHeader({
  school, isSchool, unreadCount, onBellClick, onSignOut, onProfileOpen, onTeachersOpen, teachersPending = 0,
}: FeedHeaderProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 28px 20px',
    }}>

      {/* School logo — navigates to school profile */}
      <button onClick={() => {
        try { sessionStorage.setItem('feed-left', '1') } catch {}
        router.push('/school')
      }}
        onMouseDown ={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp   ={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        style={{
          width: 72, height: 72, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          background: '#F0F0F0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(0,0,0,0.07)',
          cursor: 'pointer', padding: 0,
          transition: 'transform 0.15s ease',
        }}>
        {school.logo_url
          ? <FadingImg key={school.logo_url} src={school.logo_url} alt={school.name} />
          : <span style={{ fontSize: 26, fontWeight: 600, color: '#AAAAAA' }}>
              {school.name.charAt(0)}
            </span>
        }
      </button>

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 18 }}>

        {isSchool && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(v => !v)} aria-label="More" style={circleBtn}>
              <MoreDotsIcon />
            </button>

            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                     onClick={() => setShowMenu(false)} />
                <div className="dropdown-in" style={{
                  position: 'absolute', right: 0, top: 44,
                  width: 168, background: '#fff', borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  zIndex: 50, padding: '5px 0',
                  transformOrigin: 'top right',
                }}>
                  <button onClick={() => { setShowMenu(false); onTeachersOpen() }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '11px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 14, color: '#1A1A1A',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <GraduationCap style={{ width: 14, height: 14, color: '#AAAAAA' }} />
                    Teachers
                    {teachersPending > 0 && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                                     color: '#E8281E', background: '#FFF1F2',
                                     padding: '1px 6px', borderRadius: 20 }}>
                        {teachersPending}
                      </span>
                    )}
                  </button>
                  <button onClick={() => {
                    setShowMenu(false)
                    try { sessionStorage.setItem('feed-left', '1') } catch {}
                    router.push('/school')
                  }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '11px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 14, color: '#1A1A1A',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <Settings style={{ width: 14, height: 14, color: '#AAAAAA' }} />
                    School profile
                  </button>
                  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 12px' }} />
                  <button onClick={() => { setShowMenu(false); onSignOut() }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '11px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 14, color: '#E8281E',
                    textAlign: 'left', fontFamily: 'inherit',
                  }}>
                    <LogOut style={{ width: 14, height: 14 }} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bell */}
        <button onClick={onBellClick} aria-label="Notifications"
                style={{ ...circleBtn, position: 'relative' }}>
          <BellIcon />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, background: '#E8281E',
              borderRadius: '50%', border: '1.5px solid #fff',
            }} />
          )}
        </button>
      </div>
    </div>
  )
}
