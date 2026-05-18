# School Connect

> The official memory of your school. A feed-first school communication platform.

---

## Session 1 — What's been built

- ✅ Next.js 14 (App Router) project scaffold
- ✅ Supabase integration (client + server + middleware)
- ✅ Full Postgres schema with RLS security
- ✅ TypeScript types for the entire database
- ✅ Auth flow (login + signup) with proper error handling
- ✅ Zustand global auth store
- ✅ PWA manifest
- ✅ Mobile-first global CSS with safe area support
- ✅ Custom Tailwind design tokens

---

## Setup Instructions

### Step 1 — Install the project

```bash
# Move the project folder into your dev directory
mv school-connect ~/dev/school-connect

# Enter the project
cd ~/dev/school-connect

# Install dependencies
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**
3. Name it `school-connect`
4. Choose a strong database password (save it somewhere)
5. Select the region closest to your users (e.g. `eu-west-1` for South Africa)
6. Wait ~2 minutes for the project to provision

### Step 3 — Run the database schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run**
6. You should see: `Success. No rows returned`

### Step 4 — Configure environment variables

```bash
# Copy the example env file
cp .env.local.example .env.local
```

Now edit `.env.local`:

1. Go to your Supabase dashboard → **Settings** → **API**
2. Copy **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon / public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Step 5 — Configure Supabase Auth

1. In Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to `http://localhost:3000`
3. Add to **Redirect URLs**: `http://localhost:3000/auth/callback`

### Step 6 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should be redirected to `/auth/login`.

---

## Project Structure

```
school-connect/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/
│   │   │   ├── login/          # Login page
│   │   │   ├── signup/         # School signup page
│   │   │   └── callback/       # Supabase auth callback
│   │   ├── feed/               # Main feed (Session 3)
│   │   ├── onboarding/         # School + parent setup (Session 2)
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── auth/               # Auth forms + providers
│   │   ├── feed/               # Feed components (Session 3)
│   │   ├── composer/           # Post composer (Session 4)
│   │   └── ui/                 # Shared UI primitives
│   ├── lib/
│   │   └── supabase/           # Supabase client + server clients
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand global state
│   ├── types/                  # TypeScript types (mirrors DB schema)
│   └── utils/                  # Utility functions
├── supabase/
│   └── schema.sql              # Complete database schema — run this first
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # App icons (add your own)
├── .env.local.example          # Environment variables template
└── README.md
```

---

## Sessions Roadmap

| # | Session | Status |
|---|---------|--------|
| 1 | Foundation + Schema + Auth | ✅ Done |
| 2 | School onboarding + profile setup | Next |
| 3 | Feed page + post rendering | |
| 4 | Post composer (all 5 types) | |
| 5 | Parent invite + parent onboarding | |
| 6 | Reactions + private comment threads | |
| 7 | School comment management + notifications | |
| 8 | PWA polish + offline support | |
| 9 | Search + filters | |
| 10 | Performance + security + launch | |

---

## Design Tokens

The Tailwind config includes a custom palette:

- `brand-*` — primary blue (`#0b7ee8`)
- `ink-*` — warm neutral for text and backgrounds
- `warm-*` — amber accent for moments/celebrations
- `grow-*` — green for success states

---

## Notes for Cursor AI

When working in Cursor, the `@/` alias maps to `src/`. All component imports use this.

The Supabase client has two versions:
- `@/lib/supabase/client` — use in `'use client'` components
- `@/lib/supabase/server` — use in Server Components and API routes
