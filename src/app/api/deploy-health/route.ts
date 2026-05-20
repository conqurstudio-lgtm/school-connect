// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function maskPresent(value?: string) {
  return Boolean(value && value.trim().length > 0)
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

async function safeTableCheck(sb: any, table: string, select = 'id') {
  try {
    const { data, error } = await sb
      .from(table)
      .select(select)
      .limit(1)

    return {
      ok: !error,
      table,
      count_sample: Array.isArray(data) ? data.length : 0,
      error: error?.message || null,
    }
  } catch (e: any) {
    return {
      ok: false,
      table,
      count_sample: 0,
      error: e?.message || 'Unknown error',
    }
  }
}

export async function GET(req: NextRequest) {
  const expectedToken = process.env.DEPLOY_HEALTH_TOKEN

  if (!expectedToken) {
    return NextResponse.json(
      {
        ok: false,
        disabled: true,
        message: 'DEPLOY_HEALTH_TOKEN is not set. Add it in Vercel to enable this temporary diagnostic endpoint.',
      },
      { status: 404 }
    )
  }

  const suppliedToken =
    req.nextUrl.searchParams.get('token') ||
    req.headers.get('x-deploy-health-token')

  if (suppliedToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: maskPresent(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: maskPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: maskPresent(process.env.SUPABASE_SERVICE_ROLE_KEY),
    NEXT_PUBLIC_SITE_URL: maskPresent(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_APP_URL: maskPresent(process.env.NEXT_PUBLIC_APP_URL),
    VERCEL_ENV: process.env.VERCEL_ENV || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
  }

  const sb = adminClient()

  const result: any = {
    ok: true,
    checked_at: new Date().toISOString(),
    env,
    supabase: {
      configured: Boolean(sb),
      url_host: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? (() => {
            try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host } catch { return 'invalid-url' }
          })()
        : null,
    },
    tables: [],
    storage: null,
  }

  if (!sb) {
    result.ok = false
    result.supabase.error = 'Supabase admin client could not be created. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    return NextResponse.json(result, { status: 200 })
  }

  result.tables = await Promise.all([
    safeTableCheck(sb, 'schools', 'id, slug'),
    safeTableCheck(sb, 'teachers', 'id, status'),
    safeTableCheck(sb, 'posts', 'id, created_at'),
    safeTableCheck(sb, 'updates', 'id, created_at'),
    safeTableCheck(sb, 'profiles', 'id, full_name'),
  ])

  try {
    const { data, error } = await sb.storage.listBuckets()
    result.storage = {
      ok: !error,
      bucket_count: Array.isArray(data) ? data.length : 0,
      buckets: Array.isArray(data)
        ? data.map((b: any) => ({
            id: b.id,
            name: b.name,
            public: b.public,
          }))
        : [],
      error: error?.message || null,
    }
  } catch (e: any) {
    result.storage = {
      ok: false,
      bucket_count: 0,
      buckets: [],
      error: e?.message || 'Unknown storage error',
    }
  }

  return NextResponse.json(result, { status: 200 })
}
