'use client'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  UserRound,
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

type FormData = {
  school_name: string
  school_phone: string
  school_email: string
  school_province: string
  school_address: string
  principal_name: string
  principal_email: string
}

const initialForm: FormData = {
  school_name: '',
  school_phone: '',
  school_email: '',
  school_province: '',
  school_address: '',
  principal_name: '',
  principal_email: '',
}

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
]

export default function AddGroupSchoolPage() {
  const router = useRouter()

  const [form, setForm] =
    useState<FormData>(initialForm)

  const [checkingAccess, setCheckingAccess] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState(false)

  const [inviteUrl, setInviteUrl] =
    useState('')

  const [copied, setCopied] =
    useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAccess() {
      try {
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

        if (response.status === 401) {
          router.replace(
            '/auth/login'
          )
          return
        }

        if (
          !response.ok ||
          !result?.is_group_owner
        ) {
          router.replace(
            '/school'
          )
          return
        }

        setCheckingAccess(false)
      } catch {
        if (!mounted) return

        router.replace(
          '/school'
        )
      }
    }

    checkAccess()

    return () => {
      mounted = false
    }
  }, [router])

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    if (error) {
      setError('')
    }
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    if (submitting) return

    setError('')
    setCopied(false)

    if (!form.school_name.trim()) {
      setError(
        'Please enter the school name.'
      )
      return
    }

    if (!form.principal_name.trim()) {
      setError(
        'Please enter the principal name.'
      )
      return
    }

    if (!form.principal_email.trim()) {
      setError(
        'Please enter the principal email address.'
      )
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch(
        '/api/school/group/invites',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            school_name:
              form.school_name.trim(),

            school_phone:
              form.school_phone.trim(),

            school_email:
              form.school_email.trim(),

            school_province:
              form.school_province.trim(),

            school_address:
              form.school_address.trim(),

            principal_name:
              form.principal_name.trim(),

            principal_email:
              form.principal_email
                .trim()
                .toLowerCase(),
          }),
        }
      )

      const result =
        await response.json()

      if (response.status === 401) {
        router.replace(
          '/auth/login'
        )
        return
      }

      if (response.status === 403) {
        router.replace(
          '/school'
        )
        return
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Could not create the school invitation.'
        )
      }

      setInviteUrl(
        result?.invite_url || ''
      )

      setSuccess(true)
    } catch (err: any) {
      setError(
        err?.message ||
          'Could not create the school invitation.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyInviteLink() {
    if (!inviteUrl) return

    try {
      await navigator.clipboard.writeText(
        inviteUrl
      )

      setCopied(true)

      window.setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError(
        'Could not copy the invitation link.'
      )
    }
  }

  if (checkingAccess) {
    return (
      <main
        style={{
          minHeight: '100dvh',
          background: T.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <Loader2
          size={28}
          style={{
            color: T.accent,
            animation:
              'spin 0.8s linear infinite',
          }}
        />

        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    )
  }

  if (success) {
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
            maxWidth: 620,
            margin: '0 auto',
            padding:
              'max(26px, env(safe-area-inset-top)) 18px max(36px, env(safe-area-inset-bottom))',
            boxSizing: 'border-box',
          }}
        >
          <button
            type="button"
            onClick={() =>
              router.push(
                '/school/group'
              )
            }
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>

          <div
            style={{
              marginTop: 48,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                borderRadius: 22,
                margin: '0 auto',
                background:
                  T.successSoft,
                color: T.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
              }}
            >
              <Check size={30} />
            </div>

            <h1
              style={{
                margin:
                  '20px 0 0',
                fontSize: 27,
                lineHeight: 1.2,
                letterSpacing:
                  '-0.035em',
                fontWeight: 650,
              }}
            >
              School added
            </h1>

            <p
              style={{
                margin:
                  '9px auto 0',
                maxWidth: 430,
                color: T.ink2,
                fontSize: 14,
                lineHeight: 1.55,
              }}
            >
              The school is waiting
              for its principal to
              accept the invitation
              and create their School
              Connect account.
            </p>
          </div>

          <div
            style={{
              marginTop: 32,
              padding: 18,
              borderRadius: 24,
              background: T.soft,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: T.ink3,
                fontWeight: 600,
                textTransform:
                  'uppercase',
                letterSpacing:
                  '0.06em',
              }}
            >
              Principal invitation
            </p>

            <p
              style={{
                margin:
                  '9px 0 0',
                fontSize: 13,
                lineHeight: 1.5,
                color: T.ink2,
                wordBreak:
                  'break-all',
              }}
            >
              {inviteUrl}
            </p>

            <button
              type="button"
              onClick={copyInviteLink}
              style={{
                width: '100%',
                height: 46,
                marginTop: 16,
                borderRadius: 999,
                border: 'none',
                background: T.white,
                color: T.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                gap: 8,
                fontFamily:
                  'inherit',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {copied ? (
                <>
                  <Check
                    size={16}
                    color={
                      T.success
                    }
                  />
                  Link copied
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy invitation link
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/school/group'
              )
            }
            style={{
              width: '100%',
              height: 50,
              marginTop: 18,
              borderRadius: 999,
              border: 'none',
              background: T.ink,
              color: T.white,
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Our Schools
          </button>
        </div>
      </main>
    )
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
          maxWidth: 620,
          margin: '0 auto',
          padding:
            'max(22px, env(safe-area-inset-top)) 18px max(36px, env(safe-area-inset-bottom))',
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              '/school/group'
            )
          }
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: `1px solid ${T.border}`,
            background: T.white,
            color: T.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
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
              letterSpacing:
                '0.07em',
            }}
          >
            School Group
          </p>

          <h1
            style={{
              margin: '7px 0 0',
              fontSize: 27,
              lineHeight: 1.2,
              fontWeight: 650,
              letterSpacing:
                '-0.035em',
            }}
          >
            Add another school
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: T.ink2,
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            Add the school details
            and the principal who will
            manage this school.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 30,
          }}
        >
          <SectionTitle
            icon={
              <Building2 size={17} />
            }
            title="School details"
          />

          <div
            style={{
              display: 'grid',
              gap: 14,
              marginTop: 14,
            }}
          >
            <Field
              label="School name"
              required
              value={
                form.school_name
              }
              placeholder="e.g. Group Test School Sandton"
              onChange={(value) =>
                updateField(
                  'school_name',
                  value
                )
              }
            />

            <Field
              label="School phone"
              icon={
                <Phone size={15} />
              }
              value={
                form.school_phone
              }
              placeholder="e.g. 011 123 4567"
              type="tel"
              onChange={(value) =>
                updateField(
                  'school_phone',
                  value
                )
              }
            />

            <Field
              label="School email"
              icon={
                <Mail size={15} />
              }
              value={
                form.school_email
              }
              placeholder="school@example.com"
              type="email"
              onChange={(value) =>
                updateField(
                  'school_email',
                  value
                )
              }
            />

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
                Province
              </span>

              <select
                value={
                  form.school_province
                }
                onChange={(event) =>
                  updateField(
                    'school_province',
                    event.target.value
                  )
                }
                style={{
                  width: '100%',
                  height: 48,
                  borderRadius: 16,
                  border: `1px solid ${T.border}`,
                  background: T.soft,
                  color:
                    form.school_province
                      ? T.ink
                      : T.ink3,
                  padding: '0 14px',
                  fontFamily:
                    'inherit',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing:
                    'border-box',
                }}
              >
                <option value="">
                  Select province
                </option>

                {provinces.map(
                  (province) => (
                    <option
                      key={province}
                      value={province}
                    >
                      {province}
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="School address"
              icon={
                <MapPin size={15} />
              }
              value={
                form.school_address
              }
              placeholder="Street address"
              onChange={(value) =>
                updateField(
                  'school_address',
                  value
                )
              }
            />
          </div>

          <div
            style={{
              height: 1,
              background: T.border,
              margin: '28px 0',
            }}
          />

          <SectionTitle
            icon={
              <UserRound size={17} />
            }
            title="Principal details"
          />

          <p
            style={{
              margin: '7px 0 0',
              color: T.ink3,
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            This person will receive
            the setup link and become
            the administrator of this
            school.
          </p>

          <div
            style={{
              display: 'grid',
              gap: 14,
              marginTop: 14,
            }}
          >
            <Field
              label="Principal name"
              required
              value={
                form.principal_name
              }
              placeholder="Full name"
              onChange={(value) =>
                updateField(
                  'principal_name',
                  value
                )
              }
            />

            <Field
              label="Principal email"
              required
              icon={
                <Mail size={15} />
              }
              value={
                form.principal_email
              }
              placeholder="principal@example.com"
              type="email"
              onChange={(value) =>
                updateField(
                  'principal_email',
                  value
                )
              }
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: 18,
                padding:
                  '12px 14px',
                borderRadius: 16,
                background:
                  T.dangerSoft,
                color: T.danger,
                fontSize: 12.5,
                lineHeight: 1.45,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 999,
              border: 'none',
              marginTop: 24,
              background:
                submitting
                  ? '#F7AD91'
                  : T.accent,
              color: T.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'center',
              gap: 8,
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: 14,
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
                Creating invitation...
              </>
            ) : (
              <>
                <Send size={16} />
                Create principal invitation
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background: T.accentSoft,
          color: T.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </span>

      <h2
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 620,
          letterSpacing:
            '-0.015em',
        }}
      >
        {title}
      </h2>
    </div>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  required = false,
  type = 'text',
  icon,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  icon?: React.ReactNode
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
              color: T.accent,
              marginLeft: 3,
            }}
          >
            *
          </span>
        )}
      </span>

      <div
        style={{
          height: 48,
          borderRadius: 16,
          border: `1px solid ${T.border}`,
          background: T.soft,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 14px',
          boxSizing: 'border-box',
        }}
      >
        {icon && (
          <span
            style={{
              color: T.ink3,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background:
              'transparent',
            color: T.ink,
            fontFamily: 'inherit',
            fontSize: 14,
            minWidth: 0,
          }}
        />
      </div>
    </label>
  )
}