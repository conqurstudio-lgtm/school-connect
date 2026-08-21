// school-loading-guard-v1
'use client'
// school-connect-route-lock-v1
// school-admin-landing-route-repair-v1
// school-connect-cached-logo-loader-v341
// school-connect-user-scoped-school-cache-v1

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

/*
|--------------------------------------------------------------------------
| USER-SCOPED SCHOOL PAGE CACHE
|--------------------------------------------------------------------------
|
| The old cache used one shared key:
|
| school-connect:school-page-cache:v1
|
| That meant User B could temporarily see User A's cached school after
| signing in on the same browser.
|
| The cache is now scoped by authenticated user ID.
|
*/

const SCHOOL_PAGE_CACHE_PREFIX =
  'school-connect:school-page-cache:v2:'

const LEGACY_SCHOOL_PAGE_CACHE_KEY =
  'school-connect:school-page-cache:v1'

function schoolPageCacheKey(userId: string) {
  return `${SCHOOL_PAGE_CACHE_PREFIX}${userId}`
}

function initialsFrom(name?: string | null) {
  return String(name || 'SC')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function removeLegacySchoolPageCache() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(
      LEGACY_SCHOOL_PAGE_CACHE_KEY
    )
  } catch {
    // Cache cleanup should never block the page.
  }
}

function readCachedSchoolPage(
  userId: string
) {
  if (
    typeof window === 'undefined' ||
    !userId
  ) {
    return null
  }

  try {
    const raw =
      window.localStorage.getItem(
        schoolPageCacheKey(userId)
      )

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      parsed?.user_id !== userId
    ) {
      return null
    }

    return parsed?.data || null
  } catch {
    return null
  }
}

function writeCachedSchoolPage(
  userId: string,
  data: any
) {
  if (
    typeof window === 'undefined' ||
    !userId ||
    !data?.school?.id
  ) {
    return
  }

  try {
    window.localStorage.setItem(
      schoolPageCacheKey(userId),
      JSON.stringify({
        user_id: userId,
        data,
        saved_at:
          new Date().toISOString(),
      })
    )
  } catch {
    // Local storage can fail in private mode.
    // The app should still work normally.
  }
}

function SchoolRouteLogoLoader({
  cachedSchool,
}: any) {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: T.ink,
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 32,
          background:
            cachedSchool?.logo_url
              ? `url(${cachedSchool.logo_url}) center/cover`
              : T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 25,
          fontWeight: 560,
          overflow: 'hidden',
          boxShadow:
            '0 14px 34px rgba(15,23,42,0.06)',
        }}
      >
        {!cachedSchool?.logo_url &&
          initialsFrom(
            cachedSchool?.name
          )}
      </div>
    </main>
  )
}

export function SchoolPageClient() {
  const router = useRouter()

  const [data, setData] =
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  const [
    cachedSchool,
    setCachedSchool,
  ] = useState<any>(null)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  /*
  |--------------------------------------------------------------------------
  | REMOVE OLD SHARED CACHE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    removeLegacySchoolPageCache()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | LOAD SCHOOL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true

    const loadSchool =
      async () => {
        setLoading(true)
        setErrorMessage('')

        try {
          /*
          |--------------------------------------------------------------------------
          | 1. CONFIRM THE ACTUAL LOGGED-IN USER FIRST
          |--------------------------------------------------------------------------
          */

          const {
            data: sessionData,
            error: sessionError,
          } =
            await supabase.auth.getSession()

          if (!mounted) return

          if (sessionError) {
            throw new Error(
              sessionError.message ||
                'Could not confirm your session.'
            )
          }

          const session =
            sessionData?.session

          if (!session) {
            router.replace(
              '/auth/login'
            )
            return
          }

          const userId =
            session.user.id

          /*
          |--------------------------------------------------------------------------
          | 2. ONLY LOAD CACHE BELONGING TO THIS USER
          |--------------------------------------------------------------------------
          */

          const cached =
            readCachedSchoolPage(
              userId
            )

          if (
            cached?.school &&
            cached?.userId ===
              userId
          ) {
            setCachedSchool(
              cached.school
            )

            setData(cached)
          }

          /*
          |--------------------------------------------------------------------------
          | 3. LOAD CURRENT PROFILE
          |--------------------------------------------------------------------------
          */

          const {
            data: profile,
            error: profileError,
          } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

          if (!mounted) return

          if (profileError) {
            throw new Error(
              profileError.message ||
                'Could not load your school profile.'
            )
          }

          if (!profile) {
            router.replace(
              '/auth/login'
            )
            return
          }

          /*
          |--------------------------------------------------------------------------
          | 4. LOAD SCHOOL
          |--------------------------------------------------------------------------
          */

          let school = null
          let schoolError: any =
            null

          if (
            profile.role === 'school'
          ) {
            const res =
              await supabase
                .from('schools')
                .select('*')
                .eq(
                  'owner_id',
                  userId
                )
                .maybeSingle()

            school = res.data
            schoolError =
              res.error
          }

          if (
            !school &&
            profile.school_id
          ) {
            const res =
              await supabase
                .from('schools')
                .select('*')
                .eq(
                  'id',
                  profile.school_id
                )
                .maybeSingle()

            school = res.data
            schoolError =
              res.error
          }

          if (!mounted) return

          if (schoolError) {
            throw new Error(
              schoolError.message ||
                'Could not load school information.'
            )
          }

          /*
          |--------------------------------------------------------------------------
          | 5. HANDLE USERS WITHOUT A SCHOOL
          |--------------------------------------------------------------------------
          */

          if (!school) {
            if (
              profile.role ===
              'school'
            ) {
              router.replace(
                '/auth/school-setup'
              )
            } else if (
              profile.role ===
              'teacher'
            ) {
              router.replace(
                '/teacher'
              )
            } else {
              router.replace(
                '/feed'
              )
            }

            return
          }

          /*
          |--------------------------------------------------------------------------
          | 6. BUILD CURRENT SCHOOL DATA
          |--------------------------------------------------------------------------
          */

          const nextData = {
            school,
            profile,
            isAdmin:
              profile.role ===
              'school',
            userId,
          }

          /*
          |--------------------------------------------------------------------------
          | 7. REPLACE ANY CACHED VIEW WITH VERIFIED DATA
          |--------------------------------------------------------------------------
          */

          setCachedSchool(
            school
          )

          setData(nextData)

          writeCachedSchoolPage(
            userId,
            nextData
          )
        } catch (
          error: any
        ) {
          console.error(
            '[school-page] load failed:',
            error
          )

          if (mounted) {
            setErrorMessage(
              error?.message ||
                'The school page could not load.'
            )
          }
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }

    loadSchool()

    return () => {
      mounted = false
    }
  }, [router])

  /*
  |--------------------------------------------------------------------------
  | DISPLAY SCHOOL
  |--------------------------------------------------------------------------
  */

  if (data) {
    return (
      <SchoolProfilePage
        {...data}
        bootLoading={loading}
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <SchoolRouteLogoLoader
        cachedSchool={
          cachedSchool
        }
      />
    )
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (errorMessage) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'center',
          background: T.bg,
          padding: 24,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 390,
            padding: 18,
            borderRadius: 22,
            background: T.white,
            border: `1px solid ${T.border}`,
            boxShadow:
              '0 12px 32px rgba(0,0,0,0.045)',
          }}
        >
          <p
            style={{
              fontSize: 15,
              fontWeight: 650,
              color: T.ink,
              margin:
                '0 0 5px',
              letterSpacing:
                '-0.025em',
            }}
          >
            School page could
            not load
          </p>

          <p
            style={{
              fontSize: 13.2,
              color: T.ink3,
              lineHeight: 1.45,
              margin:
                '0 0 14px',
            }}
          >
            {errorMessage}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              style={{
                height: 40,
                borderRadius: 999,
                border: `1px solid ${T.border}`,
                background:
                  T.white,
                color: T.ink2,
                fontSize: 13,
                fontWeight: 560,
                cursor:
                  'pointer',
                fontFamily:
                  'inherit',
              }}
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() =>
                router.replace(
                  '/school'
                )
              }
              style={{
                height: 40,
                borderRadius: 999,
                border: 'none',
                background:
                  T.ink,
                color: T.white,
                fontSize: 13,
                fontWeight: 560,
                cursor:
                  'pointer',
                fontFamily:
                  'inherit',
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