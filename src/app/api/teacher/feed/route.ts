// /api/teacher/feed
// Returns the feed for a teacher — either school-wide posts (admin) or their own class posts.
// Uses service role since teachers don't have Supabase auth.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null
  const sb = adminClient()
  const { data } = await sb.from('teachers').select('*')
    .eq('access_token', token).eq('status', 'active').single()
  return data
}

// GET /api/teacher/feed?scope=school|class&filter=all|moments|updates|events|documents|pinned
export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const scope  = req.nextUrl.searchParams.get('scope')  || 'school'
  const filter = req.nextUrl.searchParams.get('filter') || 'all'

  const sb = adminClient()

  // Track when teacher last visited (used for "new" badges)
  const lastSeen = teacher.last_seen_at
    ? new Date(teacher.last_seen_at).toISOString()
    : new Date(0).toISOString()

  let query = sb.from('posts')
    .select('*, reactions(post_id, type, user_id, created_at), comments(post_id, created_at)')
    .eq('school_id', teacher.school_id)
    .eq('status', 'published')

  if (scope === 'class') {
    // Only this teacher's class posts
    query = query.eq('teacher_id', teacher.id)
  } else {
    // School-wide posts (admin posts only — no audience scope)
    query = query.eq('posted_by_kind', 'school').is('audience_grade', null)
  }

  // Filter by type
  if (filter === 'moments')       query = query.eq('type', 'moment')
  else if (filter === 'updates')  query = query.eq('type', 'update')
  else if (filter === 'events')   query = query.eq('type', 'event')
  else if (filter === 'documents') query = query.eq('type', 'document')
  else if (filter === 'pinned')   query = query.eq('is_pinned', true)

  // Pinned posts first, then chronological
  query = query.order('is_pinned', { ascending: false })
               .order('created_at', { ascending: false })
               .limit(50)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate reaction + comment counts; compute "new since last seen"
  const enriched = (posts ?? []).map((p: any) => {
    const counts: Record<string, number> = {}
    let mine: string | null = null
    let newReactions = 0
    for (const r of (p.reactions ?? [])) {
      counts[r.type] = (counts[r.type] || 0) + 1
      if (r.user_id === teacher.id) mine = r.type
      if (r.created_at > lastSeen) newReactions++
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    const commentCount = (p.comments ?? []).length
    let newComments = 0
    for (const c of (p.comments ?? [])) {
      if (c.created_at > lastSeen) newComments++
    }
    return {
      ...p,
      reaction_count:  total,
      reaction_counts: counts,
      my_reaction:     mine,
      comment_count:   commentCount,
      new_reactions:   newReactions,
      new_comments:    newComments,
      reactions:       undefined,
      comments:        undefined,
    }
  })

  // For class scope, update teacher.last_seen_at so future calls reset the "new" counters
  if (scope === 'class') {
    await sb.from('teachers')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', teacher.id)
  }

  return NextResponse.json({ posts: enriched })
}
