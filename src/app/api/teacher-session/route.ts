// /api/teacher-session
// Validates a teacher's access token and returns their profile + class roster.
// Sets an HTTP-only cookie so subsequent calls don't need the token in the URL.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// GET /api/teacher-session?token=...  → validate and return teacher
// GET /api/teacher-session            → use cookie
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const tokenFromUrl = url.searchParams.get('token')
  const token = tokenFromUrl ?? req.cookies.get('teacher_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'no token' }, { status: 401 })
  }

  const sb = adminClient()
  const { data: teacher } = await sb
    .from('teachers')
    .select('*')
    .eq('access_token', token)
    .eq('status', 'active')
    .single()

  if (!teacher) {
    return NextResponse.json({ error: 'invalid or revoked' }, { status: 401 })
  }

  // Touch last_seen_at
  await sb.from('teachers')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', teacher.id)

  // Get their class roster
  const { data: children } = await sb
    .from('children')
    .select('id, name, grade, class_name, status, created_at')
    .eq('school_id', teacher.school_id)
    .eq('grade', teacher.grade)
    .eq('status', 'active')
    .order('name')

  // Filter by class_name if teacher has one
  const filteredChildren = teacher.class_name
    ? (children ?? []).filter(c => c.class_name === teacher.class_name)
    : (children ?? [])

  // For each child, count guardians
  const childIds = filteredChildren.map(c => c.id)
  const { data: guardianLinks } = childIds.length > 0
    ? await sb.from('child_guardians')
        .select('child_id, guardian_id')
        .in('child_id', childIds)
    : { data: [] as any[] }

  const guardianCountMap: Record<string, number> = {}
  for (const g of (guardianLinks ?? [])) {
    guardianCountMap[g.child_id] = (guardianCountMap[g.child_id] || 0) + 1
  }

  const childrenWithCounts = filteredChildren.map(c => ({
    ...c,
    guardian_count: guardianCountMap[c.id] || 0,
  }))

  // School info
  const { data: school } = await sb
    .from('schools')
    .select('id, name, logo_url')
    .eq('id', teacher.school_id)
    .single()

  const res = NextResponse.json({
    teacher: {
      id:           teacher.id,
      name:         teacher.name,
      email:        teacher.email,
      photo_url:    teacher.photo_url,
      grade:        teacher.grade,
      class_name:   teacher.class_name,
    },
    school,
    children: childrenWithCounts,
  })

  // Set cookie if it wasn't already set (i.e. first visit via URL token)
  if (tokenFromUrl || !req.cookies.get('teacher_token')) {
    res.cookies.set('teacher_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 30,   // 30 days
      path:     '/',
    })
  }

  return res
}

// POST /api/teacher-session  → log out (clear cookie)
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('teacher_token', '', { maxAge: 0, path: '/' })
  return res
}
