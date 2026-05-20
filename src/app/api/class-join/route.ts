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
  const parentId = randomUUID()
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
  const childName = `${childFirstName} ${childLastName}`.trim()
  const fullName = `${relationship || 'Parent/Guardian'} of ${childName}`.trim()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()

  const { data: profile, error: profileError } = await sb.from('profiles')
    .insert({
      id: parentId,
      school_id: teacher.school_id,
      role: 'parent',
      full_name: fullName,
      child_name: childName,
    })
    .select('id, school_id, role')
    .single()

  if (profileError) throw new Error(profileError.message)

  const { error: sessionError } = await sb.from('parent_sessions')
    .insert({
      parent_id: parentId,
      access_token: token,
      expires_at: expiresAt,
    })

  if (sessionError) throw new Error(sessionError.message)

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

  // public-class-join-request-v1
  // A first-time parent opening /class/{teacherId} has no Supabase auth session yet.
  // Create a lightweight parent profile/session so the teacher can approve the request.
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
