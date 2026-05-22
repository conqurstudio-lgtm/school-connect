// school-loading-guard-v1
'use client'
// school-admin-landing-route-repair-v1

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
  bg: '#FCFCFF',
  white: '#FFFFFF',
}

export function SchoolPageClient() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
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
          router.replace(profile.role === 'school' ? '/auth/school-setup' : '/feed')
          return
        }

        setData({
          school,
          profile,
          isAdmin: profile.role === 'school',
          userId: session.user.id,
        })
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

  if (loading) {
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
          maxWidth: 360,
          padding: 18,
          borderRadius: 22,
          background: T.white,
          border: `1px solid ${T.border}`,
          boxShadow: '0 12px 32px rgba(0,0,0,0.045)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2.5px solid #E8E8E8',
            borderTopColor: T.ink,
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{
            fontSize: 14,
            fontWeight: 900,
            color: T.ink,
            margin: 0,
            letterSpacing: '-0.02em',
          }}>
            Opening school command centre
          </p>
          <p style={{
            fontSize: 12.8,
            color: T.ink3,
            margin: '4px 0 0',
            lineHeight: 1.45,
          }}>
            Confirming your school profile…
          </p>
        </div>
      </div>
    )
  }

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
            fontWeight: 950,
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
                fontWeight: 850,
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
                fontWeight: 850,
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

  if (!data) return null

  return <SchoolProfilePage {...data} />
}
