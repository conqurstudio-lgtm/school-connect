// /api/class-join
// parent-child-claim-flow-v1
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

function normalizedName(value: unknown) {
  return clean(value).toLowerCase()
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
  parentFirstName: string,
  parentLastName: string,
  parentPhone: string,
  childFirstName: string,
  childLastName: string,
  relationship: string,
) {
  const childName = `${childFirstName} ${childLastName}`.trim()
  const fullName = `${parentFirstName} ${parentLastName}`.trim()
  const token = makeToken()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString()

  // profiles.id has a foreign key to auth.users.id, so create a lightweight
  // auth user first, then create/update the profile.
  const authEmail = `parent-${randomUUID().replace(/-/g, '')}@schoolconnect.local`
  const authPassword = makeToken()

  const { data: authData, error: authError } = await sb.auth.admin.createUser({
    email: authEmail,
    password: authPassword,
    email_confirm: true,
    phone: undefined,
    user_metadata: {
      source: 'public_class_invite',
      school_id: teacher.school_id,
      parent_name: fullName,
      parent_phone: parentPhone,
      child_name: childName,
      relationship,
    },
  })

  if (authError || !authData.user?.id) {
    throw new Error(authError?.message || 'Could not create parent auth user')
  }

  const parentId = authData.user.id

  // Some projects have a database trigger that creates profiles automatically
  // when an auth user is created. Update it if it exists, otherwise insert it.
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
      school_id: teacher.school_id,
      phone: parentPhone,
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
  const parentFirstName = clean(body.parent_first_name)
  const parentLastName = clean(body.parent_last_name)
  const parentPhone = clean(body.parent_phone || body.phone)
  const childFirstName = clean(body.child_first_name)
  const childLastName = clean(body.child_last_name)
  const relationship = clean(body.relationship) || 'Parent/Guardian'

  if (!teacherId) return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  if (!parentFirstName || !parentLastName || !parentPhone) {
    return NextResponse.json({ error: 'parent name and phone required' }, { status: 400 })
  }
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

  // public-join-parent-details-v1
  // First-time parents opening /class/{teacherId} have no session.
  // Create a lightweight auth-backed parent profile/session using the details
  // they entered on the public join form.
  if (!caller?.profile) {
    try {
      caller = await createPublicParentSession(
        sb,
        teacher,
        parentFirstName,
        parentLastName,
        parentPhone,
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

  const requestedChildName = `${childFirstName} ${childLastName}`.trim()
  const requestedNormalized = normalizedName(requestedChildName)
  const reversedRequestedNormalized = normalizedName(`${childLastName} ${childFirstName}`)

  let classChildrenQuery = sb.from('children')
    .select('id, school_id, name, grade, class_name, status, created_by_teacher_id')
    .eq('school_id', teacher.school_id)
    .eq('grade', teacher.grade)
    .eq('status', 'active')
    .limit(200)

  if (teacher.class_name) {
    classChildrenQuery = classChildrenQuery.eq('class_name', teacher.class_name)
  } else {
    classChildrenQuery = classChildrenQuery.is('class_name', null)
  }

  const { data: classChildren, error: classChildrenError } = await classChildrenQuery

  if (classChildrenError) {
    return jsonWithOptionalParentCookie({ error: classChildrenError.message }, 500, caller.createdToken)
  }

  const child =
    (classChildren ?? []).find((kid: any) => normalizedName(kid.name) === requestedNormalized) ||
    (classChildren ?? []).find((kid: any) => normalizedName(kid.name) === reversedRequestedNormalized) ||
    (classChildren ?? []).find((kid: any) => normalizedName(kid.name).includes(requestedNormalized))

  if (!child?.id) {
    return jsonWithOptionalParentCookie({
      error: 'Child not found in this class',
      not_found: true,
      class_label: `${teacher.grade}${teacher.class_name ? ` - ${teacher.class_name}` : ''}`,
    }, 404, caller.createdToken)
  }

  const { data: existingLink } = await sb.from('child_guardians')
    .select('child_id, guardian_id')
    .eq('child_id', child.id)
    .eq('guardian_id', profile.id)
    .maybeSingle()

  if (!existingLink) {
    const { error: linkError } = await sb.from('child_guardians')
      .insert({
        child_id: child.id,
        guardian_id: profile.id,
        relationship,
      })

    if (linkError && !String(linkError.message || '').toLowerCase().includes('duplicate')) {
      return jsonWithOptionalParentCookie({ error: linkError.message }, 500, caller.createdToken)
    }
  }

  const fullName = `${parentFirstName} ${parentLastName}`.trim()

  await sb.from('profiles')
    .update({
      school_id: teacher.school_id,
      role: 'parent',
      full_name: fullName,
      child_name: child.name,
      child_grade: child.grade,
    })
    .eq('id', profile.id)

  return jsonWithOptionalParentCookie({
    ok: true,
    linked: true,
    approved: true,
    already_joined: !!existingLink,
    child,
  }, 200, caller.createdToken)
}
