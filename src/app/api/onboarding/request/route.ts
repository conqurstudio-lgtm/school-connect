// /api/onboarding/request POST { school_id, requested_name, requested_grade? }
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

  const { school_id, requested_name, requested_grade } = await req.json()
  if (!school_id || !requested_name?.trim()) {
    return NextResponse.json({ error: 'school_id and requested_name required' }, { status: 400 })
  }

  const sb = adminClient()
  // Set school on profile if missing
  await sb.from('profiles').update({ school_id }).eq('id', user.id)

  const { data, error } = await sb.from('join_requests').insert({
    school_id,
    profile_id:      user.id,
    requested_name:  requested_name.trim(),
    requested_grade: requested_grade?.trim() || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ request: data })
}
