// /api/teacher/notifications — incoming items for the teacher's bell
// Returns:
//  - parent messages (new updates from parents)
//  - reactions on the teacher's class posts
//  - replies on the teacher's class posts
// Each item has read state determined by teachers.last_seen_at

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()
  const since = teacher.last_seen_at || new Date(0).toISOString()

  // 1) Parent updates → updates rows authored by parents
  const { data: parentUpdates } = await sb.from('updates')
    .select('id, parent_id, body, image_url, created_at')
    .eq('teacher_id', teacher.id)
    .eq('author_kind', 'parent')
    .order('created_at', { ascending: false })
    .limit(30)

  // Fetch parent names
  const parentIds = Array.from(new Set((parentUpdates ?? []).map((u: any) => u.parent_id)))
  const { data: parentProfiles } = parentIds.length > 0
    ? await sb.from('profiles').select('id, full_name').in('id', parentIds)
    : { data: [] }
  const parentNameById: Record<string, string> = {}
  for (const p of (parentProfiles ?? [])) parentNameById[p.id] = p.full_name || 'Parent'

  // 2) Reactions on the teacher's class posts
  // First find the teacher's posts
  const { data: myPosts } = await sb.from('posts')
    .select('id, body, created_at')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const myPostIds = (myPosts ?? []).map((p: any) => p.id)
  const postBodyById: Record<string, string> = {}
  for (const p of (myPosts ?? [])) postBodyById[p.id] = (p.body || '').slice(0, 60)

  let postReactions: any[] = []
  let postReplies: any[]   = []
  if (myPostIds.length > 0) {
    const { data: reactions } = await sb.from('reactions')
      .select('id, post_id, author_id, type, created_at')
      .in('post_id', myPostIds)
      .order('created_at', { ascending: false })
      .limit(30)
    postReactions = reactions ?? []

    // Replies on teacher's posts (comments where post belongs to teacher AND not authored by the teacher)
    const { data: comments } = await sb.from('comments')
      .select('id, post_id, author_id, teacher_id, body, created_at')
      .in('post_id', myPostIds)
      .is('teacher_id', null) // only parent-authored
      .order('created_at', { ascending: false })
      .limit(30)
    postReplies = comments ?? []
  }

  // Fetch reaction & comment author names
  const reactorIds = Array.from(new Set([
    ...postReactions.map((r: any) => r.author_id).filter(Boolean),
    ...postReplies.map((c: any) => c.author_id).filter(Boolean),
  ]))
  const { data: reactorProfiles } = reactorIds.length > 0
    ? await sb.from('profiles').select('id, full_name').in('id', reactorIds)
    : { data: [] }
  const reactorNameById: Record<string, string> = {}
  for (const p of (reactorProfiles ?? [])) reactorNameById[p.id] = p.full_name || 'Parent'

  // Build a unified, sorted list
  const items: any[] = []

  for (const u of (parentUpdates ?? [])) {
    items.push({
      kind: 'message',
      id: `m:${u.id}`,
      parent_id:   u.parent_id,
      parent_name: parentNameById[u.parent_id] || 'Parent',
      preview:     u.body || '[photo]',
      created_at:  u.created_at,
      unread:      u.created_at > since,
    })
  }
  for (const r of postReactions) {
    items.push({
      kind: 'reaction',
      id: `r:${r.id}`,
      post_id:     r.post_id,
      post_preview: postBodyById[r.post_id] || '',
      type:        r.type,
      author_name: reactorNameById[r.author_id] || 'Parent',
      created_at:  r.created_at,
      unread:      r.created_at > since,
    })
  }
  for (const c of postReplies) {
    items.push({
      kind: 'reply',
      id: `c:${c.id}`,
      post_id:     c.post_id,
      post_preview: postBodyById[c.post_id] || '',
      preview:     c.body,
      author_name: reactorNameById[c.author_id] || 'Parent',
      created_at:  c.created_at,
      unread:      c.created_at > since,
    })
  }

  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

  const unread_count = items.filter(i => i.unread).length

  return NextResponse.json({ items, unread_count, last_seen_at: teacher.last_seen_at })
}

// POST → mark all read (set last_seen_at = now)
export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()
  await sb.from('teachers')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', teacher.id)

  return NextResponse.json({ ok: true })
}
