'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ArrowRight, Check, Building2, ChevronLeft } from 'lucide-react'

const SA_PROVINCES = [
  'Eastern Cape','Free State','Gauteng','KwaZulu-Natal',
  'Limpopo','Mpumalanga','North West','Northern Cape','Western Cape',
]

const T = {
  ink:    '#1A1A1A',
  ink2:   '#4A4A4A',
  ink3:   '#9A9A9A',
  border: 'rgba(0,0,0,0.08)',
  bg:     '#F7F7F7',
  white:  '#FFFFFF',
  red:    '#E8281E',
}

const input: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 15,
  border: `1px solid ${T.border}`, borderRadius: 12,
  background: T.bg, color: T.ink, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.14s',
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: T.ink2, marginBottom: 6,
}

// Supabase client is created once outside the component
const supabase = createClient()

export default function SchoolSetupPage() {
  const router = useRouter()

  const [step,        setStep]        = useState(0)
  const [origin,      setOrigin]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [sessionReady,setSessionReady]= useState(false)

  // Form fields
  const [schoolName,    setSchoolName]    = useState('')
  const [tagline,       setTagline]       = useState('')
  const [province,      setProvince]      = useState('')
  const [phone,         setPhone]         = useState('')
  const [email,         setEmail]         = useState('')
  const [logoFile,      setLogoFile]      = useState<File | null>(null)
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)
  const [schoolSlug,    setSchoolSlug]    = useState('')
  const [schoolNameFinal, setSchoolNameFinal] = useState('')

  const logoInputRef = useRef<HTMLInputElement>(null)

  // Confirm session on mount — single attempt with 4s fallback
  useEffect(() => { setOrigin(window.location.origin) }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (user) {
        setUserId(user.id)
        setSessionReady(true)
        return
      }

      // Session not immediately available — listen for it (handles email-confirm redirects)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        if (!mounted) return
        if (session?.user) {
          setUserId(session.user.id)
          setSessionReady(true)
          subscription.unsubscribe()
        }
      })

      // Hard timeout — if no session after 4s, send back to login
      const timeout = setTimeout(() => {
        if (mounted) {
          subscription.unsubscribe()
          toast.error('Session expired. Please sign in again.')
          window.location.href = '/auth/login'
        }
      }, 4000)

      return () => clearTimeout(timeout)
    }

    init()
    return () => { mounted = false }
  }, [router])

  const handleLogoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2 MB')
      return
    }
    // Revoke previous blob URL to avoid memory leak
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }, [logoPreview])

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const handleSchoolDetails = (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolName.trim()) { toast.error('School name is required'); return }
    setStep(1)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Session lost. Please sign in again.')
      window.location.href = '/auth/login'
      return
    }
    if (submitting) return
    setSubmitting(true)

    try {
      // Upload logo
      let logoUrl: string | undefined
      if (logoFile) {
        const ext  = logoFile.name.split('.').pop()
        const path = `schools/${userId}/logo.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('school-assets')
          .upload(path, logoFile, { upsert: true })

        if (uploadError) {
          toast.error('Logo upload failed — continuing without logo')
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('school-assets')
            .getPublicUrl(path)
          logoUrl = publicUrl
        }
      }

      // Generate unique slug
      const slug = `${generateSlug(schoolName)}-${Math.random().toString(36).slice(2, 7)}`

      // Create school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name:     schoolName.trim(),
          slug,
          tagline:  tagline.trim()  || null,
          logo_url: logoUrl         || null,
          province: province        || null,
          phone:    phone.trim()    || null,
          owner_id: userId,
        })
        .select()
        .single()

      if (schoolError) {
        toast.error('Failed to create school. Please try again.')
        console.error('[school-setup] school insert:', schoolError)
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ school_id: school.id, onboarding_done: true })
        .eq('id', userId)

      if (profileError) {
        // Non-fatal — school exists, profile will heal on next login
        console.error('[school-setup] profile update:', profileError)
        toast.error('School created but profile update failed. Contact support if issues persist.')
      }

      setSchoolSlug(school.slug)
      setSchoolNameFinal(school.name)
      setStep(2)

    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (!sessionReady) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: 24,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2.5px solid #E8E8E8', borderTopColor: '#1A1A1A',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>Confirming session…</p>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', minHeight: '100dvh',
      background: T.bg,
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        {['Details', 'Logo', 'Done'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: i <= step ? T.ink : '#E0E0E0',
              color: i <= step ? T.white : T.ink3,
              transition: 'all 0.2s',
            }}>
              {i < step ? <Check style={{ width: 13, height: 13 }} /> : i + 1}
            </div>
            {i < 2 && (
              <div style={{
                width: 32, height: 1,
                background: i < step ? T.ink : '#E0E0E0',
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: T.white, borderRadius: 24,
        border: `1px solid ${T.border}`,
        padding: '32px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>

        {/* ── Step 0: School details ── */}
        {step === 0 && (
          <form onSubmit={handleSchoolDetails} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                School details
              </h2>
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>Tell us about your school</p>
            </div>

            <div>
              <label style={label}>School name *</label>
              <input type="text" required value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="e.g. Greenfields Primary School" style={input} autoFocus />
            </div>

            <div>
              <label style={label}>Tagline <span style={{ color: T.ink3, fontWeight: 400 }}>(optional)</span></label>
              <input type="text" value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Excellence in every learner" style={input} />
            </div>

            <div>
              <label style={label}>Province</label>
              <select value={province} onChange={e => setProvince(e.target.value)}
                style={{ ...input, cursor: 'pointer' }}>
                <option value="">Select province</option>
                {SA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="012 345 6789" style={input} />
              </div>
              <div>
                <label style={label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="info@school.co.za" style={input} />
              </div>
            </div>

            <button type="submit" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 0', marginTop: 4,
              background: T.ink, color: T.white, border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}>
              Continue <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </form>
        )}

        {/* ── Step 1: Logo ── */}
        {step === 1 && (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                School logo
              </h2>
              <p style={{ fontSize: 13, color: T.ink3, margin: 0 }}>
                Parents see this everywhere — you can change it later
              </p>
            </div>

            {/* Logo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <button type="button" onClick={() => logoInputRef.current?.click()} style={{
                width: 100, height: 100, borderRadius: 20,
                border: `2px dashed ${T.border}`, background: T.bg,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, cursor: 'pointer',
                overflow: 'hidden', padding: 0, position: 'relative',
              }}>
                {logoPreview ? (
                  /* Use regular img tag — blob URLs don't work with next/image */
                  <img src={logoPreview} alt="Logo preview"
                       style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                ) : (
                  <>
                    <Building2 style={{ width: 28, height: 28, color: T.ink3 }} strokeWidth={1.2} />
                    <span style={{ fontSize: 11, color: T.ink3 }}>Upload logo</span>
                  </>
                )}
              </button>

              <input ref={logoInputRef} type="file" accept="image/*"
                     onChange={handleLogoChange} style={{ display: 'none' }} />

              {logoPreview && (
                <button type="button" onClick={() => logoInputRef.current?.click()} style={{
                  fontSize: 13, color: T.ink2, background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                  textDecoration: 'underline',
                }}>
                  Change logo
                </button>
              )}
              <p style={{ fontSize: 11, color: T.ink3, margin: 0 }}>PNG or JPG, max 2 MB</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setStep(0)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '13px 0', background: 'none',
                border: `1px solid ${T.border}`, borderRadius: 12,
                fontSize: 15, color: T.ink2, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back
              </button>
              <button type="submit" disabled={submitting} style={{
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 0',
                background: submitting ? '#CCCCCC' : T.ink,
                color: T.white, border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'background 0.15s',
              }}>
                {submitting ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%',
                                  border: '2px solid rgba(255,255,255,0.3)',
                                  borderTopColor: T.white,
                                  animation: 'spin 0.7s linear infinite' }} />
                    Creating…
                  </>
                ) : (
                  <>{logoPreview ? 'Create School' : 'Skip & Create'} <ArrowRight style={{ width: 16, height: 16 }} /></>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Done ── */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#DCFCE7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Check style={{ width: 30, height: 30, color: '#16A34A' }} strokeWidth={2} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: T.ink,
                          margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              {schoolNameFinal} is live!
            </h2>
            <p style={{ fontSize: 13, color: T.ink3, margin: '0 0 24px', lineHeight: 1.5 }}>
              Next, build your school structure by adding classes and teachers.
            </p>

            <button onClick={async () => {
                // Force session refresh so middleware cookie is set
                const { createClient } = await import('@/lib/supabase/client')
                const sb = createClient()
                await sb.auth.getSession()
                window.location.href = '/school'
              }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '13px 0',
              background: T.ink, color: T.white, border: 'none',
              borderRadius: 12, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}>
              Build school structure <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
