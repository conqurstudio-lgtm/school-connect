'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Crown,
  MapPin,
  Plus,
} from 'lucide-react'

type GroupSchool = {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  phone?: string | null
  email?: string | null
  province?: string | null
  address?: string | null
  member_type: 'primary' | 'branch'
}

type GroupData = {
  ok: boolean
  is_group_owner: boolean
  group: {
    id: string
    name: string
    primary_school_id: string
  } | null
  schools: GroupSchool[]
}

const T = {
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#989AA3',
  white: '#FFFFFF',
  soft: '#F7F7F8',
  border: 'rgba(33,34,45,0.08)',
  accent: '#f87645',
  accentSoft: '#FFF3EE',
}

function initials(name: string) {
  return String(name || 'SC')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SchoolGroupPage() {
  const router = useRouter()

  const [data, setData] =
    useState<GroupData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let mounted = true

    async function loadGroup() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          '/api/school/group',
          {
            method: 'GET',
            cache: 'no-store',
          }
        )

        const result =
          await response.json()

        if (!mounted) return

        if (
          response.status === 401
        ) {
          router.replace(
            '/auth/login'
          )
          return
        }

        if (!response.ok) {
          throw new Error(
            result?.error ||
              'Could not load your schools.'
          )
        }

        if (
          !result.is_group_owner
        ) {
          router.replace(
            '/school'
          )
          return
        }

        setData(result)
      } catch (err: any) {
        if (!mounted) return

        setError(
          err?.message ||
            'Could not load your schools.'
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadGroup()

    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: T.white,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border:
              '2px solid rgba(33,34,45,0.08)',
            borderTopColor:
              T.accent,
            animation:
              'spin 0.7s linear infinite',
          }}
        />
      </main>
    )
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: T.white,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 390,
            padding: 20,
            borderRadius: 24,
            background: T.soft,
          }}
        >
          <p
            style={{
              margin: 0,
              color: T.ink,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Could not load your schools
          </p>

          <p
            style={{
              margin: '6px 0 16px',
              color: T.ink2,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            style={{
              width: '100%',
              height: 44,
              borderRadius: 999,
              border: 'none',
              background: T.ink,
              color: T.white,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (!data?.group) {
    return null
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: T.white,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: T.ink,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding:
            'max(22px, env(safe-area-inset-top)) 18px max(30px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push('/school')
          }
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: T.white,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: T.ink,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div
          style={{
            marginTop: 26,
          }}
        >
          <p
            style={{
              margin: 0,
              color: T.ink3,
              fontSize: 12,
              fontWeight: 600,
              textTransform:
                'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            School Group
          </p>

          <h1
            style={{
              margin: '7px 0 0',
              color: T.ink,
              fontSize: 27,
              lineHeight: 1.2,
              fontWeight: 650,
              letterSpacing:
                '-0.035em',
            }}
          >
            {data.group.name}
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: T.ink2,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            Manage all schools in
            your group from one place.
          </p>
        </div>

        <div
          style={{
            marginTop: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'space-between',
            gap: 14,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: T.ink,
                fontSize: 17,
                fontWeight: 620,
              }}
            >
              Our Schools
            </p>

            <p
              style={{
                margin: '3px 0 0',
                color: T.ink3,
                fontSize: 12.5,
              }}
            >
              {data.schools.length}{' '}
              {data.schools.length ===
              1
                ? 'school'
                : 'schools'}
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Branch creation comes next"
            style={{
              height: 42,
              borderRadius: 999,
              border: 'none',
              background: T.accent,
              color: T.white,
              padding: '0 16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent:
                'center',
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              opacity: 0.55,
              cursor: 'not-allowed',
            }}
          >
            <Plus size={16} />
            Add school
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            marginTop: 16,
          }}
        >
          {data.schools.map(
            (school) => (
              <div
                key={school.id}
                style={{
                  borderRadius: 24,
                  border: `1px solid ${T.border}`,
                  background: T.white,
                  padding: 16,
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    flexShrink: 0,
                    borderRadius: 18,
                    overflow:
                      'hidden',
                    background:
                      T.soft,
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    color: T.ink2,
                    fontSize: 15,
                    fontWeight: 650,
                  }}
                >
                  {school.logo_url ? (
                    <img
                      src={
                        school.logo_url
                      }
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit:
                          'cover',
                      }}
                    />
                  ) : (
                    initials(
                      school.name
                    )
                  )}
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      flexWrap: 'wrap',
                      gap: 7,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: T.ink,
                        fontSize: 14.5,
                        fontWeight: 620,
                      }}
                    >
                      {school.name}
                    </p>

                    {school.member_type ===
                    'primary' ? (
                      <span
                        style={{
                          minHeight: 24,
                          borderRadius:
                            999,
                          background:
                            T.accentSoft,
                          color:
                            T.accent,
                          display:
                            'inline-flex',
                          alignItems:
                            'center',
                          gap: 5,
                          padding:
                            '0 9px',
                          fontSize: 10.5,
                          fontWeight:
                            650,
                        }}
                      >
                        <Crown
                          size={11}
                        />
                        Main school
                      </span>
                    ) : (
                      <span
                        style={{
                          minHeight: 24,
                          borderRadius:
                            999,
                          background:
                            T.soft,
                          color:
                            T.ink2,
                          display:
                            'inline-flex',
                          alignItems:
                            'center',
                          gap: 5,
                          padding:
                            '0 9px',
                          fontSize: 10.5,
                          fontWeight:
                            650,
                        }}
                      >
                        <Building2
                          size={11}
                        />
                        Branch
                      </span>
                    )}
                  </div>

                  {(school.address ||
                    school.province) && (
                    <p
                      style={{
                        margin:
                          '6px 0 0',
                        color: T.ink3,
                        fontSize: 12,
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 5,
                      }}
                    >
                      <MapPin
                        size={12}
                      />
                      {[
                        school.address,
                        school.province,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(' · ')}
                    </p>
                  )}

                  {(school.email ||
                    school.phone) && (
                    <p
                      style={{
                        margin:
                          '5px 0 0',
                        color: T.ink3,
                        fontSize: 12,
                      }}
                    >
                      {school.email ||
                        school.phone}
                    </p>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  )
}