// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function serviceClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY

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

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

async function getLoggedInUser(
  request: NextRequest
) {
  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
  } =
    await supabase.auth.getUser()

  if (
    error ||
    !user
  ) {
    return null
  }

  return user
}

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      await getLoggedInUser(
        request
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    const sb =
      serviceClient()

    /*
    |--------------------------------------------------------------------------
    | 1. CHECK WHETHER THIS USER OWNS A GROUP
    |--------------------------------------------------------------------------
    */

    const {
      data: group,
      error:
        groupError,
    } = await sb
      .from(
        'school_groups'
      )
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

    /*
    |--------------------------------------------------------------------------
    | 2. STANDALONE / BRANCH SCHOOL
    |--------------------------------------------------------------------------
    */

    if (!group) {
      return NextResponse.json({
        ok: true,
        is_group_owner: false,
        group: null,
        schools: [],
        pending_invites: [],
      })
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOAD ACCEPTED GROUP MEMBERS
    |--------------------------------------------------------------------------
    */

    const {
      data: members,
      error:
        membersError,
    } = await sb
      .from(
        'school_group_members'
      )
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

    const schoolIds =
      (
        members ||
        []
      )
        .map(
          (
            member: any
          ) =>
            member.school_id
        )
        .filter(Boolean)

    /*
    |--------------------------------------------------------------------------
    | 4. LOAD NORMAL SCHOOL RECORDS
    |--------------------------------------------------------------------------
    */

    let schools: any[] =
      []

    if (
      schoolIds.length >
      0
    ) {
      const {
        data:
          schoolRows,
        error:
          schoolsError,
      } = await sb
        .from(
          'schools'
        )
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

      if (
        schoolsError
      ) {
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

      schools =
        (
          members ||
          []
        ).map(
          (
            member: any
          ) => {
            const school =
              (
                schoolRows ||
                []
              ).find(
                (
                  row: any
                ) =>
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

    /*
    |--------------------------------------------------------------------------
    | 5. LOAD PENDING BRANCH INVITATIONS
    |--------------------------------------------------------------------------
    */

    const {
      data:
        pendingInviteRows,
      error:
        pendingInvitesError,
    } = await sb
      .from(
        'school_group_invites'
      )
      .select(
        `
          id,
          group_id,
          school_id,
          email,
          token,
          status,
          expires_at,
          accepted_at,
          created_at,
          school_name,
          school_phone,
          school_email,
          school_province,
          school_address,
          principal_name
        `
      )
      .eq(
        'group_id',
        group.id
      )
      .eq(
        'status',
        'pending'
      )
      .is(
        'school_id',
        null
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (
      pendingInvitesError
    ) {
      console.error(
        '[school-group] pending invite lookup failed:',
        pendingInvitesError
      )

      return NextResponse.json(
        {
          error:
            'Could not load pending school invitations.',
        },
        {
          status: 500,
        }
      )
    }

    const now =
      Date.now()

    const pendingInvites =
      (
        pendingInviteRows ||
        []
      )
        .filter(
          (
            invite: any
          ) => {
            if (
              !invite.expires_at
            ) {
              return true
            }

            return (
              new Date(
                invite.expires_at
              ).getTime() >
              now
            )
          }
        )
        .map(
          (
            invite: any
          ) => ({
            id:
              invite.id,

            group_id:
              invite.group_id,

            school_id:
              invite.school_id,

            token:
              invite.token,

            status:
              invite.status,

            expires_at:
              invite.expires_at,

            created_at:
              invite.created_at,

            school_name:
              invite.school_name,

            school_phone:
              invite.school_phone,

            school_email:
              invite.school_email,

            school_province:
              invite.school_province,

            school_address:
              invite.school_address,

            principal_name:
              invite.principal_name,

            principal_email:
              invite.email,
          })
        )

    /*
    |--------------------------------------------------------------------------
    | 6. RETURN GROUP OVERVIEW
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      ok: true,

      is_group_owner:
        true,

      group,

      schools,

      pending_invites:
        pendingInvites,
    })
  } catch (
    error: any
  ) {
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

export async function DELETE(
  request: NextRequest
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | 1. CONFIRM LOGGED-IN USER
    |--------------------------------------------------------------------------
    */

    const user =
      await getLoggedInUser(
        request
      )

    if (!user) {
      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 2. READ MEMBERSHIP ID
    |--------------------------------------------------------------------------
    */

    let body: any = {}

    try {
      body =
        await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid request body.',
        },
        {
          status: 400,
        }
      )
    }

    const membershipId =
      String(
        body.membership_id ||
        ''
      ).trim()

    if (!membershipId) {
      return NextResponse.json(
        {
          error:
            'School membership ID is required.',
        },
        {
          status: 400,
        }
      )
    }

    const sb =
      serviceClient()

    /*
    |--------------------------------------------------------------------------
    | 3. CONFIRM THIS USER OWNS THE GROUP
    |--------------------------------------------------------------------------
    */

    const {
      data: group,
      error: groupError,
    } = await sb
      .from(
        'school_groups'
      )
      .select(
        `
          id,
          primary_school_id,
          owner_user_id
        `
      )
      .eq(
        'owner_user_id',
        user.id
      )
      .maybeSingle()

    if (groupError) {
      console.error(
        '[school-group-remove] group lookup failed:',
        groupError
      )

      return NextResponse.json(
        {
          error:
            'Could not confirm school group.',
        },
        {
          status: 500,
        }
      )
    }

    if (!group) {
      return NextResponse.json(
        {
          error:
            'Only the School Group owner can remove a branch.',
        },
        {
          status: 403,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 4. LOAD MEMBERSHIP FROM THIS GROUP
    |--------------------------------------------------------------------------
    */

    const {
      data: membership,
      error: membershipError,
    } = await sb
      .from(
        'school_group_members'
      )
      .select(
        `
          id,
          group_id,
          school_id,
          member_type
        `
      )
      .eq(
        'id',
        membershipId
      )
      .eq(
        'group_id',
        group.id
      )
      .maybeSingle()

    if (membershipError) {
      console.error(
        '[school-group-remove] membership lookup failed:',
        membershipError
      )

      return NextResponse.json(
        {
          error:
            'Could not load this school membership.',
        },
        {
          status: 500,
        }
      )
    }

    if (!membership) {
      return NextResponse.json(
        {
          error:
            'School membership not found.',
        },
        {
          status: 404,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 5. NEVER ALLOW THE MAIN SCHOOL TO BE REMOVED
    |--------------------------------------------------------------------------
    */

    if (
      membership.member_type ===
        'primary' ||
      membership.school_id ===
        group.primary_school_id
    ) {
      return NextResponse.json(
        {
          error:
            'The main school cannot be removed from its own School Group.',
        },
        {
          status: 409,
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | 6. REMOVE ONLY THE GROUP MEMBERSHIP
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | We do NOT delete the school.
    | We do NOT delete the principal.
    | We do NOT delete teachers, learners, reports, Moments or parent data.
    |
    | The branch simply becomes a standalone School Connect school.
    |--------------------------------------------------------------------------
    */

    const {
      error: deleteError,
    } = await sb
      .from(
        'school_group_members'
      )
      .delete()
      .eq(
        'id',
        membership.id
      )
      .eq(
        'group_id',
        group.id
      )

    if (deleteError) {
      console.error(
        '[school-group-remove] unlink failed:',
        deleteError
      )

      return NextResponse.json(
        {
          error:
            'Could not remove this school from the group.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      ok: true,

      message:
        'School removed from group.',

      school_id:
        membership.school_id,
    })
  } catch (error: any) {
    console.error(
      '[school-group-remove] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not remove this school from the group.',
      },
      {
        status: 500,
      }
    )
  }
}

