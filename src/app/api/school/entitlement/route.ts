// @ts-nocheck

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import {
  createServerClient,
} from '@supabase/ssr'

import {
  createClient,
} from '@supabase/supabase-js'

export const dynamic =
  'force-dynamic'

export const revalidate = 0

function serviceClient() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL

  const serviceKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY

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

function subscriptionIsUsable(
  subscription: any
) {
  if (!subscription) {
    return false
  }

  if (
    subscription.status ===
    'active'
  ) {
    return true
  }

  if (
    subscription.status !==
    'trialing'
  ) {
    return false
  }

  if (
    !subscription.trial_ends_at
  ) {
    return false
  }

  return (
    new Date(
      subscription.trial_ends_at
    ).getTime() >
    Date.now()
  )
}

async function findUsableSubscription(
  sb: any,
  field:
    | 'school_id'
    | 'group_id',
  id: string
) {
  const {
    data,
    error,
  } = await sb
    .from(
      'school_subscriptions'
    )
    .select('*')
    .eq(
      field,
      id
    )
    .in(
      'status',
      [
        'trialing',
        'active',
        'past_due',
      ]
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    )

  if (error) {
    throw error
  }

  return (
    data ||
    []
  ).find(
    subscriptionIsUsable
  ) || null
}

export async function GET(
  request: NextRequest
) {
  try {
    // --------------------------------------------------------
    // 1. AUTHENTICATED USER
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // 2. FIND USER'S SCHOOL
    // --------------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await sb
      .from('profiles')
      .select('*')
      .eq(
        'id',
        user.id
      )
      .maybeSingle()

    if (profileError) {
      console.error(
        '[school-entitlement] profile lookup failed:',
        profileError
      )

      return NextResponse.json(
        {
          error:
            'Could not load school profile.',
        },
        {
          status: 500,
        }
      )
    }

    let schoolId =
      profile?.school_id ||
      profile?.managed_school_id ||
      null

    /*
     * Older accounts may not have
     * a complete profile link.
     * Fall back to school ownership.
     */

    if (!schoolId) {
      const {
        data: ownedSchool,
        error: ownedSchoolError,
      } = await sb
        .from('schools')
        .select('id')
        .eq(
          'owner_id',
          user.id
        )
        .maybeSingle()

      if (
        ownedSchoolError
      ) {
        console.error(
          '[school-entitlement] owned school lookup failed:',
          ownedSchoolError
        )
      }

      schoolId =
        ownedSchool?.id ||
        null
    }

    if (!schoolId) {
      return NextResponse.json(
        {
          error:
            'No school is linked to this account.',
        },
        {
          status: 404,
        }
      )
    }

    // --------------------------------------------------------
    // 3. CHECK GROUP MEMBERSHIP
    // --------------------------------------------------------

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
        'school_id',
        schoolId
      )
      .maybeSingle()

    if (membershipError) {
      console.error(
        '[school-entitlement] group membership lookup failed:',
        membershipError
      )

      return NextResponse.json(
        {
          error:
            'Could not check school group membership.',
        },
        {
          status: 500,
        }
      )
    }

    let group: any = null

    if (
      membership?.group_id
    ) {
      const {
        data: groupRow,
        error: groupError,
      } = await sb
        .from(
          'school_groups'
        )
        .select(
          `
            id,
            name,
            primary_school_id,
            owner_user_id
          `
        )
        .eq(
          'id',
          membership.group_id
        )
        .maybeSingle()

      if (groupError) {
        console.error(
          '[school-entitlement] group lookup failed:',
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

      group =
        groupRow
    }

    // --------------------------------------------------------
    // 4. GROUP SUBSCRIPTION HAS FIRST PRIORITY
    // --------------------------------------------------------

    let subscription: any =
      null

    let entitlementSource:
      | 'group'
      | 'school'
      | 'starter' =
      'starter'

    if (
      group?.id
    ) {
      subscription =
        await findUsableSubscription(
          sb,
          'group_id',
          group.id
        )

      if (subscription) {
        entitlementSource =
          'group'
      }
    }

    // --------------------------------------------------------
    // 5. FALL BACK TO SCHOOL'S OWN SUBSCRIPTION
    // --------------------------------------------------------

    if (!subscription) {
      subscription =
        await findUsableSubscription(
          sb,
          'school_id',
          schoolId
        )

      if (subscription) {
        entitlementSource =
          'school'
      }
    }

    // --------------------------------------------------------
    // 6. NO VALID SUBSCRIPTION = STARTER
    // --------------------------------------------------------

    const effectivePlanCode =
      subscription?.plan_code ||
      'starter'

    const {
      data: plan,
      error: planError,
    } = await sb
      .from(
        'school_plans'
      )
      .select('*')
      .eq(
        'code',
        effectivePlanCode
      )
      .eq(
        'is_active',
        true
      )
      .maybeSingle()

    if (
      planError ||
      !plan
    ) {
      console.error(
        '[school-entitlement] plan lookup failed:',
        planError
      )

      return NextResponse.json(
        {
          error:
            'Could not load School Connect plan.',
        },
        {
          status: 500,
        }
      )
    }

    // --------------------------------------------------------
    // 7. RETURN EFFECTIVE ACCESS
    // --------------------------------------------------------

    return NextResponse.json({
      ok: true,

      school_id:
        schoolId,

      is_group_member:
        !!membership,

      is_group_owner:
        !!group &&
        group.owner_user_id ===
          user.id,

      group_id:
        group?.id ||
        null,

      group_name:
        group?.name ||
        null,

      member_type:
        membership?.member_type ||
        null,

      source:
        entitlementSource,

      plan_code:
        plan.code,

      plan_name:
        plan.name,

      plan_type:
        plan.plan_type,

      plan,

      subscription:
        subscription
          ? {
              id:
                subscription.id,

              status:
                subscription.status,

              plan_code:
                subscription.plan_code,

              monthly_price_cents:
                subscription
                  .monthly_price_cents,

              is_founding_rate:
                subscription
                  .is_founding_rate,

              trial_started_at:
                subscription
                  .trial_started_at,

              trial_ends_at:
                subscription
                  .trial_ends_at,

              current_period_start:
                subscription
                  .current_period_start,

              current_period_end:
                subscription
                  .current_period_end,

              cancel_at_period_end:
                subscription
                  .cancel_at_period_end,
            }
          : null,
    })
  } catch (
    error: any
  ) {
    console.error(
      '[school-entitlement] unexpected error:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not load school entitlement.',
      },
      {
        status: 500,
      }
    )
  }
}
