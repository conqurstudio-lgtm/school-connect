// /api/teachers/[id]/profile
// Supports normal Supabase parents and lightweight parent_token sessions.

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

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role, child_name')
      .eq('id', user.id)
      .single()

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
        .select('id, school_id, role, child_name')
        .eq('id', session.parent_id)
        .single()

      if (profile?.school_id) return { profile }
    }
  }

  return null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const caller = await getCaller(req)
  if (!caller?.profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()
  const profile = caller.profile

  const { data: teacher } = await sb.from('teachers')
    .select('id, name, photo_url, grade, class_name, school_id, status')
    .eq('id', params.id)
    .eq('status', 'active')
    .single()

  if (!teacher) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (profile.school_id !== teacher.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  let myChildIds: string[] = []
  let isMyTeacher = false

  const { data: links } = await sb.from('child_guardians')
    .select('child_id')
    .eq('guardian_id', profile.id)

  const linkedChildIds = (links ?? []).map((l: any) => l.child_id)

  if (linkedChildIds.length > 0) {
    const { data: kids } = await sb.from('children')
      .select('id, school_id, grade, class_name, status')
      .in('id', linkedChildIds)

    for (const kid of (kids ?? [])) {
      if (
        kid.school_id === teacher.school_id &&
        kid.status === 'active' &&
        kid.grade === teacher.grade &&
        (kid.class_name || null) === (teacher.class_name || null)
      ) {
        myChildIds.push(kid.id)
        isMyTeacher = true
      }
    }
  }

  if (!isMyTeacher && profile.child_name) {
    const { data: kids } = await sb.from('children')
      .select('id, grade, class_name')
      .eq('school_id', teacher.school_id)
      .ilike('name', profile.child_name)

    for (const kid of (kids ?? [])) {
      if (
        kid.grade === teacher.grade &&
        (kid.class_name || null) === (teacher.class_name || null)
      ) {
        myChildIds.push(kid.id)
        isMyTeacher = true
      }
    }
  }

  const { data: latestRequest } = await sb.from('class_join_requests')
    .select('*')
    .eq('teacher_id', teacher.id)
    .eq('parent_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const joinStatus = isMyTeacher ? 'approved' : (latestRequest?.status || 'none')

  const { data: posts } = await sb.from('posts')
    .select('*, reactions(post_id, type, user_id)')
    .eq('teacher_id', teacher.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  const enrichedPosts = (posts ?? []).map((post: any) => {
    const counts: Record<string, number> = {}
    let mine: string | null = null

    for (const reaction of (post.reactions ?? [])) {
      counts[reaction.type] = (counts[reaction.type] || 0) + 1
      if (reaction.user_id === profile.id) mine = reaction.type
    }

    return {
      ...post,
      reaction_count: Object.values(counts).reduce((a, b) => a + b, 0),
      reaction_counts: counts,
      my_reaction: mine,
      reactions: undefined,
    }
  })

  let reports: any[] = []
  if (myChildIds.length > 0) {
    const { data } = await sb.from('child_reports')
      .select('*')
      .in('child_id', myChildIds)
      .eq('teacher_id', teacher.id)
      .eq('status', 'published')
      .order('week_starting', { ascending: false })
      .limit(20)

    reports = data ?? []
  }

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      photo_url: teacher.photo_url,
      grade: teacher.grade,
      class_name: teacher.class_name,
    },
    is_my_teacher: isMyTeacher,
    join_status: joinStatus,
    join_request: latestRequest ?? null,
    posts: enrichedPosts,
    reports,
  })
}
