// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Check, ArrowRight, X, AlertCircle, Search, ShieldCheck } from 'lucide-react'
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
  const [school, setSchool] = useState<any>(null)
  const [step, setStep] = useState<Step>('loading')
  const [user, setUser] = useState<any>(null)
  const [picked, setPicked] = useState<any[]>([])

  useEffect(() => {
    let alive = true

    fetch(`/api/onboarding/school?slug=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return

        if (j.school) {
          setSchool(j.school)

          supabase().auth.getUser().then(({ data }) => {
            if (!alive) return

            if (data.user) {
              setUser(data.user)
              setStep('children')
            } else {
              setStep('auth')
            }
          })
        } else {
          setStep('loading')
          toast.error('School invite link could not be found')
        }
      })
      .catch(() => {
        if (!alive) return
        toast.error('Could not open invite link')
      })

    return () => { alive = false }
  }, [slug])

  if (step === 'loading' || !school) {
    return <PageLoader />
  }

  return (
    <div style={{
      minHeight: '100dvh',
      height: '100dvh',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      background: T.bg,
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      paddingBottom: 40,
    }}>
      <JoinHeader school={school} />

      {step === 'auth' && (
        <AuthStep
          schoolId={school.id}
          schoolName={school.name}
          onSignedIn={(u) => { setUser(u); setStep('children') }}
        />
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
          schoolName={school.name}
          onBack={() => setStep('children')}
          onSubmitted={() => setStep('done')}
        />
      )}

      {step === 'done' && <DoneStep />}
    </div>
  )
}

function JoinHeader({ school }: any) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '38px 24px 24px',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: school.logo_url
          ? `url(${school.logo_url}) center/contain no-repeat`
          : '#F0F0F4',
        marginBottom: 12,
      }} />

      <h1 style={{
        fontSize: 18,
        fontWeight: 750,
        color: T.ink,
        letterSpacing: '-0.02em',
        margin: 0,
        textAlign: 'center',
      }}>
        {school.name}
      </h1>

      <p style={{
        fontSize: 12,
        color: T.ink3,
        margin: '5px 0 0',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 700,
      }}>
        Parent invite
      </p>
    </div>
  )
}

function AuthStep({ schoolId, schoolName, onSignedIn }: any) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.trim() || !pwd.trim()) {
      toast.error('Enter email and password')
      return
    }

    if (mode === 'signup' && !name.trim()) {
      toast.error('Enter your name')
      return
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
          await sb.from('profiles').upsert({
            id: data.user.id,
            full_name: name.trim(),
            school_id: schoolId,
            role: 'parent',
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
          await sb.from('profiles').upsert({
            id: data.user.id,
            school_id: schoolId,
            role: 'parent',
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
        fontSize: 20,
        fontWeight: 750,
        color: T.ink,
        letterSpacing: '-0.02em',
        margin: '0 0 6px',
      }}>
        {mode === 'signup' ? 'Create parent account' : 'Welcome back'}
      </h2>

      <p style={{
        fontSize: 13,
        color: T.ink3,
        margin: '0 0 18px',
        lineHeight: 1.5,
      }}>
        {mode === 'signup'
          ? `Join ${schoolName} so you can follow your child’s class updates, messages, documents and reports.`
          : 'Sign in to continue linking your child.'}
      </p>

      <div style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 14,
        background: '#F4F6FB',
        border: `1px solid ${T.border}`,
        marginBottom: 18,
      }}>
        <ShieldCheck size={17} color={T.blue} strokeWidth={1.9} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{
          fontSize: 12,
          color: T.ink2,
          lineHeight: 1.45,
          margin: 0,
        }}>
          Use the details you want the school to know you by. You will choose your child after signing in.
        </p>
      </div>

      {mode === 'signup' && (
        <FieldGroup label="Your full name">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Sarah Khoza"
            style={inputStyle}
          />
        </FieldGroup>
      )}

      <FieldGroup label="Email">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          style={inputStyle}
        />
      </FieldGroup>

      <FieldGroup label="Password">
        <input
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          type="password"
          placeholder="••••••••"
          style={inputStyle}
        />
      </FieldGroup>

      <button onClick={submit} disabled={busy} style={primaryBtn}>
        {busy ? 'Please wait…' : mode === 'signup' ? 'Continue' : 'Sign in'}
        {!busy && <ArrowRight size={14} strokeWidth={2.2} />}
      </button>

      <button
        onClick={() => setMode(m => m === 'signup' ? 'signin' : 'signup')}
        style={textLink}
      >
        {mode === 'signup'
          ? 'Already have an account? Sign in'
          : "Don't have an account? Sign up"}
      </button>
    </div>
  )
}

function ChildrenStep({ school, alreadyPicked, onPicked, onCantFind }: any) {
  const [children, setChildren] = useState<any[]>([])
  const [myChildIds, setMyChildIds] = useState<string[]>([])
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [mineLoading, setMineLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [grade, setGrade] = useState('')
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState<string | null>(null)

  const pickedIds = alreadyPicked.map((c: any) => c.id)
  const normalizedSearch = search.trim()

  useEffect(() => {
    let alive = true
    setMineLoading(true)

    fetch(`/api/onboarding/children?school_id=${school.id}&mine=1`)
      .then(r => r.json())
      .then(j => {
        if (!alive) return
        setMyChildIds(j.my_child_ids ?? [])
        setMyChildren(j.my_children ?? [])
      })
      .catch(() => {
        if (!alive) return
        setMyChildren([])
      })
      .finally(() => {
        if (!alive) return
        setMineLoading(false)
      })

    return () => { alive = false }
  }, [school.id])

  useEffect(() => {
    let alive = true
    const q = normalizedSearch

    if (q.length < 2 && !grade.trim()) {
      setChildren([])
      setLoading(false)
      return
    }

    setLoading(true)

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams()
      params.set('school_id', school.id)
      if (q) params.set('q', q)
      if (grade.trim()) params.set('grade', grade.trim())

      fetch(`/api/onboarding/children?${params.toString()}`)
        .then(r => r.json())
        .then(j => {
          if (!alive) return
          setChildren(j.children ?? [])
          setMyChildIds(j.my_child_ids ?? [])
          setMyChildren(j.my_children ?? [])
        })
        .catch(() => {
          if (!alive) return
          setChildren([])
        })
        .finally(() => {
          if (!alive) return
          setLoading(false)
        })
    }, 220)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [school.id, normalizedSearch, grade])

  const visibleChildren = useMemo(() => {
    const skip = new Set([...pickedIds, ...myChildIds])
    return children.filter((child: any) => !skip.has(child.id))
  }, [children, pickedIds.join(','), myChildIds.join(',')])

  const connectedChildren = useMemo(() => {
    const map = new Map<string, any>()

    for (const child of myChildren) {
      if (child?.id) map.set(child.id, child)
    }

    for (const child of alreadyPicked) {
      if (child?.id) map.set(child.id, child)
    }

    return Array.from(map.values())
  }, [myChildren, alreadyPicked])

  const groups: Record<string, any[]> = {}
  for (const c of visibleChildren) {
    const key = `${c.grade || 'Class'}${c.class_name ? ` · ${c.class_name}` : ''}`
    groups[key] = groups[key] || []
    groups[key].push(c)
  }

  const link = async (child: any) => {
    setLinking(child.id)

    try {
      const res = await fetch('/api/onboarding/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_id: child.id }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Could not link child')
      }

      onPicked(child)
    } catch (e: any) {
      toast.error(e.message || 'Could not link')
    }

    setLinking(null)
  }

  const showStartState = !loading && normalizedSearch.length < 2 && !grade.trim()
  const showEmptyState = !loading && !showStartState && Object.keys(groups).length === 0

  return (
    <div style={{ padding: '24px 0 40px' }}>
      <div style={{ padding: '0 24px 16px' }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 750,
          color: T.ink,
          letterSpacing: '-0.02em',
          margin: '0 0 6px',
        }}>
          {alreadyPicked.length > 0 ? 'Add another child' : 'Find your child'}
        </h2>

        <p style={{
          fontSize: 13,
          color: T.ink3,
          margin: 0,
          lineHeight: 1.5,
        }}>
          Search by name, then tap “This is my child”. This keeps the school list private.
        </p>
      </div>

      {mineLoading ? null : connectedChildren.length > 0 && (
        <ConnectedChildrenCard children={connectedChildren} />
      )}

      <div style={{ padding: '0 24px 14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: T.white,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: '0 12px',
        }}>
          <Search size={16} color={T.ink3} strokeWidth={1.8} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search child name"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: T.ink,
              fontSize: 16,
              height: 46,
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: 'none',
                background: '#F4F4F6',
                color: T.ink3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <input
          value={grade}
          onChange={e => setGrade(e.target.value)}
          placeholder="Grade or class optional"
          style={{ ...inputStyle, marginTop: 10 }}
        />
      </div>

      {showStartState ? (
        <HelperCard
          icon={<Search size={18} color={T.ink3} strokeWidth={1.7} />}
          title="Start typing your child’s name"
          body="Only matching children will appear. This makes the shared school link safer for large schools."
        />
      ) : loading ? (
        <ChildSearchLoading />
      ) : showEmptyState ? (
        <div style={{ padding: '10px 24px 0' }}>
          <div style={{
            padding: 16,
            borderRadius: 16,
            border: `1px dashed ${T.border}`,
            background: T.white,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
          }}>
            <AlertCircle
              size={18}
              color={T.ink3}
              strokeWidth={1.6}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 13,
                color: T.ink,
                fontWeight: 750,
                margin: '0 0 4px',
              }}>
                No matching child found
              </p>
              <p style={{
                fontSize: 12,
                color: T.ink3,
                margin: 0,
                lineHeight: 1.5,
              }}>
                Try a different spelling, or ask the school to add your child.
              </p>
              <button onClick={onCantFind} style={{
                marginTop: 12,
                padding: '9px 12px',
                borderRadius: 999,
                border: 'none',
                background: T.ink,
                color: T.white,
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                Request child be added
              </button>
            </div>
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([groupName, kids]: any) => (
          <div key={groupName} style={{ marginBottom: 18 }}>
            <p style={{
              padding: '0 24px 8px',
              fontSize: 11,
              fontWeight: 700,
              color: T.ink3,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              {groupName}
            </p>

            <div style={{
              padding: '0 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {kids.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => link(c)}
                  disabled={linking === c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 13px',
                    borderRadius: 14,
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    cursor: linking === c.id ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    opacity: linking === c.id ? 0.55 : 1,
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#F0F0F4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                    color: T.ink2,
                    fontWeight: 800,
                  }}>
                    {String(c.name || 'C').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 650,
                      color: T.ink,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.name}
                    </p>
                    <p style={{
                      fontSize: 11,
                      color: T.ink3,
                      margin: '2px 0 0',
                    }}>
                      {c.grade}{c.class_name ? ` · ${c.class_name}` : ''}
                    </p>
                  </div>

                  <span style={{
                    flexShrink: 0,
                    padding: '8px 10px',
                    borderRadius: 999,
                    background: '#F4F4F6',
                    color: T.ink2,
                    fontSize: 11,
                    fontWeight: 800,
                  }}>
                    {linking === c.id ? 'Linking…' : 'This is my child'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      {!showEmptyState && (
        <div style={{ padding: '18px 24px 0' }}>
          <button onClick={onCantFind} style={textLink}>
            Can't find your child? Request help →
          </button>
        </div>
      )}
    </div>
  )
}

function ConnectedChildrenCard({ children }: any) {
  return (
    <div style={{ padding: '0 24px 16px' }}>
      <div style={{
        padding: 14,
        borderRadius: 16,
        background: '#F4F6FB',
        border: `1px solid ${T.border}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}>
          <div>
            <p style={{
              fontSize: 13,
              fontWeight: 800,
              color: T.ink,
              margin: '0 0 3px',
            }}>
              Connected children
            </p>
            <p style={{
              fontSize: 12,
              color: T.ink3,
              margin: 0,
              lineHeight: 1.45,
            }}>
              These children are already linked to your parent profile.
            </p>
          </div>

          <span style={{
            height: 24,
            minWidth: 24,
            padding: '0 8px',
            borderRadius: 999,
            background: T.ink,
            color: T.white,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 850,
            flexShrink: 0,
          }}>
            {children.length}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {children.map((child: any) => (
            <div key={child.id} style={{
              padding: '9px 10px',
              borderRadius: 13,
              background: T.white,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#F0F0F4',
                color: T.ink2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 850,
                flexShrink: 0,
              }}>
                {String(child.name || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13.5,
                  fontWeight: 750,
                  color: T.ink,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {child.name}
                </p>
                <p style={{
                  fontSize: 11,
                  color: T.ink3,
                  margin: '1px 0 0',
                }}>
                  {child.grade}{child.class_name ? ` · ${child.class_name}` : ''}
                </p>
              </div>

              <Check size={15} color={T.blue} strokeWidth={2.2} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => { window.location.href = '/feed' }}
          style={{
            width: '100%',
            height: 38,
            borderRadius: 12,
            border: 'none',
            background: T.ink,
            color: T.white,
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: 11,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          Open parent feed <ArrowRight size={13} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  )
}


function SiblingStep({ picked, onAddMore, onDone }: any) {
  const latest = picked[picked.length - 1]

  return (
    <div style={{ padding: '40px 24px' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 32,
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: T.ink,
          color: T.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Check size={24} strokeWidth={2.4} />
        </div>

        <h2 style={{
          fontSize: 20,
          fontWeight: 750,
          color: T.ink,
          letterSpacing: '-0.02em',
          margin: '0 0 6px',
        }}>
          {latest.name} is linked
        </h2>

        <p style={{
          fontSize: 13,
          color: T.ink3,
          margin: 0,
          lineHeight: 1.5,
          maxWidth: 280,
        }}>
          You’ll see their class updates on your feed.
        </p>
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.ink3,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '0 0 8px',
        }}>
          Linked children
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {picked.map((c: any) => (
            <div key={c.id} style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: '#F4F4F8',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: T.ink2,
                fontWeight: 700,
              }}>
                {String(c.name || 'C').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
              </div>

              <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
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
        I’m done <ArrowRight size={14} strokeWidth={2.2} />
      </button>
    </div>
  )
}

function RequestStep({ schoolId, schoolName, onBack, onSubmitted }: any) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Enter your child's name")
      return
    }

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
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        color: T.ink3,
        padding: 0,
        marginBottom: 16,
        fontFamily: 'inherit',
      }}>
        ← Back to child search
      </button>

      <h2 style={{
        fontSize: 20,
        fontWeight: 750,
        color: T.ink,
        letterSpacing: '-0.02em',
        margin: '0 0 6px',
      }}>
        Request help from school
      </h2>

      <p style={{
        fontSize: 13,
        color: T.ink3,
        margin: '0 0 20px',
        lineHeight: 1.5,
      }}>
        Tell {schoolName} your child’s name. The school can check their roster and help link you.
      </p>

      <FieldGroup label="Child's full name">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Emma Johnson"
          style={inputStyle}
        />
      </FieldGroup>

      <FieldGroup label="Grade or class if known">
        <input
          value={grade}
          onChange={e => setGrade(e.target.value)}
          placeholder="Grade 4A"
          style={inputStyle}
        />
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
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: T.ink,
        color: T.white,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Check size={24} strokeWidth={2.4} />
      </div>

      <h2 style={{
        fontSize: 20,
        fontWeight: 750,
        color: T.ink,
        letterSpacing: '-0.02em',
        margin: '0 0 6px',
      }}>
        You’re almost there
      </h2>

      <p style={{
        fontSize: 13,
        color: T.ink3,
        margin: 0,
        lineHeight: 1.5,
        maxWidth: 300,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        If your child is linked, your feed is ready. If you requested help, the school will review it and your child will appear once approved.
      </p>

      <button
        onClick={() => { window.location.href = '/feed' }}
        style={{ ...primaryBtn, maxWidth: 260, margin: '18px auto 0' }}
      >
        Go to feed <ArrowRight size={14} strokeWidth={2.2} />
      </button>
    </div>
  )
}

function HelperCard({ icon, title, body }: any) {
  return (
    <div style={{ padding: '12px 24px 0' }}>
      <div style={{
        padding: 16,
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        background: T.white,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <div style={{ flexShrink: 0, marginTop: 1 }}>{icon}</div>
        <div>
          <p style={{
            fontSize: 13,
            color: T.ink,
            fontWeight: 750,
            margin: '0 0 4px',
          }}>
            {title}
          </p>
          <p style={{
            fontSize: 12,
            color: T.ink3,
            margin: 0,
            lineHeight: 1.5,
          }}>
            {body}
          </p>
        </div>
      </div>
    </div>
  )
}

function ChildSearchLoading() {
  return (
    <div style={{ padding: '18px 24px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          height: 62,
          borderRadius: 14,
          background: T.white,
          border: `1px solid ${T.border}`,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 13px',
        }}>
          <div className="join-skeleton" style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div className="join-skeleton" style={{
              width: i === 1 ? '48%' : '60%',
              height: 10,
              borderRadius: 999,
              marginBottom: 8,
            }} />
            <div className="join-skeleton" style={{
              width: '32%',
              height: 8,
              borderRadius: 999,
            }} />
          </div>
        </div>
      ))}

      <style jsx global>{`
        .join-skeleton {
          background: linear-gradient(90deg, #F1F1F5 0%, #F7F7FA 45%, #F1F1F5 100%);
          background-size: 220% 100%;
          animation: joinSkeleton 1.25s ease-in-out infinite;
        }
        @keyframes joinSkeleton {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>
    </div>
  )
}

function PageLoader() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: T.bg,
      maxWidth: 520,
      margin: '0 auto',
      fontFamily: 'Inter, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 320,
        textAlign: 'center',
      }}>
        <div className="join-skeleton" style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          margin: '0 auto 14px',
        }} />
        <div className="join-skeleton" style={{
          width: '70%',
          height: 14,
          borderRadius: 999,
          margin: '0 auto 9px',
        }} />
        <div className="join-skeleton" style={{
          width: '44%',
          height: 10,
          borderRadius: 999,
          margin: '0 auto',
        }} />

        <style jsx global>{`
          .join-skeleton {
            background: linear-gradient(90deg, #F1F1F5 0%, #F7F7FA 45%, #F1F1F5 100%);
            background-size: 220% 100%;
            animation: joinSkeleton 1.25s ease-in-out infinite;
          }
          @keyframes joinSkeleton {
            0% { background-position: 120% 0; }
            100% { background-position: -120% 0; }
          }
        `}</style>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: any) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        color: T.ink3,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: any = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 16,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  background: T.white,
  color: T.ink,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const primaryBtn: any = {
  width: '100%',
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 12,
  background: T.ink,
  color: T.white,
  border: 'none',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  marginTop: 8,
}

const secondaryBtn: any = {
  width: '100%',
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  borderRadius: 12,
  background: T.white,
  color: T.ink,
  border: `1px solid ${T.border}`,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const textLink: any = {
  display: 'block',
  marginTop: 16,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  color: T.ink3,
  fontFamily: 'inherit',
  padding: 0,
  textAlign: 'center',
  width: '100%',
}
