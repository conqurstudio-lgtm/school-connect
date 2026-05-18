// /api/teacher/photo
// Upload a teacher profile photo via the service role (teachers don't have
// a Supabase auth session, so they can't upload directly).

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
  if (file.size > 5_000_000) {
    return NextResponse.json({ error: 'max 5MB' }, { status: 400 })
  }

  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `teachers/${teacher.id}/photo-${Date.now()}.${ext}`

  // Upload to the existing 'avatars' or 'school-logos' bucket; we'll use 'avatars'
  const arrayBuf = await file.arrayBuffer()
  const { error: upErr } = await sb.storage
    .from('avatars')
    .upload(path, arrayBuf, { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: pub } = sb.storage.from('avatars').getPublicUrl(path)
  const photo_url = pub.publicUrl

  await sb.from('teachers').update({ photo_url, updated_at: new Date().toISOString() })
    .eq('id', teacher.id)

  return NextResponse.json({ photo_url })
}
