// /api/class-join
// Parent requests to join a teacher's class.
// Supports normal Supabase parents, lightweight parent_token sessions,
// and first-time public class invite visitors.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function userClient() {
  const store = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return store.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

function clean(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function makeToken() {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
}

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.school_id) return { profile, createdToken: null as string | null }
  }

  const parentToken = req.cookies.get('parent_token')?.value

  if (parentToken) {
    const { data: session } = await sb.from('parent_sessions')
      .select('*')
      .eq('access_token', parentToken)
      .maybeSingle()

    if (session && (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())) {
      const { data: profile } = await sb.from('profiles')
        .select('id, school_id, role')
        .eq('id', session.parent_id)
        .single()

      if (profile?.school_id) return { profile, createdToken: null as string | null }
    }
  }

  return null
}

async function createPublicParentSession(
  sb: ReturnType<typeof adminClient>,
  teacher: any,
  childFirstName: string,
  childLastName: string,
  relationship: string,
) {
  const childName = `${childFirstName} ${childLastName}`.trim()
  const fullName = `${relationship || 'Parent/Guardian'} of ${childName}`.trim()
  const token = makeToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()

  // profiles.id has a foreign key to auth.users.id, so we must first create
  // a lightweight auth user for public invite parents.
  const authEmail = `parent-${randomUUID().replace(/-/g, '')}@schoolconnect.local`
  const authPassword = makeToken()

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email: authEmail,
    password: authPassword,
    email_confirm: true,
    user_metadata: {
      source: 'public_class_invite',
      school_id: teacher.school_id,
      child_name: childName,
      relationship,
    },
  })

  if (authError || !authData.user?.id) {
    throw new Error(authError?.message || 'Could not create parent auth user')
  }

  const parentId = authData.user.id

  // public-class-join-profile-upsert-v3
  // Some projects have a database trigger that creates profiles automatically
  // when an auth user is created. If that happened, insert would violate
  // profiles_pkey. So we first update the existing profile, then insert only
  // when no profile row exists yet.
  let profile: any = null

  const { data: existingProfile } = await sb.from('profiles')
    .select('id, school_id, role')
    .eq('id', parentId)
    .maybeSingle()

  if (existingProfile?.id) {
    const { data: updatedProfile, error: updateProfileError } = await sb.from('profiles')
      .update({
        school_id: teacher.school_id,
        role: 'parent',
        full_name: fullName,
        child_name: childName,
      })
      .eq('id', parentId)
      .select('id, school_id, role')
      .single()

    if (updateProfileError) {
      try { await sb.auth.admin.deleteUser(parentId) } catch {}
      throw new Error(updateProfileError.message)
    }

    profile = updatedProfile
  } else {
    const { data: insertedProfile, error: insertProfileError } = await sb.from('profiles')
      .insert({
        id: parentId,
        school_id: teacher.school_id,
        role: 'parent',
        full_name: fullName,
        child_name: childName,
      })
      .select('id, school_id, role')
      .single()

    if (insertProfileError) {
      try { await sb.auth.admin.deleteUser(parentId) } catch {}
      throw new Error(insertProfileError.message)
    }

    profile = insertedProfile
  }

  const { error: sessionError } = await sb.from('parent_sessions')
    .insert({
      // public-class-join-session-school-v4
      // parent_sessions.school_id is required by this database.
      school_id: teacher.school_id,
      // public-class-join-session-phone-v5
      // parent_sessions.phone is required by this database.
      // The current public invite form only asks for child details, so we store
      // a safe placeholder until parent details are collected in the next step.
      phone: 'not-provided',
      parent_id: parentId,
      access_token: token,
      expires_at: expiresAt,
    })

  if (sessionError) {
    try { await sb.auth.admin.deleteUser(parentId) } catch {}
    throw new Error(sessionError.message)
  }

  return { profile, createdToken: token }
}

function jsonWithOptionalParentCookie(payload: any, status = 200, token?: string | null) {
  const res = NextResponse.json(payload, { status })

  if (token) {
    res.cookies.set('parent_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return res
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const teacherId = clean(body.teacher_id)
  const childFirstName = clean(body.child_first_name)
  const childLastName = clean(body.child_last_name)
  const relationship = clean(body.relationship) || 'Parent/Guardian'

  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  if (!childFirstName || !childLastName) {
    return NextResponse.json({ error: 'child first name and surname required' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: teacher } = await sb.from('teachers')
    .select('id, school_id, grade, class_name, status')
    .eq('id', teacherId)
    .eq('status', 'active')
    .single()

  if (!teacher) return NextResponse.json({ error: 'teacher not found' }, { status: 404 })

  let caller = await getCaller(req)

  // public-class-join-auth-user-fix-v2
  // First-time parents opening /class/{teacherId} have no Supabase auth session.
  // Create a lightweight auth user + profile + parent_token session for them.
  if (!caller?.profile) {
    try {
      caller = await createPublicParentSession(
        sb,
        teacher,
        childFirstName,
        childLastName,
        relationship,
      )
    } catch (e: any) {
      return NextResponse.json({
        error: e?.message || 'Could not create parent request session',
      }, { status: 500 })
    }
  }

  const profile = caller.profile

  if (profile.school_id !== teacher.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: links } = await sb.from('child_guardians')
    .select('child_id')
    .eq('guardian_id', profile.id)

  const childIds = (links ?? []).map((link: any) => link.child_id)

  if (childIds.length > 0) {
    const { data: kids } = await sb.from('children')
      .select('id, school_id, grade, class_name, status')
      .in('id', childIds)

    const alreadyLinked = (kids ?? []).some((kid: any) =>
      kid.school_id === teacher.school_id &&
      kid.status === 'active' &&
      kid.grade === teacher.grade &&
      (kid.class_name || null) === (teacher.class_name || null)
    )

    if (alreadyLinked) {
      return jsonWithOptionalParentCookie({ already_joined: true }, 200, caller.createdToken)
    }
  }

  const { data: existingPending } = await sb.from('class_join_requests')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('parent_id', profile.id)
    .eq('status', 'pending')
    .ilike('child_first_name', childFirstName)
    .ilike('child_last_name', childLastName)
    .maybeSingle()

  if (existingPending) {
    return jsonWithOptionalParentCookie(
      { request: existingPending, already_pending: true },
      200,
      caller.createdToken,
    )
  }

  const { data, error } = await sb.from('class_join_requests')
    .insert({
      school_id: teacher.school_id,
      teacher_id: teacher.id,
      parent_id: profile.id,
      child_first_name: childFirstName,
      child_last_name: childLastName,
      relationship,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return jsonWithOptionalParentCookie({ request: data }, 200, caller.createdToken)
}
