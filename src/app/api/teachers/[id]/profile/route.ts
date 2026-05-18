// /api/teachers/[id]/profile
// Returns a teacher's public profile + their class posts.
// If the caller is a parent with a child in this teacher's class,
// also returns the child's reports written by this teacher.

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
    { cookies: {
      get(name: string) { return store.get(name)?.value },
      set() {}, remove() {},
    }}
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = userClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()

  // Get the teacher
  const { data: teacher } = await sb.from('teachers')
    .select('id, name, photo_url, grade, class_name, school_id, status')
    .eq('id', params.id)
    .eq('status', 'active')
    .single()
  if (!teacher) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Verify the caller is in the same school
  const { data: profile } = await supabase.from('profiles')
    .select('id, school_id, role, child_name').eq('id', user.id).single()
  if (!profile || profile.school_id !== teacher.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Is the parent linked to a child in this teacher's class?
  // Best-effort matching using legacy child_name
  let myChildIds: string[] = []
  let isMyTeacher = false
  if (profile.child_name) {
    const { data: kids } = await sb.from('children')
      .select('id, grade, class_name')
      .eq('school_id', teacher.school_id)
      .ilike('name', profile.child_name)
    if (kids) {
      for (const k of kids) {
        if (k.grade === teacher.grade &&
            (k.class_name || null) === (teacher.class_name || null)) {
          myChildIds.push(k.id)
          isMyTeacher = true
        }
      }
    }
  }

  // Posts by this teacher
  const { data: posts } = await sb.from('posts')
    .select('*, reactions(post_id, type, user_id)')
    .eq('teacher_id', teacher.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  const enrichedPosts = (posts ?? []).map((p: any) => {
    const counts: Record<string, number> = {}
    let mine: string | null = null
    for (const r of (p.reactions ?? [])) {
      counts[r.type] = (counts[r.type] || 0) + 1
      if (r.user_id === user.id) mine = r.type
    }
    return {
      ...p,
      reaction_count:  Object.values(counts).reduce((a, b) => a + b, 0),
      reaction_counts: counts,
      my_reaction:     mine,
      reactions:       undefined,
    }
  })

  // Reports for this parent's child(ren) authored by this teacher
  let reports: any[] = []
  if (myChildIds.length > 0) {
    const { data } = await sb.from('child_reports')
      .select('*')
      .in('child_id', myChildIds)
      .eq('teacher_id', teacher.id)
      .order('week_start', { ascending: false })
      .limit(20)
    reports = data ?? []
  }

  return NextResponse.json({
    teacher: {
      id:         teacher.id,
      name:       teacher.name,
      photo_url:  teacher.photo_url,
      grade:      teacher.grade,
      class_name: teacher.class_name,
    },
    is_my_teacher: isMyTeacher,
    posts:         enrichedPosts,
    reports,
  })
}
