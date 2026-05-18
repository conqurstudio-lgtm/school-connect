// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, ArrowRight, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.07)',
  bg:     '#FCFCFF',
  white:  '#FFFFFF',
  blue:   '#78A6FE',
}

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface Props { slug: string }

type Step = 'loading' | 'auth' | 'children' | 'sibling' | 'request' | 'done'

export function JoinFlow({ slug }: Props) {
  const router = useRouter()
  const [school,     setSchool]     = useState<any>(null)
  const [step,       setStep]       = useState<Step>('loading')
  const [user,       setUser]       = useState<any>(null)
  const [picked,     setPicked]     = useState<any[]>([])     // children linked so far

  // Load school by slug, then check auth state
  useEffect(() => {
    fetch(`/api/onboarding/school?slug=${slug}`)
      .then(r => r.json())
      .then(j => {
        if (j.school) {
          setSchool(j.school)
          // Check auth
          supabase().auth.getUser().then(({ data }) => {
            if (data.user) {
              setUser(data.user)
              setStep('children')
            } else {
              setStep('auth')
            }
          })
        }
      })
  }, [slug])

  if (step === 'loading' || !school) {
    return <Loader />
  }

  return (
    <div style={{
      minHeight: '100dvh', height: '100dvh',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      background: T.bg, maxWidth: 520, margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingBottom: 40,
    }}>
      {/* Header — school logo + name */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 24px 28px',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: school.logo_url
            ? `url(${school.logo_url}) center/contain no-repeat`
            : '#F0F0F4',
          marginBottom: 12,
        }} />
        <h1 style={{
          fontSize: 18, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.02em', margin: 0,
        }}>
          {school.name}
        </h1>
        <p style={{ fontSize: 12, color: T.ink3, margin: '4px 0 0',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    fontWeight: 600 }}>
          Join your child's school
        </p>
      </div>

      {step === 'auth' && (
        <AuthStep
          schoolId={school.id}
          onSignedIn={(u) => { setUser(u); setStep('children') }} />
      )}
      {step === 'children' && (
        <ChildrenStep
          school={school}
          alreadyPicked={picked}
          onPicked={(child) => {
            setPicked(p => [...p, child])
            setStep('sibling')
          }}
          onCantFind={() => setStep('request')}
        />
      )}
      {step === 'sibling' && (
        <SiblingStep
          picked={picked}
          onAddMore={() => setStep('children')}
          onDone={() => {
            setStep('done')
            setTimeout(() => { window.location.href = '/feed' }, 1200)
          }}
        />
      )}
      {step === 'request' && (
        <RequestStep
          schoolId={school.id}
          onBack={() => setStep('children')}
          onSubmitted={() => setStep('done')}
        />
      )}
      {step === 'done' && <DoneStep />}
    </div>
  )
}

/* ─── Step 1: Sign up / sign in ─── */
function AuthStep({ schoolId, onSignedIn }: any) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pwd,   setPwd]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const submit = async () => {
    if (!email.trim() || !pwd.trim()) {
      toast.error('Enter email and password'); return
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error('Enter your name'); return
    }

    setBusy(true)
    try {
      const sb = supabase()
      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email: email.trim(),
          password: pwd,
          options: { data: { full_name: name.trim() } },
        })
        if (error) throw error
        if (data.user) {
          // Create the profile row immediately (legacy compatibility)
          await sb.from('profiles').upsert({
            id:        data.user.id,
            full_name: name.trim(),
            school_id: schoolId,
            role:      'parent',
          })
          onSignedIn(data.user)
        }
      } else {
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.trim(),
          password: pwd,
        })
        if (error) throw error
        if (data.user) {
          // Make sure profile points at this school
          await sb.from('profiles').upsert({
            id:        data.user.id,
            school_id: schoolId,
          })
          onSignedIn(data.user)
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed')
    }
    setBusy(false)
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: T.ink,
        letterSpacing: '-0.02em', margin: '0 0 6px',
      }}>
        {mode === 'signup' ? 'Welcome' : 'Welcome back'}
      </h2>
      <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 24px',
                  lineHeight: 1.5 }}>
        {mode === 'signup'
          ? 'Create your account to follow your child.'
          : 'Sign in to continue.'}
      </p>

      {mode === 'signup' && (
        <FieldGroup label="Your name">
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Sarah Khoza" style={inputStyle} />
        </FieldGroup>
      )}
      <FieldGroup label="Email">
        <input value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="you@example.com" style={inputStyle} />
      </FieldGroup>
      <FieldGroup label="Password">
        <input value={pwd} onChange={e => setPwd(e.target.value)}
          type="password" placeholder="••••••••" style={inputStyle} />
      </FieldGroup>

      <button onClick={submit} disabled={busy} style={primaryBtn}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Continue' : 'Sign in'}
        {!busy && <ArrowRight size={14} strokeWidth={2.2} />}
      </button>

      <button onClick={() => setMode(m => m === 'signup' ? 'signin' : 'signup')}
        style={textLink}>
        {mode === 'signup'
          ? 'Already have an account? Sign in'
          : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}

/* ─── Step 2: Pick a child from the roster ─── */
function ChildrenStep({ school, alreadyPicked, onPicked, onCantFind }: any) {
  const [children, setChildren] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [linking,  setLinking]  = useState<string | null>(null)

  const pickedIds = alreadyPicked.map((c: any) => c.id)

  useEffect(() => {
    fetch(`/api/onboarding/children?school_id=${school.id}`)
      .then(r => r.json())
      .then(j => setChildren(j.children ?? []))
      .finally(() => setLoading(false))
  }, [school.id])

  const link = async (child: any) => {
    setLinking(child.id)
    try {
      const res = await fetch('/api/onboarding/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: child.id }),
      })
      if (!res.ok) {
        const j = await res.json()
        throw new Error(j.error || 'failed')
      }
      onPicked(child)
    } catch (e: any) {
      toast.error(e.message || 'Could not link')
    }
    setLinking(null)
  }

  // Group by "Grade · Class"
  const groups: Record<string, any[]> = {}
  for (const c of children) {
    if (pickedIds.includes(c.id)) continue
    const key = `${c.grade}${c.class_name ? ` · ${c.class_name}` : ''}`
    groups[key] = groups[key] || []
    groups[key].push(c)
  }

  return (
    <div style={{ padding: '24px 0 40px' }}>
      <div style={{ padding: '0 24px 14px' }}>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.02em', margin: '0 0 6px',
        }}>
          {alreadyPicked.length > 0 ? 'Add another child' : "Who's your child?"}
        </h2>
        <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5 }}>
          Tap your child's name to follow their class.
        </p>
      </div>

      {loading ? (
        <Loader />
      ) : Object.keys(groups).length === 0 ? (
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            padding: 16, borderRadius: 14,
            border: `1px dashed ${T.border}`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <AlertCircle size={18} color={T.ink3} strokeWidth={1.6}
              style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, color: T.ink, fontWeight: 600,
                          margin: '0 0 4px' }}>
                No children listed yet
              </p>
              <p style={{ fontSize: 12, color: T.ink3, margin: 0,
                          lineHeight: 1.5 }}>
                Ask your teacher to add your child to the class roster.
              </p>
            </div>
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([groupName, kids]: any) => (
          <div key={groupName} style={{ marginBottom: 18 }}>
            <p style={{
              padding: '0 24px 8px',
              fontSize: 11, fontWeight: 600, color: T.ink3,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              margin: 0,
            }}>
              {groupName}
            </p>
            <div style={{ padding: '0 16px', display: 'flex',
                          flexDirection: 'column', gap: 6 }}>
              {kids.map((c: any) => (
                <button key={c.id} onClick={() => link(c)} disabled={linking === c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12,
                    background: T.white, border: `1px solid ${T.border}`,
                    cursor: linking === c.id ? 'wait' : 'pointer',
                    fontFamily: 'inherit', textAlign: 'left',
                    opacity: linking === c.id ? 0.5 : 1,
                  }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: '#F0F0F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: 13, color: T.ink2, fontWeight: 600,
                  }}>
                    {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 500,
                                 color: T.ink, letterSpacing: '-0.005em' }}>
                    {c.name}
                  </span>
                  {linking === c.id && (
                    <div style={{ width: 14, height: 14, borderRadius: '50%',
                                  border: `2px solid ${T.border}`, borderTopColor: T.ink,
                                  animation: 'spin 0.7s linear infinite' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{ padding: '20px 24px 0' }}>
        <button onClick={onCantFind} style={textLink}>
          Can't find your child? Ask the school to add them →
        </button>
      </div>
    </div>
  )
}

/* ─── Step 3: After picking, prompt for siblings ─── */
function SiblingStep({ picked, onAddMore, onDone }: any) {
  const latest = picked[picked.length - 1]

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', marginBottom: 32,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: T.ink, color: T.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Check size={24} strokeWidth={2.4} />
        </div>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: T.ink,
          letterSpacing: '-0.02em', margin: '0 0 6px',
        }}>
          {latest.name} is linked
        </h2>
        <p style={{ fontSize: 13, color: T.ink3, margin: 0,
                    lineHeight: 1.5, maxWidth: 280 }}>
          You'll see their class updates on your feed.
        </p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: T.ink3,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '0 0 8px',
        }}>
          Linked children
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {picked.map((c: any) => (
            <div key={c.id} style={{
              padding: '10px 14px', borderRadius: 12,
              background: '#F4F4F8',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: T.ink2, fontWeight: 600,
              }}>
                {c.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>
                {c.name}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: T.ink3 }}>
                {c.grade}{c.class_name ? ` · ${c.class_name}` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onAddMore} style={{ ...secondaryBtn, marginBottom: 8 }}>
        Add another child
      </button>
      <button onClick={onDone} style={primaryBtn}>
        I'm done <ArrowRight size={14} strokeWidth={2.2} />
      </button>
    </div>
  )
}

/* ─── Step 4: Can't find child → submit request ─── */
function RequestStep({ schoolId, onBack, onSubmitted }: any) {
  const [name,  setName]  = useState('')
  const [grade, setGrade] = useState('')
  const [busy,  setBusy]  = useState(false)

  const submit = async () => {
    if (!name.trim()) { toast.error("Enter your child's name"); return }
    setBusy(true)
    try {
      const res = await fetch('/api/onboarding/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          requested_name: name.trim(),
          requested_grade: grade.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      onSubmitted()
    } catch {
      toast.error('Could not submit. Try again.')
    }
    setBusy(false)
  }

  return (
    <div style={{ padding: '24px 24px 40px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: T.ink3, padding: 0, marginBottom: 16,
        fontFamily: 'inherit',
      }}>← Back to list</button>

      <h2 style={{
        fontSize: 20, fontWeight: 700, color: T.ink,
        letterSpacing: '-0.02em', margin: '0 0 6px',
      }}>
        Request your child be added
      </h2>
      <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 24px',
                  lineHeight: 1.5 }}>
        Tell us their name and grade. The school will review and add them.
      </p>

      <FieldGroup label="Child's full name">
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Emma Johnson" style={inputStyle} />
      </FieldGroup>
      <FieldGroup label="Grade (optional)">
        <input value={grade} onChange={e => setGrade(e.target.value)}
          placeholder="Grade 4" style={inputStyle} />
      </FieldGroup>

      <button onClick={submit} disabled={busy} style={primaryBtn}>
        {busy ? 'Submitting…' : 'Send request'}
        {!busy && <ArrowRight size={14} strokeWidth={2.2} />}
      </button>
    </div>
  )
}

function DoneStep() {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: T.ink, color: T.white,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Check size={24} strokeWidth={2.4} />
      </div>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: T.ink,
        letterSpacing: '-0.02em', margin: '0 0 6px',
      }}>
        We've told your school
      </h2>
      <p style={{ fontSize: 13, color: T.ink3, margin: 0, lineHeight: 1.5,
                  maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
        They'll add your child to the roster. We'll let you know when they're in.
      </p>
    </div>
  )
}

function Loader() {
  return (
    <div style={{
      minHeight: '40dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${T.border}`, borderTopColor: T.ink,
                    animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function FieldGroup({ label, children }: any) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{
        display: 'block', fontSize: 11, fontWeight: 600, color: T.ink3,
        letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</span>
      {children}
    </label>
  )
}

const inputStyle: any = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  border: `1px solid ${T.border}`, borderRadius: 12,
  background: T.white, color: T.ink, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}
const primaryBtn: any = {
  width: '100%', padding: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  borderRadius: 12, background: T.ink, color: T.white, border: 'none',
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  marginTop: 8,
}
const secondaryBtn: any = {
  width: '100%', padding: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  borderRadius: 12, background: T.white, color: T.ink,
  border: `1px solid ${T.border}`,
  fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const textLink: any = {
  display: 'block', marginTop: 16,
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 13, color: T.ink3, fontFamily: 'inherit',
  padding: 0, textAlign: 'center', width: '100%',
}
