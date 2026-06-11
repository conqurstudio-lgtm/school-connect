// school-loading-guard-v1
'use client'
// school-connect-route-lock-v1
// school-admin-landing-route-repair-v1
// school-connect-cached-logo-loader-v341

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SchoolProfilePage } from '@/components/school/SchoolProfilePage'

const supabase = createClient()

const T = {
  ink: '#1A1A1A',
  ink2: '#4A4A4A',
  ink3: '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg: '#FFFFFF',
  soft: '#F7F7F8',
  accent: '#717171',
  accentSoft: '#F5F5F5',
  white: '#FFFFFF',
}

const SCHOOL_PAGE_CACHE_KEY = 'school-connect:school-page-cache:v1'

function initialsFrom(name?: string | null) {
  return String(name || 'SC')
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function readCachedSchoolPage() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SCHOOL_PAGE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.data || null
  } catch {
    return null
  }
}

function writeCachedSchoolPage(data: any) {
  if (typeof window === 'undefined' || !data?.school?.id) return

  try {
    window.localStorage.setItem(
      SCHOOL_PAGE_CACHE_KEY,
      JSON.stringify({ data, saved_at: new Date().toISOString() })
    )
  } catch {
    // Local storage can fail in private mode; the app should still work.
  }
}

function SchoolRouteLogoLoader({ cachedSchool }: any) {
  return (
    <main style={{
      minHeight: '100dvh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      color: T.ink,
    }}>
      <div style={{
        width: 92,
        height: 92,
        borderRadius: 32,
        background: cachedSchool?.logo_url ? `url(${cachedSchool.logo_url}) center/cover` : T.accentSoft,
        color: T.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 25,
        fontWeight: 560,
        overflow: 'hidden',
        boxShadow: '0 14px 34px rgba(15,23,42,0.06)',
        animation: 'schoolRouteLogoIn 260ms cubic-bezier(.2,.8,.2,1) both',
      }}>
        {!cachedSchool?.logo_url && initialsFrom(cachedSchool?.name)}
      </div>

      <style>{`
        @keyframes schoolRouteLogoIn {
          from { opacity: 0; transform: translateY(7px) scale(0.965); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </main>
  )
}

export function SchoolPageClient() {
  const router = useRouter()
  const [data, setData] = useState<any>(() => readCachedSchoolPage())
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadSchool = async () => {
      setLoading(true)
      setErrorMessage('')

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (!mounted) return

        if (sessionError) {
          throw new Error(sessionError.message || 'Could not confirm your session.')
        }

        const session = sessionData?.session
        if (!session) {
          router.replace('/auth/login')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (!mounted) return

        if (profileError) {
          throw new Error(profileError.message || 'Could not load your school profile.')
        }

        if (!profile) {
          router.replace('/auth/login')
          return
        }

        let school = null
        let schoolError: any = null

        if (profile.role === 'school') {
          const res = await supabase
            .from('schools')
            .select('*')
            .eq('owner_id', session.user.id)
            .maybeSingle()

          school = res.data
          schoolError = res.error
        }

        if (!school && profile.school_id) {
          const res = await supabase
            .from('schools')
            .select('*')
            .eq('id', profile.school_id)
            .maybeSingle()

          school = res.data
          schoolError = res.error
        }

        if (!mounted) return

        if (schoolError) {
          throw new Error(schoolError.message || 'Could not load school information.')
        }

        if (!school) {
          if (profile.role === 'school') {
            router.replace('/auth/school-setup')
          } else if (profile.role === 'teacher') {
            router.replace('/teacher')
          } else {
            router.replace('/feed')
          }
          return
        }

        const nextData = {
          school,
          profile,
          isAdmin: profile.role === 'school',
          userId: session.user.id,
        }

        setData(nextData)
        writeCachedSchoolPage(nextData)
      } catch (error: any) {
        console.error('[school-page] load failed:', error)
        if (mounted) {
          setErrorMessage(error?.message || 'The school page could not load.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadSchool()

    return () => {
      mounted = false
    }
  }, [router])

  if (data) {
    return <SchoolProfilePage {...data} bootLoading={loading} />
  }

  if (loading) return <SchoolRouteLogoLoader cachedSchool={readCachedSchoolPage()?.school} />

  if (errorMessage) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        padding: 24,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 390,
          padding: 18,
          borderRadius: 22,
          background: T.white,
          border: `1px solid ${T.border}`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.045)',
        }}>
          <p style={{
            fontSize: 15,
            fontWeight: 650,
            color: T.ink,
            margin: '0 0 5px',
            letterSpacing: '-0.025em',
          }}>
            School page could not load
          </p>

          <p style={{
            fontSize: 13.2,
            color: T.ink3,
            lineHeight: 1.45,
            margin: '0 0 14px',
          }}>
            {errorMessage}
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                height: 40,
                borderRadius: 999,
                border: `1px solid ${T.border}`,
                background: T.white,
                color: T.ink2,
                fontSize: 13,
                fontWeight: 560,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() => router.replace('/school')}
              style={{
                height: 40,
                borderRadius: 999,
                border: 'none',
                background: T.ink,
                color: T.white,
                fontSize: 13,
                fontWeight: 560,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Open school home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
