// /api/updates/reply  — parent or teacher posts a one-level reply
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

  const { update_id, body } = await req.json()
  if (!update_id || !body?.trim()) {
    return NextResponse.json({ error: 'update_id and body required' }, { status: 400 })
  }

  let parent_id: string | null = null
  let teacher_id: string | null = null

  if (user) parent_id = user.id
  else if (teacherToken) {
    const { data: t } = await sb.from('teachers').select('id')
      .eq('access_token', teacherToken).eq('status', 'active').single()
    if (t) teacher_id = t.id
  }
  if (!parent_id && !teacher_id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: upd } = await sb.from('updates').select('parent_id, teacher_id').eq('id', update_id).single()
  if (!upd) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (parent_id && upd.parent_id !== parent_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (teacher_id && upd.teacher_id !== teacher_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { data, error } = await sb.from('update_replies').insert({
    update_id,
    parent_id,
    teacher_id,
    body: body.trim(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ reply: data })
}

export async function DELETE(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  const teacherToken = req.cookies.get('teacher_token')?.value
  const sb = adminClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: r } = await sb.from('update_replies')
    .select('parent_id, teacher_id').eq('id', id).single()
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (user && r.parent_id === user.id) {
    await sb.from('update_replies').delete().eq('id', id)
    return NextResponse.json({ ok: true })
  }
  if (teacherToken && r.teacher_id) {
    const { data: t } = await sb.from('teachers').select('id')
      .eq('access_token', teacherToken).eq('status', 'active').single()
    if (t && t.id === r.teacher_id) {
      await sb.from('update_replies').delete().eq('id', id)
      return NextResponse.json({ ok: true })
    }
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}
