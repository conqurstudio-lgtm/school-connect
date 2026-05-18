// /api/teachers
// Admin endpoints for creating, listing, hiding/reactivating, and rotating teacher links.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string)     { return cookieStore.get(name)?.value },
        set()                  {}, // server-side, RLS handles auth
        remove()               {},
      },
    }
  )
}

// Generate a 32-char URL-safe random token
function generateToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, 'a')
    .replace(/\//g, 'b')
    .replace(/=/g, '')
}

// ── GET /api/teachers ─ list all teachers in admin's school ─────
export async function GET() {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Get admin's school
  const { data: school } = await supabase
    .from('schools').select('id').eq('owner_id', user.id).single()
  if (!school) return NextResponse.json({ error: 'no school' }, { status: 404 })

  const { data: teachers, error } = await supabase
    .from('teachers').select('*')
    .eq('school_id', school.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teachers })
}

// ── POST /api/teachers ─ add a new teacher ──────────────────────
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: school } = await supabase
    .from('schools').select('id').eq('owner_id', user.id).single()
  if (!school) return NextResponse.json({ error: 'no school' }, { status: 404 })

  const body = await req.json()
  const { name, grade, class_name, email } = body
  if (!name || !grade) {
    return NextResponse.json({ error: 'name and grade required' }, { status: 400 })
  }

  const access_token = generateToken()

  const { data: teacher, error } = await supabase
    .from('teachers')
    .insert({
      school_id:    school.id,
      name:         name.trim(),
      grade:        grade.trim(),
      class_name:   class_name?.trim() || null,
      email:        email?.trim() || null,
      access_token,
      status:       'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teacher })
}

// ── PATCH /api/teachers ─ update teacher (revoke / rotate / edit) ─
export async function PATCH(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: school } = await supabase
    .from('schools').select('id').eq('owner_id', user.id).single()
  if (!school) return NextResponse.json({ error: 'no school' }, { status: 404 })

  const body = await req.json()
  const { id, action, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  let updates: any = {}
  if (action === 'revoke') {
    updates.status = 'inactive'
    updates.updated_at = new Date().toISOString()
  } else if (action === 'reactivate') {
    updates.status = 'active'
    updates.updated_at = new Date().toISOString()
  } else if (action === 'rotate') {
    updates.access_token = generateToken()
    updates.updated_at = new Date().toISOString()
  } else {
    updates = { ...fields, updated_at: new Date().toISOString() }
  }

  const { data: teacher, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .eq('school_id', school.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ teacher })
}

// ── DELETE /api/teachers?id=... ─ delete a teacher ──────────────
export async function DELETE(req: NextRequest) {
  const supabase = getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: school } = await supabase
    .from('schools').select('id').eq('owner_id', user.id).single()
  if (!school) return NextResponse.json({ error: 'no school' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('teachers')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('school_id', school.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
