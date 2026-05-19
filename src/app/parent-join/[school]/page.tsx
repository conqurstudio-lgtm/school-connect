'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, Phone, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink: '#1A1A1A',
  ink3: '#9A9A9A',
  bg: '#FCFCFF',
  white: '#FFFFFF',
  border: 'rgba(0,0,0,0.08)',
}

export default function ParentJoinPage() {
  const params = useParams<{ school: string }>()
  const router = useRouter()

  const rawSchool = params?.school
  const school = Array.isArray(rawSchool) ? rawSchool[0] : rawSchool

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const name = fullName.trim()
    const phoneValue = phone.trim()

    if (!name) {
      toast.error('Enter your full name')
      return
    }

    if (!phoneValue) {
      toast.error('Enter your phone number')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/parent-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_key: school, full_name: name, phone: phoneValue }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not join school')

      toast.success('Welcome')
      router.replace('/feed')
    } catch (e: any) {
      toast.error(e.message || 'Could not continue')
    }
    setSaving(false)
  }

  return (
    <main style={{
      minHeight: '100dvh',
      background: T.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 22,
      fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 420,
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: 28,
        boxShadow: '0 20px 60px rgba(0,0,0,0.07)',
        padding: 24,
      }}>
        <div style={{
          width: 58,
          height: 58,
          borderRadius: 18,
          background: '#F0F0F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
        }}>
          <UserRound size={27} color={T.ink} strokeWidth={1.5} />
        </div>

        <h1 style={{
          fontSize: 25,
          lineHeight: 1.08,
          fontWeight: 850,
          letterSpacing: '-0.045em',
          color: T.ink,
          margin: '0 0 8px',
        }}>
          Join your school feed
        </h1>

        <p style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: T.ink3,
          margin: '0 0 22px',
        }}>
          Enter your name and phone number. No password is needed for parent access.
        </p>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={labelStyle}>Full name</span>
          <input
            autoFocus
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={labelStyle}>Phone number</span>
          <div style={{ position: 'relative' }}>
            <Phone size={16} color={T.ink3} strokeWidth={1.7}
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+27..."
              inputMode="tel"
              style={{ ...inputStyle, paddingLeft: 38 }}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
            />
          </div>
        </label>

        <button
          onClick={submit}
          disabled={saving}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 16,
            border: 'none',
            background: saving ? '#D4D4D8' : T.ink,
            color: T.white,
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: saving ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {saving ? 'Opening…' : 'Continue to feed'}
          {!saving && <ArrowRight size={16} strokeWidth={2.2} />}
        </button>
      </section>
    </main>
  )
}

const labelStyle: any = {
  display: 'block',
  fontSize: 11,
  fontWeight: 850,
  color: T.ink3,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const inputStyle: any = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px 14px',
  borderRadius: 15,
  border: `1px solid ${T.border}`,
  background: '#FAFAFC',
  color: T.ink,
  fontSize: 16,
  outline: 'none',
  fontFamily: 'inherit',
}
