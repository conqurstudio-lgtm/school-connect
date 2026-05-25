// /api/teacher/parents  — list parents in this teacher's class for the updates inbox
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getTeacher(req: NextRequest) {
  const token = req.cookies.get('teacher_token')?.value
  if (!token) return null
  const sb = adminClient()
  const { data } = await sb.from('teachers').select('*')
    .eq('access_token', token).eq('status', 'active').single()
  return data
}

export async function GET(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const sb = adminClient()

  // Find all children in this teacher's class
  let kidsQuery = sb.from('children')
    .select('id, name')
    .eq('school_id', teacher.school_id)
    .eq('grade', teacher.grade)
    .eq('status', 'active')
  if (teacher.class_name) {
    kidsQuery = kidsQuery.eq('class_name', teacher.class_name)
  }
  const { data: kids } = await kidsQuery

  const childIds = (kids ?? []).map((c: any) => c.id)
  const childById: Record<string, string> = {}
  for (const k of (kids ?? [])) childById[k.id] = k.name

  // Find guardians of these children
  const { data: links } = childIds.length > 0
    ? await sb.from('child_guardians').select('guardian_id, child_id').in('child_id', childIds)
    : { data: [] as any[] }

  // Plus legacy parents matched by profiles.child_name
  const { data: legacy } = await sb.from('profiles')
    .select('id, full_name, child_name')
    .eq('school_id', teacher.school_id)
    .eq('role', 'parent')
    .not('child_name', 'is', null)

  const parents: Record<string, { id: string; name: string; child_names: string[] }> = {}

  for (const link of (links ?? [])) {
    if (!parents[link.guardian_id]) {
      parents[link.guardian_id] = { id: link.guardian_id, name: '', child_names: [] }
    }
    const childName = childById[link.child_id]
    if (childName && !parents[link.guardian_id].child_names.includes(childName)) {
      parents[link.guardian_id].child_names.push(childName)
    }
  }

  // Add legacy parents whose child_name matches a kid in this class
  for (const p of (legacy ?? [])) {
    const matchedKid = (kids ?? []).find((k: any) =>
      k.name?.toLowerCase() === p.child_name?.toLowerCase())
    if (matchedKid) {
      if (!parents[p.id]) {
        parents[p.id] = { id: p.id, name: '', child_names: [] }
      }
      if (!parents[p.id].child_names.includes(matchedKid.name)) {
        parents[p.id].child_names.push(matchedKid.name)
      }
    }
  }

  // Fetch parent names
  const parentIds = Object.keys(parents)
  if (parentIds.length > 0) {
    const { data: profiles } = await sb.from('profiles')
      .select('id, full_name').in('id', parentIds)
    for (const p of (profiles ?? [])) {
      if (parents[p.id]) parents[p.id].name = p.full_name || 'Parent'
    }
  }

  // For each parent, get the latest update + unread count
  const parentList = Object.values(parents)
  for (const p of parentList) {
    const { data: latest } = await sb.from('updates')
      .select('id, body, created_at, author_kind')
      .eq('teacher_id', teacher.id)
      .eq('parent_id', p.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ;(p as any).latest_update = latest
  }

  // Sort by latest activity
  parentList.sort((a: any, b: any) => {
    const at = a.latest_update?.created_at || '0'
    const bt = b.latest_update?.created_at || '0'
    return bt.localeCompare(at)
  })

  return NextResponse.json({ parents: parentList })
}
