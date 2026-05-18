// /api/updates/react  — parent or teacher toggles a reaction on an update
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

// Parent reacts
export async function POST(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  const teacherToken = req.cookies.get('teacher_token')?.value
  const sb = adminClient()

  const { update_id, type } = await req.json()
  if (!update_id || !type) return NextResponse.json({ error: 'update_id and type required' }, { status: 400 })

  let parent_id: string | null = null
  let teacher_id: string | null = null

  if (user) {
    parent_id = user.id
  } else if (teacherToken) {
    const { data: t } = await sb.from('teachers').select('id')
      .eq('access_token', teacherToken).eq('status', 'active').single()
    if (t) teacher_id = t.id
  }
  if (!parent_id && !teacher_id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Verify they're a participant in this update's thread
  const { data: upd } = await sb.from('updates').select('parent_id, teacher_id')
    .eq('id', update_id).single()
  if (!upd) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (parent_id && upd.parent_id !== parent_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (teacher_id && upd.teacher_id !== teacher_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  // Toggle: if reaction with same type exists, remove; otherwise upsert
  let query = sb.from('update_reactions').select('id, type').eq('update_id', update_id)
  if (parent_id) query = query.eq('parent_id', parent_id)
  if (teacher_id) query = query.eq('teacher_id', teacher_id)
  const { data: existing } = await query.maybeSingle()

  if (existing && existing.type === type) {
    await sb.from('update_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ removed: true })
  }

  if (existing) {
    await sb.from('update_reactions').update({ type }).eq('id', existing.id)
  } else {
    await sb.from('update_reactions').insert({
      update_id, parent_id, teacher_id, type,
    })
  }
  return NextResponse.json({ ok: true })
}
