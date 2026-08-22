'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation'

import {
  Building2,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'

const T = {
  ink: '#21222D',
  ink2: '#545866',
  ink3: '#989AA3',
  white: '#FFFFFF',
  soft: '#F7F7F8',
  border: 'rgba(33,34,45,0.08)',
  accent: '#f87645',
  accentSoft: '#FFF3EE',
  success: '#258A55',
  successSoft: '#EEF9F2',
  danger: '#C94A4A',
  dangerSoft: '#FFF2F2',
}

type InviteData = {
  ok: boolean

  invite: {
    id: string

    status:
      | 'pending'
      | 'accepted'
      | 'revoked'
      | 'expired'

    expires_at?: string | null
    accepted_at?: string | null

    principal_name?: string | null
    principal_email?: string | null

    school: {
      id?: string | null
      name?: string | null
      phone?: string | null
      email?: string | null
      province?: string | null
      address?: string | null
    }
  }

  group: {
    id: string
    name: string
    primary_school_id: string
  }
}

export default function PrincipalInvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const existingMode =
    searchParams.get(
      'existing'
    ) === '1'

  const token =
    String(
      params?.token || ''
    ).trim()

  const [data, setData] =
    useState<InviteData | null>(
      null
    )

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [fullName, setFullName] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('')

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadInvite() {
      try {
        setLoading(true)
        setError('')

        if (!token) {
          throw new Error(
            'Invitation token is missing.'
          )
        }

        const response =
          await fetch(
            `/api/school/group/invites/${encodeURIComponent(
              token
            )}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          )

        const result =
          await response.json()

        if (!mounted) {
          return
        }

        if (!response.ok) {
          throw new Error(
            result?.error ||
              'Could not load this invitation.'
          )
        }

        setData(result)

        setFullName(
          result?.invite
            ?.principal_name || ''
        )
      } catch (err: any) {
        if (!mounted) {
          return
        }

        setError(
          err?.message ||
            'Could not load this invitation.'
        )
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadInvite()

    return () => {
      mounted = false
    }
  }, [token])

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    if (submitting) {
      return
    }

    setError('')

    if (!fullName.trim()) {
      setError(
        'Please enter your full name.'
      )
      return
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      )
      return
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        'The passwords do not match.'
      )
      return
    }

    try {
      setSubmitting(true)

      const response =
        await fetch(
          `/api/school/group/invites/${encodeURIComponent(
            token
          )}/accept`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              full_name:
                fullName.trim(),

              password,
            }),
          }
        )

      const result =
        await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Could not complete account setup.'
        )
      }

      const loginUrl =
        result?.login_url ||
        '/auth/login'

      router.replace(
        loginUrl
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not complete account setup.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleExistingAccount() {
    if (submitting) {
      return
    }

    setError('')

    if (!existingMode) {
      const returnPath =
        `/school/group/invite/${encodeURIComponent(
          token
        )}?existing=1`

      router.push(
        `/auth/login?redirectTo=${encodeURIComponent(
          returnPath
        )}`
      )

      return
    }

    if (!fullName.trim()) {
      setError(
        'Please enter your full name.'
      )
      return
    }

    try {
      setSubmitting(true)

      const response =
        await fetch(
          `/api/school/group/invites/${encodeURIComponent(
            token
          )}/accept`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              mode:
                'existing',

              full_name:
                fullName.trim(),
            }),
          }
        )

      const result =
        await response.json()

      if (!response.ok) {
        if (
          response.status ===
          401
        ) {
          const returnPath =
            `/school/group/invite/${encodeURIComponent(
              token
            )}?existing=1`

          router.push(
            `/auth/login?redirectTo=${encodeURIComponent(
              returnPath
            )}`
          )

          return
        }

        throw new Error(
          result?.error ||
            'Could not link this invitation to your account.'
        )
      }

      router.replace(
        result?.login_url ||
          '/school'
      )
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not link this invitation to your account.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div
          style={{
            minHeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border:
                '2px solid rgba(33,34,45,0.08)',
              borderTopColor:
                T.accent,
              animation:
                'spin 0.8s linear infinite',
            }}
          />
        </div>

        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(
                360deg
              );
            }
          }
        `}</style>
      </PageShell>
    )
  }

  if (
    error &&
    !data
  ) {
    return (
      <PageShell>
        <StatusCard
          icon={
            <XCircle
              size={30}
            />
          }
          iconBackground={
            T.dangerSoft
          }
          iconColor={
            T.danger
          }
          title="Invitation unavailable"
          description={
            error ||
            'This invitation could not be loaded.'
          }
        />
      </PageShell>
    )
  }

  if (!data) {
    return null
  }

  if (
    data.invite.status ===
    'expired'
  ) {
    return (
      <PageShell>
        <StatusCard
          icon={
            <Clock3
              size={30}
            />
          }
          iconBackground={
            T.dangerSoft
          }
          iconColor={
            T.danger
          }
          title="Invitation expired"
          description="This principal invitation has expired. Please ask the School Group administrator to send you a new invitation."
        />
      </PageShell>
    )
  }

  if (
    data.invite.status ===
    'revoked'
  ) {
    return (
      <PageShell>
        <StatusCard
          icon={
            <XCircle
              size={30}
            />
          }
          iconBackground={
            T.dangerSoft
          }
          iconColor={
            T.danger
          }
          title="Invitation cancelled"
          description="This invitation is no longer active. Please contact the School Group administrator."
        />
      </PageShell>
    )
  }

  if (
    data.invite.status ===
    'accepted'
  ) {
    return (
      <PageShell>
        <StatusCard
          icon={
            <CheckCircle2
              size={30}
            />
          }
          iconBackground={
            T.successSoft
          }
          iconColor={
            T.success
          }
          title="Invitation already accepted"
          description="This school has already been set up. You can sign in using the principal account."
        />
      </PageShell>
    )
  }

  const school =
    data.invite.school

  return (
    <PageShell>
      <div
        style={{
          paddingTop: 26,
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 20,
            background:
              T.accentSoft,
            color: T.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
          }}
        >
          <ShieldCheck
            size={27}
          />
        </div>

        <p
          style={{
            margin:
              '22px 0 0',
            color: T.ink3,
            fontSize: 12,
            fontWeight: 600,
            textTransform:
              'uppercase',
            letterSpacing:
              '0.07em',
          }}
        >
          School Connect invitation
        </p>

        <h1
          style={{
            margin: '7px 0 0',
            color: T.ink,
            fontSize: 29,
            lineHeight: 1.18,
            fontWeight: 650,
            letterSpacing:
              '-0.04em',
          }}
        >
          You&apos;ve been
          invited to manage{' '}
          {school?.name ||
            'a school'}
        </h1>

        <p
          style={{
            margin:
              '11px 0 0',
            color: T.ink2,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          {data.invite
            .principal_name
            ? `${data.invite.principal_name}, `
            : ''}
          you have been invited
          to become the
          administrator of this
          school under{' '}
          <strong>
            {data.group.name}
          </strong>
          .
        </p>

        <div
          style={{
            marginTop: 30,
            borderRadius: 26,
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 18,
              background: T.soft,
              display: 'flex',
              alignItems:
                'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 16,
                background:
                  T.white,
                display: 'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color:
                  T.accent,
              }}
            >
              <Building2
                size={22}
              />
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: T.ink3,
                  fontWeight: 600,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.06em',
                }}
              >
                Your school
              </p>

              <h2
                style={{
                  margin:
                    '4px 0 0',
                  fontSize: 17,
                  color: T.ink,
                  fontWeight: 630,
                }}
              >
                {school?.name}
              </h2>
            </div>
          </div>

          <div
            style={{
              padding: 18,
              display: 'grid',
              gap: 15,
            }}
          >
            {data.invite
              .principal_name && (
              <Detail
                icon={
                  <UserRound
                    size={15}
                  />
                }
                label="Principal"
                value={
                  data.invite
                    .principal_name
                }
              />
            )}

            {data.invite
              .principal_email && (
              <Detail
                icon={
                  <Mail
                    size={15}
                  />
                }
                label="Principal email"
                value={
                  data.invite
                    .principal_email
                }
              />
            )}

            {school?.phone && (
              <Detail
                icon={
                  <Phone
                    size={15}
                  />
                }
                label="School phone"
                value={
                  school.phone
                }
              />
            )}

            {school?.email && (
              <Detail
                icon={
                  <Mail
                    size={15}
                  />
                }
                label="School email"
                value={
                  school.email
                }
              />
            )}

            {(school?.address ||
              school?.province) && (
              <Detail
                icon={
                  <MapPin
                    size={15}
                  />
                }
                label="Location"
                value={[
                  school.address,
                  school.province,
                ]
                  .filter(
                    Boolean
                  )
                  .join(', ')}
              />
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              color: T.ink,
              fontSize: 17,
              fontWeight: 630,
            }}
          >
            Create your admin account
          </p>

          <p
            style={{
              margin:
                '6px 0 0',
              color: T.ink3,
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            Use the invited email
            address and choose your
            password.
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          style={{
            marginTop: 18,
            display: 'grid',
            gap: 14,
          }}
        >
          <Field
            label="Full name"
            value={fullName}
            required
            placeholder="Your full name"
            onChange={
              setFullName
            }
          />

          <Field
            label="Email"
            value={
              data.invite
                .principal_email ||
              ''
            }
            placeholder=""
            type="email"
            disabled
            onChange={() => {}}
          />

          <Field
            label="Password"
            value={password}
            required
            placeholder="At least 8 characters"
            type="password"
            onChange={
              setPassword
            }
          />

          <Field
            label="Confirm password"
            value={
              confirmPassword
            }
            required
            placeholder="Enter password again"
            type="password"
            onChange={
              setConfirmPassword
            }
          />

          {error && (
            <div
              style={{
                padding:
                  '12px 14px',
                borderRadius: 16,
                background:
                  T.dangerSoft,
                color:
                  T.danger,
                fontSize: 12.5,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting
            }
            style={{
              width: '100%',
              height: 51,
              marginTop: 4,
              borderRadius: 999,
              border: 'none',

              background:
                submitting
                  ? '#F7AD91'
                  : T.accent,

              color: T.white,

              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 8,

              fontFamily:
                'inherit',
              fontSize: 14,
              fontWeight: 620,

              cursor:
                submitting
                  ? 'wait'
                  : 'pointer',
            }}
          >
            {submitting ? (
              <>
                <Loader2
                  size={17}
                  style={{
                    animation:
                      'spin 0.8s linear infinite',
                  }}
                />

                Creating account...
              </>
            ) : (
              <>
                <ShieldCheck
                  size={17}
                />

                Create admin account
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            paddingTop: 18,
            borderTop:
              `1px solid ${T.border}`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              color: T.ink2,
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            {existingMode
              ? 'Already signed in? Continue with the School Connect account that matches the invited email.'
              : 'Already have a School Connect account? Sign in instead of creating another account.'}
          </p>

          <button
            type="button"
            disabled={
              submitting
            }
            onClick={
              handleExistingAccount
            }
            style={{
              width: '100%',
              minHeight: 48,
              marginTop: 12,
              borderRadius: 999,
              border:
                `1px solid ${T.border}`,
              background:
                T.white,
              color:
                T.accent,
              fontFamily:
                'inherit',
              fontSize: 13.5,
              fontWeight: 620,
              cursor:
                submitting
                  ? 'wait'
                  : 'pointer',
            }}
          >
            {existingMode
              ? submitting
                ? 'Linking account…'
                : 'Continue with signed-in account'
              : 'I already have an account'}
          </button>

          {existingMode && (
            <button
              type="button"
              onClick={() => {
                router.replace(
                  `/school/group/invite/${encodeURIComponent(
                    token
                  )}`
                )
              }}
              style={{
                marginTop: 10,
                border: 'none',
                background:
                  'transparent',
                color:
                  T.ink3,
                fontFamily:
                  'inherit',
                fontSize: 12,
                cursor:
                  'pointer',
              }}
            >
              Create a new account instead
            </button>
          )}
        </div>

        <div
          style={{
            marginTop: 22,
            padding: 17,
            borderRadius: 20,
            background:
              T.accentSoft,
          }}
        >
          <p
            style={{
              margin: 0,
              color: T.ink,
              fontSize: 13,
              fontWeight: 620,
            }}
          >
            Your school stays independent
          </p>

          <p
            style={{
              margin:
                '6px 0 0',
              color: T.ink2,
              fontSize: 12.5,
              lineHeight: 1.55,
            }}
          >
            After setup you will
            manage this school
            normally, including
            teachers, learners,
            reports, Moments and
            parents. You will not
            have access to add or
            manage other schools in
            the group.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(
              360deg
            );
          }
        }
      `}</style>
    </PageShell>
  )
}

function PageShell({
  children,
}: {
  children:
    React.ReactNode
}) {
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
          maxWidth: 590,
          margin: '0 auto',
          padding:
            'max(24px, env(safe-area-inset-top)) 18px max(38px, env(safe-area-inset-bottom))',
          boxSizing:
            'border-box',
        }}
      >
        {children}
      </div>
    </main>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  required = false,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (
    value: string
  ) => void
  required?: boolean
  type?: string
  disabled?: boolean
}) {
  return (
    <label
      style={{
        display: 'grid',
        gap: 7,
      }}
    >
      <span
        style={{
          fontSize: 12.5,
          color: T.ink2,
          fontWeight: 600,
        }}
      >
        {label}

        {required && (
          <span
            style={{
              color:
                T.accent,
              marginLeft: 3,
            }}
          >
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        style={{
          width: '100%',
          height: 48,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          background:
            disabled
              ? '#F2F2F3'
              : T.soft,
          color:
            disabled
              ? T.ink3
              : T.ink,
          padding:
            '0 14px',
          boxSizing:
            'border-box',
          outline: 'none',
          fontFamily:
            'inherit',
          fontSize: 14,
          cursor:
            disabled
              ? 'not-allowed'
              : 'text',
        }}
      />
    </label>
  )
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 11,
        alignItems:
          'flex-start',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 10,
          background:
            T.soft,
          color: T.ink3,
          display: 'flex',
          alignItems:
            'center',
          justifyContent:
            'center',
        }}
      >
        {icon}
      </div>

      <div>
        <p
          style={{
            margin: 0,
            fontSize: 10.5,
            color: T.ink3,
            fontWeight: 600,
            textTransform:
              'uppercase',
            letterSpacing:
              '0.05em',
          }}
        >
          {label}
        </p>

        <p
          style={{
            margin:
              '3px 0 0',
            fontSize: 13.5,
            color: T.ink,
            lineHeight: 1.45,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusCard({
  icon,
  iconBackground,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode
  iconBackground: string
  iconColor: string
  title: string
  description: string
}) {
  return (
    <div
      style={{
        minHeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          'center',
      }}
    >
      <div
        style={{
          width: '100%',
          textAlign:
            'center',
        }}
      >
        <div
          style={{
            width: 66,
            height: 66,
            margin:
              '0 auto',
            borderRadius: 22,
            background:
              iconBackground,
            color:
              iconColor,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
          }}
        >
          {icon}
        </div>

        <h1
          style={{
            margin:
              '20px 0 0',
            color: T.ink,
            fontSize: 25,
            fontWeight: 650,
            letterSpacing:
              '-0.035em',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            maxWidth: 420,
            margin:
              '9px auto 0',
            color: T.ink2,
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}