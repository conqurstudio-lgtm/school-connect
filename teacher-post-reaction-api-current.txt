// /api/teacher/post-reaction
// Lets a teacher react to their own mirrored class posts using teacher_token.
// PostCard normally saves reactions directly through Supabase auth.
// Teachers do not use Supabase auth, so mirrored teacher-page reactions must go through this route.

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
  const { data } = await sb
    .from('teachers')
    .select('id, school_id, status')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  return data
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const postId = String(body.post_id || '').trim()
  const type = body.type === null ? null : String(body.type || '').trim()

  if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 })
  if (type && !['love', 'like', 'celebrate'].includes(type)) {
    return NextResponse.json({ error: 'invalid reaction type' }, { status: 400 })
  }

  const sb = adminClient()

  const { data: post } = await sb
    .from('posts')
    .select('id, school_id, teacher_id')
    .eq('id', postId)
    .single()

  if (!post || post.teacher_id !== teacher.id || post.school_id !== teacher.school_id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: existing } = await sb
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', teacher.id)
    .maybeSingle()

  if (!type) {
    if (existing?.id) {
      const { error } = await sb
        .from('reactions')
        .delete()
        .eq('id', existing.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, reaction: null })
  }

  if (existing?.id) {
    const { data, error } = await sb
      .from('reactions')
      .update({ type })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, reaction: data })
  }

  const { data, error } = await sb
    .from('reactions')
    .insert({
      post_id: postId,
      school_id: teacher.school_id,
      user_id: teacher.id,
      type,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, reaction: data })
}
