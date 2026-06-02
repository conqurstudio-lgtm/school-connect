import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DEFAULT_SUBJECTS = ['Mathematics', 'English', 'Life Skills', 'Behaviour']

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
  const { data } = await sb.from('teachers').select('*').eq('access_token', token).maybeSingle()

  if (!data) return null

  const blocked = ['rejected', 'revoked', 'inactive', 'disabled']
  if (blocked.includes(String(data.status || '').toLowerCase())) return null

  return data
}

function normalizeSubjects(input: unknown) {
  const raw = Array.isArray(input) ? input : DEFAULT_SUBJECTS
  const seen = new Set<string>()

  const subjects = raw
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 40))
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 12)

  return subjects.length ? subjects : DEFAULT_SUBJECTS
}

export async function POST(req: NextRequest) {
  const teacher = await getTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const subjects = normalizeSubjects(body.subjects)

  if (subjects.length > 12) {
    return NextResponse.json({ error: 'Use 12 subjects or fewer' }, { status: 400 })
  }

  const sb = adminClient()

  const { data, error } = await sb
    .from('teachers')
    .update({
      report_subjects: subjects,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teacher.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    report_subjects: subjects,
    teacher: data,
  })
}
