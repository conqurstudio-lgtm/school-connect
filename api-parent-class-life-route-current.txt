// @ts-nocheck
// /api/parent/class-life?teacher_id=...
// Parent-facing class updates for the Class Space screen.

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
    {
      cookies: {
        get(name: string) { return store.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

export async function GET(req: NextRequest) {
  const teacherId = req.nextUrl.searchParams.get('teacher_id')
  if (!teacherId) {
    return NextResponse.json({ error: 'teacher_id required' }, { status: 400 })
  }

  const supa = userClient()
  const { data: { user } } = await supa.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', posts: [] }, { status: 401 })
  }

  const sb = adminClient()

  // Keep Class Life protected. If this parent is not approved for this class,
  // return an empty set instead of exposing the class posts.
  let approved = false

  try {
    const { data: joinReq } = await sb.from('class_join_requests')
      .select('id, status')
      .eq('teacher_id', teacherId)
      .eq('parent_id', user.id)
      .eq('status', 'approved')
      .limit(1)

    approved = (joinReq ?? []).length > 0
  } catch {
    // Some older schemas may not have parent_id/status exactly as above.
    // In that case, let the page fail closed.
    approved = false
  }

  if (!approved) {
    return NextResponse.json({ posts: [], approved: false })
  }

  try {
    const { data: posts, error } = await sb.from('posts')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ posts: [], approved: true, warning: error.message })
    }

    return NextResponse.json({ posts: posts ?? [], approved: true })
  } catch (e: any) {
    return NextResponse.json({ posts: [], approved: true, warning: e?.message || 'Could not load posts' })
  }
}
