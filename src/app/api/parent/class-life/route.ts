// @ts-nocheck
// /api/parent/class-life?teacher_id=...
// Parent-facing class updates for the Class Space screen.

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

async function getParentCaller(req: NextRequest, sb: any) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb
      .from('profiles')
      .select('id, school_id, role, child_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.id && profile?.school_id) return profile
  }

  const parentToken = req.cookies.get('parent_token')?.value

  if (parentToken) {
    const { data: session } = await sb
      .from('parent_sessions')
      .select('*')
      .eq('access_token', parentToken)
      .maybeSingle()

    if (session && (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())) {
      const { data: profile } = await sb
        .from('profiles')
        .select('id, school_id, role, child_name')
        .eq('id', session.parent_id)
        .maybeSingle()

      if (profile?.id && profile?.school_id) return profile
    }
  }

  return null
}

export async function GET(req: NextRequest) {
  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  if (!teacherId) {
    return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  }

  const sb = adminClient()
  const profile = await getParentCaller(req, sb)

  if (!profile?.id || !profile?.school_id) {
    return NextResponse.json({ error: 'unauthorized', posts: [] }, { status: 401 })
  }

  const { data: teacher } = await sb
    .from('teachers')
    .select('id, school_id, grade, class_name, status')
    .eq('id', teacherId)
    .eq('status', 'active')
    .maybeSingle()

  if (!teacher || teacher.school_id !== profile.school_id) {
    return NextResponse.json({ posts: [], approved: false })
  }

  let approved = false

  try {
    const { data: joinReq } = await sb
      .from('class_join_requests')
      .select('id, status')
      .eq('teacher_id', teacher.id)
      .eq('parent_id', profile.id)
      .eq('status', 'approved')
      .limit(1)

    approved = (joinReq ?? []).length > 0
  } catch {
    approved = false
  }

  let hasLinkedChildInClass = false

  try {
    const { data: links } = await sb
      .from('child_guardians')
      .select('child_id')
      .eq('guardian_id', profile.id)

    const childIds = (links ?? []).map((link: any) => link.child_id).filter(Boolean)

    if (childIds.length > 0) {
      const { data: kids } = await sb
        .from('children')
        .select('id, school_id, grade, class_name, status')
        .in('id', childIds)

      hasLinkedChildInClass = (kids ?? []).some((kid: any) => (
        kid.school_id === teacher.school_id &&
        String(kid.status || 'active').toLowerCase() === 'active' &&
        String(kid.grade || '').trim() === String(teacher.grade || '').trim() &&
        String(kid.class_name || '').trim() === String(teacher.class_name || '').trim()
      ))
    }

    if (!hasLinkedChildInClass && profile.child_name) {
      const { data: legacyKids } = await sb
        .from('children')
        .select('id, school_id, grade, class_name, status')
        .eq('school_id', teacher.school_id)
        .ilike('name', profile.child_name)

      hasLinkedChildInClass = (legacyKids ?? []).some((kid: any) => (
        String(kid.status || 'active').toLowerCase() === 'active' &&
        String(kid.grade || '').trim() === String(teacher.grade || '').trim() &&
        String(kid.class_name || '').trim() === String(teacher.class_name || '').trim()
      ))
    }
  } catch {
    hasLinkedChildInClass = false
  }

  const canViewClassLife = approved || hasLinkedChildInClass

  if (!canViewClassLife) {
    return NextResponse.json({ posts: [], approved: false })
  }

  const { data: posts, error } = await sb
    .from('posts')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ posts: [], approved: true, warning: error.message })
  }

  return NextResponse.json({ posts: posts ?? [], approved: true })
}

