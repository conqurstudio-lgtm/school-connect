# School Connect — Session 1 Setup Guide

## What was built in this session

- ✅ Complete project scaffold (Next.js 14 App Router + TypeScript + Tailwind)
- ✅ Supabase database schema with RLS policies
- ✅ Auth system (login, signup, school setup, parent join)
- ✅ PWA manifest
- ✅ Shared types, utilities, hooks
- ✅ Middleware for route protection
- ✅ School onboarding (3-step: details → logo → done)
- ✅ Parent join flow (invite token → child details → feed)
- ✅ Storage bucket policies

---

## Step-by-step: Getting this running in Cursor

### 1. Move the project folder

```bash
mv ~/Downloads/school-connect ~/projects/school-connect
cd ~/projects/school-connect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Go to https://supabase.com → New project
2. Copy your project URL and anon key
3. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

4. Fill in your values in `.env.local`

### 4. Run the database schema

In Supabase dashboard → SQL Editor → New query:
- Paste and run: `supabase/migrations/001_initial_schema.sql`

### 5. Create storage buckets

In Supabase dashboard → Storage → Create bucket:
- `school-assets` → Public: ON
- `post-images` → Public: ON  
- `post-documents` → Public: OFF

Then in SQL Editor, run: `supabase/migrations/002_storage_policies.sql`

### 6. Run the dev server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## What you can test right now

1. **http://localhost:3000** → redirects to login
2. **Sign up as School** → fill details → get school feed
3. **Sign up as Parent** (via the invite link from step 2)
4. **School setup flow** → 3-step onboarding → live feed placeholder

---

## Project structure

```
school-connect/
├── src/
│   ├── app/
│   │   ├── auth/          ← login, signup, school-setup, parent-join
│   │   ├── feed/          ← main feed (Session 3)
│   │   ├── join/[slug]/   ← public invite redirect
│   │   └── layout.tsx
│   ├── components/        ← (Session 2+)
│   ├── lib/
│   │   ├── supabase/      ← client, server, middleware
│   │   ├── hooks/         ← useAuth
│   │   ├── types/         ← all TypeScript types
│   │   └── utils/         ← cn, formatters, helpers
│   └── styles/            ← globals.css
├── supabase/migrations/   ← SQL schema files
├── public/
│   ├── manifest.json      ← PWA
│   └── icons/             ← add 192px + 512px icons here
└── .env.local.example
```

---

## Coming in Session 2

- Feed layout component (header, filters, scroll)
- School identity header (logo, name, invite sharing)
- Notification bell
- School vs parent view switcher logic

## Coming in Session 3

- Full feed rendering (all post types)
- Post cards for each type
- Pinned posts strip

## Coming in Session 4

- Post composer (all 5 post types with file upload)

---

## Notes for Cursor AI

When opening this in Cursor, you can reference these files:
- `src/lib/types/index.ts` — all data shapes
- `src/lib/supabase/client.ts` — browser Supabase client
- `supabase/migrations/001_initial_schema.sql` — full DB schema

The stack is: **Next.js 14 App Router + Supabase + Tailwind + TypeScript**
