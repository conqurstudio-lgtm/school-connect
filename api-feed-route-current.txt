// /api/feed
// Feed reader using service role.
// Supports school users, parent_token sessions, and teacher_token sessions.

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
      .select('id, school_id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'school') {
      const { data: school } = await sb.from('schools')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (school?.id) return { id: profile.id, school_id: school.id, role: 'school' }
    }

    if (profile?.school_id) {
      return { id: profile.id, school_id: profile.school_id, role: profile.role }
    }
  }

  const parentToken = req.cookies.get('parent_token')?.value
  if (parentToken) {
    const { data: session } = await sb.from('parent_sessions')
      .select('*')
      .eq('access_token', parentToken)
      .maybeSingle()

    if (session && (!session.expires_at || new Date(session.expires_at).getTime() > Date.now())) {
      return { id: session.parent_id, school_id: session.school_id, role: 'parent' }
    }
  }

  const teacherToken = req.cookies.get('teacher_token')?.value
  if (teacherToken) {
    const { data: teacher } = await sb.from('teachers')
      .select('id, school_id')
      .eq('access_token', teacherToken)
      .eq('status', 'active')
      .single()

    if (teacher?.school_id) return { id: teacher.id, school_id: teacher.school_id, role: 'teacher' }
  }

  return null
}

export async function GET(req: NextRequest) {
  const caller = await getCaller(req)

  if (!caller?.school_id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const schoolId = req.nextUrl.searchParams.get('school_id') || caller.school_id
  const filter = req.nextUrl.searchParams.get('filter') || 'all'

  if (schoolId !== caller.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const sb = adminClient()

  let query = sb.from('posts')
    .select('*')
    .eq('school_id', schoolId)
    .eq('status', 'published')

  if (filter === 'pinned') {
    query = query.eq('is_pinned', true)
  } else if (filter !== 'all') {
    const map: Record<string, string> = {
      updates: 'update',
      moments: 'moment',
      events: 'event',
      documents: 'document',
    }

    if (map[filter]) query = query.eq('type', map[filter])
  }

  const { data: posts, error } = await query
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (posts ?? []).map((post: any) => post.id)

  let allReactions: any[] = []
  let myReactions: any[] = []

  if (ids.length > 0) {
    const [{ data: rxAll }, { data: rxMine }] = await Promise.all([
      sb.from('reactions').select('post_id, type').in('post_id', ids),
      sb.from('reactions').select('post_id, type').in('post_id', ids).eq('user_id', caller.id),
    ])

    allReactions = rxAll ?? []
    myReactions = rxMine ?? []
  }

  const typeMap: Record<string, Record<string, number>> = {}
  const mineMap: Record<string, string> = {}

  for (const reaction of allReactions) {
    if (!typeMap[reaction.post_id]) typeMap[reaction.post_id] = {}
    typeMap[reaction.post_id][reaction.type] = (typeMap[reaction.post_id][reaction.type] || 0) + 1
  }

  for (const reaction of myReactions) {
    mineMap[reaction.post_id] = reaction.type
  }

  const enriched = (posts ?? []).map((post: any) => {
    const counts = typeMap[post.id] || {}
    const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)

    return {
      ...post,
      reaction_count: total,
      reaction_counts: counts,
      my_reaction: mineMap[post.id] || null,
      comment_count: post.comment_count || 0,
    }
  })

  return NextResponse.json({ posts: enriched })
}
