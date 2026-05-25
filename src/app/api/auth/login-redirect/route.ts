// @ts-nocheck
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CookieToSet = {
  name: string
  value: string
  options?: any
}

function safePath(value: FormDataEntryValue | null) {
  const raw = String(value || '/school').trim()
  if (!raw.startsWith('/')) return '/school'
  if (raw.startsWith('//')) return '/school'
  if (raw.startsWith('/auth/login')) return '/school'
  return raw || '/school'
}

function redirectWithCookies(request: NextRequest, path: string, cookiesToSet: CookieToSet[]) {
  const url = new URL(path, request.url)
  const response = NextResponse.redirect(url, 303)

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  }

  return response
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const redirectTo = safePath(formData.get('redirectTo'))

  if (!email || !password) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('error', 'Email and password are required')
    return NextResponse.redirect(url, 303)
  }

  const cookiesToSet: CookieToSet[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(nextCookies) {
          cookiesToSet.push(...nextCookies)
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session?.user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('error', error?.message || 'Login failed. Please check your details.')
    return redirectWithCookies(request, `${url.pathname}${url.search}`, cookiesToSet)
  }

  return redirectWithCookies(request, redirectTo, cookiesToSet)
}
