# School Admin Landing Route Repair v1

## Why this was needed

The routing scan showed that school/admin login and the root app page still defaulted logged-in users to `/feed`. That is why the old school feed was still loading after admin login.

## Applied changes

- Login: changed default redirect variable from /feed to explicit-only redirect
- Login: school profile users now land on /school instead of old /feed
- Root page: logged-in school users now route to /school instead of /feed
- SchoolPageClient: old Go to feed button now points back to /school
- SchoolProfilePage: old Go to feed action now returns to School Life home tab

## Intended flow

- School admin login without an explicit redirect now lands on `/school`.
- Parent/normal users still land on `/feed`.
- Explicit `redirectTo` links are still respected.
- The root `/` route sends school users to `/school` and others to `/feed`.

## Scope lock

- No database/schema changes.
- No feed card changes.
- No message/composer changes.
- No parent/teacher flow changes.

## Files changed

- src/app/auth/login/page.tsx
- src/app/page.tsx
- src/components/school/SchoolPageClient.tsx
- src/components/school/SchoolProfilePage.tsx
