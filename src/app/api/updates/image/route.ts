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
    { cookies: { get(n: string) { return store.get(n)?.value }, set() {}, remove() {} } }
  )
}

export async function POST(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  const teacherToken = req.cookies.get('teacher_token')?.value
  const sb = adminClient()

  let folder = ''
  if (user) {
    folder = `parent-${user.id}`
  } else if (teacherToken) {
    const { data: t } = await sb.from('teachers').select('id')
      .eq('access_token', teacherToken).eq('status', 'active').single()
    if (t) folder = `teacher-${t.id}`
  }
  if (!folder) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
  if (file.size > 10_000_000) return NextResponse.json({ error: 'max 10MB' }, { status: 400 })

  const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `updates/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buf  = await file.arrayBuffer()
  const { error } = await sb.storage.from('post-images')
    .upload(path, buf, { contentType: file.type, upsert: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const { data: pub } = sb.storage.from('post-images').getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl })
}
