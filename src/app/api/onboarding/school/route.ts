// /api/onboarding/school?slug=...  → return public school info
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const sb = adminClient()
  const { data: school } = await sb.from('schools')
    .select('id, name, slug, logo_url')
    .eq('slug', slug).single()
  if (!school) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({ school })
}
