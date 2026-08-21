// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is not configured'
    )
  }

  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function getLoggedInUser(
  request: NextRequest
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll() {
          // Read-only API.
        },
      },
    }
  )

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest
) {
  try {
    const user = await getLoggedInUser(request)

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const sb = serviceClient()

    // ---------------------------------------------------------
    // 1. CHECK WHETHER THIS USER OWNS A GROUP
    // ---------------------------------------------------------

    const {
      data: group,
      error: groupError,
    } = await sb
      .from('school_groups')
      .select(
        `
          id,
          name,
          primary_school_id,
          owner_user_id,
          created_at,
          updated_at
        `
      )
      .eq(
        'owner_user_id',
        user.id
      )
      .maybeSingle()

    if (groupError) {
      console.error(
        '[school-group] group lookup failed:',
        groupError
      )

      return NextResponse.json(
        {
          error:
            'Could not load school group.',
        },
        {
          status: 500,
        }
      )
    }

    // ---------------------------------------------------------
    // 2. STANDALONE SCHOOL
    // ---------------------------------------------------------

    if (!group) {
      return NextResponse.json({
        ok: true,
        is_group_owner: false,
        group: null,
        schools: [],
      })
    }

    // ---------------------------------------------------------
    // 3. LOAD GROUP MEMBERS
    // ---------------------------------------------------------

    const {
      data: members,
      error: membersError,
    } = await sb
      .from('school_group_members')
      .select(
        `
          id,
          group_id,
          school_id,
          member_type,
          created_at
        `
      )
      .eq(
        'group_id',
        group.id
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )

    if (membersError) {
      console.error(
        '[school-group] member lookup failed:',
        membersError
      )

      return NextResponse.json(
        {
          error:
            'Could not load schools in this group.',
        },
        {
          status: 500,
        }
      )
    }

    const schoolIds = (
      members || []
    )
      .map(
        (member: any) =>
          member.school_id
      )
      .filter(Boolean)

    // ---------------------------------------------------------
    // 4. LOAD NORMAL SCHOOL RECORDS
    // ---------------------------------------------------------

    let schools: any[] = []

    if (schoolIds.length > 0) {
      const {
        data: schoolRows,
        error: schoolsError,
      } = await sb
        .from('schools')
        .select(
          `
            id,
            name,
            slug,
            logo_url,
            phone,
            email,
            province,
            address,
            owner_id,
            is_active,
            is_verified,
            created_at
          `
        )
        .in(
          'id',
          schoolIds
        )

      if (schoolsError) {
        console.error(
          '[school-group] school lookup failed:',
          schoolsError
        )

        return NextResponse.json(
          {
            error:
              'Could not load school details.',
          },
          {
            status: 500,
          }
        )
      }

      schools = (
        members || []
      ).map(
        (member: any) => {
          const school = (
            schoolRows || []
          ).find(
            (row: any) =>
              row.id ===
              member.school_id
          )

          return {
            ...school,
            membership_id:
              member.id,
            member_type:
              member.member_type,
          }
        }
      )
    }

    // ---------------------------------------------------------
    // 5. RETURN GROUP OVERVIEW
    // ---------------------------------------------------------

    return NextResponse.json({
      ok: true,
      is_group_owner: true,
      group,
      schools,
    })
  } catch (error: any) {
    console.error(
      '[school-group] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not load school group.',
      },
      {
        status: 500,
      }
    )
  }
}