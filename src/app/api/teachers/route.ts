// @ts-nocheck
// /api/teachers
// Admin endpoints for creating, listing, hiding/reactivating, and rotating teacher links.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function authClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}

async function getSchoolContext() {
  const auth = authClient()

  const {
    data: { user },
  } = await auth.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error: 'unauthorized',
        },
        {
          status: 401,
        }
      ),
    }
  }

  const sb = adminClient()

  const {
    data: school,
    error,
  } = await sb
    .from('schools')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    return {
      error: NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      ),
    }
  }

  if (!school) {
    return {
      error: NextResponse.json(
        {
          error: 'no school',
        },
        {
          status: 404,
        }
      ),
    }
  }

  return {
    sb,
    user,
    school,
  }
}

function subscriptionIsUsable(
  subscription: any
) {
  if (!subscription) {
    return false
  }

  if (
    subscription.status === 'active'
  ) {
    return true
  }

  if (
    subscription.status !== 'trialing'
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
  field: 'school_id' | 'group_id',
  id: string
) {
  const {
    data,
    error,
  } = await sb
    .from('school_subscriptions')
    .select('*')
    .eq(field, id)
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
    data || []
  ).find(
    subscriptionIsUsable
  ) || null
}

async function getTeacherPlan(
  sb: any,
  schoolId: string
) {
  /*
   * Group entitlement has first priority.
   */
  const {
    data: membership,
    error: membershipError,
  } = await sb
    .from('school_group_members')
    .select(
      `
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
    throw membershipError
  }

  let subscription: any = null

  if (
    membership?.group_id
  ) {
    subscription =
      await findUsableSubscription(
        sb,
        'group_id',
        membership.group_id
      )
  }

  /*
   * If there is no usable group plan,
   * check the school's own subscription.
   */
  if (!subscription) {
    subscription =
      await findUsableSubscription(
        sb,
        'school_id',
        schoolId
      )
  }

  /*
   * No usable subscription means Starter.
   */
  const planCode =
    subscription?.plan_code ||
    'starter'

  const {
    data: plan,
    error: planError,
  } = await sb
    .from('school_plans')
    .select(
      `
        code,
        name,
        max_teachers
      `
    )
    .eq(
      'code',
      planCode
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
    throw (
      planError ||
      new Error(
        'School plan could not be loaded.'
      )
    )
  }

  return plan
}

async function checkTeacherLimit(
  sb: any,
  schoolId: string
) {
  const plan =
    await getTeacherPlan(
      sb,
      schoolId
    )

  /*
   * NULL means unlimited.
   */
  if (
    plan.max_teachers ===
    null
  ) {
    return {
      allowed: true,
      plan,
      activeTeachers: null,
    }
  }

  const {
    data: teacherRows,
    error: teacherError,
  } = await sb
    .from('teachers')
    .select(
      `
        id,
        status
      `
    )
    .eq(
      'school_id',
      schoolId
    )

  if (teacherError) {
    throw teacherError
  }

  /*
   * Older teacher rows may have NULL status.
   * Count everything except explicitly inactive.
   */
  const activeTeachers =
    (
      teacherRows ||
      []
    ).filter(
      (teacher: any) =>
        teacher.status !==
        'inactive'
    ).length

  return {
    allowed:
      activeTeachers <
      Number(
        plan.max_teachers
      ),

    plan,

    activeTeachers,
  }
}

function teacherLimitResponse(
  result: any
) {
  const maximum =
    Number(
      result.plan.max_teachers
    )

  return NextResponse.json(
    {
      error:
        `${result.plan.name} allows up to ${maximum} teacher${maximum === 1 ? '' : 's'}. Upgrade your plan to add more teachers.`,

      code:
        'teacher_limit_reached',

      plan_code:
        result.plan.code,

      plan_name:
        result.plan.name,

      max_teachers:
        maximum,

      current_teachers:
        result.activeTeachers,
    },
    {
      status: 403,
    }
  )
}

// Generate a 32-char URL-safe random token
function generateToken(): string {
  const bytes =
    new Uint8Array(24)

  crypto.getRandomValues(
    bytes
  )

  return Buffer
    .from(bytes)
    .toString('base64')
    .replace(/\+/g, 'a')
    .replace(/\//g, 'b')
    .replace(/=/g, '')
}

// ── GET /api/teachers ─ list all teachers in admin's school ─────
export async function GET() {
  const context =
    await getSchoolContext()

  if (context.error) {
    return context.error
  }

  const {
    sb,
    school,
  } = context

  const {
    data: teachers,
    error,
  } = await sb
    .from('teachers')
    .select('*')
    .eq(
      'school_id',
      school.id
    )
    .order(
      'created_at',
      {
        ascending: false,
      }
    )

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    )
  }

  const teacherIds =
    (
      teachers ||
      []
    )
      .map(
        (teacher: any) =>
          teacher.id
      )
      .filter(Boolean)

  const momentSummaryByTeacher:
    Record<
      string,
      {
        moment_count: number
        latest_moment_at:
          string | null
      }
    > = {}

  if (
    teacherIds.length
  ) {
    // service-role-v416
    // Moments are created through the teacher service-role API. School-admin RLS may not
    // expose those rows through the normal browser session, so count them server-side
    // after we have already verified the authenticated admin owns this school.
    const {
      data: moments,
      error: momentError,
    } = await sb
      .from('moments')
      .select(
        'teacher_id,created_at'
      )
      .in(
        'teacher_id',
        teacherIds
      )

    if (!momentError) {
      for (
        const moment of
        moments ||
        []
      ) {
        const teacherId =
          String(
            (moment as any)
              .teacher_id ||
            ''
          )

        if (!teacherId) {
          continue
        }

        if (
          !momentSummaryByTeacher[
            teacherId
          ]
        ) {
          momentSummaryByTeacher[
            teacherId
          ] = {
            moment_count: 0,
            latest_moment_at:
              null,
          }
        }

        momentSummaryByTeacher[
          teacherId
        ].moment_count += 1

        const createdAt =
          (moment as any)
            .created_at ||
          null

        const currentLatest =
          momentSummaryByTeacher[
            teacherId
          ].latest_moment_at

        if (
          createdAt &&
          (
            !currentLatest ||
            new Date(
              createdAt
            ).getTime() >
              new Date(
                currentLatest
              ).getTime()
          )
        ) {
          momentSummaryByTeacher[
            teacherId
          ].latest_moment_at =
            createdAt
        }
      }
    }
  }

  const rows =
    (
      teachers ||
      []
    ).map(
      (teacher: any) => ({
        ...teacher,

        moment_count:
          momentSummaryByTeacher[
            teacher.id
          ]?.moment_count ||
          0,

        latest_moment_at:
          momentSummaryByTeacher[
            teacher.id
          ]?.latest_moment_at ||
          null,
      })
    )

  return NextResponse.json({
    teachers: rows,
  })
}

// ── POST /api/teachers ─ add a new teacher ──────────────────────
export async function POST(
  req: NextRequest
) {
  const context =
    await getSchoolContext()

  if (context.error) {
    return context.error
  }

  const {
    sb,
    school,
  } = context

  const body =
    await req.json()

  const {
    name,
    grade,
    class_name,
    email,
  } = body

  if (
    !name ||
    !grade
  ) {
    return NextResponse.json(
      {
        error:
          'name and grade required',
      },
      {
        status: 400,
      }
    )
  }

  /*
   * Enforce teacher allowance before insert.
   */
  try {
    const limit =
      await checkTeacherLimit(
        sb,
        school.id
      )

    if (!limit.allowed) {
      return teacherLimitResponse(
        limit
      )
    }
  } catch (error: any) {
    console.error(
      '[teachers] plan limit check failed:',
      error
    )

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Could not check teacher allowance.',
      },
      {
        status: 500,
      }
    )
  }

  const access_token =
    generateToken()

  const {
    data: teacher,
    error,
  } = await sb
    .from('teachers')
    .insert({
      school_id:
        school.id,

      name:
        name.trim(),

      grade:
        grade.trim(),

      class_name:
        class_name?.trim() ||
        null,

      email:
        email?.trim() ||
        null,

      access_token,

      status:
        'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    )
  }

  return NextResponse.json({
    teacher,
  })
}

// ── PATCH /api/teachers ─ update teacher (revoke / rotate / edit) ─
export async function PATCH(
  req: NextRequest
) {
  const context =
    await getSchoolContext()

  if (context.error) {
    return context.error
  }

  const {
    sb,
    school,
  } = context

  const body =
    await req.json()

  const {
    id,
    action,
    ...fields
  } = body

  if (!id) {
    return NextResponse.json(
      {
        error:
          'id required',
      },
      {
        status: 400,
      }
    )
  }

  let updates: any = {}

  if (
    action === 'revoke'
  ) {
    updates.status =
      'inactive'

    updates.updated_at =
      new Date()
        .toISOString()
  } else if (
    action ===
    'reactivate'
  ) {
    /*
     * Reactivating a teacher also consumes
     * a teacher seat, so enforce the same limit.
     */
    const {
      data: existingTeacher,
      error:
        existingTeacherError,
    } = await sb
      .from('teachers')
      .select(
        `
          id,
          status
        `
      )
      .eq(
        'id',
        id
      )
      .eq(
        'school_id',
        school.id
      )
      .maybeSingle()

    if (
      existingTeacherError
    ) {
      return NextResponse.json(
        {
          error:
            existingTeacherError
              .message,
        },
        {
          status: 500,
        }
      )
    }

    if (!existingTeacher) {
      return NextResponse.json(
        {
          error:
            'teacher not found',
        },
        {
          status: 404,
        }
      )
    }

    if (
      existingTeacher.status ===
      'inactive'
    ) {
      try {
        const limit =
          await checkTeacherLimit(
            sb,
            school.id
          )

        if (!limit.allowed) {
          return teacherLimitResponse(
            limit
          )
        }
      } catch (
        error: any
      ) {
        console.error(
          '[teachers] reactivation plan limit check failed:',
          error
        )

        return NextResponse.json(
          {
            error:
              error?.message ||
              'Could not check teacher allowance.',
          },
          {
            status: 500,
          }
        )
      }
    }

    updates.status =
      'active'

    updates.updated_at =
      new Date()
        .toISOString()
  } else if (
    action === 'rotate'
  ) {
    updates.access_token =
      generateToken()

    updates.updated_at =
      new Date()
        .toISOString()
  } else {
    updates = {
      ...fields,

      updated_at:
        new Date()
          .toISOString(),
    }
  }

  const {
    data: teacher,
    error,
  } = await sb
    .from('teachers')
    .update(
      updates
    )
    .eq(
      'id',
      id
    )
    .eq(
      'school_id',
      school.id
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    )
  }

  return NextResponse.json({
    teacher,
  })
}

// ── DELETE /api/teachers?id=... ─ soft-remove a teacher ─────────
export async function DELETE(
  req: NextRequest
) {
  const context =
    await getSchoolContext()

  if (context.error) {
    return context.error
  }

  const {
    sb,
    school,
  } = context

  const id =
    req.nextUrl
      .searchParams
      .get('id')

  if (!id) {
    return NextResponse.json(
      {
        error:
          'id required',
      },
      {
        status: 400,
      }
    )
  }

  const {
    error,
  } = await sb
    .from('teachers')
    .update({
      status:
        'inactive',

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      'id',
      id
    )
    .eq(
      'school_id',
      school.id
    )

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message,
      },
      {
        status: 500,
      }
    )
  }

  return NextResponse.json({
    ok: true,
  })
}
