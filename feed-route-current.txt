// /api/feed
// parent-feed-linked-child-simple-v2
// Simple safe feed reader:
// - School/Admin/Teacher: same-school published posts.
// - Parent: same-school school posts + teacher posts for linked child class.
// - Parent child resolution uses child_guardians first, then child_name fallback.

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

function same(a: any, b: any) {
  return clean(a) !== '' && clean(a) === clean(b)
}

function postTime(post: any) {
  return new Date(post.created_at || post.published_at || 0).getTime()
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

async function getCaller(req: NextRequest) {
  const sb = adminClient()
  const supabase = userClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user?.id) {
    const { data: profile } = await sb.from('profiles')
      .select('id, school_id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'school') {
      const { data: school } = await sb.from('schools')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

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
      .maybeSingle()

    if (teacher?.school_id) return { id: teacher.id, school_id: teacher.school_id, role: 'teacher' }
  }

  return null
}

async function resolveParentChildren(sb: any, caller: any) {
  if (caller?.role !== 'parent') {
    return { children: [], source: 'not_parent', profile: null }
  }

  const { data: profile } = await sb.from('profiles')
    .select('id, school_id, child_name, child_grade')
    .eq('id', caller.id)
    .maybeSingle()

  // First choice: proper approved parent-child link.
  const { data: links } = await sb.from('child_guardians')
    .select('child_id')
    .eq('guardian_id', caller.id)

  const childIds = (links || [])
    .map((link: any) => link.child_id)
    .filter(Boolean)

  if (childIds.length > 0) {
    const { data: linkedChildren } = await sb.from('children')
      .select('id, school_id, name, grade, class_name, status, created_by_teacher_id, created_at')
      .eq('school_id', caller.school_id)
      .in('id', childIds)

    if ((linkedChildren || []).length > 0) {
      return { children: linkedChildren || [], source: 'child_guardians', profile }
    }
  }

  // Fallback for older/test parent profiles where only child_name was saved.
  const childName = String(profile?.child_name || '').trim()
  const childGrade = String(profile?.child_grade || '').trim()

  if (!childName && !childGrade) {
    return { children: [], source: 'none', profile }
  }

  let query = sb.from('children')
    .select('id, school_id, name, grade, class_name, status, created_by_teacher_id, created_at')
    .eq('school_id', caller.school_id)

  if (childName) {
    query = query.ilike('name', childName)
  } else if (childGrade) {
    query = query.ilike('grade', childGrade)
  }

  const { data: fallbackChildren } = await query
    .order('created_at', { ascending: false })
    .limit(10)

  const list = fallbackChildren || []

  if (childName) {
    const exact = list.find((child: any) => clean(child.name) === clean(childName))
    if (exact) return { children: [exact], source: 'profile_child_name', profile }
  }

  if (childGrade) {
    const exactGrade = list.find((child: any) => clean(child.grade) === clean(childGrade))
    if (exactGrade) return { children: [exactGrade], source: 'profile_child_grade', profile }
  }

  return { children: list.slice(0, 1), source: list.length ? 'fallback_first_child_match' : 'none', profile }
}

function parentCanSeePost(post: any, children: any[]) {
  const postedByKind = clean(post.posted_by_kind || 'school')
  const isTeacherPost = postedByKind === 'teacher'

  // School/admin-wide posts stay visible to parents in the same school.
  if (!isTeacherPost) return true

  // Teacher/class posts only show when a linked child matches.
  if (!children.length) return false

  return children.some((child: any) => {
    const matchesGradeClass =
      same(post.audience_grade, child.grade) &&
      same(post.audience_class, child.class_name)

    const matchesTeacher =
      post.teacher_id &&
      child.created_by_teacher_id &&
      String(post.teacher_id) === String(child.created_by_teacher_id)

    return matchesGradeClass || matchesTeacher
  })
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
  const resolved = await resolveParentChildren(sb, caller)

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
      .filter((post: any) => parentCanSeePost(post, resolved.children))
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
        child_source: resolved.source,
        resolved_children: resolved.children,
        parent_profile: resolved.profile,
        post_count: enriched.length,
      },
    } : {}),
  })
}
