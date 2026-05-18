// /api/teacher/post-engagement?post_id=...
// Returns reactions + comments for a teacher's post with the engaging parent's info.

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

  const postId = req.nextUrl.searchParams.get('post_id')
  if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 })

  const sb = adminClient()

  // Confirm the teacher owns this post
  const { data: post } = await sb.from('posts').select('teacher_id, school_id')
    .eq('id', postId).single()
  if (!post || post.teacher_id !== teacher.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Fetch reactions + comments in parallel
  const [reactionsRes, commentsRes] = await Promise.all([
    sb.from('reactions')
      .select('id, type, user_id, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false }),
    sb.from('comments')
      .select('id, body, author_id, teacher_id, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  ])

  // Get all unique user_ids from reactions (user_id) and comments (author_id)
  const userIds = Array.from(new Set([
    ...(reactionsRes.data ?? []).map(r => r.user_id).filter(Boolean),
    ...(commentsRes.data ?? []).map(c => c.author_id).filter(Boolean),
  ]))

  // Fetch parent profiles (legacy: profiles table with child_name)
  const profileMap: Record<string, { name: string; child_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await sb.from('profiles')
      .select('id, full_name, child_name')
      .in('id', userIds)
    for (const p of (profiles ?? [])) {
      profileMap[p.id] = {
        name: p.full_name || 'Parent',
        child_name: p.child_name,
      }
    }
  }

  const enrichReaction = (r: any) => ({
    ...r,
    user_name:  profileMap[r.user_id]?.name || 'Parent',
    child_name: profileMap[r.user_id]?.child_name || null,
  })
  const enrichComment = (c: any) => ({
    ...c,
    user_id:    c.author_id,  // alias for UI consistency
    user_name:  c.author_id ? (profileMap[c.author_id]?.name || 'Parent') : null,
    child_name: c.author_id ? (profileMap[c.author_id]?.child_name || null) : null,
  })

  return NextResponse.json({
    reactions: (reactionsRes.data ?? []).map(enrichReaction),
    comments:  (commentsRes.data ?? []).map(enrichComment),
  })
}

// POST — teacher replies in their post's comments
export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { post_id, body } = await req.json()
  if (!post_id || !body?.trim()) {
    return NextResponse.json({ error: 'post_id and body required' }, { status: 400 })
  }

  const sb = adminClient()
  // Confirm ownership and grab school_id in one query
  const { data: post } = await sb.from('posts').select('teacher_id, school_id').eq('id', post_id).single()
  if (!post || post.teacher_id !== teacher.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Insert as teacher comment (author_id null, teacher_id set)
  const { data, error } = await sb.from('comments')
    .insert({
      post_id,
      school_id:       post.school_id,
      author_id:       null,
      teacher_id:      teacher.id,
      body:            body.trim(),
      is_school_reply: true,   // appears as a "reply from school side" so it's not hidden by privacy
      visibility:      'public',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}

// DELETE — teacher removes one of their comments
export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const commentId = req.nextUrl.searchParams.get('id')
  if (!commentId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()
  const { data: comment } = await sb.from('comments')
    .select('teacher_id').eq('id', commentId).single()
  if (!comment || comment.teacher_id !== teacher.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { error } = await sb.from('comments').delete().eq('id', commentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
