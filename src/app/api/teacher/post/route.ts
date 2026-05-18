// /api/teacher/post
// Teacher posts to their class. Uses service role since teachers don't have Supabase auth.

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
    .from('teachers').select('*')
    .eq('access_token', token).eq('status', 'active')
    .single()
  return data
}

// POST — create a class post
export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const { body: postBody, type, image_urls } = body

  // Need at least body OR images
  if (!postBody && (!image_urls || image_urls.length === 0)) {
    return NextResponse.json({ error: 'empty post' }, { status: 400 })
  }

  const sb = adminClient()
  const { data: post, error } = await sb.from('posts')
    .insert({
      school_id:        teacher.school_id,
      author_id:        null,  // teacher posts have no auth user
      type:             type || 'update',
      status:           'published',
      body:             postBody?.trim() || null,
      image_urls:       Array.isArray(image_urls) ? image_urls : null,
      posted_by_kind:   'teacher',
      teacher_id:       teacher.id,
      audience_grade:   teacher.grade,
      audience_class:   teacher.class_name,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post })
}

// DELETE — teacher removes their own post
export async function DELETE(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = adminClient()
  // Only allow if teacher owns the post
  const { data: post } = await sb.from('posts').select('teacher_id')
    .eq('id', id).single()
  if (!post || post.teacher_id !== teacher.id) {
    return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  }

  const { error } = await sb.from('posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
