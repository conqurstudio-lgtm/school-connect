// /api/updates/attachment
// Uploads image/document attachments for parent-teacher message threads.
// Auth supports either a signed-in parent or a teacher_token cookie.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MAX_SIZE = 15 * 1024 * 1024

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

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

function safeName(name: string) {
  return (name || 'attachment')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
}

export async function POST(req: NextRequest) {
  const sb = adminClient()

  let ownerFolder: string | null = null

  const teacherToken = req.cookies.get('teacher_token')?.value
  if (teacherToken) {
    const { data: teacher } = await sb
      .from('teachers')
      .select('id')
      .eq('access_token', teacherToken)
      .eq('status', 'active')
      .single()

    if (teacher?.id) ownerFolder = `teacher-${teacher.id}`
  }

  if (!ownerFolder) {
    const supa = userClient()
    const { data: { user } } = await supa.auth.getUser()
    if (user?.id) ownerFolder = `parent-${user.id}`
  }

  if (!ownerFolder) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Maximum file size is 15MB' }, { status: 400 })
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const name = safeName(file.name)
  const ext = (name.split('.').pop() || 'file').toLowerCase()
  const path = `${ownerFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await sb.storage
    .from('update-attachments')
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: pub } = sb.storage
    .from('update-attachments')
    .getPublicUrl(path)

  return NextResponse.json({
    url: pub.publicUrl,
    attachment: {
      url: pub.publicUrl,
      name,
      type: file.type,
      is_image: file.type.startsWith('image/'),
    },
  })
}
