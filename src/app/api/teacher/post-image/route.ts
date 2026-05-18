// /api/teacher/post-image
// Upload a single image for a teacher class post.
// Returns the public URL — multiple images = multiple calls.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()
  const { data: teacher } = await sb.from('teachers').select('id, school_id')
    .eq('access_token', token).eq('status', 'active').single()
  if (!teacher) return NextResponse.json({ error: 'invalid token' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (file.size > 10_000_000) {
    return NextResponse.json({ error: 'max 10MB' }, { status: 400 })
  }

  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `teacher-posts/${teacher.school_id}/${teacher.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const arrayBuf = await file.arrayBuffer()
  const { error: upErr } = await sb.storage
    .from('post-images')
    .upload(path, arrayBuf, { contentType: file.type, upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: pub } = sb.storage.from('post-images').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
