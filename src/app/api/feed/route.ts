// /api/feed
// parent-feed-teacher-posts-v1
// Feed reader using service role.
// Supports school users, parent_token sessions, teacher_token sessions,
// and parent class-aware teacher posts.

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

function clean(value: any) {
  return String(value || '').trim().toLowerCase()
}

function same(valueA: any, valueB: any) {
  return clean(valueA) !== '' && clean(valueA) === clean(valueB)
}

function postMatchesFilter(post: any, filter: string) {
  if (filter === 'pinned') return !!post.is_pinned
  if (filter === 'all') return true

  const map: Record<string, string> = {
    updates: 'update',
    moments: 'moment',
    events: 'event',
    documents: 'document',
  }

  return map[filter] ? post.type === map[filter] : true
}

function postTime(post: any) {
  return new Date(post.created_at || post.published_at || 0).getTime()
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

async function resolveParentChild(sb: any, caller: any) {
  if (caller?.role !== 'parent') return null

  const { data: profile } = await sb.from('profiles')
    .select('id, school_id, child_name, child_grade')
    .eq('id', caller.id)
    .maybeSingle()

  const childName = String(profile?.child_name || '').trim()
  const childGrade = String(profile?.child_grade || '').trim()

  if (!childName && !childGrade) return null

  let childrenQuery = sb.from('children')
    .select('id, school_id, name, grade, class_name, status, created_by_teacher_id, created_at')
    .eq('school_id', caller.school_id)

  if (childName) {
    childrenQuery = childrenQuery.ilike('name', childName)
  } else if (childGrade) {
    childrenQuery = childrenQuery.ilike('grade', childGrade)
  }

  const { data: children } = await childrenQuery
    .order('created_at', { ascending: false })
    .limit(10)

  const list = children || []

  if (childName) {
    const exact = list.find((child: any) => clean(child.name) === clean(childName))
    if (exact) return exact
  }

  if (childGrade) {
    const exactGrade = list.find((child: any) => clean(child.grade) === clean(childGrade))
    if (exactGrade) return exactGrade
  }

  return list[0] || null
}

function parentCanSeePost(post: any, child: any) {
  const postedByKind = clean(post.posted_by_kind || 'school')
  const isTeacherPost = postedByKind === 'teacher'

  // School-wide/admin posts remain visible to parents in the same school.
  if (!isTeacherPost) return true

  // Teacher posts need a child/class match.
  if (!child) return false

  const matchesGradeAndClass =
    same(post.audience_grade, child.grade) &&
    same(post.audience_class, child.class_name)

  const matchesChildTeacher =
    post.teacher_id &&
    child.created_by_teacher_id &&
    String(post.teacher_id) === String(child.created_by_teacher_id)

  return matchesGradeAndClass || matchesChildTeacher
}

export async function GET(req: NextRequest) {
  const caller = await getCaller(req)

  if (!caller?.school_id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const schoolId = req.nextUrl.searchParams.get('school_id') || caller.school_id
  const filter = req.nextUrl.searchParams.get('filter') || 'all'
  const debug = req.nextUrl.searchParams.get('debug') === '1'

  if (schoolId !== caller.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const sb = adminClient()
  const parentChild = await resolveParentChild(sb, caller)

  let posts: any[] = []

  if (caller.role === 'parent') {
    const { data, error } = await sb.from('posts')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    posts = (data || [])
      .filter((post: any) => parentCanSeePost(post, parentChild))
      .filter((post: any) => postMatchesFilter(post, filter))
      .sort((a: any, b: any) => {
        const pinned = Number(!!b.is_pinned) - Number(!!a.is_pinned)
        if (pinned !== 0) return pinned
        return postTime(b) - postTime(a)
      })
      .slice(0, 50)
  } else {
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

    const { data, error } = await query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    posts = data || []
  }

  const ids = posts.map((post: any) => post.id)

  let allReactions: any[] = []
  let myReactions: any[] = []
  let allComments: any[] = []

  if (ids.length > 0) {
    const [{ data: rxAll }, { data: rxMine }, { data: comments }] = await Promise.all([
      sb.from('reactions').select('post_id, type').in('post_id', ids),
      sb.from('reactions').select('post_id, type').in('post_id', ids).eq('user_id', caller.id),
      sb.from('comments').select('post_id').in('post_id', ids),
    ])

    allReactions = rxAll ?? []
    myReactions = rxMine ?? []
    allComments = comments ?? []
  }

  const typeMap: Record<string, Record<string, number>> = {}
  const mineMap: Record<string, string> = {}
  const commentMap: Record<string, number> = {}

  for (const reaction of allReactions) {
    if (!typeMap[reaction.post_id]) typeMap[reaction.post_id] = {}
    typeMap[reaction.post_id][reaction.type] = (typeMap[reaction.post_id][reaction.type] || 0) + 1
  }

  for (const reaction of myReactions) {
    mineMap[reaction.post_id] = reaction.type
  }

  for (const comment of allComments) {
    commentMap[comment.post_id] = (commentMap[comment.post_id] || 0) + 1
  }

  const enriched = posts.map((post: any) => {
    const counts = typeMap[post.id] || {}
    const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0)

    return {
      ...post,
      reaction_count: total,
      reaction_counts: counts,
      my_reaction: mineMap[post.id] || null,
      comment_count: commentMap[post.id] || post.comment_count || 0,
    }
  })

  return NextResponse.json({
    posts: enriched,
    ...(debug ? {
      debug: {
        caller,
        resolved_child: parentChild,
        post_count: enriched.length,
      },
    } : {}),
  })
}
