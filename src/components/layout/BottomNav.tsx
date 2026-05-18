// @ts-nocheck
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface BottomNavProps {
  isSchool:    boolean
  unreadCount: number
  onCompose?:  () => void
}

const T = {
  ink:    '#1A1A1A',
  ink3:   '#B0B0B0',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke={active ? T.ink : T.ink3} strokeWidth={active ? '1.8' : '1.5'}
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function BellIcon({ active, count }: { active: boolean; count: number }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
           stroke={active ? T.ink : T.ink3} strokeWidth={active ? '1.8' : '1.5'}
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 10a6 6 0 0 1 12 0c0 5 2 7 2 7H4s2-2 2-7" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        <line x1="12" y1="2" x2="12" y2="4" />
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 16, height: 16, borderRadius: 20,
          background: '#E8281E', color: '#fff',
          fontSize: 9, fontWeight: 700, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px', border: '1.5px solid #FCFCFF',
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  )
}

function SchoolIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke={active ? T.ink : T.ink3} strokeWidth={active ? '1.8' : '1.5'}
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke={active ? T.ink : T.ink3} strokeWidth={active ? '1.8' : '1.5'}
         strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function NavItem({ href, label, Icon, active }: {
  href: string; label: string
  Icon: React.ReactNode; active: boolean
}) {
  return (
    <Link href={href} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 4, padding: '8px 0',
      textDecoration: 'none', cursor: 'pointer',
    }}>
      {Icon}
      <span style={{
        fontSize: 10, fontWeight: active ? 600 : 400,
        color: active ? T.ink : T.ink3,
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '0.01em',
      }}>
        {label}
      </span>
    </Link>
  )
}

export function BottomNav({ isSchool, unreadCount, onCompose }: BottomNavProps) {
  const pathname = usePathname()

  const isFeed    = pathname === '/feed'
  const isSchoolP = pathname === '/school'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%',
      transform: 'translateX(-50%)',
      width: '100%', maxWidth: 520,
      zIndex: 40,
      background: '#FCFCFF',
      borderTop: `1px solid ${T.border}`,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      display: 'flex', alignItems: 'center',
    }}>
      <NavItem href="/feed" label="Feed" active={isFeed}
        Icon={<HomeIcon active={isFeed} />} />

      {/* Centre — compose for school, nothing for parent (they use profile) */}
      {isSchool ? (
        <button onClick={onCompose} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4, padding: '8px 0',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: T.ink, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="#fff" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 400, color: T.ink3,
                         fontFamily: 'Inter, system-ui, sans-serif' }}>
            Post
          </span>
        </button>
      ) : (
        <NavItem href="/school" label="School" active={isSchoolP}
          Icon={<SchoolIcon active={isSchoolP} />} />
      )}

      <NavItem href="/school" label={isSchool ? 'School' : 'Profile'}
        active={isSchoolP && !(!isSchool)}
        Icon={isSchool
          ? <SchoolIcon active={isSchoolP} />
          : <ProfileIcon active={isSchoolP} />
        }
      />
    </div>
  )
}
