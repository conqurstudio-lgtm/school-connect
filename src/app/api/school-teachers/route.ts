// /api/school-teachers
// Returns active teachers for the feed strip.
// Supports normal Supabase users and lightweight parent_token sessions.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function userClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role, child_name, full_name, phone')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'school') {
      const { data: school } = await sb.from('schools')
        .select('id')
        .eq('owner_id', profile.id)
        .single()

      if (school?.id) return { profile: { ...profile, school_id: school.id } }
    }

    if (profile?.school_id) return { profile }
  }

  const parentToken = req.cookies.get('parent_token')?.value

  if (parentToken) {
    const { data: session } = await sb.from('parent_sessions')
      .select('*')
      .eq('access_token', parentToken)
      .maybeSingle()

    if (session && (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())) {
      const { data: profile } = await sb.from('profiles')
        .select('id, school_id, role, child_name, full_name, phone')
        .eq('id', session.parent_id)
        .single()

      if (profile?.school_id) return { profile }
    }
  }

  return null
}

export async function GET(req: NextRequest) {
  const caller = await getCaller(req)

  if (!caller?.profile?.school_id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const profile = caller.profile
  const sb = adminClient()

  const { data: teachers } = await sb
    .from('teachers')
    .select('id, name, photo_url, grade, class_name')
    .eq('school_id', profile.school_id)
    .eq('status', 'active')
    .order('grade')
    .order('class_name')
    .order('name')

  let my_teacher_ids: string[] = []

  if (profile.role === 'parent') {
    const { data: links } = await sb.from('child_guardians')
      .select('child_id')
      .eq('guardian_id', profile.id)

    const childIds = (links ?? []).map((link: any) => link.child_id)

    if (childIds.length > 0 && teachers) {
      const { data: kids } = await sb.from('children')
        .select('id, school_id, grade, class_name, status')
        .in('id', childIds)

      for (const kid of (kids ?? [])) {
        for (const teacher of (teachers ?? [])) {
          if (
            kid.school_id === profile.school_id &&
            kid.status === 'active' &&
            teacher.grade === kid.grade &&
            (teacher.class_name || null) === (kid.class_name || null)
          ) {
            if (!my_teacher_ids.includes(teacher.id)) my_teacher_ids.push(teacher.id)
          }
        }
      }
    }

    if (my_teacher_ids.length === 0 && profile.child_name && teachers) {
      const { data: legacyKids } = await sb.from('children')
        .select('grade, class_name')
        .eq('school_id', profile.school_id)
        .ilike('name', profile.child_name)

      for (const kid of (legacyKids ?? [])) {
        for (const teacher of (teachers ?? [])) {
          if (
            teacher.grade === kid.grade &&
            (teacher.class_name || null) === (kid.class_name || null)
          ) {
            if (!my_teacher_ids.includes(teacher.id)) my_teacher_ids.push(teacher.id)
          }
        }
      }
    }
  }

  return NextResponse.json({ teachers: teachers ?? [], my_teacher_ids })
}
