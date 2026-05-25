// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function redirectTo(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url), { status: 303 })
}

function makeSlug(value: string) {
  const base = String(value || 'school')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42)

  return `${base || 'school'}-${randomBytes(3).toString('hex')}`
}

function withError(req: NextRequest, form: Record<string, string>, message: string) {
  const params = new URLSearchParams()
  params.set('school_name', form.school_name || '')
  params.set('school_phone', form.school_phone || '')
  params.set('school_email', form.school_email || '')
  params.set('error', message)
  return redirectTo(req, `/auth/signup/owner?${params.toString()}`)
}

async function safeUpsertProfile(sb: any, values: any) {
  const attempts = [
    {
      id: values.id,
      role: 'school',
      full_name: values.full_name,
      email: values.email,
      school_id: values.school_id,
      managed_school_id: values.school_id,
      onboarding_done: true,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: values.id,
      role: 'school',
      full_name: values.full_name,
      email: values.email,
      school_id: values.school_id,
      managed_school_id: values.school_id,
      updated_at: new Date().toISOString(),
    },
    {
      id: values.id,
      role: 'school',
      full_name: values.full_name,
      email: values.email,
      school_id: values.school_id,
      updated_at: new Date().toISOString(),
    },
    {
      id: values.id,
      role: 'school',
      full_name: values.full_name,
      school_id: values.school_id,
    },
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const { error } = await sb.from('profiles').upsert(payload, { onConflict: 'id' })
    if (!error) return null
    lastError = error
  }
  return lastError
}

export async function POST(req: NextRequest) {
  const data = await req.formData()

  const form = {
    school_name: String(data.get('school_name') || '').trim(),
    school_phone: String(data.get('school_phone') || '').trim(),
    school_email: String(data.get('school_email') || '').trim(),
    owner_name: String(data.get('owner_name') || '').trim(),
    owner_email: String(data.get('owner_email') || '').trim().toLowerCase(),
    password: String(data.get('password') || ''),
  }

  if (!form.school_name) return withError(req, form, 'School name is required.')
  if (!form.owner_name) return withError(req, form, 'Owner full name is required.')
  if (!form.owner_email || !form.owner_email.includes('@')) return withError(req, form, 'A valid owner email is required.')
  if (form.password.length < 8) return withError(req, form, 'Password must be at least 8 characters.')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return withError(req, form, 'Signup server is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart npm run dev.')
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email: form.owner_email,
    password: form.password,
    email_confirm: true,
    user_metadata: {
      role: 'school',
      full_name: form.owner_name,
      school_name: form.school_name,
    },
  })

  if (createError || !created.user?.id) {
    const message = createError?.message || 'Could not create owner account.'
    const isDuplicate = /already|registered|exists/i.test(message)
    return withError(req, form, isDuplicate ? 'This owner email already exists. Please sign in instead.' : message)
  }

  const ownerId = created.user.id
  const slug = makeSlug(form.school_name)

  const schoolAttempts = [
    {
      name: form.school_name,
      slug,
      phone: form.school_phone || null,
      email: form.school_email || null,
      owner_id: ownerId,
      country: 'South Africa',
      is_active: true,
      is_verified: false,
      settings: { mvp: 'weekly_reports' },
    },
    {
      name: form.school_name,
      slug,
      phone: form.school_phone || null,
      email: form.school_email || null,
      owner_id: ownerId,
      country: 'South Africa',
      is_active: true,
      is_verified: false,
    },
    {
      name: form.school_name,
      slug,
      phone: form.school_phone || null,
      email: form.school_email || null,
      owner_id: ownerId,
      country: 'South Africa',
    },
    {
      name: form.school_name,
      slug,
      owner_id: ownerId,
    },
  ]

  let school: any = null
  let schoolError: any = null

  for (const payload of schoolAttempts) {
    const result = await sb.from('schools').insert(payload).select('*').single()
    if (!result.error && result.data?.id) {
      school = result.data
      schoolError = null
      break
    }
    schoolError = result.error
  }

  if (!school?.id) {
    await sb.auth.admin.deleteUser(ownerId).catch?.(() => null)
    return withError(req, form, schoolError?.message || 'Owner was created, but the school profile could not be created.')
  }

  const profileError = await safeUpsertProfile(sb, {
    id: ownerId,
    full_name: form.owner_name,
    email: form.owner_email,
    school_id: school.id,
  })

  if (profileError) {
    return withError(req, form, profileError.message || 'School was created, but the owner profile could not be linked.')
  }

  const params = new URLSearchParams()
  params.set('created', '1')
  params.set('email', form.owner_email)
  params.set('school', school.name || form.school_name)

  return redirectTo(req, `/auth/login?${params.toString()}`)
}
