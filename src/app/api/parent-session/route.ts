// /api/parent-session
// Lightweight parent access without password.
// Parent enters full name + phone from a school invite link.
// We create/fetch a parent profile and store a parent_token cookie.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function clean(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function normalisePhone(value: unknown) {
  return clean(value).replace(/[^\d+]/g, '')
}

function newToken() {
  return `${crypto.randomUUID().replaceAll('-', '')}${Math.random().toString(36).slice(2, 10)}`
}

function safePhoneForEmail(phone: string) {
  return phone.replace(/[^\d]/g, '') || Math.random().toString(36).slice(2, 10)
}

async function findSchool(sb: any, schoolKey: string) {
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolKey)

  // Accept school id first.
  if (uuidLike) {
    const byId = await sb.from('schools').select('*').eq('id', schoolKey).maybeSingle()
    if (byId.data) return byId.data

    // Also accept owner/account id, because admins may copy their user id by mistake.
    const byOwner = await sb.from('schools').select('*').eq('owner_id', schoolKey).maybeSingle()
    if (byOwner.data) return byOwner.data
  }

  // Accept school slug.
  const bySlug = await sb.from('schools').select('*').eq('slug', schoolKey).maybeSingle()
  if (bySlug.data) return bySlug.data

  return null
}

async function createParentProfile(sb: any, school: any, fullName: string, phone: string) {
  // profiles.id has a foreign key to auth.users.id,
  // so parent profiles must be created from an auth user ID.
  // Parents will still NOT use passwords; this auth user is internal only.

  const phoneDigits = safePhoneForEmail(phone)
  const schoolShort = String(school.id).replaceAll('-', '').slice(0, 10)
  const randomShort = crypto.randomUUID().replaceAll('-', '').slice(0, 8)
  const email = `parent-${schoolShort}-${phoneDigits}-${randomShort}@schoolconnect.local`

  const created = await sb.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
      role: 'parent',
      school_id: school.id,
    },
  })

  if (created.error || !created.data?.user?.id) {
    throw new Error(created.error?.message || 'Could not create parent auth user')
  }

  const userId = created.data.user.id

  // Some projects have a trigger that auto-creates profiles after auth user creation.
  // If it exists, update it. If not, insert it.
  const { data: existingProfile } = await sb.from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  const profilePayload = {
    full_name: fullName,
    phone,
    role: 'parent',
    school_id: school.id,
    onboarding_done: true,
    updated_at: new Date().toISOString(),
  }

  if (existingProfile) {
    const { data, error } = await sb.from('profiles')
      .update(profilePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  const inserted = await sb.from('profiles')
    .insert({
      id: userId,
      ...profilePayload,
    })
    .select()
    .single()

  if (!inserted.error) return inserted.data

  // Safety net for auto-profile trigger race condition.
  if ((inserted.error.message || '').toLowerCase().includes('duplicate')) {
    const { data, error } = await sb.from('profiles')
      .update(profilePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  throw new Error(inserted.error.message)
}

async function getSessionFromToken(parentToken: string | undefined) {
  if (!parentToken) return null

  const sb = adminClient()

  const { data: session } = await sb.from('parent_sessions')
    .select('*')
    .eq('access_token', parentToken)
    .maybeSingle()

  if (!session) return null

  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    return null
  }

  const [{ data: profile }, { data: school }] = await Promise.all([
    sb.from('profiles').select('*').eq('id', session.parent_id).single(),
    sb.from('schools').select('*').eq('id', session.school_id).single(),
  ])

  if (!profile || !school) return null

  await sb.from('parent_sessions')
    .update({
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  return { session, profile, school }
}

export async function GET(req: NextRequest) {
  const current = await getSessionFromToken(req.cookies.get('parent_token')?.value)

  if (!current) {
    return NextResponse.json({ error: 'no parent session' }, { status: 401 })
  }

  return NextResponse.json({
    parent: {
      id: current.profile.id,
      full_name: current.profile.full_name,
      phone: current.profile.phone,
      school_id: current.profile.school_id,
    },
    profile: current.profile,
    school: current.school,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const fullName = clean(body.full_name)
  const phone = normalisePhone(body.phone)
  const schoolKey = clean(body.school_key || body.school_id || body.school)

  if (!fullName) return NextResponse.json({ error: 'full name required' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'phone number required' }, { status: 400 })
  if (!schoolKey) return NextResponse.json({ error: 'school link missing' }, { status: 400 })

  const sb = adminClient()
  const school = await findSchool(sb, schoolKey)

  if (!school) return NextResponse.json({ error: 'school not found' }, { status: 404 })

  const { data: existing } = await sb.from('profiles')
    .select('*')
    .eq('school_id', school.id)
    .eq('role', 'parent')
    .eq('phone', phone)
    .maybeSingle()

  let profile = existing

  if (profile) {
    const { data, error } = await sb.from('profiles')
      .update({
        full_name: fullName,
        phone,
        onboarding_done: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    profile = data
  } else {
    try {
      profile = await createParentProfile(sb, school, fullName, phone)
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Could not create parent' }, { status: 500 })
    }
  }

  const accessToken = newToken()
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  const { error: sessionError } = await sb.from('parent_sessions')
    .insert({
      school_id: school.id,
      parent_id: profile.id,
      phone,
      access_token: accessToken,
      expires_at: expiresAt,
      last_seen_at: new Date().toISOString(),
    })

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 })
  }

  const res = NextResponse.json({
    ok: true,
    parent: {
      id: profile.id,
      full_name: profile.full_name,
      phone: profile.phone,
      school_id: profile.school_id,
    },
    profile,
    school,
  })

  res.cookies.set('parent_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  })

  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('parent_token', '', { maxAge: 0, path: '/' })
  return res
}
