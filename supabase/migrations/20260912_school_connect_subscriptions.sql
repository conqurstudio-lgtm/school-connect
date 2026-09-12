create table if not exists public.school_subscriptions (
  id uuid primary key default gen_random_uuid(),

  /*
  |--------------------------------------------------------------------------
  | SUBSCRIPTION OWNER
  |--------------------------------------------------------------------------
  |
  | Exactly one must be set:
  | - school_id = standalone school subscription
  | - group_id  = multi-branch group subscription
  |
  */

  school_id uuid references public.schools(id) on delete cascade,
  group_id uuid references public.school_groups(id) on delete cascade,

  /*
  |--------------------------------------------------------------------------
  | PLAN
  |--------------------------------------------------------------------------
  */

  plan_code text not null
    references public.school_plans(code),

  status text not null default 'trialing',

  /*
  |--------------------------------------------------------------------------
  | PRICE LOCK
  |--------------------------------------------------------------------------
  |
  | Store the price the customer actually agreed to.
  | This allows founding-school pricing to remain locked.
  |
  | Examples:
  | Pro             = 29900
  | School          = 49900
  | Group Starter   = 69900
  | Group Pro       = 99900
  | Group Elite     = 149900
  |
  */

  monthly_price_cents integer not null default 0,
  currency text not null default 'ZAR',

  is_founding_rate boolean not null default false,

  /*
  |--------------------------------------------------------------------------
  | TRIAL
  |--------------------------------------------------------------------------
  */

  trial_started_at timestamptz,
  trial_ends_at timestamptz,

  /*
  |--------------------------------------------------------------------------
  | BILLING PERIOD
  |--------------------------------------------------------------------------
  */

  current_period_start timestamptz,
  current_period_end timestamptz,

  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,

  /*
  |--------------------------------------------------------------------------
  | PAYMENT PROVIDER
  |--------------------------------------------------------------------------
  |
  | Kept generic now so Yoco or another provider can be connected later.
  |
  */

  provider text,
  provider_customer_id text,
  provider_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  constraint school_subscriptions_scope_check
    check (
      (
        school_id is not null
        and group_id is null
      )
      or
      (
        school_id is null
        and group_id is not null
      )
    ),

  constraint school_subscriptions_plan_check
    check (
      plan_code in (
        'starter',
        'pro',
        'school',
        'group_starter',
        'group_pro',
        'group_elite',
        'enterprise'
      )
    ),

  constraint school_subscriptions_status_check
    check (
      status in (
        'trialing',
        'active',
        'past_due',
        'cancelled',
        'expired'
      )
    ),

  constraint school_subscriptions_price_check
    check (
      monthly_price_cents >= 0
    ),

  constraint school_subscriptions_currency_check
    check (
      currency = 'ZAR'
    ),

  constraint school_subscriptions_plan_scope_check
    check (
      (
        school_id is not null
        and plan_code in (
          'starter',
          'pro',
          'school'
        )
      )
      or
      (
        group_id is not null
        and plan_code in (
          'group_starter',
          'group_pro',
          'group_elite',
          'enterprise'
        )
      )
    )
);

create unique index if not exists uq_school_active_subscription
  on public.school_subscriptions (school_id)
  where school_id is not null
    and status in ('trialing', 'active', 'past_due');

create unique index if not exists uq_group_active_subscription
  on public.school_subscriptions (group_id)
  where group_id is not null
    and status in ('trialing', 'active', 'past_due');

create index if not exists idx_school_subscriptions_school
  on public.school_subscriptions (school_id);

create index if not exists idx_school_subscriptions_group
  on public.school_subscriptions (group_id);

create index if not exists idx_school_subscriptions_status
  on public.school_subscriptions (status);

create index if not exists idx_school_subscriptions_trial_end
  on public.school_subscriptions (trial_ends_at);

alter table public.school_subscriptions
  enable row level security;
