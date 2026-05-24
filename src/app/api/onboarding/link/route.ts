// /api/onboarding/link
// parent-child-claim-flow-v1  POST { child_id }
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
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { child_id } = await req.json()
  if (!child_id) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

  const sb = adminClient()

  // Make sure the child exists
  const { data: child } = await sb.from('children')
    .select('id, school_id, name, grade, class_name').eq('id', child_id).single()
  if (!child) return NextResponse.json({ error: 'child not found' }, { status: 404 })

  // Ensure the parent's profile is in this school
  const { data: profile } = await sb.from('profiles')
    .select('id, school_id').eq('id', user.id).single()

  if (!profile?.school_id || profile.school_id !== child.school_id) {
    // Set the school on the profile if missing
    await sb.from('profiles').update({
      school_id: child.school_id,
      role: 'parent',
      child_name: child.name,
      child_grade: child.grade,
    }).eq('id', user.id)
  } else {
    await sb.from('profiles').update({
      role: 'parent',
      child_name: child.name,
      child_grade: child.grade,
    }).eq('id', user.id)
  }

  // Create the link (idempotent)
  const { error } = await sb.from('child_guardians')
    .insert({ child_id, guardian_id: user.id })
    .select().single()
  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, child })
}

// DELETE — unlink a child
export async function DELETE(req: NextRequest) {
  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const child_id = req.nextUrl.searchParams.get('child_id')
  if (!child_id) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

  const sb = adminClient()
  await sb.from('child_guardians')
    .delete().eq('child_id', child_id).eq('guardian_id', user.id)
  return NextResponse.json({ ok: true })
}
