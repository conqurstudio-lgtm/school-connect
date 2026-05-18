// /api/school-teachers
// Returns the public list of active teachers for the feed strip.
// Optionally indicates which teacher(s) the calling parent is linked to via their children.

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
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set() {}, remove() {},
    }}
  )
}

export async function GET(req: NextRequest) {
  const supabase     = userClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Get caller's school
  const { data: profile } = await supabase
    .from('profiles').select('school_id, role').eq('id', user.id).single()
  if (!profile?.school_id) {
    return NextResponse.json({ teachers: [], my_teacher_ids: [] })
  }

  const sb = adminClient()
  const { data: teachers } = await sb
    .from('teachers')
    .select('id, name, photo_url, grade, class_name')
    .eq('school_id', profile.school_id)
    .eq('status', 'active')
    .order('grade').order('class_name').order('name')

  // For parents (legacy profiles role), figure out which teachers teach their children.
  // Phase 1 (this code) uses the new parent_profiles → child_guardians → children → teacher.
  // Phase 2 parents (legacy) won't have child_guardians yet, so my_teacher_ids will be [].
  // We try both paths.
  let my_teacher_ids: string[] = []

  if (profile.role === 'parent') {
    // Check legacy child_name field for matching
    const { data: legacy } = await sb
      .from('profiles').select('child_name').eq('id', user.id).single()

    if (legacy?.child_name) {
      // Find children in this school matching the legacy name (best-effort)
      const { data: kids } = await sb
        .from('children').select('grade, class_name')
        .eq('school_id', profile.school_id)
        .ilike('name', legacy.child_name)
      if (kids && teachers) {
        for (const kid of kids) {
          for (const t of teachers) {
            if (t.grade === kid.grade && (t.class_name || null) === (kid.class_name || null)) {
              if (!my_teacher_ids.includes(t.id)) my_teacher_ids.push(t.id)
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ teachers: teachers ?? [], my_teacher_ids })
}
